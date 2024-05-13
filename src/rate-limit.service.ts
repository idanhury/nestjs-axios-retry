import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { HostOptions } from './interfaces';
import * as md5 from 'md5';

@Injectable()
export class RateLimitService {
  constructor(@Inject('RATE_LIMIT_REDIS') private redis: Redis) { }

  public async onRequest(host: string, { minIntervalInSeconds, maxRequests, headers }: HostOptions) {
    const hashedHost = md5(host);
    const rateLimitKey = `rate-limit:${hashedHost}`;
    const rateLimited = await this.handleRateLimit(rateLimitKey, minIntervalInSeconds, maxRequests);

    if (rateLimited) {
      console.debug('Rate limited exceeded');
   }

    // Retrieve and cycle headers
    return this.retrieveHeader(hashedHost, headers);
  }

  private async handleRateLimit(key: string, intervalInSeconds: number, maxRequests: number): Promise<boolean> {
    const currentTime = Date.now();
    const intervalInMilliseconds = intervalInSeconds * 1000;
    const windowStart = currentTime - intervalInMilliseconds

    // Multi-command transaction to ensure atomicity
    const transactionResults = await this.redis.multi()
      .zremrangebyscore(key, 0, windowStart) // Clean out expired entries
      .zrangebyscore(key, '-inf', '+inf', 'WITHSCORES', 'LIMIT', 0, 1) // Get the oldest entry
      .zcard(key) // Count the number of requests in the current window
      .exec();

    // @ts-ignore
    const oldestTimestamp = transactionResults[1][1].length > 0 ? parseInt(transactionResults[1][1][0]) : null;
    const currentCount = transactionResults[2][1];

    // @ts-ignore
    if (currentCount >= maxRequests) {
      if (oldestTimestamp) {
        const oldestRequestTime = oldestTimestamp;
        const delayTime = (oldestRequestTime + intervalInMilliseconds) - currentTime;
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
      return true; // After waiting, retry
    } else {
      // Add current request timestamp to Redis
      await this.redis.multi().zadd(key, currentTime, currentTime.toString()).expire(key, intervalInMilliseconds).exec();
      return false; // No need to wait, proceed with the request
    }
  }

  private async retrieveHeader(hashedHost: string, headers: Record<string, any>[]): Promise<Record<string, any>> {
    const credentialsKey = `credentials-index:${hashedHost}`;
    let currentIndex = Number(await this.redis.get(credentialsKey)) || 0;
    const nextIndex = currentIndex + 1 < headers.length ? currentIndex + 1 : 0;

    await this.redis.set(credentialsKey, nextIndex.toString());

    return headers[currentIndex];
  }
}
