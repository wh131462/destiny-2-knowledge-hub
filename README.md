# Destiny 2 Knowledge Hub

面向《命运2》玩家的中文知识库与配装工具，提供职业与棱镜技能百科、武器和防具目录、活动攻略、手动配装及社区构筑分享。官方定义来自 Bungie Manifest，机制解读、获取指引和来源记录由仓库维护。

前端使用 Vue 3、Vite 6 和 Ant Design Vue 4，可构建为静态站点。日常浏览与本地配装无需登录 Bungie 账号；社区投稿通过 GitHub Issue 完成。

## 功能与入口

网站使用 Hash 路由。例如，本地配装台地址为 `http://localhost:9999/#/manual-loadout`。

| 入口 | 功能 |
| --- | --- |
| `/classes`、`/classes/:classId` | 三职业百科，查看普通与棱镜子职业的技能、星相、碎片和固定超越能力 |
| `/weapons`、`/weapon-tier-list` | 武器目录、版本与词条详情，以及编辑维护的武器评级 |
| `/armor` | 防具与 Armor 3.0 系统说明、套装效果、异域护甲搭配，并可将套装配置带入配装台 |
| `/activities` | 活动、突袭、地牢及相关玩法攻略与来源 |
| `/lore`、`/glossary` | 世界观资料与术语查询 |
| `/encyclopedia/:kind/:id` | 技能、装备等实体的详情与关联知识 |
| `/manual-loadout` | 可视化配装台：技能、武器 Perk 组合、护甲、模组、神器和属性建议；支持草稿、分享代码与一图流导出 |
| `/builds` | 公开构筑列表，可按关键词、职业和玩法筛选；社区详情位于 `/builds/community/:issueNumber` |
| `/build-workbench` | 高级构筑 JSON 工作台，展示结构与规则校验、属性和已登记机制计算、获取与解锁清单 |
| `/manifest`、`/data-status` | 已接入的官方定义目录、快照版本、覆盖范围与缺失字段报告 |

`/build-lab`、`/smart-loadout` 和 `/tools` 已重定向到 `/builds`。当前 `content/builds/` 的编辑构筑列表为空，网站公开方案来自已配置的社区快照；测试用构筑不作为公开推荐展示。

### 创建与分享构筑

1. 在 `/manual-loadout` 选择职业、技能和装备，填写武器 Perk 组合、用途备注及属性建议，并检查配置提示。
2. 使用“保存草稿”保存在当前浏览器，或导出配装代码备份。导入保留词条组合、备注、属性区间和神器配置，并兼容旧版代码；跨版本数据需重新核对。
3. 使用“导出一图流”生成 PNG 长图，也可保存内嵌配图的独立 HTML。
4. 使用“发布构筑”生成投稿内容，前往 GitHub 创建 Issue。修改已有投稿时，在配装台生成更新内容后编辑原 Issue；关闭 Issue 可下架，重开后会重新检查。

`/build-workbench` 用于编辑符合仓库内容 schema 的完整构筑 JSON，可显示错误路径、保存多个本地版本和导出 JSON。它与配装台的 v3 分享格式不同；社区投稿使用配装台生成的完整 v3 配装。

## 本地开发

建议使用 **Node.js 22**（与 CI 一致）及 npm。在仓库根目录执行：

```bash
npm ci --prefix web
npm run dev
```

