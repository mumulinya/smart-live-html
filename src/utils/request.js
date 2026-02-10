import axios from 'axios';
import router from '@/router'; // Import router for redirects

// Environment variables or constants
export const minioURL = "http://192.168.182.20";
export const minioPort = "9000";
export const filePrefix = "/smart-live";
export const fileURL = minioURL + ":" + minioPort + filePrefix;

export const webSocketURL = "localhost";
// Base configuration
const service = axios.create({
  baseURL: '/app-dev-api', // Proxy target will handle this
  timeout: 5000
});

// Request interceptor
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers['authorization'] = token;
    }
    // Prevent GET request caching
    if (config.method === 'get') {
      config.params = config.params || {};
      config.params['_t'] = Date.now();
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
