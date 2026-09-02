<script setup>
import { classes } from '@/data/classes'
import { curatedBuilds, gearById } from '@/data/v2'
import { useI18n, localized } from '@/i18n'

const { t, locale } = useI18n()

const classCards = classes.map(c => ({
  ...c,
  count: c.subclasses.length
}))

const featuredBuilds = curatedBuilds.slice(0, 3)

const modules = [
  { to: '/classes', icon: '01', title: '职业百科', en: 'CLASSES', desc: '三大职业、普通子职业、技能体系' },
  { to: '/prismatic', icon: '02', title: '棱镜职业', en: 'PRISMATIC', desc: '跨元素技能池、超越、21 个特性' },
  { to: '/smart-loadout', icon: '03', title: '智能配装', en: 'SMART LOADOUT', desc: '天赋、技能、武器、一图流' },
  { to: '/weapons', icon: '04', title: '武器百科', en: 'WEAPONS', desc: '武器原型、异域武器图鉴' },
  { to: '/armor', icon: '05', title: '防具与套装', en: 'ARMOR', desc: '防具、异域护甲、模组' },
  { to: '/activities', icon: '06', title: '活动图鉴', en: 'ACTIVITIES', desc: '突袭、地牢、高难活动' },
  { to: '/lore', icon: '07', title: '世界观', en: 'LORE', desc: '传奇、势力、角色、敌人' },
  { to: '/glossary', icon: '08', title: '术语表', en: 'GLOSSARY', desc: '中英对照、快速检索' }
]

</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-brand" :aria-label="locale === 'en' ? 'Destiny 2 Knowledge Hub' : '命运2知识中枢 Destiny 2 Knowledge Hub'">
          <img src="/favicon.svg" class="hero-brand-icon" alt="" aria-hidden="true" />
          <div class="hero-brand-copy">
            <strong>{{ locale === 'en' ? 'Destiny 2 Knowledge Hub' : '命运2知识中枢' }}</strong>
            <span>DESTINY 2 KNOWLEDGE HUB</span>
          </div>
        </div>
        <p class="eyebrow">DESTINY 2 / KNOWLEDGE HUB</p>
        <h1>{{ locale === 'en' ? 'Light as a blade,' : '以光为刃，' }} <span class="gold">{{ locale === 'en' ? 'knowledge as a shield' : '以知为盾' }}</span></h1>
        <div class="hero-actions">
        <router-link to="/smart-loadout" class="btn primary">开始智能配装</router-link><router-link to="/manual-loadout" class="btn">手动构建一图流</router-link>
          <router-link to="/smart-loadout" class="text-action">生成一图流 ↗</router-link>
          <router-link to="/prismatic" class="text-action">了解棱镜系统 →</router-link>
        </div>
      </div>
      <!-- 星光效果 -->
      <div class="stars" aria-hidden="true"></div>
    </section>

    <!-- 模块入口 -->
    <section>
      <div class="section-title">
        <h2>{{ t('pages.home.explore') }}</h2>
        <span class="en">EXPLORE</span>
      </div>
      <div class="grid grid-4">
        <router-link v-for="m in modules" :key="m.to" :to="m.to" class="card module-card">
          <div class="mod-icon">{{ m.icon }}</div>
          <h3>{{ locale === 'en' ? ({ classes: 'Classes', prismatic: 'Prismatic Subclass', 'smart-loadout': 'Smart Loadout', weapons: 'Weapons', armor: 'Armor & Sets', activities: 'Activities', lore: 'Lore', glossary: 'Glossary' }[m.to.slice(1)] || m.title) : m.title }}</h3>
          <span class="en-tag">{{ m.en }}</span>
          <p>{{ m.desc }}</p>
        </router-link>
      </div>
    </section>

    <!-- 热门构筑 -->
    <section>
      <div class="section-title">
        <h2>{{ t('pages.home.featured') }}</h2>
        <span class="en">FEATURED BUILDS</span>
        <router-link to="/smart-loadout" class="more">进入智能配装 →</router-link>
      </div>
      <div class="grid grid-3">
        <router-link :to="`/smart-loadout?build=${b.id}`" v-for="b in featuredBuilds" :key="b.id" class="card build-card">
          <div class="build-head">
            <span class="badge gold">{{ b.name }}</span>
          </div>
          <p class="why">{{ b.goal }}</p>
          <div class="build-metrics">
            <span>生存 {{ b.scoring.survivability }}</span>
            <span>清怪 {{ b.scoring.addClear }}</span>
            <span>输出 {{ b.scoring.bossDamage }}</span>
          </div>
          <div class="exotic">{{ locale === 'en' ? 'Core: ' : '核心：' }}{{ localized(gearById[b.exoticArmorId]) }}</div>
        </router-link>
      </div>
    </section>

    <!-- 职业速览 -->
    <section>
      <div class="section-title">
        <h2>{{ t('pages.home.classes') }}</h2>
        <span class="en">CLASSES</span>
      </div>
      <div class="grid grid-3">
        <router-link v-for="c in classCards" :key="c.id" :to="`/classes/${c.id}`" class="card class-card">
          <div class="class-inner">
            <div class="class-icon" :style="{ borderColor: c.color, color: c.color }">
              {{ c.name[0] }}
            </div>
            <div>
              <h3>{{ localized(c) }}</h3>
              <span v-if="locale === 'zh'" class="en-tag">{{ c.en.toUpperCase() }}</span>
            </div>
          </div>
          <p>{{ c.role }}：职业技能「{{ c.classAbility.split('（')[0] }}」</p>
          <div class="sub-count">{{ c.count }} 个子职业分支</div>
        </router-link>
      </div>
    </section>

  </div>
