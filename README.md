# Destiny 2 Knowledge Hub

一个面向《命运2》玩家的可溯源中文机制数据库、棱镜百科、合法构筑实验室、自定义构筑工作台与装备获取规划器。

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

常用命令：

```bash
npm run validate       # 内容引用、构筑合法性、目标属性
npm run audit:builds   # 检查构筑武器词条是否存在于当前 Manifest/配方候选
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

- `content/` 是实体、机制、构筑、来源和获取路径的单一数据源。
- 网站从 `web/src/data/v2.js` 引用统一数据。
- `docs/knowledge-base/15-已验证构筑手册.md` 由脚本自动生成，不应直接编辑；01–13 章是待逐步核验的历史编辑稿。
- 构筑必须通过 `npm run validate` 和测试才能发布。

## 当前边界

当前实现聚焦可核验的《终焉之形》棱镜基线，已经覆盖三职业棱镜技能池、21 个棱镜特性、关键机制、异域职业物品结构与 24 套完整基准构筑。Manifest 已支持组件级官方快照、官方技能定义、装备类型/槽位/职业标准化、武器 Socket/配方词条池、513 条可识别装备模组、5,422 个 PlugSet、56 个官方装备套装、供应商库存和活动奖励关系。`acquisition-sources.json` 将官方候选、编辑获取步骤和证据边界统一为可查询对象；`curated-mod-links.json` 提供站内模组的 Hash、能量和一致性核对；机制计算会输出已登记的组合链和组合倍率。官方目录可检索完整技能和活动索引。RewardMapping 快照当前没有有效关联，因此网站不会伪造遭遇战掉落条件。逐补丁数值和 DPS 模拟仍需持续同步，网站的“数据状态”页面会公开这些边界。
