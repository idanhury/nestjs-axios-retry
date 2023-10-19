import { DynamicModule, Module } from '@nestjs/common';
import { AxiosProvider } from './providers/axios/axios.provider';
import { RedisProvider } from './providers/redis/redis.provider';
import { IRateLimitModule } from './interfaces';
import { RateLimitService } from './rate-limit.service';

/**
 * Instructions:
 * 1. Import RateLimitModule to your @Module and add axios and redis options.
 * 
 * 2. Import @Inject('RATE_LIMIT_AXIOS_INSTANCE') private readonly axios: AxiosInstance
 * to the service constructor
 * 
*/

@Module({})
export class RateLimitModule {
    static register({rateLimitsConfig, redisConnectionString}: IRateLimitModule): DynamicModule {
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