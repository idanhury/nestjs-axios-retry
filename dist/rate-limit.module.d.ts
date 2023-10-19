import { DynamicModule } from '@nestjs/common';
import { IRateLimitModule } from './interfaces';
export declare class RateLimitModule {
    static register({ rateLimitsConfig, redisConnectionString }: IRateLimitModule): DynamicModule;
}
