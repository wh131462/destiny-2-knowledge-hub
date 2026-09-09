<script setup>
import { computed, ref, watch } from 'vue'
import CommunityPublishGuide from '@/components/CommunityPublishGuide.vue'
import { activitiesV2 } from '@/data/v2'
import { communityConfig } from '@/utils/communityConfig'
import { createSubmission, submissionBody, validateSubmission, newIssueUrl, issueUrl } from '../../../packages/community-builds/index.js'

const props = defineProps({ open: Boolean, draft: Object, context: Object, ready: Boolean, origin: Object, metadata: Object, sourceWarning: String })
const emit = defineEmits(['close'])
const summary = ref(''), tagsText = ref(''), activityIds = ref([]), copyMessage = ref('')
watch(() => props.open, open => {
  if (!open) return
  summary.value = props.metadata?.summary || ''; tagsText.value = props.metadata?.tags?.join('，') || ''; activityIds.value = [...(props.metadata?.activityIds || [])]; copyMessage.value = ''
})
const prepared = computed(() => {
  if (!props.ready) return { errors: ['装备目录尚未就绪，暂时不能生成投稿。'], body: '' }
  try {
    const tags = tagsText.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    const value = createSubmission(props.draft, { summary: summary.value, tags, activityIds: activityIds.value })
    const validation = validateSubmission(value, props.context)
    return { ...validation, body: validation.valid ? submissionBody(value) : '' }
  } catch (e) { return { errors: [e.message], body: '' } }
})
const href = computed(() => !communityConfig.submissionEnabled ? '' : props.origin ? issueUrl(communityConfig.repository, props.origin.number) : newIssueUrl(communityConfig.repository, props.draft.name))
async function copy() {
  try { await navigator.clipboard.writeText(prepared.value.body); copyMessage.value = '投稿内容已复制。请在 GitHub 粘贴并确认提交。' }
  catch { copyMessage.value = '自动复制不可用，请在下方文本框中全选并手动复制。' }
}
</script>

<template>
  <a-modal :open="open" :title="origin ? `修改原投稿 #${origin.number}` : '发布社区构筑'" width="780px" wrap-class-name="community-submission-modal" :footer="null" @cancel="emit('close')">
    <div class="submission">
      <p class="intro">给其他守护者留一份可以照着搭配的方案。先复制内容，再前往 GitHub {{ origin ? '编辑原 Issue 正文' : '创建投稿' }}。</p>
      <CommunityPublishGuide :editing="Boolean(origin)" in-submission />
      <p v-if="!communityConfig.enabled" role="status">{{ communityConfig.error || '当前页面尚未启用列表同步，仍可前往 GitHub 提交；本站展示需要等待同步配置完成。' }}</p>
      <p v-if="sourceWarning" class="notice" role="alert">{{ sourceWarning }}</p>
      <p v-if="origin" class="notice">原投稿更新于 {{ origin.updatedAt }}。只有作者或有权限的人可以修改；提交前请在 GitHub 核对最新正文。</p>
      <label>玩法说明 <a-textarea v-model:value="summary" placeholder="这套构筑适合什么场景？核心循环和装备选择是什么？" :rows="4" :maxlength="2000" /></label>
      <div class="metadata">
        <label>适用活动 <a-select v-model:value="activityIds" mode="multiple" placeholder="可选，最多 12 项" :options="activitiesV2.map(a => ({ value: a.id, label: a.name }))" /></label>
        <label>关键词 <a-input v-model:value="tagsText" placeholder="例如：生存，清怪，近战" /></label>
      </div>
      <ul v-if="prepared.errors?.length" class="notice" aria-label="投稿检查"><li v-for="error in prepared.errors" :key="error">{{ error }}</li></ul>
      <p v-for="warning in prepared.warnings" :key="warning" class="notice">{{ warning }}</p>
      <template v-if="prepared.body">
        <label>投稿内容 可手动复制 <textarea :value="prepared.body" readonly rows="8" aria-label="投稿内容" spellcheck="false" /></label>
        <div class="actions"><button type="button" class="btn primary" @click="copy">1 复制投稿内容</button><a v-if="href" class="btn" :href="href" target="_blank" rel="noopener noreferrer">2 {{ origin ? '前往原 Issue 修改' : '前往 GitHub 投稿' }} ↗</a></div>
      </template>
      <p role="status">{{ copyMessage }}</p>
      <p class="footnote">跳转不会自动提交。投稿为公开内容；关闭 Issue 可从本站下架，重新开启可恢复。被管理者屏蔽的投稿需先解除屏蔽；下架不会隐藏 GitHub 原文。更新将在同步成功后显示。</p>
    </div>
  </a-modal>
</template>

<style scoped>
:global(.community-submission-modal .ant-modal){top:24px;padding-bottom:24px}.actions .btn{padding:.65rem .85rem;font-size:.78rem}
.submission{display:grid;gap:1rem}.intro{color:var(--text-sub);line-height:1.8}.submission label{display:grid;gap:.5rem;font-size:.78rem;color:var(--text-sub)}.metadata{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.notice{padding:.7rem 1rem;border-left:2px solid var(--warn);color:var(--warn);font-size:.76rem;line-height:1.8}.notice li{margin-left:.6rem}.submission textarea[readonly]{width:100%;resize:vertical;background:var(--bg-deep);border:1px solid var(--line-soft);color:var(--text-sub);padding:.75rem;font:.7rem monospace;box-sizing:border-box}.actions{display:flex;gap:.75rem;flex-wrap:wrap}.footnote{font-size:.72rem;line-height:1.8;color:var(--text-dim)}[role=status]{font-size:.76rem;color:var(--gold)}@media(max-width:600px){.metadata{grid-template-columns:1fr}.actions>*{flex:1;text-align:center}}
</style>
