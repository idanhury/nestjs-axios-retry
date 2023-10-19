"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimitModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitModule = void 0;
const common_1 = require("@nestjs/common");
const axios_provider_1 = require("./providers/axios/axios.provider");
const redis_provider_1 = require("./providers/redis/redis.provider");
const rate_limit_service_1 = require("./rate-limit.service");
let RateLimitModule = RateLimitModule_1 = class RateLimitModule {
    static register({ axios, redis }) {
        return {
            module: RateLimitModule_1,
            providers: [
                {
                    provide: 'RATE_LIMIT_REDIS_OPTIONS',
                    useValue: redis,
                },
                redis_provider_1.RedisProvider,
                {
                    provide: 'RATE_LIMIT_AXIOS_OPTIONS',
                    useValue: axios,
                },
                axios_provider_1.AxiosProvider,
                rate_limit_service_1.RateLimitService
            ],
            exports: [rate_limit_service_1.RateLimitService],
        };
    }
};
exports.RateLimitModule = RateLimitModule;
exports.RateLimitModule = RateLimitModule = RateLimitModule_1 = __decorate([
    (0, common_1.Module)({})
], RateLimitModule);
//# sourceMappingURL=rate-limit.module.js.map