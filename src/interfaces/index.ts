import { AxiosInstance } from "axios";

export interface IRateLimitModule {
    rateLimitsConfig: RateLimitsConfig;
    redisConnectionString: string;
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
    minInterval: number; // seconds
    headers: Record<string, any>[];
}
