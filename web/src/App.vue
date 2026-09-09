<script setup>
import { computed } from 'vue'
import { theme } from 'ant-design-vue'
import enUS from 'ant-design-vue/es/locale/en_US'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import DestinyLoading from '@/components/DestinyLoading.vue'
import { navigationLoading } from '@/composables/useNavigationLoading'
import { useI18n } from '@/i18n'

const { t, locale } = useI18n()
const antLocale = computed(() => locale.value === 'en' ? enUS : zhCN)
const reloadPage = () => window.location.reload()

const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#e8c15a',
    colorInfo: '#4db8ff',
    colorSuccess: '#7ddb8a',
    colorWarning: '#ffb454',
    colorError: '#ff6b6b',
    colorBgBase: '#060a14',
    colorBgContainer: '#101828',
    colorBgElevated: '#141d33',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorText: '#e8edf7',
    colorTextSecondary: '#9aa7c0',
    borderRadius: 8,
    controlHeight: 42,
    fontFamily: "var(--font-cn)"
  },
  components: {
    Input: { activeBorderColor: '#e8c15a', hoverBorderColor: '#a8843a' },
    Select: { optionSelectedBg: 'rgba(232, 193, 90, 0.16)', optionActiveBg: 'rgba(77, 184, 255, 0.1)' },
    Button: { contentFontSizeSM: 12 }
  }
}
</script>

<template>
  <a-config-provider :theme="antTheme" :locale="antLocale">
    <a class="skip-link" href="#main-content">{{ t('common.skipToMain') }}</a>
    <SiteHeader />
    <DestinyLoading v-if="navigationLoading.pending" fullscreen />
    <main id="main-content" tabindex="-1" :aria-busy="navigationLoading.pending">
      <div v-if="navigationLoading.error" class="note" role="alert">
        {{ locale === 'en' ? 'Unable to load this page. Check your connection and try again.' : '页面加载失败，请检查网络后重试。' }}
        <button type="button" class="btn small" @click="reloadPage">{{ t('common.retry') }}</button>
      </div>
      <router-view />
    </main>
    <SiteFooter />
  </a-config-provider>
</template>

<style>
.skip-link{position:fixed;top:.5rem;left:.5rem;z-index:1000;padding:.65rem 1rem;background:var(--gold);color:var(--bg-deep);transform:translateY(-160%)}
.skip-link:focus{transform:translateY(0)}
</style>
