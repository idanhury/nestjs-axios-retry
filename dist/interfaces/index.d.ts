export interface IRateLimitModule {
    axios: AxiosProviderOptions;
    redis: RedisProviderOptions;
}
export interface AxiosProviderOptions {
    [key: string]: HostOptions;
}
export interface HostOptions {
    requests: number;
    interval: number;
    headers: Record<string, any>[];
}
export interface RedisProviderOptions {
    host: string;
    port: number;
}
