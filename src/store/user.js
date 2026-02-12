import { reactive } from 'vue';
import { emitAuthChanged } from '@/utils/auth-event';

const userState = reactive({
    userInfo: null,
    token: localStorage.getItem('token') || ''
});

// Initialize from localStorage if available
try {
    const savedUser = localStorage.getItem('userInfo');
    if (savedUser) {
        userState.userInfo = JSON.parse(savedUser);
    }
} catch (e) {
    console.error('Failed to parse user info from localStorage', e);
}

export function setUserInfo(info) {
    userState.userInfo = info;
    localStorage.setItem('userInfo', JSON.stringify(info));
}

export function getUserInfo() {
    return userState.userInfo;
}

export function clearUserInfo() {
    userState.userInfo = null;
    userState.token = '';
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    emitAuthChanged('logout');
}

export function setToken(token) {
    userState.token = token;
    localStorage.setItem('token', token);
}

export default userState;
