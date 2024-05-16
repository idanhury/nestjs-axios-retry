import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { HostOptions } from './interfaces';
import * as md5 from 'md5';

@Injectable()
export class RateLimitService {
  constructor(@Inject('RATE_LIMIT_REDIS') private redis: Redis) { }

  public async onRequest(host: string, { minIntervalInSeconds, maxRequests, headers }: HostOptions, isRetry = false) {
    const hashedHost = md5(host);
    const rateLimitKey = `rate-limit:${hashedHost}`;

    if (headers.length > 1 && !isRetry) {
      maxRequests = maxRequests * headers.length;
    }

    let headerRes;
    let delayTime = 0;
    const lockKey = `lock:${rateLimitKey}`;
    const lockExpireTime = 10 * 1000;
    
    // @ts-ignore
    const lockAcquired = await this.redis.set(lockKey, 'locked', 'NX', 'PX', lockExpireTime);
    if (!lockAcquired) {
      await new Promise(resolve => setTimeout(resolve, 150));
      return await this.onRequest(host, { minIntervalInSeconds, maxRequests, headers }, true);
    }
    // const uniqueId = Math.random().toString(36).substring(7);
    try {
      delayTime = await this.handleRateLimit(rateLimitKey, minIntervalInSeconds, maxRequests);
      headerRes = await this.retrieveHeader(hashedHost, headers);
      // console.log('#' + uniqueId + '#: ' + 'delayTime', delayTime);
      // console.log('#' + uniqueId + '#: ' + 'headerRes', headerRes);
    } finally {
      await this.redis.del(lockKey);
    }

    await new Promise(resolve => setTimeout(resolve, delayTime));
    return headerRes;
  }

  async handleRateLimit(key, intervalInSeconds, maxRequests) {
    const keysPattern = `${key}-*`;
    const requests = await this.redis.keys(keysPattern);

    const timestamp = Date.now();
    const redisKey = `${key}-${timestamp}`;

    if (requests.length >= maxRequests) {
      // console.log('requests.length', requests.length, Date.now());
      let smallestTTLInSeconds = intervalInSeconds * Math.max(Math.floor(requests.length / maxRequests), 1);
      await this.redis.set(redisKey, 'key', 'EX', smallestTTLInSeconds, 'NX');
      return smallestTTLInSeconds;
    }

    await this.redis.set(redisKey, 'key', 'EX', Math.max(intervalInSeconds, 1), 'NX');
    return 0;
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
