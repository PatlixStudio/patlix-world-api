import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AgentStatus, PropertyType } from '@patlixworld/shared';
import { AgentsService } from '../agents/agents.service';
import { CompaniesService } from '../companies/companies.service';
import { ProjectsService } from '../projects/projects.service';
import { PropertiesService } from '../properties/properties.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { WorldService } from '../world/world.service';

/**
 * Idempotent bootstrap seed: demo user, world zones, Patlix company + HQ
 * property, one project, the initial workforce (Aurel/Developer/Designer) and
 * a sample task. Runs only when the tables are empty.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly world: WorldService,
    private readonly companies: CompaniesService,
    private readonly properties: PropertiesService,
    private readonly projects: ProjectsService,
    private readonly agents: AgentsService,
    private readonly tasks: TasksService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.agents.findAll();
    if (existing.length > 0) {
      this.logger.log(`Seed skipped (${existing.length} agents already present)`);
      return;
    }

    await this.seedUser();
    await this.seedZones();
    await this.seedCompany();
    await this.seedProperty();
    await this.seedProject();
    await this.seedAgents();
    await this.seedTask();
    this.logger.log(
      'Patlix World seeded (zones, company, property, project, agents, task)',
    );
  }

  private async seedUser(): Promise<void> {
    const email = 'dev@patlix.studio';
    if (!(await this.users.findByEmail(email))) {
      await this.users.create(email, 'patlixworld', 'Patlix Developer');
    }
  }

  private async seedZones(): Promise<void> {
    const zones = [
      { name: 'beach', kind: 'beach', center: { x: 200, y: 0, z: 200 }, radius: 80 },
      { name: 'hq', kind: 'clearing', center: { x: -40, y: 0, z: -60 }, radius: 60 },
      {
        name: 'forest',
        kind: 'forest',
        center: { x: -150, y: 0, z: -120 },
        radius: 150,
      },
      {
        name: 'village',
        kind: 'village',
        center: { x: 120, y: 0, z: -180 },
        radius: 90,
      },
      { name: 'river', kind: 'river', center: { x: 0, y: 0, z: 250 }, radius: 120 },
      {
        name: 'mountain',
        kind: 'mountain',
        center: { x: -260, y: 0, z: 120 },
        radius: 100,
      },
    ];
    for (const z of zones) {
      await this.world.ensureZone(z);
    }
  }

  private async seedCompany(): Promise<void> {
    const list = await this.companies.findAll();
    if (list.length === 0) {
      const user = await this.users.findByEmail('dev@patlix.studio');
      await this.companies.create(
        {
          name: 'Patlix',
          industry: 'technology',
          description: 'Open-world AI workforce — the company behind Patlix World.',
        },
        user?.id ?? 'system',
      );
    }
  }

  private async seedProperty(): Promise<void> {
    const list = await this.properties.findAll();
    if (list.length === 0) {
      const companies = await this.companies.findAll();
      await this.properties.create({
        name: 'Patlix HQ',
        type: PropertyType.HEADQUARTERS,
        companyId: companies[0]?.id,
        zoneId: 'hq',
        x: -40,
        y: 0,
        z: -60,
        buildingStyle: 'modern',
        theme: 'technology campus in a forest clearing',
        isPublic: true,
      });
    }
  }

  private async seedProject(): Promise<void> {
    const list = await this.projects.findAll();
    if (list.length === 0) {
      const properties = await this.properties.findAll();
      const companies = await this.companies.findAll();
      await this.projects.create({
        name: 'patlix-world-web',
        propertyId: properties[0]?.id,
        companyId: companies[0]?.id,
        repoUrl: 'https://github.com/PatlixStudio/patlix-world-web',
        workingDirectory: 'apps/patlix-world-web',
        branch: 'main',
        description: 'The 3D client for Patlix World.',
      });
    }
  }

  private async seedAgents(): Promise<void> {
    const companies = await this.companies.findAll();
    const projects = await this.projects.findAll();
    const companyId = companies[0]?.id;
    const projectId = projects[0]?.id;

    await this.agents.create({
      name: 'Aurel',
      role: 'Orchestrator',
      persona:
        'Aurel is the central orchestration intelligence of Patlix World: it plans work, assigns agents, monitors execution and coordinates the workforce. It does not do the work itself.',
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      companyId,
      projectId,
      zoneId: 'hq',
      x: -44,
      y: 0,
      z: -58,
    });
    await this.agents.create({
      name: 'Developer-01',
      role: 'Backend Developer',
      persona:
        'A focused backend developer that implements features, writes tests and reports progress on real repositories.',
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      companyId,
      projectId,
      zoneId: 'hq',
      x: -36,
      y: 0,
      z: -62,
    });
    await this.agents.create({
      name: 'Designer-01',
      role: 'Designer',
      persona:
        'A designer who shapes the visual identity of projects and reviews interfaces for quality.',
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      companyId,
      projectId,
      zoneId: 'hq',
      x: -40,
      y: 0,
      z: -66,
    });

    // Promote the seeded agents to a live (idle) state.
    for (const agent of await this.agents.findAll()) {
      await this.agents.update(agent.id, { status: AgentStatus.IDLE });
    }
  }

  private async seedTask(): Promise<void> {
    const list = await this.tasks.findAll();
    if (list.length === 0) {
      const projects = await this.projects.findAll();
      const developers = (await this.agents.findAll()).filter(
        (a) => a.role === 'Backend Developer',
      );
      await this.tasks.create({
        title: 'Implement JWT authentication',
        description:
          'Add JWT auth to the Patlix World API: register/login endpoints, JwtAuthGuard, current-user decorator.',
        projectId: projects[0]?.id,
        assignedAgentId: developers[0]?.id,
      });
    }
  }
}
