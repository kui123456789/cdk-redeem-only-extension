# Release Notes

## CDK Redeem Only V1.0.7

本版本修复试用资格检查可能被旧 AT / 串号 AT 误判的问题，并给自定义邮箱池新增独立的 AT 复制按钮，建议已安装 V1.0.6 的用户升级。

### 修复

- 后端资格检查返回 `not-eligible` 前，会先校验返回邮箱是否等于当前目标邮箱；如果返回邮箱不一致，会标记为检查失败/疑似 AT 串号，不再把当前邮箱写成无试用资格。
- 主流程、Free 资格检测、邮箱池手动资格检查等调用资格检查时都会传入目标邮箱，避免旧 AT 属于其它账号时污染当前邮箱状态。
- 结构化资格检查结果会优先按 `trialEligibilityStatus` 判断，避免“资格检查失败”这类文案被旧正则误判为“无试用资格”。
- 自定义邮箱池行新增单独的 `复制 AT` 按钮，和原来的邮箱复制按钮分开；邮箱按钮只复制邮箱，AT 按钮只复制完整 AT。

### 验证

- 已通过 `node --check shared/trial-eligibility-api.js`。
- 已通过 `node --check background/steps/upi-redeem.js`。
- 已通过 `node --check background/upi-credential-membership-checker.js`。
- 已通过 `node --check sidepanel/custom-email-pool-manager.js`。
- 已通过 `node --check sidepanel/sidepanel.js`。
- 已通过 `node --test scripts/test-trial-eligibility-api.cjs`。
- 已通过 `node scripts/audit-smoke-tests.mjs`。
- 已通过 `git diff --check`。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏和后台 service worker 加载 V1.0.7 新代码。

## CDK Redeem Only V1.0.6

本版本补齐自定义邮箱池的手动试用资格检查和 AT 保留逻辑，移除 Free 组里容易误用的试用资格复查入口，建议已安装 V1.0.5 的用户升级。

### 修复

- 自定义邮箱池每个邮箱旁新增 `检查资格` 入口，可用已保存 AT 单独调用后端试用资格检查。
- 第 7 步注册完成后会把 2FA、Passkey、免 2FA 路线读取到的 AT 回写到自定义邮箱池，便于后续手动重查资格。
- 试用资格检查失败、网络波动或明确无资格时，只更新邮箱池行状态，不再误写入 Free，也不会删除邮箱本身。
- Free 组移除旧的 `检查试用资格` 入口，避免和邮箱池手动检查、Free 会员状态识别混用。
- 修复邮箱池行缺 AT 时按钮不可点且原因不清楚的问题，现在会提示缺少已保存 AT。
- Passkey / 免 2FA / 完整 2FA 路线在资格检查失败后仍保留邮箱池里的取件链接和 AT 信息。

### 验证

- 已通过 `node --check background.js`。
- 已通过 `node --check background/message-router.js`。
- 已通过 `node --check background/steps/enable-passkey.js`。
- 已通过 `node --check background/steps/enable-totp-mfa.js`。
- 已通过 `node --check background/steps/no-2fa-free-route.js`。
- 已通过 `node --check background/steps/upi-redeem.js`。
- 已通过 `node --check background/upi-credential-membership-checker.js`。
- 已通过 `node --check sidepanel/account-records-manager.js`。
- 已通过 `node --check sidepanel/custom-email-pool-manager.js`。
- 已通过 `node --check sidepanel/sidepanel.js`。
- 已通过 `node scripts/audit-smoke-tests.mjs`。
- 已通过 `node --test scripts/test-trial-eligibility-api.cjs`。
- 已通过 `node --test scripts/test-passkey-login-core.cjs`。
- 已通过 `git diff --check`。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏和后台 service worker 加载 V1.0.6 新代码。

## CDK Redeem Only V1.0.5

本版本修复试用资格失败后的邮箱池状态展示，并恢复 Free 导出中三条路线的邮箱取件链接字段，建议已安装 V1.0.4 的用户升级。

### 修复

- 第 7 步检测到账号无试用资格时，不再删除邮箱本身，也不写入 Free；会在自定义邮箱池中标记 `无试用资格`，并保留失败原因。
- 自定义邮箱池新增无试用资格标识和 `清除无资格` 操作，方便手动恢复后重新测试。
- Free 可兑换筛选会跳过已标记无试用资格的邮箱，避免后续自动兑换或一键兑换再次选中。
- 恢复完整 2FA Free 导出格式：`邮箱---密码---2FA---邮箱取件地址---AT---具体时间`。
- 恢复 Passkey Free 导出格式：`邮箱---密码---PASSKEY:credentialId---邮箱取件地址---AT---具体时间`。
- 保持免 2FA Free 导出格式：`邮箱---邮箱取件地址---AT---具体时间`。
- 导入解析同步支持上述带取件链接的 2FA / Passkey / 免 2FA Free 文本，避免链接被误读成 AT 或时间。

