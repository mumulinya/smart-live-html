import request from '@/utils/request';

export function searchUser(params) {
    return request.get('/app/user/list', { params });
}

export function login(data) {
    return request.post('/app/auth/appLogin', data);
}

export function appLoginByPassword(data) {
    return request.post('/app/auth/appLoginByPassword', data);
}

export function sendCode(phone) {
    return request.post('/app/code', null, { params: { phone } });
}

export function getUserInfo(id) {
    return request.get(`/app/user/${id}`);
}

import { setUserInfo, getUserInfo as getStoreUserInfo, clearUserInfo } from '@/store/user';

function cloneUser(user) {
    if (!user || typeof user !== 'object') return user;
    return { ...user };
}

export function getCurrentUser() {
    const cachedUser = getStoreUserInfo();
    if (cachedUser) {
        return Promise.resolve({ data: cloneUser(cachedUser) });
    }
    return request.get('/app/user/me').then(res => {
        if (res.data) { // Assuming res.data is the user object, adjust based on actual response structure
            setUserInfo(res.data);
        }
        return { ...res, data: cloneUser(res.data) };
    }).catch(err => {
        clearUserInfo();
        throw err;
    });
}

export function getUserStats(userId) {
    return request.get(`/app/user/stats/${userId}`);
}

export function getFullUserInfo(userId) {
    return request.get(`/app/user/info/getUserInfo/${userId}`);
}

export function updateUser(data) {
    return request.post('/app/user/update', data);
}

export function updateUserInfo(data) {
    return request.post('/app/user/info/update', data);
}

export function updateBackgroundImage(data) {
    return request.post('/app/user/info/updateBackgroundImage', data);
}

export function uploadFile(formData) {
    return request.post('/app/file/appUpload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}

export function updatePassword(data) {
    return request.post('/app/user/updatePassword', data);
}

// 设置密码（用于从未设置过密码的用户）
export function setPassword(data) {
    return request.post('/app/user/setPassword', data);
}
