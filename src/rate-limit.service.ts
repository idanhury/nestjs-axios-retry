import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { HostOptions } from './interfaces';
import * as md5 from 'md5';

@Injectable()
export class RateLimitService {

  constructor(@Inject('RATE_LIMIT_REDIS') private redis: Redis) { }

  public async onRequest(host: string, { minIntervalInSeconds, maxRequests, headers }: HostOptions) {
    const hashedHost = md5(host);
    const lockKey = `lock-${hashedHost}`;
    const lockAcquired = await this.acquireLock(lockKey, minIntervalInSeconds);


    if (!lockAcquired) {
      return;
    }

    try {
      return await this.retrieveHeader(`${hashedHost}`, { minIntervalInSeconds, maxRequests, headers });
    } catch (e) {
      console.error('Ratelimit onRequest ', e);
    } finally {
      await this.redis.del(`${lockKey}`);
    }


  }

  async acquireLock(lockKey: string, lockDurationInSeconds: number) {
    const lockValue = "locked";

    const acquireLock = async () => {
      // https://github.com/redis/ioredis/issues/1811
      return new Promise((resolve, reject) => {
        const response = this.redis.set(`${lockKey}`, lockValue, 'EX', Math.max(lockDurationInSeconds, 1), 'NX');
        resolve(response);
      });

    };

    const maxRetries = 1000;
    let retries = 0;

    while (retries < maxRetries) {
      const lockAcquired = await acquireLock();
      if (lockAcquired === "OK") {
        return lockAcquired;
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (lockDurationInSeconds * retries * 0.1)));
    }

    return false;
  }

  async retrieveHeader(hashedHost: string, { minIntervalInSeconds, maxRequests, headers }: HostOptions) {
    const keysPattern = `${hashedHost}-*`;
    const requests = await this.redis.keys(keysPattern);


    if (headers.length > 1) {
      maxRequests = maxRequests * headers.length;
    }


    if (requests.length >= maxRequests) {
      await this.waitForSmallestTTL(requests);
    }

    const timestamp = Date.now();
    const key = `${hashedHost}-${timestamp}`;

    await this.redis.set(key, 'key', 'EX', Math.max(minIntervalInSeconds, 1), 'NX');

    const credentialsKey = `last-index-credential-used-${hashedHost}`;
    let currentIndex = 0;
    try {
      currentIndex = Number(await this.redis.get(credentialsKey));
    } catch (e) {
      console.error('failed get header index ', e);
    }
    const nextIndex = currentIndex + 1 < headers.length ? currentIndex + 1 : 0;
    try {
      await this.redis.set(credentialsKey, nextIndex);
    } catch (e) {
      console.error('failed set header index', e);
    }

    return headers[currentIndex];
  }

  async waitForSmallestTTL(requests) {
    const getSmallestTTL = async () => {
      let ttls = await Promise.all(requests.map(request => this.redis.ttl(request)));

      ttls = ttls.filter(t => t > 0);
      return ttls.length > 0 ? Math.min(...ttls) : 0;
    };

    let smallestTTLInSeconds = await getSmallestTTL();
    while (smallestTTLInSeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, smallestTTLInSeconds * 1000));
      smallestTTLInSeconds = await getSmallestTTL();
    }
  }

}