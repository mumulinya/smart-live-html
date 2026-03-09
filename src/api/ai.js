import request from '@/utils/request';

/**
 * 发送消息给助手
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
 * 流式发送消息给助手（SSE）- 支持事件分流
 * @param {Object} data - 消息数据
 * @param {string} data.sessionId - 会话ID
 * @param {string} data.content - 消息内容
 * @param {Function} onMessage - 接收普通消息回调 (data) => void
 * @param {Function} onError - 错误回调
 * @param {Function} onComplete - 完成回调
 * @param {Function} onStatus - 状态更新回调 (statusText) => void
 * @param {Function} onCardRender - 卡片渲染回调 (cardData) => void
 */
export function sendMessageStream(data, onMessage, onError, onComplete, onStatus, onCardRender) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/app-dev-api';
    // URL construction for GET request
    // Backend expects: message, sessionId, x, y, contextMode, userId, region
    let url = `${baseURL}/app/ai/message/chat?sessionId=${data.sessionId}&message=${encodeURIComponent(data.content)}`;

    // 添加可选参数
    if (data.contextMode !== undefined) {
        url += `&contextMode=${data.contextMode}`;
    }

    // 添加经纬度参数 (x=longitude, y=latitude)
    if (data.latitude && data.longitude) {
        url += `&x=${data.longitude}&y=${data.latitude}`;
    }

    // 添加用户ID参数
    if (data.userId !== undefined && data.userId !== null && data.userId !== '') {
        url += `&userId=${encodeURIComponent(data.userId)}`;
    }

    // 添加区域参数
    if (data.region) {
        url += `&region=${encodeURIComponent(data.region)}`;
    }

    // 使用 fetch 替代 EventSource，以兼容非标准 SSE 格式的流式输出
    // 模拟 EventSource 的返回对象，以便前端可以调用 close()
    const controller = new AbortController();
    const eventSourceShim = {
        close: () => controller.abort()
    };

    // 获取token
    const token = localStorage.getItem('token');

    fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'Accept': 'text/event-stream, text/plain, */*',
            'authorization': token || ''
        }
    }).then(async response => {
        if (!response.ok) throw new Error(response.statusText);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE 规范以双换行分隔事件
                const events = buffer.split('\n\n');
                buffer = events.pop(); // 保留未完成的部分

                for (const eventBlock of events) {
                    if (!eventBlock.trim()) continue;

                    // 解析 event: xxx 和 data: xxx
                    const lines = eventBlock.split('\n');
                    let eventType = 'message'; // 默认事件类型
                    let eventData = '';

                    for (const line of lines) {
                        // 跳过注释行
                        if (line.startsWith(':')) continue;

                        if (line.startsWith('event:')) {
                            eventType = line.substring(6).trim();
                        } else if (line.startsWith('data:')) {
                            const rawData = line.substring(5);
                            // 跳过 [DONE] 标记
                            if (rawData.trim() === '[DONE]') continue;

                            // SSE 规范：如果有多行 data，用换行符连接
                            if (eventData) {
                                eventData += '\n' + rawData;
                            } else {
                                eventData += rawData;
                            }
                        }
                    }

                    if (eventData) {
                        // 根据事件类型分流处理
                        switch (eventType) {
                            case 'message':
                                // 普通闲聊：追加文字（打字机效果）
                                // 注意：这里不再添加换行符，让前端更精确控制显示
                                onMessage && onMessage({ content: eventData });
                                break;
                            case 'status':
                                // 状态更新：显示 "正在搜索..." 等
                                onStatus && onStatus(eventData);
                                break;
                            case 'card_render':
                                // 推荐结果：解析 JSON 并渲染卡片
                                try {
                                    const cardResult = JSON.parse(eventData);
                                    onCardRender && onCardRender(cardResult);
                                } catch (e) {
                                    console.error('card_render JSON解析失败:', e, eventData);
                                }
                                break;
                            default:
                                // 兼容旧格式：没有event标识的直接当作message处理
                                onMessage && onMessage({ content: eventData + '\n' });
                        }
                    }
                }
            }

            // 处理剩余的buffer（兼容旧格式，没有双换行分隔的情况）
            if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                    if (line.startsWith(':') || !line.trim()) continue;

                    let content = line;
                    if (line.startsWith('data:')) {
                        content = line.substring(5);
                    }

                    if (content.trim() && content.trim() !== '[DONE]') {
                        onMessage && onMessage({ content: content + '\n' });
                    }
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
 * 创建新的会话
 * @param {Object} data - 会话数据
 * @param {string} data.title - 会话标题（可选）
 * @returns {Promise}
 */
export function createSession(data = {}) {
    return request.post('/app/ai/session/create', data);
}

/**
 * 获取用户的会话列表
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
 * 删除会话
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
 * 获取推荐的快捷问题
 * @returns {Promise}
 */
export function getSuggestions() {
    return request.get('/app/ai/suggestions');
}

/**
 * 上传文件到会话
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

/**
 * 搜索用户的会话列表
 * @param {Object} params - 查询参数
 * @param {string} params.keyword - 搜索关键词
 * @param {number} params.current - 当前页码
 * @returns {Promise}
 */
export function searchSession(params) {
    return request.get('/app/ai/session/search', { params });
}
