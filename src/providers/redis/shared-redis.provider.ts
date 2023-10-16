import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const SharedRedisProvider: Provider = {
    provide: 'SHARED_REDIS',
    useFactory: (): Redis => {
        return new Redis({
            host: 'localhost',
            port: 6379,
        });
    },
};
