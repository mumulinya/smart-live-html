import request from '@/utils/request';

// Search Shops (POST)
export function searchShops(data) {
    return request.post('/app/es/search/shops', data);
}

// Search Blogs (GET)
export function searchBlogs(data) {
    return request.post('/app/es/search/blogs', data);
}

// Search Users (GET)
export function searchUsers(params) {
    return request.get('/app/es/search/users', { params });
}

// Search Vouchers (POST)
export function searchVouchers(data) {
    return request.post('/app/es/search/vouchers', data);
}

// Hot Search (GET)
export function getHotSearch() {
    return request.get('/app/es/search/hot');
}

// Add Search History (POST)
export function addSearchHistory(data) {
    return request.post('/app/es/search/history', data);
}

// Get Search History (GET)
export function getSearchHistory(params) {
    return request.get('/app/es/search/history', { params });
}

// Clear Search History (DELETE)
export function clearSearchHistory(params) {
    return request.delete('/app/es/search/history', { params });
}
