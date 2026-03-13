const EMPTY_STATUS_TEXT = '-';

const BUSINESS_STATUS_CONFIG = {
  product: {
    1: { text: '已上架', tone: 'success' },
    2: { text: '已下架', tone: 'warning' },
    3: { text: '已过期', tone: 'info' }
  },
  blog: {
    0: { text: '草稿', tone: 'info' },
    1: { text: '已发布', tone: 'success' },
    2: { text: '已下架', tone: 'warning' }
  },
  review: {
    0: { text: '草稿', tone: 'info' },
    1: { text: '已发布', tone: 'success' },
    2: { text: '已下架', tone: 'warning' }
  },
  comment: {
    0: { text: '正常', tone: 'success' },
    1: { text: '禁用', tone: 'warning' }
  },
  shop: {
    1: { text: '上架', tone: 'success' },
    2: { text: '下架', tone: 'warning' }
  }
};

const AUDIT_STATUS_CONFIG = {
  0: { text: '未审核', tone: 'warning' },
  1: { text: '审核通过', tone: 'success' },
  2: { text: '人工审核驳回', tone: 'danger' },
  3: { text: '自动审核驳回', tone: 'info' }
};

const DISPLAY_STATUS_CONFIG = {
  draft: { text: '草稿', tone: 'info', visible: true },
  pending: { text: '审核中', tone: 'warning', visible: true },
  rejected: { text: '审核失败', tone: 'danger', visible: true },
  off: { text: '已下架', tone: 'danger', visible: true },
  expired: { text: '已过期', tone: 'info', visible: true },
  disabled: { text: '已禁用', tone: 'danger', visible: true },
  passed: { text: '', tone: 'default', visible: false },
  none: { text: '', tone: 'default', visible: false }
};

const DISPLAY_STATUS_BY_MODULE = {
  product: {
    2: { key: 'off', text: '已下架', tone: 'danger' },
    3: { key: 'expired', text: '已过期', tone: 'info' }
  },
  blog: {
    2: { key: 'off', text: '已下架', tone: 'danger' }
  },
  review: {
    2: { key: 'off', text: '已下架', tone: 'danger' }
  },
  comment: {
    1: { key: 'disabled', text: '已禁用', tone: 'danger' }
  },
  shop: {
    2: { key: 'off', text: '已下架', tone: 'danger' }
  }
};

const DRAFT_STATUS_BY_MODULE = {
  blog: new Set([0, 3, 4]),
  review: new Set([0, 3, 4])
};

export function isEmptyStatusValue(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function normalizeStatusValue(value) {
  if (isEmptyStatusValue(value)) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return String(value).trim();
}

function resolveStatusMeta(config, value) {
  if (isEmptyStatusValue(value)) {
    return {
      value: null,
      text: EMPTY_STATUS_TEXT,
      tone: 'default',
      isEmpty: true,
      isKnown: false
    };
  }

  const normalizedValue = normalizeStatusValue(value);
  const preset = config[normalizedValue];

  if (preset) {
    return {
      value: normalizedValue,
      text: preset.text,
      tone: preset.tone,
      isEmpty: false,
      isKnown: true
    };
  }

  return {
    value: normalizedValue,
    text: String(value),
    tone: 'default',
    isEmpty: false,
    isKnown: false
  };
}

function createDisplayStatusMeta(key, value, preset = null) {
  const meta = preset || DISPLAY_STATUS_CONFIG[key] || DISPLAY_STATUS_CONFIG.none;
  return {
    key,
    value,
    text: meta.text,
    tone: meta.tone,
    visible: !!meta.visible
  };
}

export function getBusinessStatusMeta(moduleName, value) {
  const config = BUSINESS_STATUS_CONFIG[moduleName] || {};
  return resolveStatusMeta(config, value);
}

export function getAuditStatusMeta(value) {
  return resolveStatusMeta(AUDIT_STATUS_CONFIG, value);
}

export function getSingleDisplayStatusMeta(moduleName, status, auditStatus) {
  const normalizedStatus = normalizeStatusValue(status);
  const normalizedAuditStatus = normalizeStatusValue(auditStatus);

  if (DRAFT_STATUS_BY_MODULE[moduleName]?.has(normalizedStatus)) {
    return createDisplayStatusMeta('draft', normalizedStatus);
  }

  const moduleStatusConfig = DISPLAY_STATUS_BY_MODULE[moduleName] || {};
  const moduleStatusMeta = moduleStatusConfig[normalizedStatus];
  if (moduleStatusMeta) {
    return createDisplayStatusMeta(moduleStatusMeta.key, normalizedStatus, moduleStatusMeta);
  }

  if (normalizedAuditStatus === 0) {
    return createDisplayStatusMeta('pending', normalizedAuditStatus);
  }

  if (normalizedAuditStatus === 2 || normalizedAuditStatus === 3) {
    return createDisplayStatusMeta('rejected', normalizedAuditStatus);
  }

  if (normalizedAuditStatus === 1) {
    return createDisplayStatusMeta('passed', normalizedAuditStatus);
  }

  return createDisplayStatusMeta('none', normalizedAuditStatus);
}

export function shouldShowRejectReason(auditStatus) {
  const value = normalizeStatusValue(auditStatus);
  return value === 2 || value === 3;
}

export function isDraftBusinessStatus(moduleName, status) {
  const value = normalizeStatusValue(status);
  return !!DRAFT_STATUS_BY_MODULE[moduleName]?.has(value);
}

export function getRejectReasonText(auditStatus, rejectReason) {
  if (!shouldShowRejectReason(auditStatus) || isEmptyStatusValue(rejectReason)) {
    return '';
  }
  return String(rejectReason).trim();
}

function buildOptions(config, includeAll, allLabel) {
  const options = Object.keys(config)
    .map((key) => ({
      value: key,
      label: config[key].text
    }))
    .sort((a, b) => Number(a.value) - Number(b.value));

  if (!includeAll) {
    return options;
  }

  return [
    { value: 'all', label: allLabel },
    ...options
  ];
}

export function getBusinessStatusOptions(moduleName, options = {}) {
  const { includeAll = false, allLabel = '全部业务状态' } = options;
  return buildOptions(BUSINESS_STATUS_CONFIG[moduleName] || {}, includeAll, allLabel);
}

export function getAuditStatusOptions(options = {}) {
  const { includeAll = false, allLabel = '全部审核状态' } = options;
  return buildOptions(AUDIT_STATUS_CONFIG, includeAll, allLabel);
}

export function getStatusToneClass(tone) {
  return `biz-status-chip--${tone || 'default'}`;
}
