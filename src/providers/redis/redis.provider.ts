import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisProviderOptions } from '../../interfaces';

export const RedisProvider: Provider = {
    provide: 'RATE_LIMIT_REDIS',
    useFactory: ({host, port}: RedisProviderOptions): Redis => {
        return new Redis({host,port});
    },
    inject: ['RATE_LIMIT_REDIS_OPTIONS']
};
