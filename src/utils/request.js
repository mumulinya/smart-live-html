import axios from 'axios';
import router from '@/router'; // Import router for redirects
import { emitAuthChanged } from '@/utils/auth-event';

// Environment variables (with safe defaults for local development)
const DEFAULT_MINIO_URL = 'http://127.0.0.1';
const DEFAULT_MINIO_PORT = '9000';
const DEFAULT_FILE_PREFIX = '/smart-live';

export const minioURL = import.meta.env.VITE_MINIO_URL || DEFAULT_MINIO_URL;
export const minioPort = String(import.meta.env.VITE_MINIO_PORT || DEFAULT_MINIO_PORT);
export const filePrefix = import.meta.env.VITE_FILE_PREFIX || DEFAULT_FILE_PREFIX;
export const fileURL =
  import.meta.env.VITE_FILE_URL ||
  `${minioURL}${minioPort ? `:${minioPort}` : ''}${filePrefix}`;

export const webSocketURL = import.meta.env.VITE_WS_HOST || 'localhost';
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/app-dev-api';
// Base configuration
const service = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000 // Increased from 5000 to 30000 to prevent timeouts
});

// Request interceptor
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers['authorization'] = token;
    }
    // Add no-cache timestamp only when explicitly requested.
    if (config.method === 'get') {
      config.params = config.params || {};
      if (config.noCache === true) {
        config.params['_t'] = Date.now();
      }
    }
    return config;
  },
  error => {
    console.log(error);
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  response => {
    // console.log(response); // Debug
    const res = response.data;

    // 401: Not logged in or token expired
    if (res.code == 401) {
      // 清除过期的token
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      emitAuthChanged('logout');
      setTimeout(() => {
        router.push("/user/login");
      }, 200);
      return Promise.reject("请先登录");
    }

    // Custom success check (adapting from legacy common.js)
    if (!res.success) {
      return Promise.reject(res.errorMsg || 'Error');
    }
    return res;
  },
  error => {
    console.log('err' + error);
    if (error.response && error.response.status === 401) {
      // 清除过期的token
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      emitAuthChanged('logout');
      setTimeout(() => {
        router.push("/user/login");
      }, 200);
      return Promise.reject("请先登录");
    }
    return Promise.reject(error);
  }
);

export default service;

// Utility functions from common.js
export const util = {
  getUrlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return decodeURI(r[2]);
    }
    return "";
  },
  formatPrice(val) {
    if (typeof val === 'string') {
      if (isNaN(val)) {
        return null;
      }
      // 价格转为整数
      const index = val.lastIndexOf(".");
      let p = "";
      if (index < 0) {
        // 无小数
        p = val + "00";
      } else if (index === p.length - 2) {
        // 1位小数
        p = val.replace(".", "") + "0";
      } else {
        // 2位小数
        p = val.replace(".", "")
      }
      return parseInt(p);
    } else if (typeof val === 'number') {
      if (!val) {
        return null;
      }
      const s = val + '';
      if (s.length === 0) {
        return "0.00";
      }
      if (s.length === 1) {
        return "0.0" + val;
      }
      if (s.length === 2) {
        return "0." + val;
      }
      const i = s.indexOf(".");
      if (i < 0) {
        return s.substring(0, s.length - 2) + "." + s.substring(s.length - 2)
      }
      const num = s.substring(0, i) + s.substring(i + 1);
      if (i === 1) {
        // 1位整数
        return "0.0" + num;
      }
      if (i === 2) {
        return "0." + num;
      }
      if (i > 2) {
        return num.substring(0, i - 2) + "." + num.substring(i - 2)
      }
    }
  }
};
