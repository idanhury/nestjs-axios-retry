import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';

@Injectable()
export class AxiosService {
    #axios: AxiosInstance;

    get axios(): AxiosInstance {
        return this.#axios;
    }

    constructor(@Inject('SHARED_REDIS') private readonly redisClient: Redis) { }

    initializeAxios(buffer: number, requests: number, metadata: Record<string, any>[]): AxiosInstance {
        const instance = axios.create();

        instance.interceptors.request.use(async (config) => {
            await this.#checkRateLimit(buffer, requests);
            const d = new Date()
            console.log(`000 axios send time: ${d.getMinutes()}:${d.getSeconds()}`);

            if (!!metadata[1]) {
                Object.entries(metadata[0]).forEach(([key, value]) => {
                    config.headers.set(key, value);
                });
            }

            return config;
        });

        return instance;
    }

    #checkRateLimit(buffer: number, requests: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            const key = 'rate_limit_timestamps';
            const listLength = await this.redisClient.llen(key);

            if (!listLength) {
                await this.redisClient.lpush(key, currentTime.toString());
                resolve();
                return;
            }

            const listElements = await this.redisClient.lrange(key, 0, listLength - 1);
            const timePassedResults = listElements.map((timestamp) => currentTime - parseInt(timestamp, 10));

            if (timePassedResults[listLength - 1] > buffer || listLength < requests) { // num of allowed request per time
                // If more than buffer (seconds) have passed, remove all elements that meet condition
                await this.#removeRedisElements(key, listElements, timePassedResults, buffer);
                await this.redisClient.lpush(key, currentTime.toString());
                resolve();
                return;
            }

            setTimeout(async () => {
                await this.#checkRateLimit(buffer, requests);
                resolve();
            }, 1000);
        });
    }

    async #removeRedisElements(key: string, listElements: string[], timePassedResults: number[], buffer: number) {
        for (let i = timePassedResults.length - 1; i >= 0; i--) {

            if (timePassedResults[i] < buffer) {
                return;
            }

            // if last element meet condition, empty the array
            if (i === timePassedResults.length - 1) {
                await this.redisClient.del(key);
                return;
            }

            await this.redisClient.lrem(key, 1, listElements[i]);
        }
    }
}
