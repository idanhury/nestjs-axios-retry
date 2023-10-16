import { Provider } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';

export interface AxiosProviderOptions {
    requests: number;
    interval: number; // seconds
    headers: Record<string, any>[];
}

export const AxiosProvider: Provider = {
    provide: 'AXIOS_INSTANCE',
    useFactory: (redisClient: Redis, options: AxiosProviderOptions): AxiosInstance => {
        const instance = axios.create();

        instance.interceptors.request.use(async (config) => {
            await checkRateLimit(options.requests, options.interval, redisClient);

            if (options.headers.length > 0) {
                Object.entries(options.headers[0]).forEach(([key, value]) => {
                    config.headers.set(key, value);
                });
            }

            return config;
        });

        return instance;
    },
    inject: ['SHARED_REDIS', 'AXIOS_OPTIONS'],
};

async function checkRateLimit(requests: number, interval: number, redisClient: Redis): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const key = 'rate_limit_timestamps';
        const multi = redisClient.multi();
        multi.llen(key);
        let listLength: number;

        try {
            const [listLengthArr] = await multi.exec();
            // @ts-ignore
            listLength = listLengthArr[1];
            if (!listLength) {
                await redisClient.lpush(key, currentTime.toString());
                resolve();
                return;
            }
        } catch (e) {
            console.error('checkRateLimit listLengthArr error ', e);
            resolve();
            return;
        }

        const listElements = await redisClient.lrange(key, 0, listLength - 1);
        const timePassedResults = listElements.map((timestamp) => currentTime - parseInt(timestamp, 10));

        if (timePassedResults[listLength - 1] > interval || listLength < requests) { // {requests} is num of allowed request per time
            // If more than {interval} seconds have passed, remove all elements that meet condition
            const multi = redisClient.multi();
            await removeRedisElements(key, listElements, timePassedResults, multi);
            await multi.lpush(key, currentTime.toString());

            try {
                multi.exec();
            } catch (e) {
                console.error('checkRateLimit error ', e);
            }

            resolve();
            return;
        }

        setTimeout(async () => {
            await checkRateLimit(requests, interval, redisClient);
            resolve();
        }, 1000);
    });

    async function removeRedisElements(key: string, listElements: string[], timePassedResults: number[], multi) {
        for (let i = timePassedResults.length - 1; i >= 0; i--) {

            if (timePassedResults[i] < interval) {
                return;
            }

            // if last element meet condition, empty the array
            if (i === timePassedResults.length - 1) {
                multi.del(key);
                return;
            }

            multi.lrem(key, 1, listElements[i]);
        }
    }
};