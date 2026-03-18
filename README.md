# wechat-openclaw-channel

<p align="center">
    <a href="https://linux.do" alt="LINUX DO"><img src="https://shorturl.at/ggSqS" /></a>
</p>

---

> **v1.1.0 — 现已支持 WorkBuddy 模式！** 无需内测码，通过 WorkBuddy 账号即可登录使用。

OpenClaw 微信通路插件 — 支持 QClaw 和 WorkBuddy 双模式。

## 安装

```bash
openclaw plugins install @henryxiaoyang/wechat-openclaw-channel
```

## 快速开始

### 1. 登录

```bash
openclaw wechat login
```

交互式选择登录模式：

- **QClaw** — 微信扫码登录 **目前需要内测码。**
- **WorkBuddy** — CodeBuddy OAuth 登录

### 2. 启动 Gateway

```bash
openclaw gateway restart
```

### 3. 设备绑定（首次使用）

```bash
openclaw wechat bind
```

在微信中打开返回的链接完成绑定，绑定后即可通过微信对话。

## 登录模式

### QClaw 模式

通过微信平台 OAuth 获取 token，连接 WebSocket 网关。**目前需要内测码。**

### WorkBuddy 模式 （推荐）

通过 CodeBuddy OAuth 获取 token，连接 WebSocket 网关。不需要内测码。

## CLI 命令

| 命令 | 说明 |
|------|------|
| `openclaw wechat login` | 交互式登录（选择 QClaw 或 WorkBuddy） |
| `openclaw wechat logout` | 清除登录态 |
| `openclaw wechat bind` | 获取设备绑定链接 |

## 配置

凭证统一存储在 `~/.openclaw/openclaw.json` 的 `channels.wechat-openclaw-channel` 下：

```json
{
  "channels": {
    "wechat-openclaw-channel": {
      "loginMode": "workbuddy",
      "environment": "production",
      "qclaw": {
        "jwtToken": "...",
        "channelToken": "...",
        "apiKey": "...",
        "guid": "...",
        "userId": "...",
        "wsUrl": "...",
        "userInfo": {}
      },
      "workbuddy": {
        "accessToken": "...",
        "refreshToken": "...",
        "userId": "...",
        "hostId": "...",
        "baseUrl": "https://copilot.tencent.com",
        "userInfo": {}
      }
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `loginMode` | 当前登录模式：`qclaw` 或 `workbuddy` |
| `environment` | 环境：`production`（默认）或 `test` |
| `qclaw` | QClaw 模式凭证（登录后自动写入） |
| `workbuddy` | WorkBuddy 模式凭证（登录后自动写入） |

## 项目结构

```
index.ts                    # 插件入口，注册渠道、CLI、启停 WebSocket
auth/
  types.ts                  # 认证相关类型（LoginMode, QClawCredentials, WorkBuddyCredentials）
  environments.ts           # 生产/测试环境配置
  device-guid.ts            # 设备 GUID 生成
  qclaw-api.ts              # QClaw JPRX 网关 API 客户端
  codebuddy-api.ts          # CodeBuddy (copilot.tencent.com) API 客户端
  wechat-login.ts           # QClaw 扫码登录流程（交互式）
  wechat-qr-poll.ts         # QR 码 URL 生成
  device-bind.ts            # 设备绑定流程
websocket/
  types.ts                  # AGP 协议类型
  websocket-client.ts       # QClaw WebSocket 客户端
  centrifuge-client.ts      # WorkBuddy Centrifuge WebSocket 客户端
  message-handler.ts        # 消息处理（调用 Agent）
  message-adapter.ts        # AGP ↔ OpenClaw 消息适配
common/
  runtime.ts                # OpenClaw 运行时单例
  agent-events.ts           # Agent 事件订阅
  message-context.ts        # 消息上下文构建
```

## License

MIT
