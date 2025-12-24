<script setup>
import { computed, onMounted } from 'vue'
import { useScript } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { useGlobalState } from './store'
import { useIsMobile } from './utils/composables'
import Header from './views/Header.vue';
import Footer from './views/Footer.vue';
import M3LoadingIndicator from './components/M3LoadingIndicator.vue';
import { api } from './api'

const {
  isDark, loading, useSideMargin, telegramApp, isTelegram, snackbar
} = useGlobalState()
const adClient = import.meta.env.VITE_GOOGLE_AD_CLIENT;
const adSlot = import.meta.env.VITE_GOOGLE_AD_SLOT;
const { locale } = useI18n({});
const theme = useTheme()
const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);

// Watch dark mode changes
import { watch } from 'vue'
watch(isDark, (val) => {
  theme.global.name.value = val ? 'dark' : 'light'
}, { immediate: true })

// Load Google Ad script at top level (not inside onMounted)
if (showAd.value) {
  useScript({
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
    async: true,
    crossorigin: "anonymous",
  })
}

onMounted(async () => {
  try {
    await api.getUserSettings();
  } catch (error) {
    console.error(error);
  }

  const token = import.meta.env.VITE_CF_WEB_ANALY_TOKEN;

  const exist = document.querySelector('script[src="https://static.cloudflareinsights.com/beacon.min.js"]') !== null
  if (token && !exist) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = `{ token: ${token} }`;
    document.body.appendChild(script);
  }

  // check if google ad is enabled
  if (showAd.value) {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  // check if telegram is enabled
  const enableTelegram = import.meta.env.VITE_IS_TELEGRAM;
  if (
    (typeof enableTelegram === 'boolean' && enableTelegram === true)
    ||
    (typeof enableTelegram === 'string' && enableTelegram === 'true')
  ) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    telegramApp.value = window.Telegram?.WebApp || {};
    isTelegram.value = !!window.Telegram?.WebApp?.initData;
  }
});
</script>

<template>
  <v-app>
    <v-overlay :model-value="loading" class="align-center justify-center" persistent>
      <M3LoadingIndicator />
    </v-overlay>
    
    <v-main class="d-flex flex-column" style="min-height: 100vh;">
      <v-container fluid class="flex-grow-1">
        <v-row justify="center">
          <v-col v-if="showSideMargin && showAd" cols="1">
            <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
              data-ad-format="auto" data-full-width-responsive="true"></ins>
          </v-col>
          
          <v-col :cols="showSideMargin ? 10 : 12" :md="showSideMargin ? 10 : 10" :lg="showSideMargin ? 10 : 10" :xl="showSideMargin ? 10 : 8">
            <Header />
            <router-view></router-view>
          </v-col>
          
          <v-col v-if="showSideMargin && showAd" cols="1">
            <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
              data-ad-format="auto" data-full-width-responsive="true"></ins>
          </v-col>
        </v-row>
      </v-container>
      <Footer />
    </v-main>

    <v-snackbar-queue></v-snackbar-queue>
    
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
}

/* M3 Type Scale - 字体排版系统 */
:root {
  /* Display */
  --md-sys-typescale-display-large: 600 57px/64px 'Roboto', sans-serif;
  --md-sys-typescale-display-medium: 500 45px/52px 'Roboto', sans-serif;
  --md-sys-typescale-display-small: 500 36px/44px 'Roboto', sans-serif;
  
  /* Headline */
  --md-sys-typescale-headline-large: 500 32px/40px 'Roboto', sans-serif;
  --md-sys-typescale-headline-medium: 500 28px/36px 'Roboto', sans-serif;
  --md-sys-typescale-headline-small: 500 24px/32px 'Roboto', sans-serif;
  
  /* Title */
  --md-sys-typescale-title-large: 500 22px/28px 'Roboto', sans-serif;
  --md-sys-typescale-title-medium: 600 16px/24px 'Roboto', sans-serif;
  --md-sys-typescale-title-small: 600 14px/20px 'Roboto', sans-serif;
  
  /* Body */
  --md-sys-typescale-body-large: 400 16px/24px 'Roboto', sans-serif;
  --md-sys-typescale-body-medium: 400 14px/20px 'Roboto', sans-serif;
  --md-sys-typescale-body-small: 400 12px/16px 'Roboto', sans-serif;
  
  /* Label */
  --md-sys-typescale-label-large: 600 14px/20px 'Roboto', sans-serif;
  --md-sys-typescale-label-medium: 600 12px/16px 'Roboto', sans-serif;
  --md-sys-typescale-label-small: 600 11px/16px 'Roboto', sans-serif;
}

