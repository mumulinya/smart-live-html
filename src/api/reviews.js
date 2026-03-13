import request from '@/utils/request';

export function getReviewList(params) {
    return request.get('/app/interaction/review/listReview', { params });
}

export function addReview(data) {
    // status: 1=发布, 0=草稿
    return request.post('/app/interaction/review/addReview', data);
}

export function updateReview(data) {
    return request.put('/app/interaction/review/updateReview', data);
}

export function removeReview(id) {
    return request.delete(`/app/interaction/review/removeReview/${id}`);
}

export function getUserReviewList(params) {
    return request.get('/app/interaction/review/of/user', { params });
}

export function getReview(id) {
    return request.get(`/app/interaction/review/getReview/${id}`);
}

export function likeReviewComment(id) {
    return request.put('/app/interaction/like', { sourceType: 7, sourceId: id });
}
