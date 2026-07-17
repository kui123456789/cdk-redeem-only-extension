# PIX 兑换渠道设计

日期：2026-07-17

## 目标

在现有 UPI、IDEAL 兑换能力之外新增独立的 PIX 渠道，并让 PIX 完整具备卡密池管理、Free 账号兑换、远端状态刷新、任务取消/重试、失败状态记录、会员结果分组和导出删除能力。

“一键兑换全部”不再固定按 UPI 再 IDEAL 的顺序执行。用户点击后先选择一个卡密池，本次批量兑换只使用所选渠道。

## 用户界面

### 卡密池设置

在 UPI 和 IDEAL 卡密池之后新增 PIX 卡密池面板，结构和能力保持一致：

- PIX 卡密输入框；
- 导入 PIX；
- 一键删除；
- 总数、已用、可用数量摘要；
- 单条启用/停用、删除、标记可用、取消和重试；
- PIX 卡密远端状态列表；
- “刷新全部状态”同时覆盖 UPI、IDEAL、PIX。

### Free 账号操作

Free 组增加以下信息和操作：

- PIX 候选数量；
- PIX 可用卡密数量；
- “一键兑换 PIX”按钮；
- “一键兑换全部”继续保留，但改为渠道选择入口。

点击“一键兑换全部”后复用现有 Action Modal，标题为“选择卡密池”。弹框显示三个直接操作按钮：

- `UPI（可兑换 N）`；
- `IDEAL（可兑换 N）`；
- `PIX（可兑换 N）`。

弹框正文同时显示各渠道的可用卡密数和候选账号数。没有可用卡密或没有候选账号的渠道按钮置为禁用。用户点击关闭按钮时取消操作，不启动兑换。

用户选定渠道后，系统重新读取最新账号结果和卡密池状态，避免弹框打开期间状态变化导致使用过期数量。如果此时已无可兑换账号或卡密，显示提示并结束。

本次“一键兑换全部”只运行用户选择的渠道，不自动切换或接力其他渠道。现有独立 UPI、IDEAL 操作保持原有行为，另新增独立 PIX 操作。

### 会员结果

新增 PIX Plus 分组，并与现有分组能力一致：

- 顶部“有会员”统计包含 PIX Plus；
- 增加 PIX Plus 账号列表；
- 支持导出 PIX Plus；
- 支持删除 PIX Plus；
- “导出全部 Plus”和全部会员验证包含 PIX Plus；
- 行内渠道标签、兑换状态、CDK、取消和删除动作正确显示 PIX。

内部会员分组值使用 `pix-plus`，界面区块和导出筛选值使用 `paid-pix`。

## 渠道模型和状态

共享渠道规范化逻辑支持三个明确值：`upi`、`ideal`、`pix`。未知值继续回退到 `upi`，保持旧数据兼容。

渠道标签映射为 UPI、IDEAL、PIX。所有原先使用 UPI/IDEAL 二选一判断或 `['upi', 'ideal']` 列表的代码改为显式三渠道映射或共享渠道列表，避免 PIX 被错误归入 UPI。

PIX 使用独立状态字段：

- `pixChannelRedeemCdkeyPoolText`；
- `pixChannelRedeemCdkeyUsage`；
- `pixRedeemFailureCount`；
- `pixRedeemDailyLimitBlockedAt`；
- `pixRedeemDailyLimitBlockedUntil`；
- `pixRedeemDailyLimitReason`；
- `pixChannelEligibilityStatus`；
- `pixChannelEligibilityReason`。

PIX 卡密池和使用记录不得读取或写入 UPI、IDEAL 的状态字段。

资格检查响应按现有 UPI、IDEAL 的解析方式增加 PIX 分支，读取 PIX 渠道状态和原因；当后端没有返回 PIX 专属资格字段时，沿用现有兼容规则，将其视为未知状态并允许进入后续兑换检查。

PIX 的普通失败采用现有非 UPI 渠道的三次失败上限，仅阻止继续使用 PIX。现有 IDEAL 三次失败导致账号封存的规则保持不变；明确的跨地区支付不可用错误仍按现有规则全局封存账号。本功能不改变既有 UPI、IDEAL 失败策略。

