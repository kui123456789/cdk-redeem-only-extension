# 免 2FA Free 路线设计

## 背景

当前主流程在第 5 步完成资料页后，继续执行第 6 步设置 GPT 登录密码，并在第 7 步通过 Nerver API 开通 TOTP 2FA、检测 UPI 试用资格，资格通过后写入 Free 组。

由于官网 2FA 开通链路当前不可用，需要保留原完整路线，同时新增一条免 2FA 路线：注册资料页完成后，不再强制设置 GPT 密码或开通 2FA，而是保存邮箱、邮箱取码链接和 AT，检测有试用资格后直接进入 Free 组。

## 目标

- 保留原 `完整 2FA 路线`，旧流程仍可使用。
- 新增 `免 2FA Free 路线`，由侧边栏开关选择。
- 免 2FA 路线必须检测 UPI 试用资格，通过后才写入 Free。
- 免 2FA Free 账号可参与 Free 组刷新、导出和 UPI/IDEAL 兑换。
- 免 2FA Free 导出支持 `邮箱---邮箱获取验证码链接---AT---时间戳`。

## 非目标

- 不绕过 OpenAI、Nerver 或任何外部服务限制。
- 不删除完整 2FA 路线。
- 不改变 UPI/IDEAL 卡密池、Plus 分组和失败次数策略。
- 不把无资格账号写入 Free。
- 不要求免 2FA 账号具备 GPT 密码或 TOTP secret。

## 流程模式

侧边栏新增主流程路线选择：

- `完整 2FA 路线`
  - 第 5 步资料页完成。
  - 第 6 步设置 GPT 登录密码。
  - 第 7 步开通 TOTP 2FA。
  - 检测 UPI 试用资格。
  - 资格通过后写入 Free。

- `免 2FA Free 路线`
  - 第 5 步资料页完成。
  - 读取当前账号邮箱。
  - 保存邮箱取码链接。
  - 读取并保存 AT。
  - 检测 UPI 试用资格。
  - 资格通过后写入 Free。
  - 跳过第 6 步设置 GPT 密码和第 7 步开通 TOTP 2FA。

## Free 记录字段

免 2FA 路线写入 Free 时，应保存以下核心字段：

```text
email
verificationUrl
accessToken
recordedAt
planType=free
status=free
trialEligible=true
twoFactorEnabled=false
gptPassword=''
totpSecret=''
```

兼容字段要求：

- `accessToken` 必须保留，兑换和刷新会员状态依赖 AT。
- `verificationUrl` 必须保留，用于导出和后续人工取码。
- `recordedAt` 必须保留，使用写入/捕获这条免 2FA Free 记录时的 Unix epoch 毫秒时间戳。
- `password` / `gptPassword` 可以为空。
- `totpSecret` 可以为空。
- 不因缺少 2FA secret 而从 Free 组隐藏。
- 缺 AT 的账号不能进入一键兑换候选。

## 导出格式

Free 导出需要兼容免 2FA 格式：

```text
邮箱---邮箱获取验证码链接---AT---时间戳
```

导出规则：

- 如果 Free 账号来自免 2FA 路线，并且有 `email`、`verificationUrl`、`accessToken`，导出四段格式。
- 第四段时间戳优先使用该账号记录的 `recordedAt`，缺失时使用账号写入 Free 时的当前 Unix epoch 毫秒。
- 如果账号有旧格式需要的密码、2FA 或其它字段，继续保留现有导出兼容逻辑。
- 导入配置时不能因为缺密码或缺 2FA secret 丢弃免 2FA Free 账号。

## 资格检测规则

两条路线都必须遵守相同的资格规则：

- 有 UPI 试用资格：写入 Free。
- 明确无资格：不写入 Free，并记录失败原因。
- 资格接口临时失败：不写入 Free，保留失败原因，避免污染 Free 池。
- 用户停止：不写入 Free，不继续后续步骤。

## UI 行为

- 侧边栏提供路线选择，推荐文案：
  - `完整 2FA 路线`
  - `免 2FA Free 路线`
- 默认值建议保持 `完整 2FA 路线`，避免旧用户升级后行为突变。
- 免 2FA 路线运行时，流程列表中第 6/7 步应显示为跳过或已按免 2FA 路线完成，日志必须说明原因。
- 日志示例：
  - `免 2FA Free 路线：第 5 步完成，开始读取邮箱、取码链接和 AT。`
  - `免 2FA Free 路线：已检测到 UPI 试用资格，写入 Free。`
  - `免 2FA Free 路线：账号缺 AT，未进入 Free。`

## 错误处理

- 拿不到当前邮箱：当前轮失败。
- 拿不到邮箱取码链接：当前轮失败或标记为缺少取码链接，不写入可导出的免 2FA Free。
- 拿不到 AT：当前轮失败或进入缺 AT 状态，不进入一键兑换候选。
- 资格检测失败：不写入 Free。
- 资格接口临时异常：记录原因，不写入 Free。
- 用户停止：停止当前轮，不写入 Free。

## 测试场景

- 完整 2FA 路线仍执行第 6 步和第 7 步，行为不变。
- 免 2FA Free 路线在第 5 步后跳过设置 GPT 密码和开通 2FA。
- 免 2FA Free 路线有资格才进入 Free。
- 免 2FA Free 账号缺 AT 时不进入一键兑换候选。
- 免 2FA Free 账号可以刷新邮箱状态。
- 免 2FA Free 账号可以参与 UPI/IDEAL 兑换。
- Free 导出能输出 `邮箱---邮箱获取验证码链接---AT---时间戳`。
- 导入包含免 2FA Free 账号的配置后，账号不会因为缺密码或缺 2FA secret 消失。

## 发布说明

实现完成后应更新：

- `manifest.json` 版本号。
- `sidepanel/sidepanel.html` 标题。
- `Release.md`。
- GitHub Release 下载包。

更新后用户需要在浏览器扩展管理页重新加载扩展。
