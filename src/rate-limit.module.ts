import { DynamicModule, Module } from '@nestjs/common';
import { AxiosProvider } from './providers/axios/axios.provider';
import { IRateLimitModule } from './interfaces';
import { RateLimitService } from './rate-limit.service';

@Module({})
export class RateLimitModule {
  static register({ rateLimitsConfig, redisClient }: IRateLimitModule): DynamicModule {
    return {
      module: RateLimitModule,
      providers: [
        {
          provide: 'RATE_LIMIT_REDIS',
          useValue: redisClient
        },
        {
          provide: 'RATE_LIMIT_AXIOS_OPTIONS',
          useValue: rateLimitsConfig,
        },
        AxiosProvider,
        RateLimitService],
      exports: [ RateLimitService ],
    };
  }
}