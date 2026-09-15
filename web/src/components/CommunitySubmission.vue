<script setup>
import { ui, localizedOptions, uiMessage } from '@/i18n'
import { computed, ref, watch } from 'vue'
import CommunityPublishGuide from '@/components/CommunityPublishGuide.vue'
import StableDisclosure from '@/components/StableDisclosure.vue'
import { activitiesV2 } from '@/data/v2'
import { communityConfig } from '@/utils/communityConfig'
import { createSubmission, submissionBody, validateSubmission, newIssueUrl, issueUrl } from '../../../packages/community-builds/index.js'

const props = defineProps({ open: Boolean, draft: Object, context: Object, ready: Boolean, origin: Object, metadata: Object, sourceWarning: String })
const emit = defineEmits(['close'])
const summary = ref(''), tagsText = ref(''), activityIds = ref([]), copyMessage = ref(''), manualCopy = ref(false), copied = ref(false)
let editingDraft, editingOrigin
watch(() => props.open, open => {
  if (!open) return
  if (editingDraft === props.draft && editingOrigin === props.origin?.number) return
  editingDraft = props.draft; editingOrigin = props.origin?.number
  manualCopy.value = false; copied.value = false
  summary.value = props.metadata?.summary || ''; tagsText.value = props.metadata?.tags?.join('，') || ''; activityIds.value = [...(props.metadata?.activityIds || [])]; copyMessage.value = ''
})
const prepared = computed(() => {
  if (!props.ready) return { errors: ['装备目录尚未就绪，暂时不能生成投稿。'], body: '' }
  try {
    const tags = tagsText.value.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    const value = createSubmission(props.draft, { summary: summary.value.trim() || '待填写玩法说明', tags, activityIds: activityIds.value })
    const validation = validateSubmission(value, props.context)
    return { ...validation, body: validation.valid && summary.value.trim() ? submissionBody(value) : '' }
  } catch (e) { return { errors: [e.message], body: '' } }
})
const href = computed(() => !communityConfig.submissionEnabled ? '' : props.origin ? issueUrl(communityConfig.repository, props.origin.number) : newIssueUrl(communityConfig.repository, props.draft.name))
watch(() => prepared.value.body, () => { copied.value = false; copyMessage.value = ''; manualCopy.value = false })
async function copy() {
  if (!prepared.value.body) return
  try { await navigator.clipboard.writeText(prepared.value.body); copied.value = true; copyMessage.value = '投稿内容已复制。请在 GitHub 粘贴并确认提交。' }
  catch { manualCopy.value = true; copyMessage.value = '自动复制不可用，请在下方文本框中全选并手动复制。' }
}
</script>

