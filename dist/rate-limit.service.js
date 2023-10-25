"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const md5 = require("md5");
let RateLimitService = class RateLimitService {
    constructor(redis) {
        this.redis = redis;
    }
    async onRequest(host, { minInterval, maxRequests, headers }) {
        const hashedHost = md5(host);
        const lockKey = `lock-${hashedHost}`;
        const lockAcquired = await this.acquireLock(lockKey, minInterval);
        if (!lockAcquired) {
            return;
        }
        try {
            return await this.retrieveHeader(`${hashedHost}`, { minInterval, maxRequests, headers });
        }
        catch (e) {
            console.error('Ratelimit onRequest ', e);
        }
        finally {
            await this.redis.del(`${lockKey}`);
        }
    }
    async acquireLock(lockKey, lockDurationInSeconds) {
        const lockValue = "locked";
        const acquireLock = async () => {
            return new Promise((resolve, reject) => {
                const response = this.redis.set(`${lockKey}`, lockValue, 'EX', lockDurationInSeconds, 'NX');
                resolve(response);
            });
        };
        const maxRetries = 10;
        let retries = 0;
        while (retries < maxRetries) {
            const lockAcquired = await acquireLock();
            if (lockAcquired === "OK") {
                return lockAcquired;
            }
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return false;
    }
    async retrieveHeader(hashedHost, { minInterval, maxRequests, headers }) {
        const keysPattern = `${hashedHost}-*`;
        const requests = await this.redis.keys(keysPattern);
        if (headers.length > 1) {
            maxRequests = maxRequests * headers.length;
        }
        if (requests.length >= maxRequests) {
            await this.waitForSmallestTTL(requests);
        }
        const timestamp = Date.now();
        const key = `${hashedHost}-${timestamp}`;
        await this.redis.set(key, 'key', 'EX', minInterval, 'NX');
        const credentialsKey = `last-credential-used-${hashedHost}`;
        const currentIndex = Number(await this.redis.get(credentialsKey));
        const nextIndex = currentIndex + 1 < headers.length ? currentIndex + 1 : 0;
        try {
            await this.redis.set(credentialsKey, nextIndex);
        }
        catch (e) {
            console.error('Ratelimit retrieveHeader ', e);
        }
        return headers[currentIndex];
    }
    async waitForSmallestTTL(requests) {
        const getSmallestTTL = async () => {
            let ttls = await Promise.all(requests.map(request => this.redis.ttl(request)));
            ttls = ttls.filter(t => t > 0);
            return ttls.length > 0 ? Math.min(...ttls) : 0;
        };
        let smallestTTLInSeconds = await getSmallestTTL();
        while (smallestTTLInSeconds > 0) {
            await new Promise((resolve) => setTimeout(resolve, smallestTTLInSeconds * 1000));
            smallestTTLInSeconds = await getSmallestTTL();
        }
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('RATE_LIMIT_REDIS')),
    __metadata("design:paramtypes", [ioredis_1.default])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map