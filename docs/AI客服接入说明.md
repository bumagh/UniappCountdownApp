# 奇妙日 AI 客服接入说明

## 架构

```
用户在小程序发消息
    → 微信服务器 POST → 你的后端 Webhook
    → PHP 解析消息 → 调 Claude API（gaccode.com 代理）
    → 调微信客服消息接口主动推送回复给用户
```

---

## 一、后端部署步骤

### 1. 控制器位置

文件已生成到：

```
CountDownBuildAdmin/app/api/controller/CustomerService.php
```

框架为 ThinkPHP 8 + BuildAdmin，**无需额外路由配置**，ThinkPHP 多应用模式自动将控制器名映射到 URL：

```
GET/POST https://app.tutlab.tech/api/customer_service/webhook
```

### 2. 配置已内置

`appid` 和 `appsecret` 已从 `Wechat.php` 同步写入，Claude API Key 也已内置，**无需修改**。

如需更换消息推送 Token，修改控制器顶部：

```php
private string $msgToken = 'qimiaori_cs_2024';
```

### 3. 对话历史存储

使用 ThinkPHP Cache（复用框架缓存驱动，默认 file），**无需建目录或数据库**，1 小时无消息自动重置会话。

---

## 二、微信小程序后台配置

### 2.1 开启消息推送

路径：**小程序后台 → 开发管理 → 开发设置 → 消息推送**

| 字段 | 值 |
|------|----|
| 服务器地址（URL） | `https://app.tutlab.tech/api/customer-service/webhook` |
| 令牌（Token） | `qimiaori_cs_2024`（与代码中 WX_MSG_TOKEN 一致） |
| 消息加密方式 | 明文模式（先用明文调通，再升级加密） |

保存后微信会发 GET 请求验证，后端验证通过后绿灯。

### 2.2 添加客服账号

路径：**小程序后台 → 功能 → 客服**  
添加一个微信号作为客服（AI 回复不需要人在线，但必须有账号才能触发客服会话）。

### 2.3 合法域名

在 **开发管理 → 开发设置 → 服务器域名** 中添加：
- `https://app.tutlab.tech`（你的后端，通常已有）
- `https://gaccode.com`（Claude 代理，仅后端调用，前端不需要）

> 注意：`gaccode.com` 是后端服务器调用，**不需要**加入小程序前端合法域名白名单。

---

## 三、前端（已完成）

`profile.vue` 中已有：

```vue
<!-- #ifdef MP-WEIXIN -->
<button
  class="menu-item contact-btn"
  open-type="contact"
  session-from="profile_about"
  @contact="handleContact"
>
  ...联系客服...
</button>
<!-- #endif -->
```

`handleContact` 处理用户从客服消息点击小程序卡片时的跳转，无需修改。

---

## 四、对话效果说明

| 场景 | 行为 |
|------|------|
| 用户发文字消息 | AI 自动秒回（Claude claude-3-5-haiku） |
| 用户发图片/语音 | 暂时忽略（可后续扩展 OCR） |
| 会话超 1 小时 | 历史自动重置，重新开始 |
| AI 无法回答 | 提示将转人工客服（需你有人工客服响应） |

---

## 五、可选优化

### 5.1 升级对话存储（推荐）

将文件存储换为 MySQL，避免多进程并发写冲突：

```sql
CREATE TABLE cs_sessions (
  openid       VARCHAR(64)  PRIMARY KEY,
  messages     JSON         NOT NULL,
  updated_at   INT          NOT NULL
);
```

### 5.2 添加关键词快速回复

在 `callClaude()` 前加一个关键词拦截层：

```php
$quickReplies = [
    '退款'   => '奇妙日目前为免费产品，如有付费问题请联系官方邮箱。',
    '删除账号' => '请在个人中心 → 设置中操作，或发邮件至 support@tutlab.tech。',
];
foreach ($quickReplies as $kw => $reply) {
    if (mb_strpos($userMessage, $kw) !== false) {
        return $reply;
    }
}
```

### 5.3 消息加密（上线前）

微信后台消息推送改为"安全模式"，在 `handleVerify()` 和 `handleMessage()` 中加入 AES 解密。

### 5.4 更换更强模型

将 `CLAUDE_MODEL` 改为 `claude-sonnet-4-5` 或 `claude-opus-4-5`（更贵但更强）。

---

## 六、测试验证

1. 微信开发者工具打开小程序 → 个人中心 → 点击「联系客服」
2. 在聊天窗口发送"如何创建倒数日"
3. 预期：几秒内收到 AI 自动回复
4. 后端日志检查：`error_log` 默认写入 PHP error log

```bash
# 查看后端日志
tail -f /var/log/php/error.log | grep QimiaoriCS
```
