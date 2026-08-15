import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Agent } from '../agents/agent.entity';
import { Task } from '../tasks/task.entity';
import { ToolRun } from '../tools/tool-run.entity';
import { WorldEvent } from '../events/event.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agents: Repository<Agent>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(ToolRun)
    private readonly toolRuns: Repository<ToolRun>,
    @InjectRepository(WorldEvent)
    private readonly events: Repository<WorldEvent>,
  ) {}

  /** Runs every hour to collect metrics and cleanup old events. */
  @Cron(CronExpression.EVERY_HOUR)
  async collectMetricsAndCleanup(): Promise<void> {
    this.logger.log('Starting metrics collection and cleanup...');

    try {
      // Collect metrics
      const [agentCount, taskCount, toolRunCount, eventCount] = await Promise.all([
        this.agents.count(),
        this.tasks.count(),
        this.toolRuns.count(),
        this.events.count(),
      ]);

      const agentsByStatus = await this.agents
        .createQueryBuilder('agent')
        .select('agent.status, COUNT(*) as count')
        .groupBy('agent.status')
        .getRawMany();

      const tasksByStatus = await this.tasks
        .createQueryBuilder('task')
        .select('task.status, COUNT(*) as count')
        .groupBy('task.status')
        .getRawMany();

      const toolRunsByStatus = await this.toolRuns
        .createQueryBuilder('toolRun')
        .select('toolRun.status, COUNT(*) as count')
        .groupBy('toolRun.status')
        .getRawMany();

      const avgTokens = await this.toolRuns
        .createQueryBuilder('toolRun')
        .select('AVG(toolRun.tokens)', 'average')
        .getRawOne();

      const avgCost = await this.toolRuns
        .createQueryBuilder('toolRun')
        .select('AVG(toolRun.cost)', 'average')
        .getRawOne();

      this.logger.log(`Metrics: `);
      this.logger.log(`  Agents: ${agentCount}`);
      this.logger.log(`  Tasks: ${taskCount}`);
      this.logger.log(`  Tool Runs: ${toolRunCount}`);
      this.logger.log(`  Events (outbox): ${eventCount}`);
      this.logger.log(`  Agents by status: ${JSON.stringify(agentsByStatus)}`);
      this.logger.log(`  Tasks by status: ${JSON.stringify(tasksByStatus)}`);
      this.logger.log(`  Tool Runs by status: ${JSON.stringify(toolRunsByStatus)}`);
      this.logger.log(`  Average tokens per run: ${avgTokens?.average ?? 0}`);
      this.logger.log(`  Average cost per run: $${(avgCost?.average ?? 0).toFixed(4)}`);

      // Cleanup: delete events older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deleteResult = await this.events
        .createQueryBuilder()
        .delete()
        .from(WorldEvent)
        .where('createdAt < :date', { date: sevenDaysAgo })
        .execute();

      this.logger.log(`Cleaned up ${deleteResult.affected} events older than 7 days`);
    } catch (error) {
      this.logger.error(`Error in metrics collection and cleanup: ${error.message}`);
    }
  }
}