import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('en')
  async sendRequest() {
    return await this.appService.sendRequest('en');
  }

  @Get('he')
  async sendHeRequest() {
    return await this.appService.sendRequest('he');
  }

  @Get('fr')
  async sendFrRequest() {
    return await this.appService.sendRequest('fr');
  }

}
