<script setup>
import { ui } from '@/i18n'
import { communityConfig } from '@/utils/communityConfig'
import StableDisclosure from '@/components/StableDisclosure.vue'
defineProps({ editing: Boolean, inSubmission: Boolean })
</script>

<template>
  <div class="guide-container">
  <nav v-if="communityConfig.repositoryUrl" class="repository-links" :aria-label="ui(&quot;投稿仓库链接&quot;)">
    <span>{{ ui("投稿仓库") }}</span>
    <a :href="communityConfig.repositoryUrl" target="_blank" rel="noopener noreferrer">{{ communityConfig.repository }} ↗</a>
    <a :href="communityConfig.issuesUrl" target="_blank" rel="noopener noreferrer">{{ ui("查看 GitHub Issues ↗") }}</a>
  </nav>
  <div class="publish-guide"><StableDisclosure :title="editing ? ui('如何更新这份投稿？') : ui('第一次发布？查看完整指引')" :width="920" trigger-class="publish-guide-trigger">
    <template #trigger>
      <span class="guide-mark" aria-hidden="true">?</span>
      <span class="guide-heading"><strong>{{ editing ? ui("如何更新这份投稿？") : ui("第一次发布？查看完整指引") }}</strong><small>{{ ui("准备构筑 → GitHub 提交 → 查看发布结果") }}</small></span>
    </template>
    <div class="guide-body">
      <p class="guide-intro">{{ ui("在本站完成配装，再用自己的 GitHub 账号确认提交。每份投稿对应当前项目仓库中的一条 Issue（投稿记录），不需要填写 Token。") }}</p>
      <ol class="guide-steps">
        <li><span class="step-number" aria-hidden="true">01</span><div><h3>{{ ui("准备一份可以分享的构筑") }}</h3><p>{{ ui("进入“创建构筑”，填写名称，选择职业、子职业，至少配置一项装备或天赋。按需要补充武器词条组合、模组、神器和备注；先处理页面指出的配置错误。发布前可以“保存草稿”或“导出代码”留一份备份。") }}</p></div></li>
        <li><span class="step-number" aria-hidden="true">02</span><div><h3>{{ editing ? ui("生成原投稿的更新内容") : ui("填写玩法说明，复制投稿内容") }}</h3><p>{{ ui("点击“") }}{{ editing ? ui("更新投稿") : ui("发布构筑") }}{{ ui("”，说明适用场景、核心循环和装备选择；活动与关键词可选。检查通过后，点击“1 复制投稿内容”。需要复制的是这个窗口生成的完整内容，包含说明和配装数据块；“导出代码”或一图流不能直接代替投稿内容。") }}</p><p class="step-tip">{{ ui("自动复制失败时，在“投稿内容”文本框中全选并手动复制。") }}</p></div></li>
        <li><span class="step-number" aria-hidden="true">03</span><div><h3>{{ editing ? ui("在 GitHub 编辑原 Issue") : ui("前往 GitHub，粘贴并提交") }}</h3><p v-if="editing">{{ ui("点击“2 前往原 Issue 修改”，使用原作者账号登录。先核对最新正文，再通过正文右上角的“…”菜单选择 Edit，将原正文替换为刚复制的完整内容，保存修改。继续使用原 Issue，不要为同一次更新新建投稿。") }}</p><p v-else>{{ ui("点击“2 前往 GitHub 投稿”，按提示登录或注册 GitHub。进入“构筑投稿”模板后，核对标题，将正文里的模板提示全部替换为刚复制的完整内容，再点击 Create（创建）或 Submit new issue（提交新 Issue）。") }}</p><p class="step-tip">{{ ui("只复制或打开 GitHub 页面都还没有发布。看到新 Issue 的编号和正文，或看到原文已保存更新，才说明 GitHub 已收到内容。") }}</p></div></li>
        <li><span class="step-number" aria-hidden="true">04</span><div><h3>{{ ui("回到构筑列表，查看发布结果") }}</h3><p>{{ ui("提交后保存原 Issue 链接。网站会自动检查并同步内容，完成后回到“构筑方案”，点击“刷新列表”，按构筑名称或 GitHub 用户名搜索。留意列表上方的数据更新时间；同步需要等待，不会立即出现。") }}</p></div></li>
      </ol>
      <div class="guide-after">
        <section><h3>{{ ui("发布后怎么管理？") }}</h3><dl>
          <div><dt>{{ ui("修改原稿") }}</dt><dd>{{ ui("从详情点击“修改原投稿”，编辑后生成新内容，在 GitHub 替换原 Issue 正文。只有作者或有权限的人能保存修改；提交前核对最新原文。") }}</dd></div>
          <div><dt>{{ ui("另存一份") }}</dt><dd>{{ ui("从详情点击“以此创建副本”，改好后发布为新 Issue，原投稿保留。") }}</dd></div>
          <div><dt>{{ ui("下架 / 恢复") }}</dt><dd>{{ ui("在原 Issue 点击 Close issue（关闭）可下架；Reopen issue（重新开启）可恢复。两者都要等待网站同步。") }}</dd></div>
          <div><dt>{{ ui("管理者屏蔽") }}</dt><dd>{{ ui("带有 moderation:blocked 标签的投稿不会展示，需管理者移除该标签；作者重新开启 Issue 不能解除屏蔽。") }}</dd></div>
        </dl></section>
        <section><h3>{{ ui("提交后没有出现在列表？") }}</h3><ul>
          <li>{{ ui("先确认 GitHub 中确实存在已提交的 Issue，而不是仍停留在填写页面。") }}</li>
          <li>{{ ui("确认它处于 Open（开启）状态，带有 build 标签，且没有被管理者屏蔽。投稿模板会预设 build；缺失时请联系维护者处理。") }}</li>
          <li>{{ ui("如果更新尚未同步，稍后再刷新；如果投稿内容有错误，在本站重新导入、修复后替换原文。") }}</li>
          <li>{{ ui("持续无法显示时，将原 Issue 链接提供给站点维护者，方便核对同步结果，无需重复投稿。") }}</li>
        </ul></section>
      </div>
      <footer><p>{{ ui("投稿和 GitHub 原文都是公开内容。关闭或屏蔽只控制本站展示，不会使原文私密。通过配置检查也不代表经过实机验证。") }}</p><router-link v-if="!inSubmission" to="/manual-loadout" class="guide-link">{{ ui("前往创建构筑 →") }}</router-link></footer>
    </div>
  </StableDisclosure></div>
  </div>
