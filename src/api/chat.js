import request from '@/utils/request';

export function getUserSessions(params) {
    return request.get('/app/chat/userSession/list', { params });
}

export function getChatSession(params) {
    return request.get('/app/chat/chatSession', { params });
}

export function getMessageList(params) {
    return request.get('/app/chat/message/list', { params });
}

export function createChatSession(targetUid) {
    return request.post(`/app/chat/chatSession/createSession/${targetUid}`);
}

export function getSessionId(params) {
    return request.get('/app/chat/chatSession/getSessionId', { params });
}

// 删除用户会话
export function deleteUserSession(sessionId) {
    return request.delete(`/app/chat/userSession/${sessionId}`);
}

// 置顶/取消置顶用户会话
export function togglePinUserSession(data) {
    return request.put('/app/chat/userSession/isPin', data);
}

// 获取聊天记录活跃日期列表
export function getHistoryDates(params) {
    return request.get('/app/chat/message/history/dates', { params });
}

// 修改用户会话背景图
export function updateBackgroundImage(data) {
    return request.put('/app/chat/userSession/backgroundImage', data);
}