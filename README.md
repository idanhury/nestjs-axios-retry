## Installation

```bash
npm install https://USERNAME:FINE_GRAINED_TOKEN@github.com/smipin/rate-limit-monitor-nestjs.git
```

## Instructions:

Import RateLimitModule to your app.module 

```
export const axiosClient: AxiosInstance = axios.create();

@Module({
  imports: [RateLimitModule.register({
    rateLimitsConfig: {
      options: {
        'HOSTNAME': {
          maxRequests: 2,
          minIntervalInSeconds: 10,
          headers: [{
              KEY: VALUE,
          },
      ]},
      },
      axiosClient,
    },
    redisConnectionString: 'localhost:6379'
  })
  ],
  controllers: [...],
```