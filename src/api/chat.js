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
