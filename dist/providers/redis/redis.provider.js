"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const ioredis_1 = require("ioredis");
exports.RedisProvider = {
    provide: 'RATE_LIMIT_REDIS',
    useFactory: (uri) => {
        return new ioredis_1.default(uri);
    },
    inject: ['RATE_LIMIT_REDIS_OPTIONS']
};
//# sourceMappingURL=redis.provider.js.map