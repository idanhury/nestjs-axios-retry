import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';

@Injectable()
export class RateLimitService {

  constructor(@Inject('RATE_LIMIT_AXIOS_INSTANCE') private readonly axiosInstance: AxiosInstance) { }

  public get axios() {
    return this.axiosInstance;
  }
}