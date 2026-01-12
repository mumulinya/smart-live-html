import request from '@/utils/request';

export function getOrderList(params) {
    return request.get('/app/order/voucher-order/of/me', { params });
}

export function createOrder(data) {
    return request.post('/app/order/voucher-order', data);
}

export function payOrder(orderId) {
    return request.post(`/app/order/voucher-order/pay/${orderId}`);
}


export function cancelOrder(orderId) {
    return request.post(`/app/order/voucher-order/cancel/${orderId}`);
}

export function refundOrder(orderId) {
    return request.post(`/app/order/voucher-order/refund/${orderId}`);
}
