import { Injectable } from '@nestjs/common';
import { RateLimitMonitorService } from './services/rate-limit-monitor/rate-limit-monitor.service';

@Injectable()
export class AppService {

  constructor(private rateLimitMonitorService: RateLimitMonitorService) { }

  async sendRequest() {
    const startTime = new Date();
    const axios = this.rateLimitMonitorService.setRateLimitConfig();

    const hostnameTest = 'en.wikipedia.org';
    return (await axios.request({
      url: `https://${hostnameTest}/static/images/icons/wikipedia.png`,
      method: 'GET',
    })).data;

    // const endTime = new Date();
    // // @ts-ignore
    // const timeDifference = endTime - startTime;
    // return timeDifference;
  }
}
