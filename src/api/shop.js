import request from '@/utils/request';

export function getShopTypes() {
    return request.get('/app/shop/shop-type/list');
}

export function getShopList(params) {
    return request.get('/app/shop/of/type', { params });
}

export function getHotRank(params) {
    return request.get('/app/shop/hot/rank', { params });
}

export function getShopsByIds(ids) {
    return request.get('/app/shop/listByIds', { params: { ids } });
}

export function getShopDetail(id) {
    return request.get(`/app/shop/${id}`);
}

export function searchShopsByName(name, area) {
    const params = { name };
    if (area) params.area = area;
    return request.get('/app/shop/of/name', { params });
}

export function getShopProducts(params) {
    return request.get('/app/product/listByShop', { params });
}

export function getProductDetail(id) {
    return request.get(`/app/product/getProductById/${id}`);
}

export function buyProductAPI(productId) {
    // Assuming the buy endpoint follows the pattern or generic order creation
    // The doc didn't specify a new buy endpoint, but typically it would be /product/product/buy/{id} or similar
    // For now, I'll update the prefix to product
    return request.post(`/app/product/purchase/${productId}`);
}

export function seckillProductAPI(productId) {
    return request.post(`/app/product/purchase/${productId}`);
}
