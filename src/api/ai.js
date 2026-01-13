import request from '@/utils/request';

/**
 * 发送消息给AI助手
 * @param {Object} data - 消息数据
 * @param {string} data.sessionId - 会话ID
 * @param {string} data.content - 消息内容
 * @param {string} data.messageType - 消息类型：text/image/file
 * @returns {Promise}
 */
export function sendMessage(data) {
    return request.post('/app/ai/message/send', data);
}

/**
 * 流式发送消息给AI助手（SSE）
 * @param {Object} data - 消息数据
 * @param {string} data.sessionId - 会话ID
 * @param {string} data.content - 消息内容
 * @param {Function} onMessage - 接收消息回调
 * @param {Function} onError - 错误回调
 * @param {Function} onComplete - 完成回调
 */
export function sendMessageStream(data, onMessage, onError, onComplete) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/app-dev-api';
    // URL construction for GET request
    // Backend expects: message, sessionId, x, y, contextMode
    let url = `${baseURL}/app/ai/chat?sessionId=${data.sessionId}&message=${encodeURIComponent(data.content)}`;

    // 添加可选参数
    if (data.contextMode !== undefined) {
        url += `&contextMode=${data.contextMode}`;
    }

    // 添加经纬度参数 (x=longitude, y=latitude)
    if (data.latitude && data.longitude) {
        url += `&x=${data.longitude}&y=${data.latitude}`;
    }

    // 使用 fetch 替代 EventSource，以兼容非标准 SSE 格式的流式输出
    // 模拟 EventSource 的返回对象，以便前端可以调用 close()
    const controller = new AbortController();
    const eventSourceShim = {
        close: () => controller.abort()
    };

    fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'Accept': 'text/event-stream, text/plain, */*'
        }
    }).then(async response => {
        if (!response.ok) throw new Error(response.statusText);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                if (chunk) {
                    onMessage && onMessage({ content: chunk });
                }
            }
            onComplete && onComplete();
        } catch (e) {
            console.error('流读取中断:', e);
            onError && onError(e);
        }
    }).catch(error => {
        if (error.name === 'AbortError') {
            console.log('请求已取消');
        } else {
            console.error('Fetch error:', error);
            onError && onError(error);
        }
    });

    return eventSourceShim;
}

/**
 * 创建新的AI会话
 * @param {Object} data - 会话数据
 * @param {string} data.title - 会话标题（可选）
 * @returns {Promise}
 */
export function createSession(data = {}) {
    return request.post('/app/ai/session/create', data);
}

/**
 * 获取用户的AI会话列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise}
 */
export function getSessionList(params) {
    return request.get('/app/ai/session/list', { params });
}

/**
 * 获取指定会话的详细信息
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function getSessionDetail(sessionId) {
    return request.get(`/app/ai/session/${sessionId}`);
}

/**
 * 获取指定会话的消息列表
 * @param {Object} params - 查询参数
 * @param {string} params.sessionId - 会话ID
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise}
 */
export function getMessageList(params) {
    return request.get('/app/ai/message/list', { params });
}

/**
 * 删除AI会话
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function deleteSession(sessionId) {
    return request.delete(`/app/ai/session/${sessionId}`);
}

/**
 * 更新会话标题
 * @param {string} sessionId - 会话ID
 * @param {string} title - 新标题
 * @returns {Promise}
 */
export function updateSessionTitle(sessionId, title) {
    return request.put(`/app/ai/session/${sessionId}/title`, { title });
}

/**
 * 清空会话消息
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function clearSessionMessages(sessionId) {
    return request.delete(`/app/ai/session/${sessionId}/messages`);
}

/**
 * 获取AI推荐的快捷问题
 * @returns {Promise}
 */
export function getSuggestions() {
    return request.get('/app/ai/suggestions');
}

/**
 * 上传文件到AI会话
 * @param {FormData} formData - 包含文件的FormData对象
 * @param {string} sessionId - 会话ID
 * @returns {Promise}
 */
export function uploadFile(formData, sessionId) {
    return request.post(`/app/ai/file/upload?sessionId=${sessionId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

/**
 * 语音转文字
 * @param {FormData} formData - 包含音频文件的FormData对象
 * @returns {Promise}
 */
export function voiceToText(formData) {
    return request.post('/app/ai/voice/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

/**
 * 获取会话统计信息
 * @returns {Promise}
 */
export function getSessionStats() {
    return request.get('/app/ai/session/stats');
}