### 验证

- 已通过 `node --check background.js`。
- 已通过 `node --check background/steps/upi-redeem.js`。
- 已通过 `node --check background/upi-credential-membership-checker.js`。
- 已通过 `node --check background/message-router.js`。
- 已通过 `node --check sidepanel/account-records-manager.js`。
- 已通过 `node --check sidepanel/sidepanel.js`。
- 已通过 `node --check sidepanel/custom-email-pool-manager.js`。
- 已通过 `git diff --check`。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏和后台 service worker 加载 V1.0.5 新代码。

## CDK Redeem Only V1.0.4

本版本补齐 Passkey Free 路线、登录邮箱验证码补 AT，以及 Free/Plus 兑换显示体验，建议已安装 V1.0.3 的用户升级。

### 新增

- 新增 `Passkey Free 路线`：第 5 步后继续设置 GPT 密码，第 7 步通过 Nerver Passkey API 开通 Passkey，再检测 UPI 试用资格并进入 Free。
- Free 导入/导出支持 Passkey 文本格式：`邮箱---密码---PASSKEY:credentialId---AT---时间`；Plus Passkey 导出支持 `邮箱----密码---PASSKEY:credentialId---时间`。
- Free/Plus 列表的 `兑换` 列改为进度条，待兑换、处理中、成功、失败、封存和缺 AT 状态更直观；处理中点击进度条仍可取消远端兑换任务。

### 修复

- 修复 Passkey 路线导入 Free 后，Passkey 字段没有稳定保留，导致导出或补 AT 判断异常的问题。
- 修复 Passkey Free 账号缺 AT 时，一键补 AT 被错误要求必须有 2FA/Passkey 验证的问题；现在有 GPT 密码即可尝试邮箱+密码登录补 AT。
- 修复补 AT 登录时遇到 OpenAI 邮箱一次性验证码页面会直接失败的问题；现在会复用自定义邮箱池/Assurivo 第 8 步取码并提交验证码后继续读取 AT。
- 修复 Free/Plus 账号行下面显示冗长日志说明的问题，详情仍保留在行悬停提示中。
- 修复侧边栏静态标题仍显示旧版本的问题。

### 验证

- 已通过 `node --check background.js`。
- 已通过 `node --check background/steps/enable-passkey.js`。
- 已通过 `node --check background/steps/upi-redeem.js`。
- 已通过 `node --check background/upi-credential-membership-checker.js`。
- 已通过 `node --check background/message-router.js`。
- 已通过 `node --check data/step-definitions.js`。
- 已通过 `node --check sidepanel/account-records-manager.js`。
- 已通过 `node --check sidepanel/sidepanel.js`。
- 已通过补 AT 邮箱验证码 smoke 测试，确认会取邮箱验证码、提交并保存 AT。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏和后台 service worker 加载 V1.0.4 新代码。

## CDK Redeem Only V1.0.3

本版本修复免 2FA Free 路线、配置导入导出入口和 Free 文本导出细节，建议已安装 V1.0.2 的用户升级。

### 修复

- 修复免 2FA Free 路线完成后，自定义邮箱池当前邮箱没有标记为已用的问题；资格通过并写入 Free 后会复用统一账号来源收尾逻辑。
- 修复侧边栏顶部 `配置` 按钮无法点击的问题；配置菜单、导出配置、导入配置重新绑定到现有配置迁移逻辑。
- 修复配置入口被自动保存状态误锁的问题；自动运行中仍会锁定导入配置，但导出配置可以等待保存完成后继续。
- 修复免 2FA Free 导出时，Assurivo `feed.php` 链接未统一为网页 `open.php` 链接的问题。
- 修复免 2FA Free 导出最后一列使用数字时间戳的问题；现在导出为 `YYYY-MM-DD HH:mm:ss` 具体时间。
- 修复自定义邮箱池解析对 `邮箱---取码链接---AT---时间`、Assurivo URL 单行格式的兼容问题。

### 验证

