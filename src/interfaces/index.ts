import { AxiosInstance } from "axios";
import { Redis } from "ioredis";

export interface IRateLimitModule {
    rateLimitsConfig: RateLimitsConfig;
    redisClient: Redis;
  }

export interface RateLimitsConfig {
    options: RateLimitsConfigOptions;
    axiosClient: AxiosInstance;
}

export interface RateLimitsConfigOptions {
    [key: string]: HostOptions
}

export interface HostOptions {
    maxRequests: number;
    minIntervalInSeconds: number;
    headers: Record<string, any>[];
}
