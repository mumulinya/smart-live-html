import request from '@/utils/request';

export function getShopTypes() {
    return request.get('/app/shop/shop-type/list');
}

export function getShopList(params) {
    return request.get('/app/shop/of/type', { params });
}

export function getShopDetail(id) {
    return request.get(`/app/shop/${id}`);
}

export function searchShopsByName(name) {
    return request.get('/app/shop/of/name', { params: { name } });
}

export function getShopVouchers(shopId) {
    return request.get(`/app/marketing/voucher/list/${shopId}`);
}

export function getVoucherDetail(id) {
    return request.get(`/app/marketing/voucher/${id}`);
}

export function buyVoucherAPI(voucherId) {
    return request.post(`/app/marketing/voucher/buy/${voucherId}`);
}

export function seckillVoucherAPI(voucherId) {
    return request.post(`/app/marketing/voucher/seckill/${voucherId}`);
}