- 已通过 `node --check background.js`。
- 已通过 `node --check background/steps/no-2fa-free-route.js`。
- 已通过 `node --check background/upi-credential-membership-checker.js`。
- 已通过 `node --check background/verification-flow.js`。
- 已通过 `node --check mail-provider-utils.js`。
- 已通过 `node --check sidepanel/sidepanel.js`。
- 已通过 `node --check sidepanel/custom-email-pool-manager.js`。
- 已通过免 2FA Free 路线 smoke 测试，确认成功后会触发邮箱池标记已用。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏和后台 service worker 加载 V1.0.3 新代码。

## CDK Redeem Only V1.0.2

本版本补入“免 2FA Free 路线”：当官网 2FA 开通不可用时，可以在第 5 步资料页完成后，直接读取邮箱、邮箱取码链接、AT 和时间戳，确认 UPI 试用资格后进入 Free 组。

### 新增

- 侧边栏 UPI 设置区新增 `主流程路线` 下拉框：
  - `完整 2FA 路线`：继续走设置 GPT 密码、开通 2FA、检测资格。
  - `免 2FA Free 路线`：第 5 步后跳过设置 GPT 密码和开通 2FA，检测有试用资格后进入 Free。
- 免 2FA Free 记录使用文本格式：`邮箱---邮箱获取验证码链接---AT---时间戳`。
- Free 导出/导入支持上述四段格式，导出文件名会使用 `upi-membership-free-email-url-at`。

### 修复

- 修复免 2FA 路线后台 registry 未包含 `persist-no-2fa-free`，导致流程节点不可执行的问题。
- 修复导入免 2FA Free TXT 时，第二段 URL 被误读成密码、第三段 AT 被误读成 2FA 的问题。
- 修复 Free 结果表 normalize/upsert 时丢失 `verificationUrl`、`recordedAt`、`no2faFreeRoute`、`twoFactorEnabled` 字段的问题。
- 修复一键兑换候选数量可能包含缺 AT Free 账号的问题；缺 AT 不再计入可兑换。

### 验证

- 已通过 192 个 JS/MJS 文件语法检查。
- 已通过 smoke 审计、无手机接码残留审计、无 Removed Network 残留审计。
- 已验证 no-2FA Free TXT 解析和导出行为。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏加载 V1.0.2 新代码。

## CDK Redeem Only V1.0.1

本版本在 V1.0 基础上补入侧边栏“自动”按钮的邮箱服务判断修复，建议已安装 V1.0 的用户升级。

### 修复

- 修复点击邮箱服务“自动”时报 `isCustomMailProvider is not defined` 的问题。
- 补回侧边栏前端缺失的 `isCustomMailProvider()`、`isLuckmailProvider()` 和统一 provider 读取 helper。
- 避免切换自定义邮箱池或 Luckmail 相关 UI 时，因为前端 helper 缺失导致侧边栏红框报错。

### 验证

- 已通过侧边栏语法检查和 smoke 审计。
- 更新后需要在浏览器扩展管理页重新加载扩展，确保侧边栏加载 V1.0.1 新代码。

## CDK Redeem Only V1.0

本版本作为 1.0 正式版，汇总近期对主流程、邮箱池、UPI/IDEAL 卡密兑换、配置导入导出和模块清理的完整修复，建议从旧版本直接升级到本版本。

### 核心主流程

- 恢复侧边栏 7 步主流程：打开官网、注册邮箱、填写密码、获取验证码、填写资料、设置 GPT 密码、开通 2FA 并检测资格。
- 第 7 步改为先确认 UPI 试用资格，通过后才进入 Free 组，避免无资格邮箱混入待兑换池。
- 主流程自动兑换时，如果当前账号因状态或日限无法继续，但 UPI 仍有可用 CDK，会接力处理 Free 队列里的其它 UPI 候选。
- 主流程提交兑换后会轻量轮询远端 CDK 状态，同步成功、失败、取消、超时和失败次数，不再让账号长期卡在等待远端结果。
- 自动运行停止时会保存上一轮日志快照，方便回看失败前的真实步骤。

### 邮箱池与取码

- 恢复 iCloud 自定义邮箱池、Hotmail、2925、Luckmail 等邮箱来源的侧边栏管理和主流程读取。
- 修复拆分后 `getHotmailAccounts is not defined`、`normalizeLuckmailBaseUrl is not defined` 等 helper 缺失导致第一步报错的问题。
- Assurivo JSON 取码支持更多邮件字段、多封邮件扫描、Hindi/英文验证码语义和 UTC+8 时间比较，减少印度/Hindi 页面下取不到码的问题。
- 第 4 步取码遇到 OpenAI 认证页 500、空收件箱、旧验证码被拒绝等情况时，会等待、重发或刷新页面后继续处理。
- 步骤 6 设置 GPT 密码补齐 Hindi 页面按钮和密码页识别，避免本地化文案导致提交失败。

