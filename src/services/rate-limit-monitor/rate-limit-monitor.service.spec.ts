import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitMonitorService } from './rate-limit-monitor.service';

describe('RateLimitMonitorService', () => {
  let service: RateLimitMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitMonitorService],
    }).compile();

    service = module.get<RateLimitMonitorService>(RateLimitMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
