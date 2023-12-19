import Redis from "ioredis";
import {RateLimitService} from "./rate-limit.service";

describe('RateLimitService', () => {
    let rateLimitService: RateLimitService;
    const redis: Redis = new Redis;

    beforeEach(() => {

        // jest.mock('redis', () => ({
        //     createClient: jest.fn().mockReturnValue({
        //       on: jest.fn(),
        //       connect: jest.fn(),
        //       get: (key: string, cb: any) => cb(),
        //       set: (args: string[], cb: any) => cb(),
        //     }),
        //   }));

        // const redisMock = jest.mock("redis", () => {
        //     return {
        //         createClient: () => {
        //             return {
        //                 connect: jest.fn(),
        //                 get: jest.fn(async () => "123qwe"),
        //                 on: jest.fn(),
        //             };
        //         }
        //     };
        // });
    });

    it('acquireLock to lock for a given time', async () => {
        const lockDurationInSeconds = 1000;
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(new Promise((resolve, reject) => {
            setTimeout(() => resolve('OK'), lockDurationInSeconds);
        }));
        rateLimitService = new RateLimitService(redis);
        const start = performance.now();
        await rateLimitService.acquireLock('test1', lockDurationInSeconds);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeGreaterThanOrEqual(lockDurationInSeconds);
        expect(lockedTime).toBeLessThan(lockDurationInSeconds + 100);
    });

    it('acquireLock to lock - failed on first attemps', async () => {
        // TODO
        const lockDurationInSeconds = 1000;
        const mockSet = jest.spyOn(redis, 'set');
        mockSet.mockResolvedValue(new Promise((resolve, reject) => {
            setTimeout(() => resolve('OK'), lockDurationInSeconds);
        }));
        rateLimitService = new RateLimitService(redis);
        const start = performance.now();
        await rateLimitService.acquireLock('test1', lockDurationInSeconds);
        const end = performance.now();
        const lockedTime = Math.floor(end - start);
        expect(lockedTime).toBeGreaterThanOrEqual(lockDurationInSeconds);
        expect(lockedTime).toBeLessThan(lockDurationInSeconds + 100);
    });
});