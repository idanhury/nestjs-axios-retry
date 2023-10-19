"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosProvider = void 0;
exports.AxiosProvider = {
    provide: 'RATE_LIMIT_AXIOS_INSTANCE',
    useFactory: (redisClient, { options, axiosInstance }) => {
        axiosInstance.interceptors.request.use(async (config) => {
            const hostname = extractHostname(axiosInstance.getUri(config));
            const lang = hostname.match(/\b(fr|he|en)\b/);
            const hostOptions = options[hostname];
            if (!hostOptions || hostOptions.headers.length === 0) {
                return config;
            }
            const keys = hostOptions.headers.map((header, i) => `${hostname}_dx_${i}`);
            const response = await checkRateLimit(keys, hostOptions.requests, hostOptions.interval, redisClient);
            const index = extractAfterDx(response);
            if (hostOptions.headers[index]) {
                Object.entries(hostOptions.headers[index]).forEach(([key, value]) => {
                    config.headers[key] = value;
                });
            }
            return config;
        });
        return axiosInstance;
    },
    inject: ['RATE_LIMIT_REDIS', 'RATE_LIMIT_AXIOS_OPTIONS'],
};
async function checkRateLimit(keys, requests, interval, redisClient) {
    return new Promise(async (resolve, reject) => {
        const currentTime = Math.floor(Date.now() / 1000);
        const luaScript = `
            local currentTime = tonumber(ARGV[1])
            local interval = tonumber(ARGV[2])
            local requests = tonumber(ARGV[3])
            local shouldPush

            for i, key in ipairs(KEYS) do
                local listLength = redis.call('LLEN', key)

                if listLength == 0 then
                    redis.call('LPUSH', key, currentTime)
                    return key
                end

                shouldPush = false

                local listElements = redis.call('LRANGE', key, 0, listLength - 1)

                for j, timestamp in ipairs(listElements) do
                    if currentTime - tonumber(timestamp) > interval then
                        if j == 0 then
                            redis.call('DEL', key)
                            break
                        end
                        redis.call('LTRIM', key, j, -1)
                        shouldPush = true
                        break
                    end
                end

                listLength = redis.call('LLEN', key)

                if listLength < requests or shouldPush then
                    redis.call('LPUSH', key, currentTime)
                    return key
                end
            end
            return 'wait'
        `;
        try {
            const result = await redisClient.eval(luaScript, keys.length, ...keys, currentTime, interval, requests);
            if (result !== 'wait') {
                resolve(result);
                return;
            }
        }
        catch (e) {
            console.error('checkRateLimit error', e);
            resolve(e);
            return;
        }
        setTimeout(async () => {
            const waitResult = await checkRateLimit(keys, requests, interval, redisClient);
            resolve(waitResult);
        }, 1000);
    });
}
function extractHostname(url) {
    const hostnameRegex = /^(?:https?:\/\/)?(?:www\.)?([^:/\n?]+)/;
    const match = url.match(hostnameRegex);
    if (match) {
        return match[1];
    }
    else {
        return null;
    }
}
function extractAfterDx(input) {
    const match = input.match(/dx_(\d+)/);
    return match ? match[1] : null;
}
//# sourceMappingURL=axios.provider.js.map