### UPI / IDEAL 兑换

- Free 组保持共享账号，Plus 分为 `UPI Plus` 和 `IDEAL Plus`，账号按实际兑换成功渠道进入对应 Plus 组。
- CDK 池拆为 `UPI 卡密池` 和 `IDEAL 卡密池`，导入、删除、启用、刷新状态互不影响。
- Free 组提供 `一键兑换 UPI`、`一键兑换 IDEAL`、`一键兑换全部`；全部兑换固定先 UPI 后 IDEAL，避免两个渠道抢同一个 Free 账号。
- UPI/IDEAL 失败次数、封存状态、日限状态和渠道归属会写入账号记录，刷新状态后能继续同步到 Free/Plus 显示。
- 只有明确命中渠道日限提示时才把账号从 UPI 候选转到 IDEAL 候选；手动 UPI 兑换不会被普通失败 3 次直接拦住。
- 删除 UPI Plus 或 IDEAL Plus 后会记录分渠道删除屏蔽，避免刷新 usage 或重新打开侧边栏后自动回弹。

### 配置、导入导出与显示

- 配置导出补齐 UPI/IDEAL 卡密池、usage、Plus/Free 记录和删除屏蔽字段，导入后会刷新显示池。
- 导出 Free/Plus/TXT/JSON 文件时优先使用 Chrome downloads API 指定文件名，减少指纹浏览器下载成 blob/UUID 且无后缀的问题。
- 文本导出自动补 `.txt`，JSON 导出自动补 `.json`，方便在下载记录中直接识别文件类型。
- Free 组刷新邮箱状态改为按有 AT 的 Free/失败账号统计和执行，不再误按 CDK 远端任务数量显示。
- 修复 Free/Plus 数量、待兑换数量、UPI 候选数量和导出数量不一致的多处显示问题。

### 模块清理

- 删除不需要的 OAuth/Plus 复查、CPA/Sub2API 会话导入入口。
- 删除 IP 代理池、Removed Network、手机接码相关残留，并加入审计脚本防止旧入口回流。
- 聚焦邮箱注册、资格检测、2FA、Free/Plus 管理和 UPI/IDEAL 卡密兑换主链路。

### 重要修复汇总

- 修复主流程注册成功、有试用资格但账号没有稳定进入 Free 组的问题。
- 修复导入配置后 IDEAL 卡密池、IDEAL Plus、Free 记录缺失或显示不刷新的问题。
- 修复删除 Free、删除 UPI Plus、删除 IDEAL Plus 后账号从本地备份池或 CDK usage 自动回弹的问题。
- 修复远端兑换失败后主程序运行中不刷新，账号一直卡在等待远端结果的问题。
- 修复 UPI 有可用 CDK，但自动兑换只检查当前账号、不继续处理其它可兑换 Free 账号的问题。
- 修复部分指纹浏览器导出配置或 Free 文本时没有 `.json` / `.txt` 后缀的问题。

### 说明

- 本版本新增/使用 `downloads` 权限；更新后需要在 Chrome/指纹浏览器扩展管理页重新加载扩展，并确认后台 service worker 与侧边栏都运行 1.0 新代码。
- 本版本仍需要用户自行配置邮箱取码、Nerver/Assurivo 等外部服务。
- 旧的 blob 下载链接不是持久文件地址，1.0 只能修复后续导出；已经下载的旧文件需要从本地下载目录或浏览器临时目录找回。

## CDK Redeem Only V0.2.12

本版本修复主流程自动兑换 UPI 队列接力，以及指纹浏览器下载导出文件时变成 blob/UUID 文件名的问题。

### 主要变化

- 主流程第 7 步资格通过后，如果本轮账号因 UPI 日限或状态不可用无法直接兑换，会在 UPI 仍有可用 CDK 时自动接力 Free 队列里的其它 UPI 候选。
- 自动兑换日志会明确写出当前账号跳过原因、可用 CDK 数和接力处理的 Free 队列候选数量，便于判断为什么没有兑换当前账号。
- 导出 Free/Plus/TXT/JSON 文件时优先使用 Chrome downloads API 明确指定文件名，避免指纹浏览器把 blob 链接保存成无后缀 UUID。
- 下载文件名增加兜底规则：文本导出自动补 `.txt`，JSON 导出自动补 `.json`。

