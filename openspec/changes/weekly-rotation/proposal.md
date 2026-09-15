## Why

当前活动页展示的是 Bungie Manifest 的静态活动定义，无法回答玩家“本周该刷什么”。Bungie 的 Milestones 接口可以提供当前周期，但 API Key 不应进入浏览器，因此需要将官方轮换同步到可审计的静态快照，再用清晰的状态提示呈现在站内。

## What Changes

- 新增受 GitHub Actions 驱动的 Bungie Milestones 周轮换同步流程。
- 生成带 schema、周期、来源、状态和活动分类的 `weekly-rotation.json` 快照。
- 同步失败时保留上一次成功快照，并在站内明确显示过期、部分数据或不可用状态。
- 新增“本周轮换”页面，展示 PvE、PvP、突袭、地牢、异域任务、限时活动和公开商人等可识别轮换。
- 增加分类、难度和数据状态筛选，支持 URL 状态、详情展开、攻略跳转和摘要复制。
- 在中英文导航、文案、移动端布局和数据状态说明中加入轮换信息。

## Capabilities

### New Capabilities

- `weekly-rotation-sync`: 从 Bungie Milestones 获取、校验、分类并发布当前轮换快照。
- `weekly-rotation-browsing`: 在站内浏览、筛选和分享当前周轮换，并透明展示数据新鲜度与缺口。

### Modified Capabilities

无。

## Impact

- 新增 `scripts/sync-weekly-rotation.js`、轮换数据包和前端 composable / view。
- 修改 Pages 工作流、站点导航、路由、双语资源和数据状态页面。
- GitHub Actions 需要配置 `BUNGIE_API_KEY` Secret；浏览器不直接调用 Bungie API。
- 依赖现有 Manifest 快照补齐活动名称、图标和攻略关联；无法映射的活动仍保留原始 Hash 和官方名称。
