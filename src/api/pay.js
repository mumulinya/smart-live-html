import request from '@/utils/request';

// 统一下单（微信支付）
export function unifiedPay(data) {
    return request.post('/app/pay/unified', data);
}

// 余额支付
export function balancePay(data) {
    return request.post('/app/pay/balance', data);
}

// 查询支付状态
export function getPayStatus(paySn) {
    return request.get('/app/pay/status', { params: { paySn } });
}

// 获取支付记录列表
export function getPaymentList(params) {
    return request.get('/app/pay/list', { params });
}

// 取消支付
export function cancelPay(paySn) {
    return request.post('/app/pay/cancel', { paySn });
}
