# 钱包模块后端实现文档

本文档描述了 Smart Live App 钱包模块的后端设计与实现细节。

## 1. 数据库设计

### 1.1 用户钱包表 (`user_wallet`)

存储用户的余额信息。

```sql
CREATE TABLE `user_wallet` (
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '可用余额',
  `frozen_balance` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '冻结余额（提现中）',
  `pay_password` varchar(128) DEFAULT NULL COMMENT '支付密码（加密）',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态 1:正常 0:冻结',
  `version` int(11) NOT NULL DEFAULT '0' COMMENT '乐观锁版本',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户钱包表';
```

### 1.2 钱包交易流水表 (`wallet_transaction`)

记录每一次资金变动。

```sql
CREATE TABLE `wallet_transaction` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `type` tinyint(2) NOT NULL COMMENT '类型: 1-充值 3-消费(订单) 4-退款 5-收益(返现)',
  `amount` decimal(10,2) NOT NULL COMMENT '变动金额（绝对值）',
  `direction` tinyint(1) NOT NULL COMMENT '方向: 1-收入 2-支出',
  `balance_after` decimal(10,2) NOT NULL COMMENT '变动后余额',
  `biz_type` varchar(32) NOT NULL COMMENT '业务类型: recharge, order_pay, refund, rebate',
  `biz_id` varchar(64) DEFAULT NULL COMMENT '关联业务ID（如订单号）',
  `title` varchar(64) NOT NULL COMMENT '展示标题（如：余额充值）',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态: 0-处理中 1-成功 2-失败',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包交易流水表';
```

---

## 2. API 接口定义

建议前缀: `/app-dev-api/app/wallet`

### 2.1 获取钱包信息

- **URL**: `/app/wallet/info`
- **Method**: `GET`
- **Response**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "balance": 3821.58,
    "frozenBalance": 0.00,
    "hasPayPassword": true // 是否设置过支付密码
  },
  "message": "success"
}
```

### 2.2 获取交易明细列表

- **URL**: `/app/wallet/transaction/list`
- **Method**: `GET`
- **Query Params**:
  - `page`: 1
  - `pageSize`: 10
  - `type`: `all` | `in` | `out`
- **Response**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "records": [
      {
        "id": 1,
        "title": "订单返现",
        "time": "2026-02-03 18:30:00",
        "amount": 15.60,
        "type": "in",      // 用于前端判断颜色
        "status": "success" // success, pending, failed
      }
    ],
    "total": 100
  }
}
```

### 2.3 充值API (微信支付)

#### 2.3.1 创建充值订单 (前端调用)

- **URL**: `/app/wallet/recharge/wechat`
- **Method**: `POST`
- **Body**: `{ "amount": 100 }`
- **Response**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "orderId": "R202602170001",
    // 微信支付参数 (根据实际环境返回 App支付参数 或 JSAPI参数)
    "payParams": {
      "appId": "wx8888888888888888",
      "timeStamp": "1414587457",
      "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "package": "Sign=WXPay",
      "signType": "MD5",
      "paySign": "..."
    }
  }
}
```

**逻辑**:
1. 创建本地充值订单 (状态: 待支付)。
2. 调用微信统一下单接口 (UnifiedOrder)。
3. 获取 `prepay_id` 并签名返回给前端。

#### 2.3.2 支付回调 (微信服务器调用)

- **URL**: `/app/wallet/callback/wechat`
- **Method**: `POST` (XML/JSON)

**逻辑**:
1. 验签。
2. 检查金额是否匹配。
3. 开启事务：
   - 更新充值订单状态为“已支付”。
   - 更新 `user_wallet`: `balance += amount`。
   - 插入 `wallet_transaction`: type=1 (充值), direction=1 (收入)。
4. 提交事务。
5. 返回微信 `SUCCESS`。

### 2.4 支付密码管理

- **设置/修改密码**: `/app/wallet/password/set` (POST)
- **验证密码**: `/app/wallet/password/verify` (POST)

---

## 3. 后台管理接口 (Admin)

建议前缀: `/admin-api/admin/wallet`

### 3.1 余额调整 (充值/扣减)
- **URL**: `/admin/wallet/adjust`
- **Method**: `POST`
- **Body**: `{ "userId": 101, "amount": 100, "type": 1, "remark": "客服补偿" }` (type 1:增加 2:扣减)

## 4. 前端对接指南

1. **新建 API 文件**: `src/api/wallet.js`.
2. **替换 Mock**: 修改 `src/views/user/wallet/Index.vue`.
