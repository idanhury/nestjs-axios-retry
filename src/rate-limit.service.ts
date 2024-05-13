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

    if (headers.length > 1) {
      maxRequests = maxRequests * headers.length;
    }

    let headerRes;
    let delayTime = 0;
    const lockKey = `${rateLimitKey}:lock`;
    const lockExpireTime = 10000;
    try {
      // @ts-ignore
      const lockAcquired = await this.redis.set(lockKey, 'locked', 'NX', 'PX', lockExpireTime);
      if (!lockAcquired) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return await this.onRequest(host, { minIntervalInSeconds, maxRequests, headers });
      }

      delayTime = await this.handleRateLimit(rateLimitKey, minIntervalInSeconds, maxRequests);
      headerRes = await this.retrieveHeader(hashedHost, headers);
    } finally {
      await this.redis.del(lockKey);
    }

    await new Promise(resolve => setTimeout(resolve, delayTime));
    return headerRes;
  }

  private async handleRateLimit(key: string, intervalInSeconds: number, maxRequests: number): Promise<number> {


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
        return delayTime;
      }
      return 0;
    } else {
      // Add current request timestamp to Redis
      await this.redis.multi().zadd(key, currentTime, currentTime.toString()).expire(key, intervalInMilliseconds).exec();
      return 0;
    }

  }

  private async retrieveHeader(hashedHost: string, headers: Record<string, any>[]): Promise<Record<string, any>> {
    try {
      const credentialsKey = `credentials-index:${hashedHost}`;
      const ttlInSeconds = 3600 * 24 * 7;
      const multi = this.redis.multi();
      multi.get(credentialsKey);
      multi.incr(credentialsKey);
      multi.expire(credentialsKey, ttlInSeconds);

      const [t1, [t2, currentIndex]] = await multi.exec();

      // @ts-ignore
      const nextIndex = currentIndex % headers.length;

      return headers[nextIndex];
    } catch (e) {
      console.error(e);
      return headers[0];
    }
  }
}
