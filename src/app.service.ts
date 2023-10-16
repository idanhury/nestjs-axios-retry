import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';

@Injectable()
export class AppService {

  constructor(@Inject('AXIOS_INSTANCE') private readonly axios: AxiosInstance) { }

  async sendRequest(language: string) {
    return (await this.axios.request({
      url: `https://${language}.wikipedia.org/static/images/icons/wikipedia.png`,
      method: 'GET',
    })).data;
  }
}
