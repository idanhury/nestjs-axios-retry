import Redis from 'ioredis';
import { HostOptions } from './interfaces';
export declare class RateLimitService {
    private redis;
    constructor(redis: Redis);
    onRequest(host: string, { minInterval, maxRequests, headers }: HostOptions): Promise<Record<string, any>>;
    acquireLock(lockKey: string, lockDurationInSeconds: number): Promise<false | "OK">;
    retrieveHeader(hashedHost: string, { minInterval, maxRequests, headers }: HostOptions): Promise<Record<string, any>>;
    waitForSmallestTTL(requests: any): Promise<void>;
}
