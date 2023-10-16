import { Inject, Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { AxiosService } from '../axios/axios.service';

@Injectable()
export class RateLimitMonitorService {

    constructor(
        @Inject('AXIOS_INSTANCE') private readonly axios: AxiosInstance,
        // private readonly axiosService: AxiosService
    ) { }

    setRateLimitConfig(): AxiosInstance {
        // return this.axiosService.initializeAxios(buffer, requests, metadata);
        return this.axios;
    }
}