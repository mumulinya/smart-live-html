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

export function likeRecord(params) {
    return request.get('/app/interaction/like/likeRecord', { params });
}

// Comments
export function getComments(params) {
    return request.get('/app/interaction/comment/listComment', { params });
}

export function addComment(data) {
    return request.post('/app/interaction/comment/addComment', data);
}

export function getUserComments(params) {
    return request.get('/app/interaction/comment/of/user', { params });
}

export function getCommentDetail(id) {
    return request.get(`/app/interaction/comment/getComment/${id}`);
}

// Like Comment: Reuse like logic with sourceType 5
export function likeComment(id) {
    return request.put('/app/interaction/like', { sourceType: 5, sourceId: id });
}

export function removeComment(data) {
    return request.post('/app/interaction/comment/removeComment', data);
}

// Reply Comment: uses addComment interface but with specific params
export function replyComment(data) {
    // data should contain: content, sourceId (commentId?), parentId (blogId), answerId (commentId)
    // User said: sourceType=5. parentId=blog/shopId. answerId=replyCommentId.
    // We expect the caller to construct the data object correctly, assuming we use the same addComment endpoint?
    // User said "Just change source_type to 5". And "Add parent_id and answer_id".
    // So we use the same generic addComment function but ensure data has these fields.
    return request.post('/app/interaction/comment/addComment', { ...data, sourceType: 5 });
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

export function starList(params) {
    return request.get('/app/interaction/star/starList', { params });
}

// Feed / Moments
export function getFeedList(params) {
    return request.get('/app/interaction/feed', { params });
}
