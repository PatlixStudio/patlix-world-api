import { Module } from '@nestjs/common';
import { ModelsService } from './models.service';

/** LLM provider access (NVIDIA → Google → Groq → OpenRouter → Ollama). */
@Module({
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
