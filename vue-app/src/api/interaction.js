import request from '@/utils/request';

// Follow
export function isFollowed(params) {
    return request.get('/app/interaction/follow/isFollow', { params });
}

export function followUser(data) {
    // data: { sourceId, sourceType, isFollow }
    return request.put('/app/interaction/follow', data);
}

export function followUserBoolean(userId, isFollow) {
    return request.put(`/app/follow/followUser/${userId}/${isFollow}`);
}

export function getFollows(params) {
    return request.get('/app/interaction/follow/follows', { params });
}

export function getCommonFollows(params) {
    return request.get('/app/interaction/follow/common', { params });
}

export function getFans(params) {
    return request.get('/app/interaction/follow/fans', { params });
}

export function getShopCollections(params) {
    return request.get('/app/follow/followShop/followShops', { params });
}

export function uncollectShop(shopId) {
    return request.put(`/app/follow/followShop/${shopId}/false`);
}


// Like
export function likeBlog(data) {
    // data: { sourceType: 3, sourceId: blogId }
    return request.put('/app/interaction/like', data);
}

export function getLikeList(params) {
    return request.get('/app/interaction/like/likeUserList', { params });
}

// Comments
export function getComments(params) {
    return request.get('/app/interaction/comment/listComment', { params });
}

export function addComment(data) {
    return request.post('/app/interaction/comment/addComment', data);
}

// Star / Collection
export function isStar(params) {
    // params: { sourceId, sourceType }
    return request.get('/app/interaction/star/isStar', { params });
}

export function toggleStar(data) {
    // data: { sourceId, sourceType, isCollection }
    return request.put('/app/interaction/star', data);
}
