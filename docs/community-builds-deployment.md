# 当前仓库的社区构筑 CI 部署

构筑投稿使用现有公开仓库 `wh131462/destiny-2-knowledge-hub` 的 Issue。网站和构筑快照由现有 `Deploy Pages` 工作流一起发布，不创建新仓库、额外数据站点或跨仓库凭据。

## 上线步骤

1. 将本地实现和配套 `content/`、`packages/`、`web/public/data/` 文件推送到当前仓库默认分支（现有配置为 master）。未提交或未推送的代码不会进入 CI。
2. 确认当前仓库启用了 Issues 和 Actions，Settings → Pages → Source 选择 GitHub Actions，允许默认分支部署到 github-pages 环境。
3. 推送会自动运行 `Deploy Pages`；也可以在 Actions 中手动运行。CI 使用内置 GITHUB_TOKEN，不需要本机 `gh auth login` 或额外 PAT。
4. 初始化 job 自动创建缺失的 `build` 和 `moderation:blocked` 标签定义。已有标签不改名、不改色，也不修改任何 Issue 已有的标签。若组织策略禁止 job 请求 issues:write，可由管理员手动创建两个标签并按策略调整初始化 job。
5. CI 自动将前端投稿仓库设置为 github.repository，将数据地址设置为 `./data/community-builds.json`；无需手动设置仓库变量。成功部署后，数据位于现有站点的 `data/community-builds.json`。
6. 检查社区列表、投稿跳转目标和快照来源均为当前仓库。用已授权的真实投稿验证修改、关闭、重开，以及屏蔽后重开仍不可见。不要自动创建公开测试 Issue 或发布测试评论。

## 一次 CI 如何发布

工作流响应 master 推送、Issue 创建/编辑/关闭/重开/标签增减/删除/转移、手动运行和每日对账。默认分支上的 `.github/ISSUE_TEMPLATE/build.md` 提供构筑入口，普通 Bug Issue 仍可照常提交。

推送和手动运行先检查两个标签定义。Issue 或定时触发时跳过初始化；build/deploy 的显式条件保证仍继续同步发布。初始化 job 单独持有 issues:write，同步 job 只有 issues:read，不具备更改投稿屏蔽标签的权限。

每次检出默认分支当前代码，并使用同一次 checkout 的校验器与 Manifest 目录；快照记录 `git rev-parse HEAD` 的实际 SHA。脚本将完整快照生成到 runner 临时目录，站点构建后将 JSON 复制到 `web/dist/data/community-builds.json`，最后上传并部署同一个 Pages artifact。

所有触发共享一个串行并发组，不取消正在部署的运行；队列中的后续运行重新读取当前 Issue 状态。每次 Issue 更新会触发整站构建，普通 Issue 也可能触发刷新，以确保删除或移除 build 标签的事件不被漏掉。

## 数据与管理

- `build`：投稿模板自动附加，用于区分普通 Issue。
- `moderation:blocked`：由仓库管理者在具体 Issue 上添加/移除。作者编辑、关闭、重开都不能通过自动化解除屏蔽。
- 公开条件：build 标签 + open + 校验通过 + 无 moderation:blocked。
- 作者身份来自 GitHub Issue 的 user，稳定键为 owner/repo#number，正文身份声明不生效。
- Issue 正文使用唯一 JSON 数据块，信封为 `d2hub-community-build-v1`，内含完整 v3 配装，正文上限 48 KiB UTF-8；错误数据不静默截断。
- 配置检查不代表实机验证。当前目录不支持的配置给出诊断；自动化不评论或向玩家发送消息。
- 标签权限属于 Triage 或更高权限的协作者及授权应用。普通投稿者不应得到这些仓库权限；GitHub 没有将某个标签限定为某个用户名独占的 ACL。
- 关闭或屏蔽只控制本站展示，不使公开 Issue 私密；网站不提供真删除按钮。

## 故障恢复与缓存

全量读取分页并排除 PR，不按事件载荷累加历史状态。每次重新生成完整快照，关闭/屏蔽投稿只保留编号及不可用状态；非法投稿只有必要诊断，不含配装和正文。永久删除/转移的记录不再保留。

GitHub API 分页失败、限流、校验目录缺失或版本不一致会阻止本次部署，保留上一次成功站点；不会发布空列表或残缺分页。单条投稿无效只影响该投稿。快照不提交到 Git 历史，生成脚本也不会覆盖未经标识的任意目录。

CI 与 CDN 需要时间，页面显示数据更新时间并提供刷新。失败期间旧站点可能仍展示后来已下架内容，需要维护者修复后重新运行工作流。已打开页面、CDN 缓存和外部下载副本无法保证即时撤回，不承诺永久擦除。

每日对账不保证精确时间；公开仓库长期无活动（GitHub 当前规则为 60 天）可能暂停定时工作流，维护者需重新启用。故障时检查 Actions 日志、权限、Pages 环境配置及 checkout 中是否包含配套目录，然后手动重跑。

回退可恢复上一版网站及工作流；原 Issue 数据不受影响，修复后重新全量同步。不要将 Token 放入 VITE 环境变量或交给玩家。

## 本地验证

运行 `node --test tests/community-builds.test.js`、`npm run validate` 和 `npm run build`。

使用本地 Issue 数组生成快照：

```sh
node scripts/sync-community-builds.js --repository wh131462/destiny-2-knowledge-hub --fixture /path/to/issues.json --out dist/community
```

随后将生成的 JSON 复制到本地 `web/public/data/community-builds.json`，按 `web/.env.example` 在 `web/.env.local` 设置两个变量。测试结束删除本地生成文件；它已加入 gitignore，不能作为真实社区数据提交。

不传 fixture 时脚本读取 GitHub API，使用 GH_TOKEN/GITHUB_TOKEN 环境变量或公开匿名请求，不把令牌写到命令参数。生产 CI 不依赖这些本地设置，而是自动配置当前仓库与同源快照地址。