### 修复

- 修复 UPI 卡密池有可用卡密，但主流程只检查本轮账号，未继续处理其它可兑换 Free 账号的问题。
- 修复扩展侧边栏导出的 Free 文本在部分指纹浏览器中显示为 `blob:chrome-extension://.../<uuid>` 且无法直接改成 `.txt` 的问题。
- 同步侧边栏 HTML 标题到当前版本号，避免页面标题仍显示旧版本。

### 说明

- 本版本新增 `downloads` 权限；更新后需要在扩展管理页重新加载扩展并确认权限。
- 旧的 blob 下载链接不是持久文件地址，更新只能修复后续导出；已下载到本地的旧文件需要从下载目录或浏览器临时目录找回。

## CDK Redeem Only V0.2.11

本版本修复主流程 Free/Plus 同步、远端兑换状态刷新、自动运行日志快照和导入配置后的显示刷新问题。

### 主要变化

- 主流程第 7 步改为确认 UPI 试用资格后再写入 Free，并对写入持久化做复核。
- 主流程自动兑换提交后会轻量轮询远端 CDK 状态，只同步失败/成功状态和失败次数，不在刷新线程里续兑。
- 自动运行停止时会保存并回放上一轮日志快照，方便排查上一轮成功或停止前的细节。
- 导入配置或账号备份更新后会刷新 Free/Plus 显示池，减少旧侧边栏状态残留。

### 修复

- 修复 Free 写入时可能清掉 UPI/IDEAL Plus 删除屏蔽，导致删除后的 Plus 账号从 CDK usage 回弹的问题。
- 修复第 7 步日志用后台简化统计显示 Free 数量，和侧边栏实际分组数量不一致的问题。
- 修复 Assurivo 未收到本轮新邮件时错误提示不够明确的问题。

### 说明

- 更新后需要在 Chrome 扩展管理页重新加载扩展，确保后台 service worker 使用新代码。

## CDK Redeem Only V0.2.10

本版本修复第 4 步 Assurivo 取码在 OpenAI 认证页 500、邮件模板变化和多封邮件混杂时无法继续的问题。

### 主要变化

- 第 4 步取码轮询期间会检测 `auth.openai.com/email-verification` 的 HTTP 500 错误页，并自动刷新认证页后继续等待邮件。
- Assurivo JSON 邮件识别支持更多字段结构，包括 `title`、`sender`、`sender_email`、`mail_from`、`html`、`content`、`message`、`text` 等。
- Assurivo 返回多封邮件时会按时间扫描候选邮件，不再只看第一封。
- 对 Assurivo 增加唯一 6 位正文验证码兜底，避免邮件正文模板变化导致“没有邮件正文匹配验证语义”。

### 修复

- 修复第 4 步已在取码等待中，但认证页变成 HTTP 500 后后台仍继续空等的问题。
- 修复 Assurivo 已返回 ChatGPT/OpenAI 验证邮件，却因为标题/发件人字段变化未进入候选的问题。
- 修复最新邮件不是验证码通知时，旧一封有效验证码邮件被忽略的问题。

### 说明

- 验证码仍只从邮件正文提取；URL、邮箱地址、日期时间会被排除，避免误取。
- 更新后需要在 Chrome 扩展管理页重新加载扩展，确保后台 service worker 使用新代码。

## CDK Redeem Only V0.2.9

本版本修复 Assurivo JSON 空收件箱导致第 4 步过早停止的问题。

### 主要变化

- 步骤 4 通过 Assurivo `feed.php` 取码时，如果返回 `{"status":"success","data":[]}`，会按邮件投递延迟处理，不再 5 次 10 秒后直接终止当前轮。
- Assurivo 空收件箱会进入最长约 180 秒的等待窗口，取到新邮件后立即继续，不会固定等满。
- 连续空收件箱时会自动请求一次 `Resend email`，然后继续等待本轮新验证码邮件。
- 最终仍未收到邮件时，错误信息会明确提示 Assurivo JSON 空数组/未收到 ChatGPT 邮件，便于区分接口延迟和验证码错误。

### 修复

- 修复第 4 步 Assurivo JSON 返回 `data: []` 时自动运行整轮停止的问题。
- 修复空收件箱情况下过快沿用当前邮箱重开，可能反复触发 OpenAI 发码的问题。
- 保持真实验证码错误、旧邮件、风控页和账号已存在的原有终止/重试逻辑不变。

