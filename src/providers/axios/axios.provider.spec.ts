import {Test} from '@nestjs/testing';
import {AxiosProvider} from './axios.provider';
import {RedisProvider} from '../redis/redis.provider';
import axios, {AxiosInstance} from 'axios';
import {RateLimitService} from '../../rate-limit.service';

describe('AxiosProvider', () => {
    let axiosInstance: AxiosInstance;
    const mockApiResponseTime = 100;

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
    const deKey1 = 'X-RapidAPI-Key';
    const deKey2 = 'X-RapidAPI-Host';
    const deHeaders = {
        [deKey1]: 'de_test_key',
        [deKey2]: 'de_test_host'
    };

    beforeEach(async () => {
        const axiosClient: AxiosInstance = axios.create();
        const moduleRef = await Test.createTestingModule({
            providers: [
                {
                    provide: 'RATE_LIMIT_REDIS_OPTIONS',
                    useFactory: async () => {
                        return 'redisConnectionString';
                    },
                },
                RedisProvider,
                {
                    provide: 'RATE_LIMIT_AXIOS_OPTIONS',
                    useFactory: async () => {
                        return {
                            axiosClient,
                            options: {
                                'en.wikipedia.org': {
                                    requests: 1,
                                    interval: 2,
                                    headers: [enHeaders, enHeaders2]
                                },
                                'he.wikipedia.org': {
                                    requests: 2,
                                    interval: 1,
                                    headers: [heHeaders]
                                },
                                'de.wikipedia.org': {
                                    requests: 1,
                                    interval: 2,
                                    headers: [deHeaders]
                                }
                            }
                        };
                    }
                },
                AxiosProvider,
                RateLimitService
            ]
        }).compile();

        axiosInstance = moduleRef.get<AxiosInstance>('RATE_LIMIT_AXIOS_INSTANCE');
    });

    it('axiosInstance should be defined', async () => {
        expect(axiosInstance).toBeDefined();
    });

    it('Should add custom headers to Axios requests', async () => {
        jest.spyOn(RateLimitService.prototype, 'onRequest').mockResolvedValue(Promise.resolve({
            [enKey1]: enHeaders[enKey1],
            [enKey2]: enHeaders[enKey2]
        }));
        const response = await axiosInstance.get(enUrl);
        expect(Object.keys(response.config.headers).length).toBeGreaterThan(2);
        const key1Value = response.config.headers[enKey1];
        expect(key1Value).toBeDefined();
        const key2Value = response.config.headers[enKey2];
        expect(key2Value).toBeDefined();
        expect(key1Value).toBe(enHeaders[enKey1]);
        expect(key2Value).toBe(enHeaders[enKey2]);
    });

    it('Should not add custom headers to Axios requests if url does not match', async () => {
        jest.spyOn(RateLimitService.prototype, 'onRequest').mockResolvedValue(Promise.resolve({
            ['otherKey']: 'otherKeyValue',
            ['otherKey2']: 'otherKeyValue2'
        }));
        const response = await axiosInstance.get(enUrl);
        expect(Object.keys(response.config.headers).length).toBeGreaterThan(0);
        const key1Value = response.config.headers[enKey1];
        expect(key1Value).toBeUndefined();
        const key2Value = response.config.headers[enKey2];
        expect(key2Value).toBeUndefined();
    });

    it('Single request: should not delay request if there is no need', async () => {
        jest.spyOn(RateLimitService.prototype, 'onRequest').mockResolvedValueOnce(
            new Promise(resolve => {
                setTimeout(() => resolve({
                    [enKey1]: enHeaders[enKey1],
                    [enKey2]: enHeaders[enKey2]
                }), mockApiResponseTime);
            }));

        const startTime = performance.now();
        await axiosInstance.get(enUrl);
        const endTime = performance.now();
        const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
        expect(elapsedTime).toBeGreaterThan(0);
        expect(elapsedTime).toBeLessThan(0.25);
    });

    it('Single request: should delay request according to config', async () => {
        const config = {
            'en.wikipedia.org': {
                requests: 1,
                interval: 2,
                headers: [enHeaders, enHeaders2]
            }
        };
        jest.spyOn(RateLimitService.prototype, 'onRequest').mockResolvedValueOnce(
            new Promise(resolve => {
                setTimeout(() => resolve({
                    [enKey1]: enHeaders[enKey1],
                    [enKey2]: enHeaders[enKey2]
                }), config['en.wikipedia.org'].interval * 1000);
            }));

        const startTime = performance.now();
        await axiosInstance.get(enUrl);
        const endTime = performance.now();
        const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
        expect(elapsedTime).toBeGreaterThan(config['en.wikipedia.org'].interval);
        expect(elapsedTime).toBeLessThan(config['en.wikipedia.org'].interval + 0.25);
    });

    it('Two requests: should delay request according to config', async () => {
        const config = {
            'de.wikipedia.org': {
                requests: 1,
                interval: 2,
                headers: [deHeaders]
            }
        };
        jest.spyOn(RateLimitService.prototype, 'onRequest')
            .mockImplementationOnce(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({
                        [deKey1]: deHeaders[deKey1]
                    }), mockApiResponseTime); // first request - wait a few milliseconds for the response
                }))
            .mockImplementationOnce(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({
                        [deKey1]: deHeaders[deKey1]
                    }), config['de.wikipedia.org'].interval * 1000); // second request - wait 2 seconds
                }));

        await axiosInstance.get(enUrl);
        const startTime = performance.now();
        await axiosInstance.get(enUrl); // second request
        const endTime = performance.now();
        const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
        expect(elapsedTime).toBeGreaterThan(config['de.wikipedia.org'].interval);
        expect(elapsedTime).toBeLessThan(config['de.wikipedia.org'].interval + 0.25);
    });

    it('Three requests: should delay request according to config', async () => {
        const config = {
            'he.wikipedia.org': {
                requests: 2,
                interval: 3,
                headers: [heHeaders]
            }
        };
        const secondRequestDelay = 200;
        const thirdRequestDelay = 50;

        jest.spyOn(RateLimitService.prototype, 'onRequest')
            .mockImplementationOnce(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({
                        [heKey1]: heHeaders[heKey1]
                    }), mockApiResponseTime); // first request - wait a few milliseconds for the response
                }))
            .mockImplementationOnce(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({
                        [heKey1]: heHeaders[heKey1]
                    }), mockApiResponseTime); // second request - wait a few milliseconds for the response
                }))
            .mockImplementationOnce(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({
                        [heKey1]: heHeaders[heKey1]
                    }), config['he.wikipedia.org'].interval * 1000); // third request - wait 2 seconds
                }));

        await axiosInstance.get(heUrl);
        await new Promise(resolve => setTimeout(() => resolve(null), secondRequestDelay)); // wait a few milliseconds, until second request happens
        await axiosInstance.get(heUrl); // second request
        await new Promise(resolve => setTimeout(() => resolve(null), secondRequestDelay));
        const startTime = performance.now();
        await axiosInstance.get(heUrl); // third request
        const endTime = performance.now();
        const elapsedTime = Number((+(endTime - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds

        // The third request should be sent after given amount of time (secondRequestDelay + thirdRequestDelay),
        // therefore, it should not be delayed at the rate limit interval, but by the time that has passed since the first request

        expect(elapsedTime).toBeGreaterThan(config['he.wikipedia.org'].interval - secondRequestDelay - thirdRequestDelay);
        expect(elapsedTime).toBeLessThan(config['he.wikipedia.org'].interval + secondRequestDelay + thirdRequestDelay);
    });

});
