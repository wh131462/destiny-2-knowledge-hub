<script setup>
import { useI18n } from '@/i18n'
const { t, locale } = useI18n()
</script>

<template>
  <section class="not-found">
    <span>404 / LOST IN THE ASCENDANT PLANE</span>
    <h1>{{ t('pages.notFound.title') }}</h1>
    <p>{{ t('pages.notFound.subtitle') }}</p>
    <div><router-link to="/" class="btn primary">{{ t('common.home') }}</router-link><router-link to="/build-lab" class="btn">{{ t('common.buildLab') }}</router-link></div>
  </section>
</template>

<style scoped>
.not-found{min-height:60vh;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;max-width:46rem}.not-found span{color:var(--gold-dim);font:.7rem var(--font-en);letter-spacing:.2em}.not-found h1{font-family:var(--font-cn);font-size:clamp(2.5rem,8vw,5rem);line-height:1.05;margin:1rem 0}.not-found p{margin-bottom:2rem}.not-found div{display:flex;gap:.8rem;flex-wrap:wrap}
</style>
