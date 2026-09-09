## ADDED Requirements

### Requirement: Public browsing uses the configured static snapshot

系统 SHALL 通过配置的静态 JSON 加载社区构筑，提供加载、就绪、失败和未配置状态，以及失败重试。访客 SHALL 不必登录或提供 Token；列表 SHALL 不直接调用 GitHub Issue 分页接口。

#### Scenario: Successful load and filtering
- **WHEN** 快照加载成功且用户按关键词、职业或活动筛选
- **THEN** 页面只显示当前公开快照中的匹配记录，并显示数据生成时间

#### Scenario: Snapshot request fails
- **WHEN** 静态数据请求失败或返回未知格式
- **THEN** 显示加载失败及重试入口，不把失败显示为零投稿；已有数据必须标明来自先前快照

#### Scenario: Community not configured
- **WHEN** 尚未配置真实投稿仓库或快照地址
- **THEN** 页面说明社区尚未启用，保留本地构筑编辑与导出，不生成示例投稿冒充真实内容

### Requirement: Community detail preserves its own data model

系统 SHALL 提供 `/builds/community/:issueNumber` 社区详情，直接展示手动配装、来源作者、玩法说明和原 Issue 链接；不得依赖编辑推荐特有字段或生成虚假的实机核验日期、机制倍率与获取结论。已有编辑推荐详情 SHALL 保持兼容。

#### Scenario: Complete community build
- **WHEN** 用户打开包含多个武器词条组合、模组分配与备注的公开投稿
- **THEN** 详情按 Manifest Hash 解析装备并展示完整配置，保留无法解析项的可辨识信息与警告

#### Scenario: No editorial verification
- **WHEN** 投稿通过自动校验但没有实机验证记录
- **THEN** 页面标记社区投稿及校验版本，不称为已验证构筑

### Requirement: Unavailable builds cannot be recovered through the public UI

系统 SHALL 在当前快照确认投稿缺失或不可用后停止展示其内容；不得通过原 Issue API 回填被隐藏正文，也不得持久缓存隐藏正文。首次打开详情 SHALL 先完成数据加载再判断不存在。

#### Scenario: Direct link to blocked build
- **WHEN** 用户直接访问已屏蔽构筑的详情链接
- **THEN** 页面显示不可用提示及返回列表入口，不显示旧配装

#### Scenario: Refresh after withdrawal
- **WHEN** 已打开详情刷新到成功移除了该投稿的新快照
- **THEN** 页面清除旧内容并显示不可用状态

### Requirement: Editing and management use explicit GitHub handoff

详情 SHALL 提供创建本地副本、修改原投稿和前往 GitHub 下架/恢复入口，解释 GitHub 将检查操作权限。系统 SHALL 保留导入数据，不因缺少站内身份而冒认访问者为作者；下架与屏蔽 SHALL 不宣称原 Issue 私密或已永久删除。

#### Scenario: Create independent copy
- **WHEN** 访问者选择以此创建副本
- **THEN** 编辑器完整加载配装，新投稿模式不默认替换原作者 Issue

#### Scenario: Manage original Issue
- **WHEN** 访问者选择下架或恢复
- **THEN** 打开可信来源的原 Issue，并说明作者可关闭/重开，屏蔽需由管理者解除

#### Scenario: Await synchronization
- **WHEN** 用户完成 GitHub 操作返回网站
- **THEN** 页面提供刷新和快照时间，说明网站将在同步成功后更新，不伪造即时成功状态
