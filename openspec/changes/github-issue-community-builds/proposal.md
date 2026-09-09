## Why

当前构筑编辑器支持本地导入、导出，但公开构筑列表尚未接入社区投稿。采用 GitHub Issue 保存公开构筑、GitHub Actions 校验与同步、GitHub Pages 提供静态数据，可以完成上传、列表、修改、下架与恢复，同时无需自建服务器或让玩家配置 Token。

## What Changes

- 在当前项目仓库增加构筑投稿模板与 CI 同步；玩家在本站编辑，在 GitHub 确认创建或修改 Issue。
- 使用 `build` 识别投稿；作者关闭/重开 Issue 控制自行下架/恢复；仓库管理者通过 `moderation:blocked` 屏蔽/解除屏蔽。
- 展示条件固定为：包含 `build`、Issue 开启、构筑校验通过、无 `moderation:blocked`。作者编辑、关闭、重开均不得清除屏蔽标签。
- Actions 根据 Issue 当前状态生成完整静态构筑快照，覆盖创建、编辑、标签变更、关闭、恢复、删除与转移，并提供手动及定时对账。
- 公开列表和社区详情读取静态快照；支持作者信息、职业与关键词筛选、导入编辑器、前往原 Issue 管理。
- 沿用当前手动配装数据格式及 Manifest Hash；明确“社区投稿、通过结构与快照校验”不等于实机验证。
- 第一版不提供站内 OAuth、私人云端草稿、站内管理员后台、用户 Token 输入或永久删除按钮。关闭或屏蔽不会使原 Issue 私密。

## Capabilities

### New Capabilities

- `community-build-submission`: 构筑投稿格式、复制与跳转、原 Issue 修改、身份与数据校验。
- `community-build-publication`: Issue 状态与标签权限、静态快照生成、同步失败和移除处理。
- `community-build-browsing`: 社区列表、详情、筛选、编辑器导入与同步状态提示。

### Modified Capabilities

无。仓库目前没有已归档的 OpenSpec 能力规范。

## Impact

- 前端：`ManualLoadoutView.vue`、`usePublicBuilds.js`、`BuildLabView.vue`、路由、社区详情及相关空态/验证文案。
- 共享代码：复用 `packages/loadout-planner` 的数据迁移与校验工具，将编辑器的配装合法性检查提取为可供 Actions 调用的纯函数；新增社区投稿与快照适配模块。
- 自动化：增加同步脚本、当前仓库的 Issue 模板、Pages CI 工作流和配置文档；当前仓库的 Issue 与网站由同一 Pages 工作流处理，快照随网站一起发布。
- 数据：社区构筑保持手动配装结构，不冒充现有编辑推荐结构或生成虚假的验证结论。
- 验证：状态转换、管理员屏蔽不可被作者操作绕过、分页与失败处理、导入导出一致性及页面交互。
