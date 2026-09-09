## ADDED Requirements

### Requirement: Versioned submission preserves loadout data

系统 SHALL 生成具有 `d2hub-community-build-v1` 格式标识的投稿 JSON，包含玩法说明、活动 ID、标签和完整 v3 手动配装；不得丢弃词条组合、装备 Hash、模组插槽、神器分配或备注。系统 SHALL 只解析唯一的约定 JSON 块，并在任何补齐、迁移或截断前验证原始字段类型和长度。

#### Scenario: Round trip through an Issue
- **WHEN** 用户发布一份包含多个词条组合和中文备注的配装，随后从社区详情导入
- **THEN** 所有配装字段与已确认的投稿一致

#### Scenario: Ambiguous or oversized data
- **WHEN** 正文包含多个约定数据块、未知格式、错误字段类型或超过 48 KiB UTF-8 的完整正文
- **THEN** 投稿被拒绝并显示可定位的诊断，不静默截断数据

### Requirement: GitHub confirms submission and editing

系统 SHALL 提供投稿内容预览、复制和前往 GitHub 的入口；完整正文不进入跳转 URL。创建和编辑 SHALL 由用户在 GitHub 确认，站内不存储 GitHub 写入凭据、不请求玩家 Token、不把打开链接视作成功提交。

#### Scenario: New submission
- **WHEN** 用户在编辑器生成合法投稿
- **THEN** 用户可以复制正文并打开配置仓库的投稿模板，页面说明仍需在 GitHub 提交

#### Scenario: Clipboard unavailable
- **WHEN** 浏览器拒绝剪贴板写入
- **THEN** 页面保留可手动选取复制的完整文本

#### Scenario: Edit original submission
- **WHEN** 用户从社区详情选择修改原投稿并生成更新内容
- **THEN** 页面链接到原 Issue，保留来源编号与已加载版本，不创建替代 Issue 或声称已获得编辑权限

#### Scenario: Source changed during editing
- **WHEN** 页面刷新来源后发现原 Issue 版本比导入时更新
- **THEN** 提示用户重新核对原稿，不自动合并或覆盖

### Requirement: Trusted authorship comes from GitHub

系统 SHALL 以配置仓库和 Issue number 作为稳定标识，并从 GitHub Issue 的 `user` 读取作者账号 ID、login 和头像；不得采用正文中自报的身份或事件 sender 作为作者。

#### Scenario: Forged author field
- **WHEN** 投稿正文声明另一个作者或管理员编辑了某用户的 Issue
- **THEN** 公开记录仍显示 Issue 原始作者，正文身份声明不产生管理权限

### Requirement: Shared validation governs publication

系统 SHALL 使用浏览器和 Actions 共用的配装校验规则，并独立检查投稿结构、有限长度、名称、玩法说明、有效职业/子职业及至少一项装备或天赋配置。当前目录能够确定的非法选择 SHALL 阻止上架；跨 Manifest 版本差异 SHALL 明确提示。通过检查 SHALL 不等同于实机验证。

#### Scenario: Invalid equipment configuration
- **WHEN** 投稿包含职业不匹配、防具插槽不兼容或多件同时装备的异域武器等确定错误
- **THEN** 系统给出诊断且不将该投稿加入公开快照

#### Scenario: Older but still valid loadout
- **WHEN** 配装标记较旧 Manifest 版本但在当前规则中校验通过
- **THEN** 配装可上架并显示版本差异提醒，标识为社区投稿

#### Scenario: Required validation catalog missing
- **WHEN** Actions 无法加载完整的必要目录
- **THEN** 本次快照生成失败，不把全部投稿错误地判为无效
