import request from '@/utils/request';

// Search Shops (POST)
export function searchShops(data) {
    return request.post('/app/search/shops', data);
}

// Search Blogs (GET)
export function searchBlogs(data) {
    return request.post('/app/search/blogs', data);
}

// Search Users (GET)
export function searchUsers(params) {
    return request.get('/app/search/users', { params });
}

// Search Vouchers (POST)
export function searchVouchers(data) {
    return request.post('/app/search/vouchers', data);
}

// Hot Search (GET)
export function getHotSearch() {
    return request.get('/app/search/hot');
}

// Add Search History (POST)
export function addSearchHistory(params) {
    return request.post('/app/search/history', null, { params });
}

// Get Search History (GET)
// Note: Backend annotation says @PathVariable but mapped to /history. Assuming typo in backend snippet (meant RequestParam) 
// or path is /history/{userId}. Since others are RequestParam, we try RequestParam first.
// If backend strictly implies /history/{userId}, we would need: request.get(`/app/search/history/${params.userId}`)
// But let's stick to query params as per existing pattern unless it fails. 
// Actually, to be safe against the snippet provided: "@GetMapping("/history") ... @PathVariable" is invalid Spring mapping.
// It most likely is @RequestParam.
export function getSearchHistory(params) {
    return request.get('/app/es/search/history', { params });
}

// Clear Search History (DELETE)
export function clearSearchHistory(params) {
    return request.delete('/app/es/search/history', { params });
}

// Record Search (POST) - For Hot Search Stats
export function recordSearch(keyword) {
    return request.post('/app/es/search/record', null, { params: { keyword } });
}
