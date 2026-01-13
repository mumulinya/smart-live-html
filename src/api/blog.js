import request from '@/utils/request';

export function getBlogDetail(id) {
    return request.get(`/app/blog/${id}`);
}

export function getMyBlogs(params) {
    return request.get('/app/blog/of/me', { params });
}

export function getUserBlogs(params) {
    return request.get('/app/blog/of/user', { params });
}

export function getFollowedFeeds(params) {
    return request.get('/app/blog/of/follow', { params });
}

export function getHotBlogs(params) {
    return request.get('/app/blog/hot', { params });
}

export function getBlogsByCategory(id, current) {
    return request.get(`/app/blog/category/${id}`, { params: { current } });
}



export function searchBlogs(params) {
    return request.get('/app/blog/list', { params });
}

export function saveBlog(data) {
    return request.post('/app/blog', data);
}

export function deleteBlog(id) {
    return request.delete(`/app/blog/remove/${id}`);
}

export function updateBlog(data) {
    return request.put('/app/blog', data);
}
