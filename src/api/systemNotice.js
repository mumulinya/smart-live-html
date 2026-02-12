import request from '@/utils/request';

const SYSTEM_NOTICE_BASE = '/app/chat/notice/system';

export function getSystemNoticeList(current = 1) {
  return request.get(`${SYSTEM_NOTICE_BASE}/list`, {
    params: { current }
  });
}

export function readSystemNotice(noticeId) {
  return request.put(`${SYSTEM_NOTICE_BASE}/read/${noticeId}`);
}

export function readAllSystemNotices() {
  return request.put(`${SYSTEM_NOTICE_BASE}/read/all`);
}

export function getSystemNoticeUnreadCount() {
  return request.get(`${SYSTEM_NOTICE_BASE}/unread/count`);
}

export function resolveSystemNoticeList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.list)) return response.data.list;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  return [];
}

export function resolveSystemNoticeUnreadCount(response) {
  const candidates = [
    response?.data?.unread,
    response?.data?.count,
    response?.unread,
    response?.count,
    response?.data,
    response
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      return num;
    }
  }

  return null;
}
