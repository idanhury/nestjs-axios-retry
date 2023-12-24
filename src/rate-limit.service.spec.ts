import Redis from "ioredis";
import {RateLimitService} from "./rate-limit.service";

describe('RateLimitService', () => {
    let rateLimitService: RateLimitService;
    const redis: Redis = new Redis;
    const spareBufferMilliseconds = 100;

    it('onRequest', async () => {
        rateLimitService = new RateLimitService(redis);
        const mockDelete = jest.spyOn(redis, 'del');
        mockDelete.mockImplementationOnce(() => Promise.resolve(1));

        const minIntervalInSeconds = 1000;
        jest.spyOn(rateLimitService, 'acquireLock').mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(() => resolve(null), minIntervalInSeconds));
            return 'OK';
        });

        jest.spyOn(rateLimitService, 'retrieveHeader').mockImplementation(() => new Promise(resolve => resolve({key1: 'value1'})));

        const result = await rateLimitService.onRequest('test1', {minIntervalInSeconds, maxRequests: 2, headers: [{key1: 'value1'}]});
        if (result) {
            expect(result.key1).toEqual('value1');
        }
    });

    it('onRequest - failed ot acquire lock', async () => {
        rateLimitService = new RateLimitService(redis);
        const minIntervalInSeconds = 1000;
        jest.spyOn(rateLimitService, 'acquireLock').mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(() => resolve(null), minIntervalInSeconds));
            return false;
        });

        const result = await rateLimitService.onRequest('test1', {minIntervalInSeconds, maxRequests: 2, headers: [{key1: 'value1'}]});
        expect(result).toBeUndefined();
    });

    it('acquireLock to lock - minimal time', async () => {
        const lockDurationInSeconds = 1000;
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(new Promise((resolve, reject) => {
            setTimeout(() => resolve('OK'));
        }));
        rateLimitService = new RateLimitService(redis);
        const start = performance.now();
        await rateLimitService.acquireLock('test1-lock', lockDurationInSeconds);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeLessThan(lockDurationInSeconds);
    });

    it('acquireLock to lock - failed on first attempts', async () => {
        const lockDurationInSeconds = 1000;
        const amountOfLocks = 2;
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(new Promise(async (resolve, reject) => {
            for (let i = 0; i < amountOfLocks; i++) {
                await new Promise(resolve => setTimeout(() => resolve(null), lockDurationInSeconds));
            }
            setTimeout(() => resolve('OK'));
        }));
        rateLimitService = new RateLimitService(redis);
        const start = performance.now();
        await rateLimitService.acquireLock('test1-lock', lockDurationInSeconds);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeGreaterThanOrEqual(lockDurationInSeconds);
        expect(lockedTime).toBeLessThan(amountOfLocks * lockDurationInSeconds + spareBufferMilliseconds);
    });

    it('waitForSmallestTTL - wait for the smallest TTL - no previous requests', async () => {
        const mockTtl = jest.spyOn(redis, 'ttl');
        rateLimitService = new RateLimitService(redis);
        mockTtl.mockResolvedValue(Promise.resolve(0));
        const start = performance.now();
        await rateLimitService.waitForSmallestTTL([]);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeLessThan(spareBufferMilliseconds);
    });

    it('waitForSmallestTTL - wait for the smallest TTL - 2 previous requests', async () => {
        rateLimitService = new RateLimitService(redis);
        const mockPromiseAll = jest.spyOn(Promise, 'all');

        const requests = ['testRequest1'];
        mockPromiseAll
            .mockImplementationOnce(() => Promise.resolve([2, 0, 1])) // wait 1 second
            .mockImplementationOnce(() => Promise.resolve([1])) // wait 1 second
            .mockImplementationOnce(() => Promise.resolve([0])); // dont wait
        const start = performance.now();
        await rateLimitService.waitForSmallestTTL(requests);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeGreaterThanOrEqual(2000);
        expect(lockedTime).toBeLessThan(2000 + spareBufferMilliseconds);
    });

    it('retrieveHeader - 1 header and its length is less than maxRequests', async () => {
        const mockKeys = jest.spyOn(redis, 'keys');
        mockKeys.mockResolvedValue(Promise.resolve([]));
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(Promise.resolve('OK'));
        const mockGet = jest.spyOn(redis, 'get');
        mockGet.mockResolvedValue(Promise.resolve('0'));
        rateLimitService = new RateLimitService(redis);

        const key = 'headerKey1';
        const headers = {key: 'headerValue1'};
        const headerResponse = await rateLimitService.retrieveHeader('test1', {minIntervalInSeconds: 1000, maxRequests: 2, headers: [headers]});
        expect(headerResponse[key]).toEqual(headers[key]);

    });

    it('retrieveHeader - requests are more than maxRequests', async () => {
        const mockKeys = jest.spyOn(redis, 'keys');
        mockKeys.mockResolvedValue(Promise.resolve(['key1', 'key2', 'key3']));
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(Promise.resolve('OK'));
        const mockGet = jest.spyOn(redis, 'get');
        mockGet.mockResolvedValue(Promise.resolve('0'));
        rateLimitService = new RateLimitService(redis);

        const key = 'headerKey1';
        const headers = {key: 'headerValue1'};
        const headerResponse = await rateLimitService.retrieveHeader('test1', {minIntervalInSeconds: 1000, maxRequests: 2, headers: [headers]});
        expect(headerResponse[key]).toEqual(headers[key]);

    });
});