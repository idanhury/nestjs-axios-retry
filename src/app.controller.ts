import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  async sendRequest() {
    return await this.appService.sendRequest();
    // console.log(`timeDifference ${index}, ${timeDifference}`);
    // return { index, time: timeDifference };
  }
}
