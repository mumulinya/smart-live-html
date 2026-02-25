import request from '@/utils/request';

/**
 * 获取商品热榜
 * @param params {current, size, category: 1=代金券 2=团购}
 */
export function getProductHotRank(params) {
    return request.get('app/product/hot/rank', { params });
}
