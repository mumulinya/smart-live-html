const STORAGE_PREFIX = 'smart-live-system-notice:v1';
const MAX_NOTICE_COUNT = 200;

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return 'guest';
    const user = JSON.parse(raw);
    return user?.id ? String(user.id) : 'guest';
  } catch (error) {
    console.error('Failed to parse userInfo for system notice key:', error);
    return 'guest';
  }
}

function getStorageKey() {
  return `${STORAGE_PREFIX}:${getCurrentUserId()}`;
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function parseObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

function unwrapNoticeData(data = {}) {
  if (!data || typeof data !== 'object') return {};
  const nested = parseObject(data.data);
  if (!nested) return data;

  return {
    ...nested,
    noticeId: data.noticeId ?? data.id ?? nested.noticeId ?? nested.id,
    sourceType: nested.sourceType ?? nested.type ?? data.sourceType ?? data.type,
    sourceId: nested.sourceId ?? nested.targetId ?? data.sourceId ?? data.targetId,
    action: nested.action ?? data.action,
    title: nested.title ?? data.title,
    content: nested.content ?? data.content,
    auditStatus: nested.auditStatus ?? data.auditStatus,
    rejectReason: nested.rejectReason ?? data.rejectReason,
    createdAt: nested.createdAt ?? nested.time ?? data.createdAt ?? data.time,
    read: data.read ?? nested.read,
    readAt: data.readAt ?? nested.readAt,
    link: nested.link ?? data.link,
    extraData: nested.extraData ?? data.extraData,
    payload: nested.payload ?? data.payload,
    context: nested.context ?? data.context
  };
}

function extractVoucherLikeData(data = {}) {
  const keys = [
    'id',
    'shopId',
    'title',
    'subTitle',
    'rules',
    'payValue',
    'actualValue',
    'status',
    'auditStatus',
    'rejectReason',
    'validityType',
    'useStartTime',
    'useEndTime',
    'validDays',
    'stock',
    'beginTime',
    'endTime',
    'shopName',
    'shopLogo',
    'shopImages',
    'typeId',
    'name',
    'price',
    'originalPrice',
    'activityType'
  ];

  const picked = {};
  let hasField = false;
  keys.forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      picked[key] = data[key];
      hasField = true;
    }
  });

  return hasField ? picked : null;
}

function buildNoticeId(data) {
  if (data.noticeId !== undefined && data.noticeId !== null && data.noticeId !== '') {
    return String(data.noticeId);
  }
  if (data.id !== undefined && data.id !== null && data.id !== '') {
    return String(data.id);
  }

  const sourceType = data.sourceType ?? data.type ?? '';
  const sourceId = data.sourceId ?? data.targetId ?? '';
  const action = data.action ?? 'SYSTEM_NOTICE';
  const createdAt = data.createdAt ?? data.time ?? '';
  const title = data.title ?? '';
  return `${action}_${sourceType}_${sourceId}_${createdAt}_${title}`;
}

function normalizeSourceType(data) {
  const value = data.sourceType ?? data.type ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSourceId(data) {
  const raw = data.sourceId ?? data.targetId ?? null;
  if (raw === undefined || raw === null || raw === '') return null;
  return raw;
}

function normalizeExtraData(data) {
  const raw = data.extraData ?? data.extra ?? data.payload ?? data.context ?? null;
  const parsed = parseObject(raw);
  if (parsed) return parsed;
  return extractVoucherLikeData(data);
}

export function normalizeSystemNotice(data = {}, options = {}) {
  const source = unwrapNoticeData(data);
  let auditStatus = source.auditStatus;
  const title = String(source.title || '系统消息');
  let rejectReason = source.rejectReason ? String(source.rejectReason) : '';
  const extraData = normalizeExtraData(source);
  auditStatus = auditStatus ?? extraData?.auditStatus;
  if (!rejectReason && extraData?.rejectReason) {
    rejectReason = String(extraData.rejectReason);
  }
  const extraContent = extraData && extraData.content ? String(extraData.content) : '';
  const content = String(
    source.content || extraContent || (rejectReason ? `${title}：${rejectReason}` : title)
  );
  const createdAt = normalizeDate(source.createdAt || source.time);
  const sourceType = normalizeSourceType(source);
  const sourceId = normalizeSourceId(source);
  const read = toBool(source.read, toBool(options.defaultRead, false));
  const action = String(source.action || 'NOTICE');
  const payload = parseObject(source.payload);

  return {
    noticeId: buildNoticeId(source),
    sourceType,
    sourceId,
    action,
    title,
    content,
    auditStatus,
    rejectReason,
    createdAt,
    read,
    readAt: source.readAt || null,
    link: source.link ? String(source.link) : '',
    payload,
    extraData
  };
}

function readRawList() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error('Failed to parse system notices from localStorage:', error);
    return [];
  }
}