### 说明

- 本修复仅作用于注册第 4 步 Assurivo 空邮件等待，不改变第 6 步设置 GPT 密码取码逻辑。
- 更新后需要在 Chrome 扩展管理页重新加载扩展，确保后台 service worker 使用新代码。

## CDK Redeem Only V0.2.8

本版本补齐慢网络认证恢复、Assurivo JSON 最新取码、UPI 临时网络失败重试，以及单独执行第 7 步的当前登录账号识别。

### 主要变化

- Assurivo 自动取码改用 `feed.php` JSON，并按 `saved_at` 选择最新 ChatGPT/OpenAI 邮件，只从邮件正文提取验证码。
- 步骤 3/4/5/6/7 增加提交后复核窗口，页面慢跳转、内容脚本短暂失联或认证重试页恢复时，不再过早误失败。
- 步骤 4 遇到旧邮件或本轮新邮件未到时会继续等待，不再从发件人、链接或旧邮件中误取 6 位数字。
- UPI 资格检测和兑换相关 `Failed to fetch` / timeout / 网络错误会按自动运行规则重试，连续失败 3 次后再换下一轮。
- 单独点击第 7 步时，以当前已登录 ChatGPT session 邮箱为准，不再被旧流程残留目标邮箱拦截。

### 修复

- 修复日本节点/日文邮件下验证码取错、误取旧码或误取发件人数字的问题。
- 修复步骤 5 资料页慢提交时长时间停留或误报输入框缺失的问题。
- 修复步骤 6 设置 GPT 密码后页面已切换但后台仍按旧状态停止的问题。
- 修复单独执行第 7 步时，当前已登录账号与旧目标邮箱不一致就直接停止的问题。
- 修复手动第 7 步可能把旧账号 GPT 密码写入当前登录账号记录的风险。

### 说明

- 自动注册完整流程仍严格校验 ChatGPT session 邮箱与本轮目标邮箱一致，避免批量运行串号。
- 单独第 7 步如果 OpenAI 要求 recent auth 且本地没有当前账号 GPT 密码，会提示需要重新认证或补密码。
- 明确 `not-eligible`、验证码真实错误、账号风控和 session 串号仍会停止，不会被网络复核吞掉。

## CDK Redeem Only V0.2.7

本版本修复步骤 4 遇到 OpenAI 认证页 `max_check_attempts` 风控后误进入步骤 5 的问题。

### 修复

- 步骤 4 提交验证码后会识别 `max_check_attempts`、日文 `試行回数が多すぎます` 和“数分待ってからもう一度”提示。
- 遇到试行次数限制时立即走现有风控停止通道，不再点击 `もう一度試す`，也不会继续进入步骤 5。
- 步骤 4 提交后的慢跳转复核会读取内容脚本状态，不再只靠 URL 判断成功。
- 步骤 4 仍停留在 `/email-verification` 且未确认进入资料页时，不再兜底成“验证码通过”。
- 步骤 5 填姓名前增加前置页面检查；如果仍在验证码页或认证重试页，会提示前置页面未就绪，不再报“未找到姓名输入框”。

### 说明

- 明确验证码错误仍按原逻辑重新取码。
- 正常进入资料页、通行密钥页、手机号页或 ChatGPT 首页的流程不变。
- 本版本不修改后端接口域名、API Key 字段或 UPI 资格规则。

## CDK Redeem Only V0.2.6

本版本重点修复慢网络和日文页面下认证流程误失败，并补齐 Free/Plus 面板的取消兑换与运行中安全操作体验。

### 主要变化

- 新增提交后复核机制：步骤 3/5 收到完成信号后会继续检查真实标签页 URL 和内容脚本状态，页面慢跳转时不再立刻失败。
- 第 5 步资料页停留在 `/about-you` 时会进入最长 60 秒复核，并在按钮可点击时最多自动重提 3 次。
- 第 6 步设置 GPT 密码继续保留快速提交 + 后台轮询，并增强 `Try again` 恢复后对新密码页、加载中和已离开密码页的判断。
- 第 4 步验证码提交后增加慢跳转复核和同码重提，遇到认证超时页会先自动恢复再判断下一步。
- 日文 OpenAI 认证页支持更完整：验证码、资料页、提交按钮、重试按钮和错误文案增加日文识别。
- Free/Plus 列表新增“取消”兑换任务入口，按后端 `can_cancel` 能力展示；自动注册运行中仍禁止手动取消。

