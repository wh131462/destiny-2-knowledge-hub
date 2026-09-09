# Destiny 2 Knowledge Hub

一个面向《命运2》玩家的可溯源中文机制数据库、含棱镜体系的职业百科、合法构筑实验室、自定义构筑工作台与装备获取规划器。

## 项目结构

```text
destiny-2-knowledge-hub/
├── content/               # 单一数据源：实体、机制、构筑、来源
├── packages/
│   ├── schema/            # 内容结构校验
│   ├── rules-engine/      # 合法性、属性、评分与获取计算
│   ├── recommendation-engine/
│   └── acquisition-engine/
├── docs/
│   └── knowledge-base/    # 知识文档与自动生成构筑手册
├── scripts/               # Manifest 同步、校验、文档生成
├── tests/                 # 规则引擎测试
├── web/                  # Vue 3 + Vite 前端应用
│   ├── public/
│   └── src/
│       ├── components/   # 通用组件
│       ├── data/         # 统一数据源的前端导出入口
│       ├── router/       # 页面路由
│       ├── styles/       # 全局样式
│       └── views/        # 页面组件（含推荐实验室与自定义工作台）
├── .tron/                # 本地智能助手配置
└── package.json          # 项目级快捷命令
```

## 本地开发

```bash
cd web
npm install
cd ..
npm run dev
```

## 校验与构建

```bash
npm run docs:generate
npm run check
```

构建产物输出到 `web/dist/`。

网站中的 `/build-workbench` 支持导入或编辑完整构筑 JSON，实时显示校验错误路径，并在合法后计算属性、已登记机制倍率和核心装备获取顺序；草稿可保存到浏览器本地或导出为 JSON。

社区构筑使用当前仓库的 GitHub Issue 投稿、修改、下架和恢复，由管理标签控制屏蔽，现有 Pages CI 自动生成静态列表并随网站发布。部署配置与权限说明见 [社区构筑部署](docs/community-builds-deployment.md)；未配置社区数据源时，本地编辑与导出仍可使用。


常用命令：

```bash
npm run validate       # 内容引用、构筑合法性、目标属性
npm run audit:builds   # 检查构筑武器词条是否存在于当前 Manifest/配方候选
npm run audit:skills   # 逐 Hash 检查子职业插槽、界面技能池、中文说明及配图
npm run audit:catalog  # 逐类型对账数量、Hash、插槽关系、版本与发布副本
npm test               # 规则引擎测试
npm run coverage       # 显示当前覆盖和已知缺口
npm run manifest:sync  # 同步 Bungie Manifest 组件快照（需要网络）
npm run manifest:sync:knowledge  # 同步知识库标准化所需的完整组件集合
npm run manifest:sync -- --input=/tmp/d2-manifest.json  # 用本地响应回放同步
npm run manifest:sync -- --all-components  # 按当前 Manifest 下载全部 JSON 组件（体积较大）
npm run manifest:normalize  # 生成轻量全装备与武器/护甲索引
npm run manifest:normalize-components  # 生成装备分类、护甲模组、PlugSet 与掉落覆盖报告
npm run manifest:link       # 将站内技能、星相、子职业和装备映射到 Manifest Hash
```

## 内容维护

- `data/catalog/` 保存标准化官方定义；`content/` 保存编辑推荐、机制解读和获取指引，不能将编辑条目数当成官方覆盖率。
- 网站从 `web/src/data/v2.js` 引用统一数据。
- `docs/knowledge-base/15-已验证构筑手册.md` 由脚本自动生成，不应直接编辑；01–13 章是待逐步核验的历史编辑稿。
- 构筑必须通过 `npm run validate` 和测试才能发布。
- 技能选择池由 `manifest-subclasses.json` 生成：从可装备子职业追踪初始插槽、内联插头和 PlugSet，而不是从推荐构筑或名称搜索推测。普通与棱镜变体保存各自的 Hash。
- `npm run manifest:sync:knowledge` 会同步中英文关联组件、重新生成技能目录并检查覆盖率。组件版本不一致或出现未分类新技能会报错，不会静默生成不完整数据。
- 当前技能覆盖包括超能、职业技能、跳跃、近战、手雷、星相、碎片，以及只读的固定超越能力；不根据账号是否解锁过滤。旧分享代码仍可使用，新代码会保留跳跃选项。
- 神器从官方物品与 PlugSet 提取复刻版本，按实际插槽配置；旧 `DestinyArtifactDefinition` 节点树及历史物品只读留档，不通过共享的 preview Hash 拼接旧节点。分享代码保留 `artifactAssignments` 与原始节点 Hash。
- 完整插槽词条目录收录所有公开 plug 类别，增强模组目录只是其中的明确子集；无名称 Sandbox 效果也保留，条件效果不因缺少名称而丢失。
- `audit:catalog` 将原始集合与生成目录逐 Hash 对账，检查候选截断、关联与发布副本，并生成 `manifest-coverage.json`。原始大组件未纳入 Git；干净检出时验证已审计输出的 SHA-256 指纹，修改数据后须完整同步再对账，不能伪称重新核对过原始数据。
- `/manifest` 可浏览全部已接入类型；`/data-status` 展示范围、应收录数量和缺失的原始图标 / 中文字段。加载失败会明确报错，不显示为“没有数据”。

## 当前边界

技能数据已按 2026-09-08 可取得的 Bungie Manifest 更新，覆盖 18 个普通/棱镜子职业的完整可选池：30 个超能、9 个职业技能、10 个移动技能、26 个近战、30 个普通手雷、60 个星相、78 个元素碎片、21 个棱镜特性和 4 个固定超越能力，共 268 个逻辑条目、411 个分支定义。配装工具与职业百科使用同一目录；数据状态页公开各分支数量。Manifest 同步仍是本地快照，不代表账号解锁或补丁后永久有效。装备、模组、供应商与活动奖励已接入官方定义；RewardMapping 尚不足以推导精确遭遇战掉落条件，逐补丁数值、精确 DPS 和未登记机制仍有覆盖边界。
