import { Module } from '@nestjs/common';
import { SharedRedisProvider } from '../../providers/redis/shared-redis.provider';
import { RateLimitMonitorService } from 'src/services/rate-limit-monitor/rate-limit-monitor.service';
import { AxiosProvider, AxiosProviderOptions } from 'src/providers/axios/axios.provider';
import { AxiosService } from 'src/services/axios/axios.service';

/**
 * Instructions:
 * Import @Inject('AXIOS_INSTANCE') private readonly axios: AxiosInstance
 * to the service constructor
*/

@Module({
    providers: [
        SharedRedisProvider,
        {
            provide: 'AXIOS_OPTIONS',
            useValue: {
                'en.wikipedia.org': {
                    requests: 2,
                    interval: 10,
                    headers: [{
                        'X-RapidAPI-Key': 'en_test_key',
                        'X-RapidAPI-Host': 'en_test_host'
                    },
                    {
                        'X-RapidAPI-Key': 'en_test_key1',
                        'X-RapidAPI-Host': 'en_test_host1'
                    }]
                },
                'he.wikipedia.org': {
                    requests: 1,
                    interval: 5,
                    headers: [{
                        'X-RapidAPI-Key': 'he_test_key',
                        'X-RapidAPI-Host': 'he_test_host'
                    },
                    {
                        'X-RapidAPI-Key': 'he_test_key1',
                        'X-RapidAPI-Host': 'he_test_host1'
                    }]
                },
                'fr.wikipedia.org': {
                    requests: 1,
                    interval: 2,
                    headers: [{
                        'X-RapidAPI-Key': 'fr_test_key',
                        'X-RapidAPI-Host': 'fr_test_host'
                    }]
                },
            } as AxiosProviderOptions
        },
        AxiosProvider,
        // RateLimitMonitorService,
        //    AxiosService
    ],
    exports: [AxiosProvider]
})
export class RateLimitModule { }