### 修复

- 修复步骤 5 已收到资料提交完成信号，但页面短时间停留在 `/about-you` 就直接停止自动运行的问题。
- 修复日本节点注册时，日文验证码邮件和日文认证页按钮识别不全导致取码或提交不稳定的问题。
- 修复步骤 6 慢网络下页面已切换或 ChatGPT session 已可读取，但旧状态仍显示新密码页时误判失败的问题。
- 修复第 7 步 2FA/UPI 资格检测遇到临时 `Failed to fetch` 时直接失败的问题，现在会短重试；明确 `not-eligible` 仍按原逻辑停止并清理。
- 修复步骤列表里“没开始”过于突出、标题与状态/按钮不齐的问题。
- 修复正在兑换或等待远端结果的 Free/Plus 行可能被误删的风险，删除时会保护活跃兑换任务。

### 说明

- 本版本不修改后端接口域名和密钥字段。
- 明确验证码错误、账号已存在、session 邮箱不一致、UPI 明确无资格仍会失败，不会被慢网络复核吞掉。
- GitHub Release 包仍需按发布流程重新打包上传；仅推送 `main` 不会自动刷新已发布 zip。

## CDK Redeem Only V0.2.5

本版本修复自动运行期间 Free/Plus 面板操作限制，并优化步骤 6 设置 GPT 密码的超时恢复。

### 主要变化

- 自动注册主程序运行中，Free/Plus 面板允许继续 `导入 Free`、安全删除普通行和 `一键兑换 CDK`。
- 删除 Free/Plus 时会保护正在兑换或等待远端结果的账号，分组删除会跳过这些账号并提示跳过数量。
- 导入 Free 时按邮箱合并去重，不覆盖 Plus 账号，也不覆盖正在兑换中的 Free 行。
- 手动执行步骤会检查前置步骤状态，第 7 步仍可单独点击，但前面的步骤未完成或未跳过时不会误启动后续步骤。
- 步骤 6 设置 GPT 密码改为快速提交后由后台每 500ms 轮询页面状态，正常情况可更快进入步骤 7。

### 修复

- 修复步骤 6 提交 GPT 密码后遇到页面跳转、内容脚本短暂失联或 `Try again` 认证超时页时容易误判失败的问题。
- 修复步骤 6 旧流程中内容脚本和后台等待重叠，导致后台先报 `内容脚本 12 秒内未响应` 的问题。
- 修复自动注册运行中后台仍拦截 Free 导入、删除和一键兑换消息的问题。
- 修复删除操作可能移除正在兑换或等待远端结果账号的风险。

### 说明

- 本版本不修改后端接口域名和密钥字段。
- `补 AT`、`识别 Plus`、`验证 Plus`、`登录`、移动分组和启用/停用在自动注册运行中仍保持锁定。
- GitHub Release 包仍需按发布流程重新打包上传；仅推送 `main` 不会自动刷新已发布 zip。

## CDK Redeem Only V0.2.4

本版本发布 CDK Jobs API、Free/Plus 状态同步和 UPI 操作体验修复。

### 主要变化

- CDK 状态列表改为以后端 Jobs API 能力字段为准，按 `can_cancel`、`can_retry`、`can_reuse_token`、`has_access_token` 显示操作。
- 新增 CDK 后端任务 `取消` / `重试` 操作，重试只复用后端已绑定的 `access_token`，不会重新读取或提交新的 AT。
- 自动注册运行中允许只读刷新 CDK 远端状态，Free/Plus 分组能继续跟随后端结果更新。
- 自动注册运行中允许继续导入追加 CDK，但禁止手动删除、停用、取消或重试已保存 CDK。
- 导出配置会携带可还原 Free/Plus 的运行数据和账号备份，导入后可恢复分组结果。

### 修复

- 修复兑换轮数语义：`3` 表示最多 3 轮，界面显示 `1/3`、`2/3`、`3/3`；`0` 表示只跑首轮。
- 修复单行账号 `登录` 会继续读取/刷新 AT 的问题，现在只执行网页登录。
- 修复第 7 步和第 6 步强绑定的问题，第 7 步可以独立点击执行。
- 修复 `cancelled` 被误显示为失败的问题，现在统一显示为 `已取消`。
- 优化 UPI 会员检测 `Failed to fetch` 报错，错误信息会带出接口地址和排查提示。
- 优化 CDK 导入按钮样式，让导入入口更明显。