<template>
  <a-modal :open="open" :title="origin ? ui(&quot;修改原投稿 #{0}&quot;, [origin.number]) : ui(&quot;发布社区构筑&quot;)" width="780px" wrap-class-name="community-submission-modal" :footer="null" @cancel="emit('close')">
    <div class="submission">
      <p class="intro">{{ ui("给其他守护者留一份可以照着搭配的方案。先复制内容，再前往 GitHub") }} {{ origin ? ui("编辑原 Issue 正文") : ui("创建投稿") }}。</p>
      <ol class="publish-progress" :aria-label="ui(&quot;发布步骤&quot;)"><li><b>01</b> {{ ui("填写说明") }}</li><li><b>02</b> {{ ui("复制内容") }}</li><li><b>03</b> {{ ui("GitHub 确认") }}</li></ol>
      <p v-if="!communityConfig.enabled" role="status">{{ communityConfig.error || ui("当前页面尚未启用列表同步，仍可前往 GitHub 提交；本站展示需要等待同步配置完成。") }}</p>
      <p v-if="sourceWarning" class="notice" role="alert">{{ uiMessage(sourceWarning) }}</p>
      <p v-if="origin" class="notice">{{ ui("原投稿更新于") }} {{ origin.updatedAt }}{{ ui("。只有作者或有权限的人可以修改；提交前请在 GitHub 核对最新正文。") }}</p>
      <label><span>{{ ui("玩法说明") }} <small>{{ ui("必填") }}</small></span><a-textarea :aria-label="ui(&quot;玩法说明&quot;)" aria-required="true" v-model:value="summary" :placeholder="ui(&quot;这套构筑适合什么场景？核心循环和装备选择是什么？&quot;)" :rows="4" :maxlength="2000" /></label>
      <p v-if="!summary.trim()" class="field-hint">{{ ui("补充适用场景和核心循环，让其他守护者知道如何使用这套构筑。") }}</p>
      <div class="metadata">
        <label>{{ ui("适用活动") }} <a-select popup-class-name="build-select-popup" :aria-label="ui(&quot;投稿适用活动&quot;)" v-model:value="activityIds" mode="multiple" :placeholder="ui(&quot;可选，最多 12 项&quot;)" :options="localizedOptions(activitiesV2.map(a => ({ value: a.id, label: a.name })))" /></label>
        <label>{{ ui("关键词") }} <a-input v-model:value="tagsText" :placeholder="ui(&quot;例如：生存，清怪，近战&quot;)" /></label>
      </div>
      <ul v-if="prepared.errors?.length" class="notice" :aria-label="ui(&quot;投稿检查&quot;)"><li v-for="error in prepared.errors" :key="error">{{ uiMessage(error) }}</li></ul>
      <p v-for="warning in prepared.warnings" :key="warning" class="notice">{{ uiMessage(warning) }}</p>
      <div class="actions"><button type="button" class="btn primary" :disabled="!prepared.body" @click="copy">{{ copied ? ui("✓ 已复制投稿内容") : ui("1 复制投稿内容") }}</button><a v-if="href && prepared.body" class="btn" :href="href" target="_blank" rel="noopener noreferrer">2 {{ origin ? ui("前往原 Issue 修改") : ui("前往 GitHub 投稿") }} ↗</a></div>
      <p v-if="copyMessage" role="status">{{ uiMessage(copyMessage) }}</p>
      <StableDisclosure v-if="prepared.body" :open="manualCopy" :title="ui('查看投稿内容 / 手动复制')" :width="760" trigger-class="submission-preview-trigger" @update:open="manualCopy = $event"><textarea :value="prepared.body" readonly rows="14" :aria-label="ui(&quot;投稿内容&quot;)" spellcheck="false" /></StableDisclosure>
      <CommunityPublishGuide :editing="Boolean(origin)" in-submission />
      <p class="footnote">{{ ui("跳转不会自动提交。投稿为公开内容；关闭 Issue 可从本站下架，重新开启可恢复。被管理者屏蔽的投稿需先解除屏蔽；下架不会隐藏 GitHub 原文。更新将在同步成功后显示。") }}</p>
    </div>
  </a-modal>
</template>

<style scoped>
:global(.community-submission-modal .ant-modal){top:24px;padding-bottom:24px}.actions .btn{padding:.65rem .85rem;font-size:.78rem}
.submission{display:grid;gap:1rem}.intro{color:var(--text-sub);line-height:1.8}.submission label{display:grid;gap:.5rem;font-size:.78rem;color:var(--text-sub)}.metadata{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.notice{padding:.7rem 1rem;border-left:2px solid var(--warn);color:var(--warn);font-size:.76rem;line-height:1.8}.notice li{margin-left:.6rem}.submission textarea[readonly]{width:100%;resize:vertical;background:var(--bg-deep);border:1px solid var(--line-soft);color:var(--text-sub);padding:.75rem;font:.7rem monospace;box-sizing:border-box}.actions{display:flex;gap:.75rem;flex-wrap:wrap}.footnote{font-size:.72rem;line-height:1.8;color:var(--text-dim)}[role=status]{font-size:.76rem;color:var(--gold)}@media(max-width:600px){.metadata{grid-template-columns:1fr}.actions>*{flex:1;text-align:center}}
</style>

<style scoped>
.publish-progress { display: flex; list-style: none; gap: .75rem; padding: .8rem 0; margin: 0; border-block: 1px solid var(--line-soft); }.publish-progress li { flex: 1; font-size: .75rem; color: var(--text-sub); }.publish-progress b { color: var(--gold); margin-right: .4rem; font: .65rem var(--font-en); }
.submission label small { margin-left: .4rem; color: var(--gold); font-size: .7rem; }.field-hint { font-size: .75rem; margin-top: -.5rem; color: var(--text-sub); }.submission .ant-select { min-width: 0; width: 100%; }.submission :deep(.submission-preview-trigger) { color: var(--text-sub); font-size: .78rem; }.actions .btn { border-radius: var(--radius-sm); min-height: 44px; }.actions .btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; }
@media(max-width:420px) { .publish-progress { gap: .4rem; }.publish-progress li { font-size: .68rem; }.publish-progress b { display: block; margin-bottom: .25rem; }.actions { flex-direction: column; } }
</style>
