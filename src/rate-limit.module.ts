import { DynamicModule, Module } from '@nestjs/common';
import { AxiosProvider } from './providers/axios/axios.provider';
import { RedisProvider } from './providers/redis/redis.provider';
import { IRateLimitModule } from './interfaces';
import { RateLimitService } from './rate-limit.service';

@Module({})
export class RateLimitModule {
    static registerAsync({rateLimitsConfig, redisConnectionString}: IRateLimitModule): DynamicModule {
        return {
          module: RateLimitModule,
          providers: [
            {
              provide: 'RATE_LIMIT_REDIS_OPTIONS',
              useValue: redisConnectionString,
            },
            RedisProvider,
            {
                provide: 'RATE_LIMIT_AXIOS_OPTIONS',
                useValue: rateLimitsConfig,
              },
            AxiosProvider,
            RateLimitService],
          exports: [RateLimitService],
        };
    }
}