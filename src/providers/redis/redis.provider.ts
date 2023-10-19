import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
    provide: 'RATE_LIMIT_REDIS',
    useFactory: (uri: string): Redis => {
        return new Redis(uri);
    },
    inject: ['RATE_LIMIT_REDIS_OPTIONS']
};