function sortByTimeDesc(list) {
  return [...list].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
}

function writeList(list) {
  try {
    const normalized = sortByTimeDesc(list).slice(0, MAX_NOTICE_COUNT);
    localStorage.setItem(getStorageKey(), JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to persist system notices:', error);
  }
}

function readNormalizedList() {
  return readRawList().map((item) =>
    normalizeSystemNotice(item, { defaultRead: toBool(item?.read, false) })
  );
}

export function getSystemNotices() {
  return sortByTimeDesc(readNormalizedList());
}

export function replaceSystemNotices(list = []) {
  const source = Array.isArray(list) ? list : [];
  const normalized = source.map((item) =>
    normalizeSystemNotice(item, { defaultRead: toBool(item?.read, false) })
  );
  writeList(normalized);
  return sortByTimeDesc(normalized);
}

export function getLatestSystemNotice() {
  const list = getSystemNotices();
  return list.length ? list[0] : null;
}

export function getSystemUnreadCount() {
  return getSystemNotices().reduce((count, item) => count + (item.read ? 0 : 1), 0);
}

export function addSystemNotice(data, options = {}) {
  const list = readNormalizedList();
  const next = normalizeSystemNotice(data, options);
  const index = list.findIndex((item) => String(item.noticeId) === String(next.noticeId));

  if (index >= 0) {
    const prev = list[index];
    const mergedRead = typeof data.read === 'boolean' ? next.read : prev.read;
    list[index] = {
      ...prev,
      ...next,
      read: mergedRead,
      readAt: mergedRead ? (prev.readAt || next.readAt || new Date().toISOString()) : null
    };
  } else {
    list.unshift(next);
  }

  writeList(list);
  return next;
}

export function markSystemNoticeRead(noticeId) {
  const list = readNormalizedList();
  let changed = false;
  const updated = list.map((item) => {
    if (String(item.noticeId) !== String(noticeId)) return item;
    if (item.read) return item;
    changed = true;
    return { ...item, read: true, readAt: new Date().toISOString() };
  });

  if (changed) {
    writeList(updated);
  }
  return changed;
}

export function markAllSystemNoticesRead() {
  const list = readNormalizedList();
  const now = new Date().toISOString();
  let changed = false;
  const updated = list.map((item) => {
    if (item.read) return item;
    changed = true;
    return { ...item, read: true, readAt: now };
  });

  if (changed) {
    writeList(updated);
  }
  return changed;
}

export function buildSystemNoticePath(notice) {
  if (!notice) return '';
  if (notice.link) return notice.link;

  const sourceType = Number(notice.sourceType || 0);
  const extraData = notice.extraData && typeof notice.extraData === 'object' ? notice.extraData : null;
  const fallbackSourceId = extraData?.sourceId ?? extraData?.id ?? null;
  const sourceId = notice.sourceId ?? fallbackSourceId;
  const hasSourceId = sourceId !== null && sourceId !== undefined && sourceId !== '';

  switch (sourceType) {
    case 1:
      return '/user/info';
    case 2:
      return hasSourceId ? `/shop/detail?id=${sourceId}` : '/shop/list';
    case 3:
      return hasSourceId ? `/blog/detail?id=${sourceId}` : '/';
    case 4:
      return hasSourceId ? `/voucher/detail?id=${sourceId}` : '/search?tab=voucher';
    case 5:
      return hasSourceId ? `/comment/list?id=${sourceId}&type=5` : '/review/mine';
    case 7:
      return hasSourceId ? `/review/detail?id=${sourceId}` : '/review/mine';
    default:
      return '';
  }
}

export function formatSystemNoticeTime(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}
