import { Module } from '@nestjs/common';
import { SharedRedisProvider } from '../../providers/redis/shared-redis.provider';
import { RateLimitMonitorService } from 'src/services/rate-limit-monitor/rate-limit-monitor.service';
import { AxiosProvider, AxiosProviderOptions } from 'src/providers/axios/axios.provider';
import { AxiosService } from 'src/services/axios/axios.service';

@Module({
    providers: [
        SharedRedisProvider,
        {
            provide: 'AXIOS_OPTIONS',
            useValue: {
                requests: 2,
                interval: 10,
                headers: [{
                    'X-RapidAPI-Key': 'test',
                    'X-RapidAPI-Host': 'test'
                }]
            } as AxiosProviderOptions
        },
        AxiosProvider,
        RateLimitMonitorService,
        //    AxiosService
    ],
    exports: [RateLimitMonitorService]
})
export class RateLimitModule { }
