## Context

现有站点是 Vue 3 静态构建，`manifest-activities.json` 来自 Bungie Manifest，只描述公开活动定义，不描述实时轮换。Pages 工作流已经具备定时构建和生成静态 JSON 的模式，但没有 Bungie API 凭据。Milestones 接口需要 `X-API-Key`，所以凭据只能留在 GitHub Actions；浏览器只读取同源快照。站点已有中英文 i18n、深色主题、活动图鉴和 Manifest Hash 关联能力。

## Goals / Non-Goals

**Goals:**

- 每次发布生成可验证的当前周轮换快照，并保留抓取时间、周期边界、来源和状态。
- 覆盖 API 能识别的 PvE、PvP、突袭、地牢、异域任务、限时活动和公开商人条目；无法分类的条目也不丢失。
- 同步失败不覆盖最近成功快照，页面明确区分新鲜、部分、过期和不可用数据。
- 在桌面和 375px 移动端提供可扫描的轮换页面，筛选状态可通过 URL 复现。
- 复用 Manifest、活动攻略、站点主题和 Ant Design Vue 选择器约束。

**Non-Goals:**

- 不在浏览器直接调用 Bungie API，不暴露 API Key。
- 不实现 Bungie OAuth、账号专属里程碑、角色进度、拥有物品或奖励领取状态。
- 不从静态 Manifest 推断实时掉落概率、精确遭遇战掉落或未由 API 返回的修饰词。
- 不承诺第三方网页抓取或永久历史周数据；历史归档另立变更。

## Decisions

### 1. 使用 CI 生成同源 JSON 快照

新增 `scripts/sync-weekly-rotation.js`，调用 `Destiny2/Milestones/` 并写入临时文件，校验成功后原子替换 `web/public/data/weekly-rotation.json`。Pages 工作流在构建前运行同步，`workflow_dispatch` 可手动重跑；每日调度作为周重置后补偿。选择快照而非运行时代理，是因为站点为静态 Pages，且可避免把 Secret 交给浏览器。

### 2. 保留原始实体并用本地映射增强

快照每条活动保存 milestone、活动 Hash、原始名称和时间窗口；随后以 `manifest-activities.json` 和 `activitiesV2` 补齐中文名、图标、攻略链接和分类。映射失败时保留原始记录并归入“其他”，不根据名称猜测掉落或难度。

### 3. 显式数据状态和失败保护

顶层 `status` 使用 `fresh`、`partial`、`stale`、`unavailable`。同步脚本只有在响应结构、周期边界和活动数组通过校验后才覆盖快照；失败时保留旧文件并让 CI 继续使用旧快照，同时生成失败状态供页面展示。页面不把网络失败渲染为空列表。

### 4. 前端按页面状态消费静态快照

新增 `useWeeklyRotation` composable 负责加载、校验 schema、计算剩余时间和筛选数据；`WeeklyRotationView` 负责布局和交互。类别、难度和状态使用 `a-select`，筛选状态同步到 query string；活动详情展开后提供现有攻略和 Manifest 入口。倒计时只依赖快照 `endDate`，不依赖服务器时钟。

### 5. 以信息密度优先的页面层级

页面首屏显示周起止、更新时间、状态和重点轮换；下方按 PvE、PvP、商人 / 事件分组。卡片优先显示“现在能玩什么、何时结束、为什么值得玩”，修饰词和来源放在展开区。移动端改为单列，筛选区域可换行，长名称可换行，所有操作保留键盘焦点。

### 6. Secret 与权限

工作流读取 `secrets.BUNGIE_API_KEY`，通过环境变量传给 Node 脚本；日志只输出 HTTP 状态和统计，不输出请求头或响应中的敏感字段。缺少 Secret 时同步明确失败并保留旧快照；本地 fixture 模式不需要 Secret。

## Risks / Trade-offs

- [Bungie 字段或活动类型变更] → 严格校验保留未知字段和原始 Hash，未知记录进入其他分类并在数据状态中提示。
- [API 限流、超时或 Cloudflare 错误] → 使用超时、有限重试和旧快照回退；不发布空数据。
- [Manifest 与 Milestone 活动不同步] → 使用活动 Hash 作为主关联，名称回退到 API 原文，并展示 Manifest 补充时间。
- [周重置时间跨时区或夏令时] → 以 API `startDate` / `endDate` 为准，前端使用 ISO 时间解析，不硬编码星期。
- [静态快照过期] → 页面在超过 `endDate` 或超过新鲜度阈值时显示过期横幅，仍保留最近可用内容供核对。
- [内容覆盖不完整] → 顶层 `missingCategories` 和分类计数公开显示，不把缺失类别伪装成“没有轮换”。

## Migration Plan

1. 配置 `BUNGIE_API_KEY` Secret，先用 fixture 运行同步和校验。
2. 发布包含页面和空 / fixture 快照的构建，确认旧环境可正常回退。
3. 开启 Pages 的定时同步和手动同步，观察首个重置周期日志。
4. 若同步持续失败，暂停同步步骤并保留最后成功快照；页面无需回滚代码。

## Open Questions

- Bungie 当前 Milestones 响应对每一类活动的实际覆盖范围需要用真实 API 响应确认；未覆盖类别只能标记缺失。
- 是否长期保存历史周快照、是否接入第三方公开数据源，留到首版运行稳定后另立变更。
