import { AxiosInstance } from 'axios';
export declare class RateLimitService {
    private readonly axiosInstance;
    constructor(axiosInstance: AxiosInstance);
    get axios(): AxiosInstance;
}
