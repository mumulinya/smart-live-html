# 支付模块前后端对接文档

本文档描述了如何在前端（Web/H5/小程序/App）集成微信支付功能，以及后端需要实现的接口和逻辑。

**Base URL**: `/app-dev-api` (开发环境)

---

## 1. 核心流程

| 支付方式 | appType | 后端返回 | 前端处理 |
|---------|---------|---------|---------|
| **扫码支付 (PC)** | `native` | `codeUrl` 或 `codeImgBase64` | 展示二维码/图片，用户扫码 |
| **H5支付 (手机浏览器)** | `h5` | `mwebUrl` 或 `form` | `window.location.href` 跳转 或 提交表单 |
| **App支付 (原生App)** | `app` | `payParams` | 调用微信 SDK |
| **小程序/JSAPI (微信内)** | `jsapi` | `payParams` | 调用 `wx.requestPayment` / `WeixinJSBridge` |
| **余额支付** | - | 直接返回结果 | 无需第三方跳转 |

**支付结果**：前端轮询 `/pay/status` 检查支付状态。

---

## 2. 数据库设计

### 支付流水表 (`payment_record`)

```sql
CREATE TABLE `payment_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `pay_sn` varchar(64) NOT NULL COMMENT '支付流水号(传给微信的out_trade_no)',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `biz_type` varchar(32) NOT NULL COMMENT '业务类型: recharge(充值), order(订单)',
  `biz_id` varchar(64) NOT NULL COMMENT '业务ID(充值单号/订单号)',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `pay_method` varchar(16) NOT NULL DEFAULT 'wechat' COMMENT 'wechat/alipay/balance',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0:待支付 1:支付成功 2:支付失败 3:已取消/已过期',
  `transaction_id` varchar(64) DEFAULT NULL COMMENT '第三方支付单号(微信返回)',
  `pay_time` datetime DEFAULT NULL COMMENT '支付成功时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pay_sn` (`pay_sn`),
  KEY `idx_biz` (`biz_type`, `biz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付流水表';
```

---

## 3. API 接口定义

### 3.1 统一下单接口 (微信/支付宝)

- **URL**: `POST /pay/unified`
- **Body**:

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `bizType` | String | 是 | 业务类型: `recharge` / `order` | `recharge` |
| `bizId` | String | 条件 | 业务ID（充值可不传，订单必传） | `ORDER001` |
| `amount` | Number | 是 | 支付金额（元），充值必传 | `100.00` |
| `payMethod` | String | 否 | 支付方式，默认 `wechat`，可选 `alipay` | `alipay` |
| `appType` | String | 是 | 终端类型: `native` / `h5` / `app` / `jsapi` | `native` |

**示例请求 (支付宝扫码支付)**:

```json
{
  "bizType": "recharge",
  "amount": 100,
  "payMethod": "alipay",
  "appType": "native"
}
```

**响应 (支付宝 Native 扫码)**:

```json
{
  "code": 200,
  "data": {
    "paySn": "P202602171000001",
    "codeUrl": "https://qr.alipay.com/bax0xxxx", // 链接（可选）
    "codeImgBase64": "data:image/png;base64,iVBORw0KGgoAAA..." // 🚩 直接展示此 Base64 图片
  }
}
```
> 优先展示 `codeImgBase64`，如果没有则使用 `codeUrl` 生成二维码。

**响应 (支付宝 H5/PC跳转)**:

```json
{
  "code": 200,
  "data": {
    "paySn": "P202602171000001",
    "payParams": {
       "form": "<form name=\"punchout_form\" method=\"post\" action=\"https://openapi.alipaydev.com/gateway.do?...\">...</form>" 
       // 🚩 插入页面并 submit
    }
  }
}
```

**响应 (微信 Native 扫码支付)**:

```json
{
  "code": 200,
  "data": {
    "paySn": "P202602171000001",
    "codeUrl": "weixin://wxpay/bizpayurl?pr=xxxx"
  }
}
```

**响应 (微信 H5 支付)**:

```json
{
  "code": 200,
  "data": {
    "paySn": "P202602171000001",
    "mwebUrl": "https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?..."
  }
}
```

**响应 (App / JSAPI 支付)**:

```json
{
  "code": 200,
  "data": {
    "paySn": "P202602171000001",
    "payParams": {
      "appid": "wx8888888888",
      "partnerid": "1900000109",
      "prepayid": "WX1217752501201407033233368018",
      "package": "Sign=WXPay",
      "noncestr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
      "timestamp": "1412000000",
      "sign": "C380BEC2BFD727A4B6845133519F3AD6"
    }
  }
}
```

### 3.2 余额支付接口

仅用于**订单支付**，充值不提供余额支付选项。

- **URL**: `POST /pay/balance`
- **Body**: `{ "bizType": "order", "bizId": "ORDER001" }`
- **成功响应**: `{ "code": 200, "success": true, "message": "支付成功" }`
- **失败响应**: `{ "code": 400, "success": false, "message": "余额不足" }`

### 3.3 支付结果查询

前端轮询此接口直到 `status === 1`。

- **URL**: `GET /pay/status`
- **Query**: `paySn=P202602171000001`
- **响应**:

```json
{
  "code": 200,
  "data": {
    "status": 1   // 0:待支付, 1:支付成功, 2:支付失败
  }
}
```

### 3.4 支付回调 (Notify)

- **微信**: `POST /pay/callback/wechat`
- **支付宝**: `POST /pay/callback/alipay`

### 3.5 获取支付记录列表

用于前端展示“支付明细”（包含成功、失败、待支付的所有记录）。

- **URL**: `GET /pay/list`
- **Query Params**:
  - `page`: Number (默认1)
  - `pageSize`: Number (默认10)
  - `status`: Number (可选, 0:待支付 1:成功 2:失败 3:已取消/已过期)
- **Response**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "records": [
      {
        "id": 101,
        "paySn": "P202602171000001",
        "bizType": "recharge",
        "amount": 100.00,
        "payMethod": "wechat",
        "status": 1,           // 0:待支付 1:成功 2:失败 3:已取消/已过期
        "createTime": "2026-02-17 10:00:00",
        "payTime": "2026-02-17 10:01:30"
      }
    ],
    "total": 50
  }
}
```

> **过期机制**: 后端创建支付单时，通过 MQ 发送 **15分钟延迟消息**。消息到期后检查该支付单 `status` 是否仍为 `0`，若是则自动更新为 `status=3`（已过期）。
> 前端倒计时通过 `createTime + 15分钟` 计算，无需后端返回过期时间字段。

### 3.6 取消支付

用户主动取消待支付的订单。

- **URL**: `POST /pay/cancel`
- **Body**: `{ "paySn": "P202602171000001" }`
- **成功响应**: `{ "success": true, "code": 200, "message": "已取消" }`
- **失败响应**: `{ "success": false, "code": 400, "message": "该订单不可取消" }`

> 仅 `status=0` (待支付) 的记录可以取消，取消后 `status` 更新为 `3`。

---

## 4. 后端开发指南 (支付宝沙箱)

### 步骤 1：配置沙箱环境

1.  登录 [支付宝开放平台 - 沙箱环境](https://open.alipay.com/develop/sandbox/app)。
2.  获取 `APPID`、`应用私钥`、`支付宝公钥`。
3.  配置后端 SDK，网关地址使用 `https://openapi.alipaydev.com/gateway.do`。

### 步骤 2：处理统一下单 (`/unified`)

1.  **参数判断**: `payMethod === 'alipay'`。
2.  **Native 扫码 (`appType=native`)**:
    -   调用 `alipay.trade.precreate` (当面付)。
    -   获取 `qr_code`，**推荐生成 Base64 图片返回** (`codeImgBase64`)，或直接返回链接 (`codeUrl`)。
3.  **H5/PC 跳转 (`appType=h5`)**:
    -   调用 `alipay.trade.page.pay` (电脑网站支付)。
    -   获取返回的 `body` (HTML Form 表单字符串)，包装在 `payParams.form` 中返回。

### 步骤 3：处理回调 (`/callback/alipay`)

1.  **验签**: 使用支付宝公钥验证签名。
2.  **业务处理**: 更新订单/充值状态。
3.  **返回**: 输出 `success` 字符串。
