<script setup>
defineProps({ result: { type: Object, required: true } })

const names = {
  mobility: '机动', resilience: '韧性', recovery: '恢复',
  discipline: '纪律', intellect: '智慧', strength: '力量'
}
</script>

<template>
  <div class="stat-grid">
    <div v-for="(value, key) in result.values" :key="key" class="stat">
      <span>{{ names[key] }}</span>
      <strong>{{ value }}</strong>
      <div class="track"><i :style="{ width: `${value}%` }"></i></div>
    </div>
    <div class="dr-note">韧性 T{{ result.tiers.resilience }}：PvE 基线减伤 {{ result.resilienceDamageResistancePercent }}%</div>
  </div>
</template>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem 1rem; }
.stat { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 0.35rem; }
.stat span { color: var(--text-dim); font-size: 0.76rem; }
.stat strong { color: var(--text-main); font-family: var(--font-en); font-variant-numeric: tabular-nums; }
.track { grid-column: 1 / -1; height: 3px; background: rgba(255,255,255,0.07); overflow: hidden; }
.track i { display: block; height: 100%; background: var(--gold); }
.dr-note { grid-column: 1 / -1; color: var(--text-dim); font-size: 0.75rem; }
@media (max-width: 560px) { .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
