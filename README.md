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

Be sure to use the same axios instance across the code.

Eg;
```
import {axiosClient} from './app.module';

@Injectable()
export class AppService {

  constructor() {}

  async sendRequest(language: string) {
    return (await axiosClient.request({
      url: `URL/path`,
      method: 'GET',
    })).data;
  }
}
```