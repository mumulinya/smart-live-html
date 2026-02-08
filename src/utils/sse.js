/**
 * SSE 流式请求工具
 * 解决 fetch 读取流时的粘包问题，支持事件分流
 */

/**
 * 统一聊天接口 - 支持 SSE 事件分流
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数（会拼接到URL）
 * @param {Function} onEvent - 事件回调 (eventType, data) => void
 * @returns {Object} 返回包含 close 方法的对象，用于取消请求
 */
export function fetchUnifiedChat(url, params, onEvent) {
    const controller = new AbortController();
    const token = localStorage.getItem('token');

    // 构建完整URL（GET请求参数拼接）
    const queryString = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const eventSourceShim = {
        close: () => controller.abort()
    };

    fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'Accept': 'text/event-stream, text/plain, */*',
            'authorization': token || ''
        }
    }).then(async response => {
        if (!response.ok) {
            onEvent('error', '网络连接失败');
            return;
        }

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
                            const data = line.substring(5);
                            // 跳过 [DONE] 标记
                            if (data.trim() === '[DONE]') continue;
                            eventData += data;
                        }
                    }

                    if (eventData) {
                        onEvent(eventType, eventData);
                    }
                }
            }

            // 处理剩余的buffer
            if (buffer.trim()) {
                const lines = buffer.split('\n');
                let eventType = 'message';
                let eventData = '';

                for (const line of lines) {
                    if (line.startsWith(':')) continue;
                    if (line.startsWith('event:')) {
                        eventType = line.substring(6).trim();
                    } else if (line.startsWith('data:')) {
                        const data = line.substring(5);
                        if (data.trim() !== '[DONE]') {
                            eventData += data;
                        }
                    }
                }

                if (eventData) {
                    onEvent(eventType, eventData);
                }
            }

            onEvent('complete', '');
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('SSE流读取错误:', e);
                onEvent('error', e.message);
            }
        }
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error('Fetch error:', error);
            onEvent('error', error.message);
        }
    });

    return eventSourceShim;
}

export default {
    fetchUnifiedChat
};
