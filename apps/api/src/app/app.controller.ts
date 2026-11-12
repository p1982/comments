import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check database, GraphQL, and WebSocket' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthResponseDto })
  async getHealth(@Res({ passthrough: true }) response: Response): Promise<HealthResponseDto> {
    const report = await this.healthService.check();
    response.status(report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return report;
  }
}
