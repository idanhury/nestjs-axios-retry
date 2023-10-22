"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosProvider = void 0;
const rate_limit_service_1 = require("../../rate-limit.service");
exports.AxiosProvider = {
    provide: 'RATE_LIMIT_AXIOS_INSTANCE',
    useFactory: ({ options, axiosClient }, rateLimitService) => {
        axiosClient.interceptors.request.use(async (config) => {
            const hostname = extractHostname(axiosClient.getUri(config));
            const hostOptions = options[hostname];
            if (!hostOptions || hostOptions.headers.length === 0) {
                return config;
            }
            const credentials = await rateLimitService.onRequest(hostname, {
                minInterval: hostOptions.minInterval,
                maxRequests: hostOptions.maxRequests,
                headers: hostOptions.headers
            });
            if (credentials) {
                Object.entries(credentials).forEach(([key, value]) => {
                    config.headers[key] = value;
                });
            }
            return config;
        });
        return axiosClient;
    },
    inject: ['RATE_LIMIT_AXIOS_OPTIONS', rate_limit_service_1.RateLimitService],
};
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
//# sourceMappingURL=axios.provider.js.map