</template>

<style scoped>
.hero {
  position: relative;
  text-align: center;
  padding: 64px 20px 56px;
  border-bottom: 1px solid var(--line-soft);
  overflow: hidden;
}
.hero-inner { position: relative; z-index: 2; }
.hero-brand { display: inline-flex; align-items: center; gap: 14px; margin-bottom: 28px; text-align: left; }
.hero-brand-icon { width: 72px; height: 72px; filter: drop-shadow(0 0 18px rgba(232, 193, 90, .3)); }
.hero-brand-copy { display: flex; flex-direction: column; gap: 5px; }
.hero-brand-copy strong { color: var(--text-main); font-size: 1.2rem; font-weight: 900; letter-spacing: .14em; }
.hero-brand-copy span { color: var(--gold-dim); font: .62rem var(--font-en); letter-spacing: .22em; }
.eyebrow {
  font-family: var(--font-en);
  letter-spacing: 0.4em;
  color: var(--gold-dim);
  font-size: 0.8rem;
  margin-bottom: 16px;
}
.hero h1 {
  font-size: 3rem;
  margin-bottom: 12px;
}
.gold {
  background: linear-gradient(120deg, var(--gold), var(--gold-bright));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 60% 20%, rgba(232,193,90,0.7), transparent),
    radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.5), transparent),
    radial-gradient(2px 2px at 90% 15%, rgba(77,184,255,0.6), transparent),
    radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.5), transparent);
  opacity: 0.5;
  pointer-events: none;
}
.module-card { display: block; color: var(--text-main); } 
.mod-icon { font: 600 .65rem var(--font-en); color: var(--gold-dim); letter-spacing: .16em; margin-bottom: 18px; }
.en-tag {
  font-family: var(--font-en);
  font-size: 0.68rem;
  letter-spacing: 0.2em;
  color: var(--gold-dim);
  display: block;
  margin: 2px 0 8px;
}
.more { margin-left: auto; font-size: 0.85rem; }
.build-card { display: block; color: var(--text-main); }
.build-head { margin-bottom: 8px; }
.build-head { display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
.why { font-size: 0.88rem; margin-bottom: 10px; min-height: 3.3em; }
.build-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-soft); margin-bottom:10px; }
.build-metrics span { background:var(--bg-dark); padding:.5rem; color:var(--text-dim); font-size:.68rem; text-align:center; }
.exotic { font-size: 0.8rem; color: var(--gold-bright); }
.text-action { display:inline-flex;align-items:center;padding:.65rem;color:var(--text-sub); }
.class-card { display: block; color: var(--text-main); }
.class-inner { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.class-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  border: 2px solid;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 800;
  background: rgba(255,255,255,0.03);
}
.sub-count { margin-top: 10px; font-size: 0.78rem; color: var(--text-dim); }
@media (max-width: 640px) {
  .hero-brand { margin-bottom: 22px; }
  .hero-brand-icon { width: 58px; height: 58px; }
  .hero-brand-copy strong { font-size: 1rem; letter-spacing: .1em; }
  .hero-brand-copy span { font-size: .52rem; letter-spacing: .14em; }
  .hero h1 { font-size: 2rem; }
}
</style>
