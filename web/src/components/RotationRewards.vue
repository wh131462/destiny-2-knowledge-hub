<script setup>
import { computed } from 'vue'
import { ui, useI18n } from '@/i18n'
import RotationHint from './RotationHint.vue'

const props = defineProps({ item: { type: Object, required: true } })
const { locale } = useI18n()
const tr = (zh, en) => locale.value === 'en' ? en : zh
const name = item => locale.value === 'en' ? (item.name || item.nameZh) : (item.nameZh || item.name)
const description = item => locale.value === 'en' ? item.description : (item.descriptionZh || item.description)
const icon = item => item.icon?.startsWith('/') ? `https://www.bungie.net${item.icon}` : (item.icon || '')
const official = computed(() => props.item.rewardDetails?.official || [])
const examples = computed(() => props.item.rewardDetails?.examples || [])
const tierSuffix = item => {
  const en = `${item.description || ''}`.match(/Tier\s*(\d+)/i)
  const zh = `${item.descriptionZh || ''}`.match(/(\d+)\s*阶/)
  if (locale.value === 'en') return en ? `T${en[1]}` : (zh ? `T${zh[1]}` : '')
  return zh ? `${zh[1]}阶` : (en ? `T${en[1]}` : '')
}
// Official rewards are distinct entries (different itemHash); group only by name is wrong
// because the same display name can carry different tiers (e.g. "Raid Gear" 5 vs 3).
const rewardTypes = computed(() => {
  const seen = new Set()
  const result = []
  for (const item of official.value) {
    const key = `${item.itemHash}:${item.quantity}:${Boolean(item.conditional)}`
    if (seen.has(key)) continue
    seen.add(key)
    const suffix = tierSuffix(item)
    const label = suffix ? `${name(item)} / ${suffix}` : name(item)
    const content = [description(item), item.quantity ? tr(`数量：${item.quantity}`, `Quantity: ${item.quantity}`) : '', item.conditional ? tr('包含条件限制，以游戏内要求为准。', 'Conditional reward; check requirements in game.') : ''].filter(Boolean).join('\n')
    result.push({
      key,
      label,
      icon: icon(item),
      content: content || tr('获取条件和数量以游戏内活动界面为准。', 'Check the in-game activity screen for quantities and requirements.')
    })
  }
  return result
})
const live = computed(() => (props.item.rewards || []).filter(value => typeof value === 'string' && !/^\d+$/.test(value)))
const acquisitionHint = computed(() => [
  props.item.rewardDetails?.note ? ui(props.item.rewardDetails.note) : '',
  tr('常规装备参考，非完整掉落池或本周保底。大师专属版本和具体获取条件可查看活动攻略。', 'General equipment reference, not a complete loot pool or weekly guarantee. See the activity guide for Master variants and acquisition requirements.')
].filter(Boolean).join('\n\n'))
const equipmentHint = reward => [name(reward), tr('编辑整理的代表性装备，非本周保底。', 'Editorial representative equipment, not a weekly guarantee.')].filter(Boolean).join('\n')
</script>

<template>
  <section class="rotation-rewards">
    <header class="reward-heading"><h4>{{ tr('奖励参考', 'Rewards') }}</h4><RotationHint v-if="official.length || examples.length" :label="tr('获取说明', 'Acquisition notes')" :content="acquisitionHint" tone="subtle" /></header>
    <p v-if="live.length" class="live-rewards">{{ live.join(' / ') }}</p>
    <div v-if="rewardTypes.length" class="reward-types"><RotationHint v-for="reward in rewardTypes" :key="reward.key" :label="reward.label" :icon="reward.icon" :title="reward.label" :content="reward.content" tone="reward" /></div>
    <div v-if="examples.length" class="equipment-rewards">
      <a-tooltip v-for="(reward, index) in examples" :key="index" :title="equipmentHint(reward)" :destroy-tooltip-on-hide="true">
        <div class="reward-equipment"><img v-if="icon(reward)" :src="icon(reward)" alt="" loading="lazy" /><span><strong>{{ name(reward) }}</strong><small v-if="locale !== 'en' && reward.nameZh">{{ reward.name }}</small></span></div>
      </a-tooltip>
    </div>
    <p v-if="examples.length" class="reward-caption">{{ tr('常规装备参考 / 非本周保底', 'General equipment reference / not weekly guarantees') }}</p>
    <p v-else-if="!official.length && !live.length" class="reward-caption">{{ tr('奖励资料暂未收录。', 'Reward details are not available yet.') }}</p>
  </section>
</template>

<style scoped>
.rotation-rewards { border-top: 1px solid var(--line-soft); padding: 1rem 0; }
.reward-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: .7rem; }
.rotation-rewards h4 { color: var(--text-main); font-size: .85rem; font-weight: 500; margin: 0; }
.reward-types { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .8rem; }
.equipment-rewards { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .55rem; }
.reward-equipment { display: flex; align-items: center; gap: .55rem; min-width: 0; padding: .5rem; border: 1px solid var(--line-soft); border-radius: 3px; background: var(--bg-dark); cursor: default; }
.reward-equipment img { width: 36px; height: 36px; flex-shrink: 0; object-fit: cover; }
.reward-equipment > span { min-width: 0; }
.reward-equipment strong { display: block; font-size: .78rem; font-weight: 500; color: var(--text-main); overflow-wrap: anywhere; }
.reward-equipment small { display: block; font-size: .65rem; color: var(--text-sub); overflow-wrap: anywhere; }
.reward-caption { margin: .65rem 0 0; color: var(--text-sub); font-size: .72rem; line-height: 1.8; }
.live-rewards { font-size: .78rem; margin-bottom: .6rem; }
.live-rewards span { color: var(--text-sub); }
@media (max-width: 480px) { .equipment-rewards { grid-template-columns: 1fr; }.reward-equipment img { width: 40px; height: 40px; }.reward-equipment strong { font-size: .85rem; }.reward-equipment small { font-size: .7rem; } }
</style>
