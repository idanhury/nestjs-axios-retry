import { AxiosInstance } from "axios";
export interface IRateLimitModule {
    rateLimitsConfig: RateLimitsConfig;
    redisConnectionString: RedisConnectionStringOptions;
}
export interface RateLimitsConfig {
    options: RateLimitsConfigOptions;
    axiosInstance: AxiosInstance;
}
export interface RateLimitsConfigOptions {
    [key: string]: HostOptions;
}
export interface HostOptions {
    requests: number;
    interval: number;
    headers: Record<string, any>[];
}
export interface RedisConnectionStringOptions {
    host: string;
    port: number;
}
