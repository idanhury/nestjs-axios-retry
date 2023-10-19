import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConnectionStringOptions } from '../../interfaces';

export const RedisProvider: Provider = {
    provide: 'RATE_LIMIT_REDIS',
    useFactory: ({host, port}: RedisConnectionStringOptions): Redis => {
        return new Redis({host,port});
    },
    inject: ['RATE_LIMIT_REDIS_OPTIONS']
};
