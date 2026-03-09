# wechat-access-unqclawed

OpenClaw 微信通路插件 — 通过 WeChat OAuth 扫码登录获取 token，连接 AGP WebSocket 网关收发消息。

## 安装

```bash
openclaw plugins install @henryxiaoyang/wechat-access-unqclawed
```

启用渠道：

```bash
openclaw config set channels.wechat-access-unqclawed.enabled true
```

## 首次登录

安装并启用后，在终端执行扫码登录：

```bash
openclaw wechat login
```

终端会显示微信二维码，扫码授权后 token 自动保存。然后重启 Gateway：

```bash
openclaw gateway restart
```

## 功能

- 微信扫码登录（终端二维码 + 浏览器链接）
- Token 自动持久化，重启免登录
- AGP 协议 WebSocket 双向通信（流式文本、工具调用）
- 邀请码验证（可配置跳过）
- 支持生产/测试环境切换

## 命令

### CLI 命令（终端）

| 命令 | 说明 |
|------|------|
| `openclaw wechat login` | 交互式微信扫码登录 |
| `openclaw wechat logout` | 清除已保存的登录态 |

### 聊天命令（渠道内）

| 命令 | 说明 |
|------|------|
| `/wechat-login` | 触发扫码登录（QR 码输出到 Gateway 日志） |
| `/wechat-logout` | 清除已保存的登录态 |

## 配置

在 OpenClaw 配置文件的 `channels.wechat-access-unqclawed` 下：

```json
{
  "channels": {
    "wechat-access-unqclawed": {
      "enabled": true,
      "token": "",
      "wsUrl": "",
      "bypassInvite": false,
      "environment": "production"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 启用渠道（必须设为 `true`） |
| `token` | string | 手动指定 channel token（留空则走扫码登录） |
| `wsUrl` | string | WebSocket 网关地址（留空使用环境默认值） |
| `bypassInvite` | boolean | 跳过邀请码验证 |
| `environment` | string | `production` 或 `test` |
| `authStatePath` | string | 自定义 token 持久化路径 |

## Token 获取策略

1. 读取配置中的 `token` — 如果有，直接使用
2. 读取本地保存的登录态（`~/.openclaw/wechat-access-auth.json`）
3. 以上都没有 — 运行 `openclaw wechat login` 手动登录

## 项目结构

```
index.ts                 # 插件入口，注册渠道、CLI、启停 WebSocket
auth/
  types.ts               # 认证相关类型
  environments.ts        # 生产/测试环境配置
  device-guid.ts         # 设备 GUID 生成（随机，持久化）
  qclaw-api.ts           # QClaw JPRX 网关 API 客户端
  state-store.ts         # Token 持久化
  wechat-login.ts        # 扫码登录流程编排
websocket/
  types.ts               # AGP 协议类型
  websocket-client.ts    # WebSocket 客户端（连接、心跳、重连）
  message-handler.ts     # 消息处理（调用 Agent）
  message-adapter.ts     # AGP <-> OpenClaw 消息适配
common/
  runtime.ts             # OpenClaw 运行时单例
  agent-events.ts        # Agent 事件订阅
  message-context.ts     # 消息上下文构建
http/                    # HTTP webhook 通道（备用）
```

## 协议

AGP (Agent Gateway Protocol) — 基于 WebSocket Text 帧的 JSON 消息协议，详见 `websocket.md`。

## License

MIT
