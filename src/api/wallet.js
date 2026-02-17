import request from '@/utils/request';

// 获取钱包信息（余额、冻结金额、支付密码状态）
export function getWalletInfo() {
    return request.get('/app/wallet/info');
}

// 获取交易明细列表
export function getWalletTransactionList(params) {
    return request.get('/app/wallet/transaction/list', { params });
}

// 创建微信充值订单
export function createWechatRecharge(data) {
    return request.post('/app/wallet/recharge/wechat', data);
}

// 设置/修改支付密码
export function setPayPassword(data) {
    return request.post('/app/wallet/password/set', data);
}

// 验证支付密码
export function verifyPayPassword(data) {
    return request.post('/app/wallet/password/verify', data);
}