</template>

<style scoped>
.guide-container{min-width:0}.repository-links{display:flex;align-items:baseline;flex-wrap:wrap;gap:.5rem 1rem;margin-top:1rem;font-size:.75rem}.repository-links>span{color:var(--text-dim)}.repository-links a{color:var(--gold);overflow-wrap:anywhere;min-width:0}.repository-links a:hover{text-decoration:underline}.repository-links a:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.publish-guide{margin:1rem 0;color:var(--text-sub)}.publish-guide :deep(.publish-guide-trigger){padding:1rem 1.15rem;border-left:2px solid var(--gold-dim);background:var(--bg-dark)}.guide-mark{display:grid;place-items:center;width:1.6rem;height:1.6rem;flex-shrink:0;border:1px solid var(--gold-dim);border-radius:50%;color:var(--gold);font:.85rem var(--font-en)}.guide-heading{display:grid;gap:.3rem;min-width:0;flex:1}.guide-heading strong{font-size:.85rem;font-weight:600}.guide-heading small{color:var(--text-dim);font-size:.7rem}.guide-body{padding:.25rem}.guide-intro{font-size:.82rem;line-height:1.8;max-width:65rem}.guide-steps{list-style:none;margin:1.2rem 0;padding:0}.guide-steps>li{display:grid;grid-template-columns:2.4rem minmax(0,1fr);gap:.8rem;padding:1rem 0;border-top:1px solid var(--line-soft)}.step-number{font:.8rem var(--font-en);color:var(--gold-dim);padding-top:.1rem}.guide-body h3{font-family:var(--font-cn);font-size:.85rem;margin:0 0 .55rem;color:var(--text-main,#eef0f5)}.guide-body p,.guide-body dd,.guide-after li{font-size:.78rem;line-height:1.85;overflow-wrap:anywhere}.guide-body p{margin:0}.guide-body .step-tip{margin-top:.5rem;color:var(--gold-dim)}.guide-after{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding-top:1.2rem;border-top:1px solid var(--line-soft)}dl{margin:0}dl>div{margin-top:.75rem}dt{color:var(--gold-dim);font-size:.75rem;margin-bottom:.15rem}dd{margin:0}.guide-after ul{padding-left:1.1rem;margin:.7rem 0}.guide-after li+li{margin-top:.65rem}.guide-body footer{display:flex;align-items:center;gap:1rem;margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line-soft)}.guide-body footer p{font-size:.72rem;color:var(--text-dim)}.guide-link{white-space:nowrap;color:var(--gold);font-size:.78rem;margin-left:auto}@media(max-width:650px){.publish-guide :deep(.publish-guide-trigger){padding:.9rem}.guide-body{padding:0}.guide-after{grid-template-columns:1fr}.guide-body footer{align-items:flex-start;flex-direction:column}.guide-link{margin-left:0}.guide-heading small{font-size:.65rem}.guide-steps>li{grid-template-columns:1.8rem minmax(0,1fr);gap:.5rem}}
</style>