## 旧数据兼容

仓库当前把以下 `pixRedeem*` 字段作为旧版 UPI 名称：

- `pixRedeemCdkeyPoolText`；
- `pixRedeemCdkeyUsage`；
- `pixRedeemApiBaseUrl`；
- `pixRedeemExternalApiKey`；
- `pixRedeemClientId`；
- 其他旧版 PIX/UPI 设置别名。

这些旧字段继续只作为 UPI 兼容输入，不能重新解释为新 PIX 渠道数据，否则旧设置备份会把 UPI 卡密误导入 PIX。

新 PIX 因此使用 `pixChannelRedeem*` 作为卡密池和使用记录的规范字段。设置导入导出同时保留旧 UPI 兼容行为，并显式导入导出新 PIX 字段。旧字段读取后仍规范化到 UPI；新 PIX 数据只从新字段读取。

现有 `plusPaymentMethod: "pix"` 到 UPI 的旧兼容规则不属于本次兑换渠道选择，不做修改。兑换 API 请求中的 `redeemChannel: "pix"` 和 `channel: "pix"` 才表示新 PIX 渠道。

## 后台兑换流程

PIX 复用现有兑换 API 地址、External API Key 和 Client ID，不新增独立服务器配置。提交兑换时请求体传递：

```json
{
  "channel": "pix"
}
```

兑换执行器根据渠道读取独立卡密池和使用记录，保存远端状态时写回同一渠道。批量兑换消息继续使用现有消息类型，并在 payload 中传递 `channel: "pix"`。

“一键兑换全部”的执行函数接收用户选择的渠道，并完成以下流程：

1. 检查当前是否已有核验或兑换任务；
2. 计算三个渠道的最新候选数和可用卡密数；
3. 打开渠道选择弹框；
4. 用户选择后重新读取最新状态；
5. 只为所选渠道构造账号列表；
6. 使用 `source: "free-all-<channel>"` 启动兑换；
7. 显示所选渠道的完成、停止或错误摘要。

刷新、取消和重试消息均携带渠道，并使用对应渠道的卡密池和使用记录。PIX 的远端查询、取消和重试请求传递 `channel: "pix"`。

## 错误处理

- 三个渠道均不可用时，“一键兑换全部”按钮禁用；
- 弹框内不可用渠道按钮禁用，并说明是无候选账号还是无可用卡密；
- 选择后状态发生变化时，不使用过期选择，显示最新不可兑换原因；
- PIX API 错误、日限额和远端状态使用现有统一错误分类，但写入 PIX 独立字段；
- PIX 操作失败不得修改 UPI 或 IDEAL 卡密使用记录；
- 停止兑换只停止当前选定渠道的运行任务。

## 测试策略

采用测试先行方式增加以下回归覆盖：

1. 渠道规范化接受 `pix`，未知值仍回退 UPI；
2. PIX 的失败、日限额和资格字段与 UPI、IDEAL 隔离；
3. PIX 卡密池和使用记录使用新规范字段；
4. 旧 `pixRedeem*` 卡密字段仍映射到 UPI，不会进入新 PIX；
5. API 兑换、刷新、取消和重试请求传递 `channel: "pix"`；
6. 设置导入导出保留旧 UPI 兼容并包含新 PIX 字段；
7. PIX 卡密池 UI 支持导入、删除、启停、摘要和状态列表；
8. Free 组渲染 PIX 候选和 PIX 兑换按钮；
9. “一键兑换全部”弹框显示三渠道、禁用不可用渠道，并只执行用户选择的渠道；
10. PIX Plus 分组、统计、导出和删除正确；
11. 原有 UPI、IDEAL 测试保持通过。

完成后运行相关 Node 测试、全部 `scripts/test-*.cjs`、smoke audit、修改文件的 `node --check` 和 `git diff --check`。

## 非目标

- 不新增 PIX 专用 API 地址、API Key 或 Client ID；
- 不改变现有 UPI、IDEAL 独立按钮的既有业务策略；
- 不让“一键兑换全部”支持多选或按顺序串行多个渠道；
- 不重新解释旧 `pixRedeem*` UPI 兼容数据；
- 不修改与兑换渠道无关的支付方式设置。
