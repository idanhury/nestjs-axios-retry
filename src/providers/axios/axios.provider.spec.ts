import { Test, TestingModule } from '@nestjs/testing';
import { AxiosProvider, AxiosProviderOptions } from './axios.provider'; // Adjust the import path based on your project structure
import Redis from 'ioredis';
import { SharedRedisProvider } from '../redis/shared-redis.provider';
import { AxiosInstance } from 'axios';

describe('AxiosProvider', () => {
    let module: TestingModule;
    let axiosInstance: AxiosInstance;
    let redisClient: Redis;

    const enUrl = 'https://en.wikipedia.org/static/images/icons/wikipedia.png';
    const enKey1 = 'X-RapidAPI-Key';
    const enKey2 = 'X-RapidAPI-Host';
    const enKey3 = 'X-RapidAPI-Host3';
    const enHeaders = {
        [enKey1]: 'en_test_key',
        [enKey2]: 'en_test_host'
    };
    const enHeaders2 = {
        [enKey1]: 'en_test_key2',
        [enKey3]: 'en_test_host2'
    };

    const heUrl = 'https://he.wikipedia.org/static/images/icons/wikipedia.png';
    const heKey1 = 'X-RapidAPI-Key';
    const heKey2 = 'X-RapidAPI-Host';
    const heHeaders = {
        [heKey1]: 'he_test_key',
        [heKey2]: 'he_test_host'
    };

    const frUrl = 'https://fr.wikipedia.org/static/images/icons/wikipedia.png';
    const frKey1 = 'X-RapidAPI-Key';
    const frKey2 = 'X-RapidAPI-Host';
    const frHeaders = {
        [frKey1]: 'fr_test_key',
        [frKey2]: 'fr_test_host'
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SharedRedisProvider,
                {
                    provide: 'AXIOS_OPTIONS',
                    useValue: {
                        'en.wikipedia.org': {
                            requests: 2,
                            interval: 3,
                            headers: [enHeaders, enHeaders2]
                        },
                        'he.wikipedia.org': {
                            requests: 1,
                            interval: 5,
                            headers: [heHeaders]
                        },
                        'fr.wikipedia.org': {
                            requests: 2,
                            interval: 3,
                            headers: [frHeaders]
                        },
                    } as AxiosProviderOptions
                },
                AxiosProvider
            ],
        }).compile();
        redisClient = module.get<Redis>('RATE_LIMIT_REDIS');
    });

    afterAll(async () => {
        await redisClient.quit();
    });

    it('axiosInstance should be defined', async () => {
        axiosInstance = module.get<AxiosInstance>('AXIOS_INSTANCE');
        expect(axiosInstance).toBeDefined();
    });

    it('should add custom headers to Axios requests', async () => {
        const response = await axiosInstance.get(enUrl);
        const key1Value = response.config.headers[enKey1];
        expect(key1Value).toBeDefined()
        const key2Value = response.config.headers[enKey2];
        expect(key2Value).toBeDefined();
        expect(key1Value).toBe(enHeaders[enKey1]);
        expect(key2Value).toBe(enHeaders[enKey2]);
    });

    it('Single header: should delay requests according to config', async () => {
        const promises = [];
        const elapsedTimes = []

        for (let i = 0; i < 2; i++) {
            const startTime = performance.now();
            promises.push(
                axiosInstance.get(heUrl).then(() => {
                    const endTime = performance.now();
                    const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
                    elapsedTimes.push(elapsedTime);
                })
            );
        }

        await Promise.all(promises);
        expect(elapsedTimes[1] - elapsedTimes[0]).toBeGreaterThan(5);
    }, 8000);

    it('Multiple headers: should delay requests according to config', async () => {
        const promises = [];
        const elapsedTimes = []

        for (let i = 0; i < 8; i++) {
            const startTime = performance.now();
            promises.push(
                axiosInstance.get(enUrl).then(() => {
                    const endTime = performance.now();
                    const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
                    elapsedTimes.push(elapsedTime);
                })
            );
        }

        await Promise.all(promises);
        const previousPromiseHighestTime1 = Math.max(elapsedTimes[0], elapsedTimes[1]);
        const previousPromiseHighestTime2 = Math.max(elapsedTimes[2], elapsedTimes[3]);

        expect(elapsedTimes[4] - previousPromiseHighestTime1).toBeGreaterThan(3);
        expect(elapsedTimes[5] - previousPromiseHighestTime1).toBeGreaterThan(3);
        expect(elapsedTimes[6] - previousPromiseHighestTime2).toBeGreaterThan(3);
        expect(elapsedTimes[7] - previousPromiseHighestTime2).toBeGreaterThan(3);
    }, 10000);

    it('Single header and multiple hosts should delay requests according to host\'s config', async () => {
        const promises = [];
        const elapsedHeTimes = []
        const elapsedFrTimes = []

        for (let i = 0; i < 7; i++) {
            const isHe = i % 2;
            const startTime = performance.now();
            promises.push(
                axiosInstance.get(isHe ? heUrl : frUrl).then(() => {
                    const endTime = performance.now();
                    const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
                    isHe ? elapsedHeTimes.push(elapsedTime) : elapsedFrTimes.push(elapsedTime);
                })
            );
        }

        await Promise.all(promises);

        expect(elapsedHeTimes[1] - elapsedHeTimes[0]).toBeGreaterThan(5);
        expect(elapsedHeTimes[2] - elapsedHeTimes[1]).toBeGreaterThan(5);
        expect(elapsedFrTimes[2] - elapsedFrTimes[0]).toBeGreaterThan(3);
        expect(elapsedFrTimes[2] - elapsedFrTimes[0]).toBeLessThan(5);
        expect(elapsedFrTimes[3] - elapsedFrTimes[1]).toBeGreaterThan(3);
        expect(elapsedFrTimes[3] - elapsedFrTimes[1]).toBeLessThan(5);
    }, 18000);

});