打开 [本地开发站点](http://localhost:9999/)。开发端口固定为 `9999`，被占用时 Vite 会直接报错；停止占用进程，或用 `npm --prefix web run dev -- --port 10000` 指定其他端口。

仓库包含运行所需的标准化数据和前端静态副本，首次启动无需下载完整 Manifest。普通浏览和配装也无需创建环境配置文件；社区列表的本地配置见下文。

构建及预览：

```bash
npm run build
npm run preview
```

构建产物位于 `web/dist/`，预览地址以终端输出为准。

开发约定见 [AGENTS.md](AGENTS.md)。所有下拉选择器统一使用 Ant Design Vue 的 `a-select`，通过 `v-model:value` 或 `:value` / `@change` 绑定，保持数值 Hash 与字符串选项的类型一致。主题沿用 `web/src/App.vue` 和 `web/src/styles/main.css`；前端变更至少运行构建，并检查选中值、筛选结果、窄屏及弹窗交互。

## 项目结构

```text
destiny-2-knowledge-hub/
├── content/                 # 编辑内容：实体、机制、构筑、获取路径与来源
├── data/
│   ├── manifest/            # 官方原始快照与同步元数据（大组件不纳入 Git）
│   └── catalog/             # 标准化目录、中文字段、关联与覆盖审计证据
├── packages/
│   ├── schema/              # 内容结构校验
│   ├── rules-engine/        # 构筑合法性、属性、机制与获取计算
│   ├── loadout-planner/     # 配装草稿、分享编码、词条与槽位校验
│   ├── loadout-export/      # 配装导出模型与独立 HTML
│   ├── community-builds/    # Issue 投稿格式、校验、同步与快照客户端
│   ├── manifest-adapter/    # Manifest 数据适配
│   ├── manifest-catalog/    # 装备目录、武器详情与防具模型
│   ├── subclass-catalog/    # 子职业技能池生成与覆盖检查
│   ├── knowledge-links/     # 百科实体与关联链接
│   ├── recommendation-engine/
│   └── acquisition-engine/
├── docs/                    # 部署说明与审计记录
├── scripts/                 # Manifest 同步、校验与审计
├── tests/                   # Node.js 测试：规则、目录、配装、导出与社区
├── web/
│   ├── public/data/         # 网站使用的静态目录与状态报告
│   ├── src/                 # Vue 页面、组件、数据入口、组合式函数与样式
│   └── .env.example         # 可选的本地社区配置示例
├── .github/                 # 校验、Pages 部署工作流与投稿模板
├── openspec/                # 变更提案、设计与任务
└── package.json             # 项目级快捷命令
```

## 校验与构建

在仓库根目录运行完整检查：

```bash
npm run check
```

该命令依次执行内容校验、构筑词条审计、技能覆盖审计、目录审计、全部测试和前端构建。目录审计在具备原始组件时会更新报告和审计证据。

| 命令 | 用途 |
| --- | --- |
| `npm run validate` | 检查内容引用、构筑合法性和目标属性 |
| `npm run audit:builds` | 检查编辑构筑的武器词条是否存在于 Manifest / 配方候选 |
| `npm run audit:skills` | 逐 Hash 检查子职业技能池、插槽、中文说明及配图 |
| `npm run audit:catalog` | 对账目录数量、Hash、关联、版本与前端发布副本；缺少原始大组件时验证已审计输出的指纹 |
| `npm test` | 运行 `tests/*.test.js` 中的全部测试 |
| `npm run coverage` | 输出官方目录覆盖报告与已知缺口，不是代码测试覆盖率 |
| `npm run build` | 构建前端到 `web/dist/` |

## 数据与内容维护

### 数据分层

- `data/catalog/` 保存标准化官方定义，`content/` 保存编辑条目、机制解读和获取指引。编辑条目数量不能代替官方目录覆盖率。
- `web/src/data/v2.js` 是编辑内容与规则引擎的前端导出入口；大型官方目录通过 `web/public/data/` 加载。生成目录及其发布副本应保持一致。
- Manifest 负责官方实体定义；`content/` 及 `web/src/data/` 中的机制解读、攻略、世界观摘要与术语仍是编辑内容，不应表述为官方结论。
- 修改内容或规则后运行 `npm run check`；发布前核对来源、适用版本与实机证据，缺少可靠数据时明确标记覆盖边界。

### 更新 Manifest

需要更新完整知识库数据时执行：

```bash
npm run manifest:sync:knowledge
npm run check
```

`manifest:sync:knowledge` 会同步所需英文组件与中文关联组件、提取中文字段、标准化目录、关联站内实体，然后执行技能和目录审计。该过程需要网络，会写入本地快照和生成数据；组件版本不一致或技能分类缺失会报错。

按需执行的分步命令：

| 命令 | 用途 |
| --- | --- |
| `npm run manifest:sync` | 默认同步职业、伤害类型、属性和活动类型四个基础组件 |
| `npm run manifest:sync:components` | 同步知识库所需的英文组件集合 |
| `npm run manifest:sync:zh` | 同步所需中文组件并提取中文字段 |
| `npm run manifest:normalize` | 生成物品与装备索引，并继续执行组件标准化 |
| `npm run manifest:normalize-components` | 生成子职业、技能、护甲、模组、神器、PlugSet、掉落及相关目录 |
| `npm run manifest:link` | 将编辑技能、星相、子职业、装备及模组关联到官方 Hash |

高级同步示例：

```bash
# 使用本地 Manifest API 响应作为索引；组件文件仍会从 Bungie 下载
npm run manifest:sync -- --input=/tmp/d2-manifest.json

# 下载当前 Manifest 的全部英文 JSON 组件，体积较大
npm run manifest:sync -- --all-components
```

原始大组件不纳入 Git。干净检出时，`audit:catalog` 校验已审计输出的 SHA-256 指纹，不代表重新核对了原始数据；修改目录数据后应完整同步并重新审计。

### 本周轮换同步

Pages 部署会在构建前通过 Bungie Milestones API 生成 `weekly-rotation.json`，浏览器只读取同源静态快照。线上部署使用名为 `BUNGIE_API_KEY` 的 GitHub Actions Secret。工作流每小时同步一次，每日 17:00 UTC 重置后的三小时内约每十分钟重试，并缓存上次有效快照供后续构建使用，避免接口失败时退回仓库中的旧版本。GitHub Actions 调度和 Pages 发布可能延迟；线上“刷新数据”读取最新发布内容，不能直接触发服务端同步。

本地同步支持从仓库根目录的 `.env.local` 或 `.env` 读取 Key（Node.js 22）：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写：

```dotenv
BUNGIE_API_KEY=你的_Bungie_API_Key
```

然后在仓库根目录启动本地站点：

```bash
npm run dev
```

启动时会先自动同步最新轮换，再启动 Vite。打开 `http://localhost:9999/#/weekly-rotation` 即可查看结果。在 `web/` 目录运行 `npm run dev` 也会自动同步。缺少 Key 时跳过同步；接口失败时保留已有快照并提示原因，两种情况均可继续启动站点。修改 Key 后重启开发服务即可生效。

读取优先级为系统环境变量 > `.env.local` > `.env`；高优先级显式配置为空时视为缺少 Key，不会回退。配置文件路径始终相对于仓库根目录。Key 仅由同步脚本读取，无需 `VITE_` 前缀，也无需写入 `web/.env.local`；不会注入前端或输出到同步日志。`.env` 和 `.env.local` 已被 Git 忽略，示例文件可以提交。运行期间，本地 Vite 服务收到数据请求时会检查快照是否超过五分钟或已跨重置边界，并在后台同步；点“刷新数据”会等待实际同步结果。并发请求合并，失败后至少间隔一分钟重试，已有数据在后台同步期间立即返回。也可执行 `npm run rotation:sync`，`build` 和 `preview` 不自动同步。

页面每五分钟无缓存检查更新，跨活动或周重置时立即检查，失败、过期或同步进行中改为每分钟检查；恢复联网时也会重试。浏览器保留经过校验的最后一份有效数据，重载、断网、空响应、格式错误和旧部署都不会清空已有列表。周范围按周二 17:00 UTC 计算，按浏览器本地时区显示；每项活动按自身周期判断是否结束。保留的旧活动标注“仅供参考”，时间缺失、尚未开始、即将重置和已经结束分别展示，不通过延长旧活动日期冒充本周数据。

本周轮换在顶部导航、首页主按钮和模块入口优先展示。列表先展示进行中的活动，24 小时内结束的活动分组优先；同组按是否提供奖励参考、挑战说明和活动攻略排序，同等条件保持稳定次序。未开始、周期未知、已结束或待更新的活动分开展示并依次后置。排序用于提高信息可查性，不表示掉落收益或本周保底排名。

没有 Key 时，可用示例响应进行离线调试：

```bash
npm run rotation:sync:fixture
npm run rotation:sync -- --fixture=data/fixtures/weekly-rotation-mapped.json --out=/tmp/weekly-rotation.json
```

接口超时、限流、缺少 Secret、响应校验失败或源站仍返回已结束的活动时，脚本保留已有有效快照和原始获取时间，页面根据周期与同步状态显示待更新提示。首次同步且没有任何可用快照时展示等待同步和活动攻略入口。Milestones 未返回的类别无法展示，静态 Manifest 也不能推导实时掉落概率或账号专属进度。

同步会同时读取中英文 `DestinyActivityModifierDefinition` 和 `DestinyMilestoneDefinition`，解析挑战、修饰词和里程碑名称；小型定义缓存保存在 `.cache/weekly-rotation/`，按官方组件路径更新。定义下载失败时使用本地缓存，未解析的条目显示说明暂缺，页面不展示原始编号。突袭、地牢、异域任务优先按官方活动类型分类，其次使用已关联攻略的类别。页面列出的是公共里程碑返回的活动，不将所有条目视为精选轮换，也不据此承诺无限刷取或掉落加成。

奖励展示会按活动 Hash 精确关联本地 `manifest-activity-rewards.json` 和同版本的物品目录，解析官方奖励类型与说明；标准和大师记录分别匹配。卡片直接展示全部挑战、修饰词标签和奖励装备；长说明通过悬停、键盘聚焦或手机点按提示查看，不设展开区域，也不展示来源和原始编号。具体装备举例来自已关联攻略，使用官方中文名和图标，保留任务奖励等获取提示。同名装备的多个版本链接到目录查询，不把催化或外观记录作为武器。静态奖励类型、攻略装备参考与实时接口返回的奖励分开展示，均不据此推断本周保底或可无限刷取。

### 技能、神器与插槽规则

- 技能池从可装备子职业的初始插槽、内联插头与 PlugSet 追踪生成，普通与棱镜变体保留各自 Hash，不根据玩家账号是否解锁过滤。
- 神器按官方物品与 PlugSet 的实际插槽配置；旧 `DestinyArtifactDefinition` 节点树和历史物品只读留档，不通过共享 preview Hash 拼接旧节点。分享代码保留 `artifactAssignments` 与原始节点 Hash。
- 完整插槽词条目录收录所有公开 plug 类别，增强模组目录是其中的子集；无名称 Sandbox 效果也保留，避免遗漏条件效果。

## 社区构筑与部署

社区构筑使用当前仓库的 GitHub Issue，网站读取 CI 生成的静态快照。公开条件为：具有 `build` 标签、Issue 处于 open 状态、通过配置校验，且没有 `moderation:blocked` 标签。配置校验通过不代表实机验证；作者编辑或重开 Issue 不会解除管理员屏蔽。

本地默认可跳转到当前仓库投稿，但未启用社区列表同步。若要测试列表，在 `web/.env.local` 中配置：

```dotenv
VITE_COMMUNITY_REPOSITORY=wh131462/destiny-2-knowledge-hub
VITE_COMMUNITY_SNAPSHOT_URL=./data/community-builds.json
```

还需按 [社区构筑部署与本地验证](docs/community-builds-deployment.md) 生成快照并放到 `web/public/data/community-builds.json`，然后重启开发服务。环境变量只是前端公开配置，不应填写 Token；本地测试快照已被 Git 忽略。

现有 GitHub Actions 工作流包括：

- **Validate**：在 push / pull request 时安装依赖并运行完整检查。
- **Deploy Pages**：在 `master` 推送、Issue 变更、手动触发及每日对账时同步社区快照、构建并发布站点。CI 自动配置投稿仓库与同源快照地址，使用内置 `GITHUB_TOKEN`。

GitHub Pages 需在仓库设置中选择 GitHub Actions 作为发布源。Vite 在 `GITHUB_ACTIONS` 环境使用 `/destiny-2-knowledge-hub/` 作为资源基路径；更换仓库名或部署路径时应同步调整 `web/vite.config.js`。权限、标签初始化、失败恢复和缓存说明见上述部署文档。

## 当前数据边界

仓库审计报告记录的 Manifest 同步日期为 **2026-09-08**，版本为 `244213.26.06.29.2000-1-bnet.65864`；这是本地快照，不代表实时游戏状态或账号解锁情况。具体版本、数量和缺失字段以 `/data-status` 及 `npm run coverage` 为准。

- 当前技能目录覆盖 18 个普通 / 棱镜子职业，包含超能、职业技能、跳跃、近战、手雷、星相、元素碎片、棱镜特性及只读固定超越能力；配装台与职业百科共用该目录。
- 官方目录包含历史装备版本，收录不等于当前可获取；缺少原始图标或中文字段的条目会计入状态报告。
- 装备、模组、供应商与活动奖励已接入官方定义，但 RewardMapping 尚不足以推导精确遭遇战掉落条件。
- 逐补丁数值、精确 DPS 与未登记机制仍有覆盖边界；规则计算和武器评级应结合来源、版本及实机情况判断。
