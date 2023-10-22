import { Provider } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { HostOptions, RateLimitsConfig } from '../../interfaces';
import { RateLimitService } from '../../rate-limit.service';

export const AxiosProvider: Provider = {
    provide: 'RATE_LIMIT_AXIOS_INSTANCE',
    useFactory: ({ options, axiosClient }: RateLimitsConfig, rateLimitService: RateLimitService): AxiosInstance => {

        axiosClient.interceptors.request.use(async (config) => {
            const hostname = extractHostname(axiosClient.getUri(config));
            const hostOptions: HostOptions = options[ hostname ];

            if (!hostOptions || hostOptions.headers.length === 0) {
                return config;
            }
            
            const credentials = await rateLimitService.onRequest(hostname, {
                minInterval: hostOptions.minInterval,
                maxRequests: hostOptions.maxRequests,
                headers: hostOptions.headers
            });
            
            if (credentials) {
                Object.entries(credentials).forEach(([ key, value ]) => {
                    config.headers[ key ] = value;
                });
            }
        

            return config;
        });

        return axiosClient;
    },
    inject: [ 'RATE_LIMIT_AXIOS_OPTIONS', RateLimitService ],
};

function extractHostname(url: string): string | null {
    const hostnameRegex = /^(?:https?:\/\/)?(?:www\.)?([^:/\n?]+)/;
    const match = url.match(hostnameRegex);
    if (match) {
        return match[ 1 ];
    } else {
        return null;
    }
}
