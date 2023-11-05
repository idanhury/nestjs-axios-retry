import { DynamicModule, Module } from '@nestjs/common';
import { AxiosProvider } from './providers/axios/axios.provider';
import { RedisProvider } from './providers/redis/redis.provider';
import { IRateLimitModule } from './interfaces';
import { RateLimitService } from './rate-limit.service';

@Module({})
export class RateLimitModule {
    static registerAsync(options: {useFactory: () => Promise<IRateLimitModule>}): DynamicModule {
        return {
          module: RateLimitModule,
          providers: [
            {
              provide: 'RATE_LIMIT_REDIS_OPTIONS',
              useFactory: async () => {
                const config = await options.useFactory();
                return config.redisConnectionString;
              },
            },
            RedisProvider,
            {
                provide: 'RATE_LIMIT_AXIOS_OPTIONS',
                useFactory: async () => {
                  const config = await options.useFactory();
                  return config.rateLimitsConfig;
                },
              },
            AxiosProvider,
            RateLimitService],
          exports: [RateLimitService],
        };
    }
}