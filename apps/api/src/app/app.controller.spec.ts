import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { AppController } from './app.controller';
import type { HealthService } from './health.service';

describe('AppController', () => {
  const healthService = { check: jest.fn() };
  const controller = new AppController(healthService as unknown as HealthService);
  const response = { status: jest.fn() };

  it('returns 200 when every dependency is up', async () => {
    const report = { status: 'ok', database: 'up', graphql: 'up', websocket: 'up' };
    healthService.check.mockResolvedValue(report);

    await expect(controller.getHealth(response as unknown as Response)).resolves.toEqual(report);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it('returns 503 when a dependency is down', async () => {
    const report = { status: 'error', database: 'down', graphql: 'up', websocket: 'up' };
    healthService.check.mockResolvedValue(report);

    await expect(controller.getHealth(response as unknown as Response)).resolves.toEqual(report);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
