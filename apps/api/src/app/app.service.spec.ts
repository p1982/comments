import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get(AppService);
  });

  describe('getData', () => {
    it('should return status ok', () => {
      expect(service.getData()).toEqual({
        message: 'API is running',
        status: 'ok',
      });
    });
  });
});
