/**
 * Feed 状态配置表
 * 使用配置对象模式管理不同业务状态，便于扩展维护
 */

// Action/SubType 状态配置 - 根据 action 或 subType 字段决定标签样式和按钮文案
export const ACTION_CONFIG = {
    // Group A: 强提醒类 (红色系 - 高优先级)
    price_drop: {
        label: '降价',
        labelColor: '#ee0a24',
        labelBg: '#FFEBEE',
        buttonText: '立即买',
        buttonColor: '#ee0a24',
        cardBg: 'bg-red',
        priority: 1
    },
    restock: {
        label: '已补货',
        labelColor: '#ee0a24',
        labelBg: '#FFEBEE',
        buttonText: '去抢购',
        buttonColor: '#ee0a24',
        cardBg: 'bg-red',
        priority: 1
    },
    start: {
        label: '开抢',
        labelColor: '#ee0a24',
        labelBg: '#FFEBEE',
        buttonText: '立即抢',
        buttonColor: '#ee0a24',
        cardBg: 'bg-red',
        priority: 1
    },

    // Group B: 中等提醒类 (橙/黄色系 - 中优先级)
    soon_end: {
        label: '即将结束',
        labelColor: '#ff976a',
        labelBg: '#FFF3E0',
        buttonText: '最后疯抢',
        buttonColor: '#ff976a',
        cardBg: 'bg-orange',
        priority: 2
    },
    reshelf: {
        label: '重新上架',
        labelColor: '#ed6a0c',
        labelBg: '#FBE9E7',
        buttonText: '去看看',
        buttonColor: '#ed6a0c',
        cardBg: 'bg-orange',
        priority: 2
    },

    // Group C: 普通类 (绿/蓝色系 - 低优先级)
    new: {
        label: '新品',
        labelColor: '#07c160',
        labelBg: '#E8F5E9',
        buttonText: '去看看',
        buttonColor: '#07c160',
        cardBg: 'bg-white',
        priority: 3
    }
};

// Button 状态配置 - 根据 buttonStatus 字段决定按钮是否可用
// 1 = 上架（正常可用）
// 2 = 下架
// 3 = 过期
export const BUTTON_STATUS_CONFIG = {
    2: {
        text: '已下架',
        disabled: true,
        color: '#CCCCCC',
        bgColor: '#F5F5F5'
    },
    3: {
        text: '已过期',
        disabled: true,
        color: '#CCCCCC',
        bgColor: '#F5F5F5'
    }
};

// 默认配置 - 未知 action/subType 时使用
export const DEFAULT_ACTION_CONFIG = {
    label: '',
    labelColor: '#999999',
    labelBg: '#F5F5F5',
    buttonText: '查看详情',
    buttonColor: '#666666',
    cardBg: 'bg-white',
    priority: 99
};

/**
 * 获取 Action 配置
 * @param {string} action - 后端返回的 action 字段
 * @returns {Object} 配置对象
 */
export function getActionConfig(action) {
    return ACTION_CONFIG[action] || DEFAULT_ACTION_CONFIG;
}

/**
 * 获取事件配置 (支持 subType 字段)
 * @param {string} subType - 后端返回的 subType 字段
 * @returns {Object} 配置对象 { label, color, btn, bg }
 */
export function getEventConfig(subType) {
    const config = ACTION_CONFIG[subType] || ACTION_CONFIG['new'];
    return {
        label: config.label,
        color: config.labelColor,
        btn: config.buttonText,
        bg: config.cardBg,
        labelBg: config.labelBg,
        buttonColor: config.buttonColor
    };
}

/**
 * 检查是否已过期（根据 endTime）
 * @param {string|number} endTime - 结束时间
 * @returns {boolean} 是否已过期
 */
function isExpired(endTime) {
    if (!endTime) return false;
    try {
        // 兼容不同时间格式
        const endDate = new Date(String(endTime).replace(/-/g, '/'));
        return endDate.getTime() < Date.now();
    } catch (e) {
        return false;
    }
}

/**
 * 获取按钮最终状态（双重验证：status 字段 + 时间过期判断）
 * @param {Object} item - Feed 数据项
 * @returns {Object} { text, disabled, color, bgColor }
 */
export function getButtonState(item) {
    const { action, subType, buttonStatus, status, endTime } = item;

    // 1. 优先判断 buttonStatus 或 status（后端实时状态）
    const statusValue = buttonStatus !== undefined ? buttonStatus : status;
    if (BUTTON_STATUS_CONFIG[statusValue]) {
        return BUTTON_STATUS_CONFIG[statusValue];
    }

    // 2. 前端时间过期判断（双重验证）
    if (isExpired(endTime)) {
        return {
            text: '已过期',
            disabled: true,
            color: '#CCCCCC',
            bgColor: '#F5F5F5'
        };
    }

    // 3. 正常情况：优先从 subType 读取，其次从 action 读取
    const eventType = subType || action;
    const actionConfig = getActionConfig(eventType);
    return {
        text: actionConfig.buttonText,
        disabled: false,
        color: '#FFFFFF',
        bgColor: actionConfig.buttonColor
    };
}
