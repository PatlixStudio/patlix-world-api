import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorldService } from './world.service';

@ApiTags('world')
@Controller('world')
export class WorldController {
  constructor(private readonly worldService: WorldService) {}

  @Get('snapshot')
  @ApiOperation({
    summary: 'Full world state snapshot (zones, agents, projects, properties, tasks)',
  })
  snapshot() {
    return this.worldService.snapshot();
  }

  @Get('zones')
  @ApiOperation({ summary: 'All world regions' })
  zones() {
    return this.worldService.findAllZones().then((z) => z.map((x) => x.toDto()));
  }
}
