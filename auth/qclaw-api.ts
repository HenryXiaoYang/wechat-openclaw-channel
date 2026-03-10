/**
 * @file qclaw-api.ts
 * @description QClaw JPRX 网关 API 客户端
 *
 * 对应 Python demo 的 QClawAPI 类，所有业务接口走 POST {jprxGateway}data/{cmdId}/forward。
 */

import type { QClawEnvironment, QClawApiResponse } from "./types.js";
import { TokenExpiredError } from "./types.js";
import { nested } from "./utils.js";

export class QClawAPI {
  private env: QClawEnvironment;
  private guid: string;

  /** 鉴权 key，登录后可由服务端返回新值 */
  loginKey = "m83qdao0AmE5";

  jwtToken: string;
  userId = "";

  constructor(env: QClawEnvironment, guid: string, jwtToken = "") {
    this.env = env;
    this.guid = guid;
    this.jwtToken = jwtToken;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Version": "1",
      "X-Token": this.loginKey,
      "X-Guid": this.guid,
      "X-Account": this.userId || "1",
      "X-Session": "",
    };
    if (this.jwtToken) {
      h["X-OpenClaw-Token"] = this.jwtToken;
    }
    return h;
  }

  private async post(path: string, body: Record<string, unknown> = {}): Promise<QClawApiResponse> {
    const url = `${this.env.jprxGateway}${path}`;
    const payload = { ...body, web_version: "1.4.0", web_env: "release" };

    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    // Token 续期
    const newToken = res.headers.get("X-New-Token");
    if (newToken) this.jwtToken = newToken;

    const data = (await res.json()) as Record<string, unknown>;

    const ret = data.ret;
    const commonCode =
      nested(data, "data", "resp", "common", "code") ??
      nested(data, "data", "common", "code") ??
      nested(data, "resp", "common", "code") ??
      nested(data, "common", "code");

    // Token 过期
    if (commonCode === 21004) {
      throw new TokenExpiredError();
    }

    if (ret === 0 || commonCode === 0) {
      const respData =
        nested(data, "data", "resp", "data") ??
        nested(data, "data", "data") ??
        data.data ??
        data;
      return { success: true, data: respData as Record<string, unknown> };
    }

    const message =
      (nested(data, "data", "common", "message") as string) ??
      (nested(data, "resp", "common", "message") as string) ??
      (nested(data, "common", "message") as string) ??
      "请求失败";
    return { success: false, message, data: data as Record<string, unknown> };
  }

  // ---------- 业务 API ----------

  /** 获取微信登录 state（OAuth2 安全校验） */
  async getWxLoginState(): Promise<QClawApiResponse> {
    return this.post("data/4050/forward", { guid: this.guid });
  }

  /** 用微信授权 code 换取 token */
  async wxLogin(code: string, state: string): Promise<QClawApiResponse> {
    return this.post("data/4026/forward", { guid: this.guid, code, state });
  }

  /** 创建模型 API Key */
  async createApiKey(): Promise<QClawApiResponse> {
    return this.post("data/4055/forward", {});
  }

  /** 获取用户信息 */
  async getUserInfo(): Promise<QClawApiResponse> {
    return this.post("data/4027/forward", {});
  }

  /** 检查邀请码验证状态 */
  async checkInviteCode(userId: string): Promise<QClawApiResponse> {
    return this.post("data/4056/forward", { user_id: userId });
  }

  /** 提交邀请码 */
  async submitInviteCode(userId: string, code: string): Promise<QClawApiResponse> {
    return this.post("data/4057/forward", { user_id: userId, code });
  }

  /** 刷新渠道 token */
  async refreshChannelToken(): Promise<string | null> {
    const result = await this.post("data/4058/forward", {});
    if (result.success) {
      return (result.data as Record<string, unknown>)?.openclaw_channel_token as string ?? null;
    }
    return null;
  }

  /** 生成企微客服专属链接 (cmd_id=4018) */
  async generateContactLink(openKfId: string): Promise<QClawApiResponse> {
    return this.post("data/4018/forward", {
      guid: this.guid,
      user_id: this.userId,
      open_id: openKfId,
      contact_type: "open_kfid",
    });
  }

  /** 查询设备绑定状态 (cmd_id=4019) */
  async queryDeviceByGuid(): Promise<QClawApiResponse> {
    return this.post("data/4019/forward", { guid: this.guid });
  }

  /** 断开设备绑定 (cmd_id=4020) */
  async disconnectDevice(): Promise<QClawApiResponse> {
    return this.post("data/4020/forward", { guid: this.guid });
  }
}