/* M3 Expressive 字体层次 */
.text-h1 {
  font: var(--md-sys-typescale-display-large) !important;
  letter-spacing: -0.25px !important;
}

.text-h2 {
  font: var(--md-sys-typescale-display-medium) !important;
  letter-spacing: 0 !important;
}

.text-h3 {
  font: var(--md-sys-typescale-headline-large) !important;
  letter-spacing: 0 !important;
}

.text-h4 {
  font: var(--md-sys-typescale-headline-medium) !important;
  letter-spacing: 0 !important;
}

.text-h5 {
  font: var(--md-sys-typescale-headline-small) !important;
  letter-spacing: 0 !important;
}

.text-h6 {
  font: var(--md-sys-typescale-title-large) !important;
  letter-spacing: 0 !important;
}

/* 卡片标题 - Title Large */
.v-card-title {
  font: var(--md-sys-typescale-title-large) !important;
  letter-spacing: 0 !important;
}

/* Tab 文字 - Label Large */
.v-tab {
  font: var(--md-sys-typescale-label-large) !important;
  letter-spacing: 0.1px !important;
  text-transform: none !important;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
}

/* 按钮文字 - Label Large */
.v-btn {
  font: var(--md-sys-typescale-label-large) !important;
  letter-spacing: 0.1px !important;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
}

.v-btn:hover {
  transform: scale(1.02);
}

.v-btn:active {
  transform: scale(0.98);
}

/* Alert 内容 - Body Large */
.v-alert__content {
  font: var(--md-sys-typescale-body-large) !important;
}

/* 输入框标签 - Body Small */
.v-field__label {
  font: var(--md-sys-typescale-body-small) !important;
}

/* 输入框内容 - Body Large */
.v-field__input {
  font: var(--md-sys-typescale-body-large) !important;
}

/* 列表项标题 - Body Large */
.v-list-item-title {
  font: var(--md-sys-typescale-body-large) !important;
}

/* 列表项副标题 - Body Medium */
.v-list-item-subtitle {
  font: var(--md-sys-typescale-body-medium) !important;
}

/* Chip - Label Large */
.v-chip {
  font: var(--md-sys-typescale-label-large) !important;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
}

.v-chip:hover {
  transform: scale(1.05);
}

/* 对话框标题 - Headline Small */
.v-dialog .v-card-title {
  font: var(--md-sys-typescale-headline-small) !important;
}

/* 卡片过渡 */
.v-card {
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
}

/* 输入框聚焦动画 */
.v-field {
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
}

/* 列表项 */
.v-list-item {
  transition: all 0.15s cubic-bezier(0.2, 0, 0, 1) !important;
}

/* Snackbar - Body Medium */
.v-snackbar__content {
  font: var(--md-sys-typescale-body-medium) !important;
}

/* 修复 v-bottom-sheet inset 模式下圆角露出阴影问题 */
.v-bottom-sheet > .v-bottom-sheet__content.v-overlay__content {
  box-shadow: none !important;
}

/* M3 风格滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.35);
}

::-webkit-scrollbar-thumb:active {
  background: rgba(var(--v-theme-on-surface), 0.5);
}

/* Firefox 滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
}
</style>
