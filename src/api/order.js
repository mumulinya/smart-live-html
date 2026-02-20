import request from '@/utils/request';
import axios from 'axios';

export function getOrderList(params) {
    return request.get('/app/order/of/me', { params });
}

export function createOrder(data) {
    return request.post('/app/order', data);
}

export function getOrderDetail(orderId) {
    return request.get(`/app/order/getOrderById/${orderId}`);
}

export function payOrder(orderId) {
    return request.post(`/app/order/pay/${orderId}`);
}


export function cancelOrder(orderId) {
    return request.post(`/app/order/cancel/${orderId}`);
}

export function refundOrder(orderId) {
    return request.post(`/app/order/refund/${orderId}`);
}



export function checkOrderCreateStatus(orderId) {
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/app-dev-api';
    return axios.get(`${baseURL}/app/order/status/${orderId}`, {
        timeout: 10000,
        headers: {
            'authorization': token
        }
    });
}