### 说明

- 本版本不修改后端接口域名和密钥字段。
- GitHub Release 包仍需按发布流程重新打包上传；仅推送 `main` 不会自动刷新已发布 zip。

## CDK Redeem Only V0.2.3

本版本发布 v0.2.2 之后的所有 CDK 改名、流程加速、会员核验和配置文档修复。

### 主要变化

- 项目与 GitHub 仓库统一改名为 `CDK Redeem Only` / `cdk-redeem-only-extension`。
- CDK 池支持像邮箱一样导入，运行中或缺 CDK 停止后导入新 CDK 会继续剩余 Free 账号兑换。
- 会员核验改为 AT 优先：已有 AT 直接查会员，AT 缺失或失效才登录补 AT。
- Free 进 Plus 使用远端会员验证，确认 Plus/Pro/Team 后才进入 Plus。
- 主流程等待时间优化：操作间延迟默认关闭，步骤 2、验证码阶段和第 6 步固定等待改短。
- 配置文档更新为当前 CDK 版本说明，删除旧包名和旧仓库名。

### 修复

- 修复更新检查里旧版本族名残留，避免 CDK Release 版本比较异常。
- 修正 Release 标题旧名残留，GitHub 页面显示为 CDK 名称。

### 说明

- 邮箱取码等待、2FA 接口重试、CDK 兑换远端超时和 Free/Plus 导出格式保持不变。
- 真实远端接口域名保持不变。

## CDK Redeem Only V0.2.2

本版本完成项目名与 GitHub 仓库名统一，并优化主注册流程等待时间。

### 优化

- 项目包名、更新检查仓库名和说明链接统一为 `cdk-redeem-only-extension`。
- 操作间延迟默认关闭，仍可在侧栏手动开启。
- 缩短步骤 2 注册入口稳定等待、注册入口点击等待和第 6 步验证码页确认等待。
- 验证码阶段改为短轮询，页面提前就绪时更快进入下一步。

### 说明

- 不修改邮箱取码等待时间、2FA 接口重试、CDK 兑换远端超时和 Free/Plus 逻辑。
- 真实接口域名保持不变，避免影响现有后端调用。

## CDK Redeem Only V0.2.1

本版本是 UPI 兑换稳定性修复版。

### 修复

- 修复远端返回兑换失败后，CDK 没有重新进入可用池的问题。
- 修复失败账号仍留在 Free 时，被界面显示成待兑换、失败数量不增加的问题。
- 修复失败 CDK 释放后自动续兑不继续处理剩余账号的问题。
- 优化日本节点注册识别、认证页切换和第 3/6 步慢响应兼容。
- 优化第 4/6 步自定义邮箱取码等待与验证码识别。
- 修复第 7 步开通 TOTP 2FA 返回 `recent_auth_required` 后直接失败的问题，改为自动重新登录并刷新登录态后重试。

### 说明

- 普通失败、超时、拒绝、取消、未找到记录的 CDK 会释放回可用池。
- `CDK 无效` 仍不会自动复用，需要手动删除或停用。
- Plus/Free 导出仍按现有格式，不导出本地密钥配置。

## CDK Redeem Only V0.2.0

本版本完成 UPI-only 清理，只保留 UPI 注册、2FA、AT、Free/Plus 分组、CDK 兑换、Plus 识别/验证和导入导出。

### 主要变化

- 移除旧支付流程 内容脚本和后台入口。
- 移除旧外部钱包支付、旧网络切换、手机验证取码、本地支付 helper 相关 UI 和入口。
- 侧栏只保留 UPI、账号、邮箱、设置密码、2FA、Free/Plus、CDK 相关配置。
- 第 7 步仍只做开通 2FA、读取 AT、检测资格、保存 Free，不自动兑换 CDK。
- Free 组支持导入、导出、补 AT、识别 Plus、一键兑换 CDK。
- Plus 组支持验证、导出、删除。
- 保留 `content/signup-page.js` 第六步错误页 Try again 自动重试和 `readyState=interactive` 兼容逻辑。

### 配置

请在侧栏填写：

- `UPI Key`
- `UPI Client ID`
- `CDK 池`
- `兑换轮数`

详细说明见 [docs/CONFIG-USAGE.md](docs/CONFIG-USAGE.md)。

### 脱敏要求

发布包必须排除本地密钥、配置、运行历史和开发缓存。不要把浏览器本地 storage、私钥、API Key 或 CDK 池打进公开包。



