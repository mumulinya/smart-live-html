import request from '@/utils/request';

// 获取积分中心信息（余额、等级、权益、签到状态）
export function getPointsInfo() {
    return request.get('/app/points/wallet/info');
}

// 获取积分明细列表
export function getPointsRecordList(params) {
    return request.get('/app/points/record/list', { params });
}

// 执行签到
export function signIn() {
    return request.post('/app/points/sign_in');
}

// 获取抽奖配置
export function getLotteryConfig() {
    return request.get('/app/points/lottery/config');
}

// 积分抽奖
export function drawLottery() {
    return request.post('/app/points/lottery/draw');
}
