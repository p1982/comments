import axios from 'axios';

import { API_CONFIG } from './config';
import { setupInterceptors } from './interceptors';

const axiosInstance = axios.create(API_CONFIG);
setupInterceptors(axiosInstance);

export default axiosInstance;
