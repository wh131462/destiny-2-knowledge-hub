## ADDED Requirements

### Requirement: Publication uses all four conditions

公开快照 SHALL 仅包含同时满足 `build` 标签、Issue 开启、构筑校验通过且没有 `moderation:blocked` 的投稿。任何正文声明、重开或校验通过 SHALL 不得覆盖屏蔽标签。

#### Scenario: Valid new Issue
- **WHEN** 开启的 Issue 包含 build 标签、配装合法且没有屏蔽标签
- **THEN** 下一次成功快照包含该构筑

#### Scenario: Author withdraws and restores
- **WHEN** 作者关闭合法投稿，随后重开且未被屏蔽
- **THEN** 关闭后的成功快照隐藏该构筑，重开后的成功快照恢复原编号记录

#### Scenario: Reopening a blocked Issue
- **WHEN** 被屏蔽的作者编辑、关闭并重开原 Issue
- **THEN** 屏蔽标签保持不变，公开快照持续排除其内容

#### Scenario: Unblock a closed Issue
- **WHEN** 管理者移除一个仍然关闭的 Issue 的屏蔽标签
- **THEN** 该构筑仍不公开，直到开启并满足其余条件

#### Scenario: Remove build label or invalidate content
- **WHEN** 原公开投稿失去 build 标签或正文被编辑为非法配置
- **THEN** 下一次成功快照移除旧公开内容，不保留旧版替代当前稿

### Requirement: Moderation respects GitHub permissions

部署 SHALL 将标签管理交给仓库所有者及明确授权者；文档 SHALL 说明 Triage 或更高权限也能操作标签。模板 SHALL 仅预置 build 标签；同步 job SHALL 不执行 Issue 管理标签写入；独立初始化 job SHALL 仅在推送或手动触发时创建缺失的标签定义，不更新已有定义或任何 Issue 标签，不根据正文命令改变标签，不覆盖整个标签集合。

#### Scenario: Ordinary contributor
- **WHEN** 普通投稿者提交正文中的管理员声明或屏蔽解除指令
- **THEN** 这些文本不改变标签或发布权限

#### Scenario: Owner blocks a submission
- **WHEN** 仓库管理者在 GitHub 添加 moderation:blocked
- **THEN** 下一次成功快照移除该构筑，自动化不删除该标签

### Requirement: Snapshot rebuild follows current repository state

同步 SHALL 处理创建、正文编辑、关闭、重开、标签增减、永久删除和转移事件，并提供手动与每日对账。每次同步 SHALL 分页读取配置仓库的当前 Issue，排除 Pull Request，重新生成完整快照；发布 SHALL 串行执行，避免较旧运行覆盖较新结果。

#### Scenario: More than one API page
- **WHEN** 投稿跨越多个 API 分页并与 Pull Request 混合返回
- **THEN** 所有真实 Issue 按规则处理，Pull Request 不成为构筑

#### Scenario: Events arrive out of order
- **WHEN** 编辑与屏蔽事件先后到达但载荷描述的历史状态不同
- **THEN** 同步读取当前状态，已屏蔽投稿不因历史载荷重新上架

#### Scenario: Deleted or transferred Issue
- **WHEN** Issue 已被永久删除或转移出投稿仓库
- **THEN** 下一次成功快照移除其内容和状态条目，构建目录不残留旧详情文件

#### Scenario: Missed event
- **WHEN** 一次事件未触发成功发布，之后执行手动或定时同步
- **THEN** 同步以当前仓库状态修复公开快照

### Requirement: Publish one complete validated artifact

系统 SHALL 发布单一版本化静态 JSON，包含来源、生成时间、校验器版本、Manifest 版本、公开构筑及必要的有限诊断。关闭、屏蔽或无效条目的正文、配装和展示摘要 SHALL 不进入快照。快照 SHALL 不提交进 Git 历史；同步失败 SHALL 不发布空列表或局部结果。

#### Scenario: Partial API failure
- **WHEN** 任一分页因限流或网络问题失败
- **THEN** 本次运行失败并保留上次成功部署，不将未读取记录解释为删除

#### Scenario: One invalid submission
- **WHEN** 一份投稿非法而其余数据和依赖完整
- **THEN** 其余符合条件的构筑正常发布，该条目只保留有限校验诊断

#### Scenario: Hidden payload exclusion
- **WHEN** 投稿被关闭或屏蔽
- **THEN** 成功发布的新快照不含该投稿的标题、配装、作者快照或正文，仅允许编号与不可用状态

### Requirement: Issue content is data only

工作流 SHALL 从当前仓库默认分支的同一次可信 checkout 加载程序和目录，并记录实际 commit SHA；投稿正文 SHALL 只经限长解析，不进入可执行 shell、代码来源、HTML 或远端资源下载指令。工作流 SHALL 不自动评论或向投稿者发送消息。

#### Scenario: Executable-looking text
- **WHEN** 备注包含 shell 命令、HTML 或伪造代码仓库 URL
- **THEN** 它们只被视为文本数据，不被执行、渲染为原始 HTML或作为下载地址使用
