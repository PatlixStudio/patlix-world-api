import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/** A single chat message passed to any provider. */
export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Base URL override, e.g. an agent's configured provider endpoint. */
  baseUrl?: string;
  /** API key override, e.g. an agent's configured key. */
  apiKey?: string;
}

interface ProviderConfig {
  name: string;
  baseURL: string;
  apiKey?: string;
  model: string;
}

/**
 * Provider-agnostic LLM client. Tries the configured providers in order
 * (NVIDIA → Google → Groq → OpenRouter → Ollama) until one answers, so the
 * system keeps working when any single provider is down or unconfigured.
 */
@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);

  constructor(private readonly config: ConfigService) {}

  /** Providers discovered from environment, highest priority first. */
  private providerConfigs(): ProviderConfig[] {
    const providers: ProviderConfig[] = [];

    const nvidiaKey = this.config.get<string>('NVIDIA_API_KEY');
    if (nvidiaKey) {
      providers.push({
        name: 'nvidia',
        baseURL:
          this.config.get<string>('NVIDIA_BASE_URL') ??
          'https://integrate.api.nvidia.com/v1',
        apiKey: nvidiaKey,
        model: this.config.get<string>('NVIDIA_MODEL') ?? 'meta/llama-3.3-70b-instruct',
      });
    }

    const googleKey = this.config.get<string>('GOOGLE_API_KEY');
    if (googleKey) {
      providers.push({
        name: 'google',
        baseURL:
          this.config.get<string>('GOOGLE_BASE_URL') ??
          'https://generativelanguage.googleapis.com/v1beta/openai/',
        apiKey: googleKey,
        model: this.config.get<string>('GOOGLE_MODEL') ?? 'gemini-2.0-flash',
      });
    }

    const groqKey = this.config.get<string>('GROQ_API_KEY');
    if (groqKey) {
      providers.push({
        name: 'groq',
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: groqKey,
        model: this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile',
      });
    }

    const openRouterKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (openRouterKey) {
      providers.push({
        name: 'openrouter',
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openRouterKey,
        model:
          this.config.get<string>('OPENROUTER_MODEL') ??
          'meta-llama/llama-3.3-70b-instruct:free',
      });
    }

    const ollamaBase = this.config.get<string>('OLLAMA_BASE_URL');
    if (ollamaBase) {
      providers.push({
        name: 'ollama',
        baseURL: ollamaBase,
        model: this.config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:7b',
      });
    }

    return providers;
  }

  /**
   * Complete a chat conversation using the provider chain.
   * @throws if every configured provider fails.
   */
  async chat(messages: ChatTurn[], options: ChatOptions = {}): Promise<string> {
    const providers = this.providerConfigs();
    if (providers.length === 0) {
      throw new Error('No LLM provider configured');
    }
    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        this.logger.log(`Trying ${provider.name} (${provider.model})`);
        const client = new OpenAI({
          baseURL: options.baseUrl ?? provider.baseURL,
          apiKey: options.apiKey ?? provider.apiKey ?? 'sk-no-key',
          timeout: 30_000,
          maxRetries: 1,
        });
        const response = await client.chat.completions.create({
          model: provider.model,
          messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 1024,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`${provider.name} returned empty content`);
        }
        return content;
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`${provider.name} failed: ${(err as Error).message}`);
      }
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
  }
}
