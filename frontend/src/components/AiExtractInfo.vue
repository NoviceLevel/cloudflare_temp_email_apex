<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
  messages: {
    en: {
      authCode: 'Verification Code',
      authLink: 'Authentication Link',
      serviceLink: 'Service Link',
      subscriptionLink: 'Subscription Link',
      otherLink: 'Other Link',
      copySuccess: 'Copied successfully',
      copyFailed: 'Copy failed',
      open: 'Open',
    },
    zh: {
      authCode: '验证码',
      authLink: '认证链接',
      serviceLink: '服务链接',
      subscriptionLink: '订阅链接',
      otherLink: '其他链接',
      copySuccess: '复制成功',
      copyFailed: '复制失败',
      open: '打开',
    }
  }
});

const props = defineProps({
  metadata: {
    type: String,
    default: null
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['notify']);

const snackbar = ref({ show: false, text: '', color: 'success' });
import { ref } from 'vue';

const aiExtract = computed(() => {
  if (!props.metadata) return null;
  try {
    const data = JSON.parse(props.metadata);
    return data.ai_extract || null;
  } catch (e) {
    return null;
  }
});

const typeLabel = computed(() => {
  if (!aiExtract.value) return '';
  const typeMap = {
    auth_code: t('authCode'),
    auth_link: t('authLink'),
    service_link: t('serviceLink'),
    subscription_link: t('subscriptionLink'),
    other_link: t('otherLink'),
  };
  return typeMap[aiExtract.value.type] || '';
});

const typeIcon = computed(() => {
  if (!aiExtract.value) return null;
  const iconMap = {
    auth_code: 'mdi-code-tags',
    auth_link: 'mdi-link',
    service_link: 'mdi-link',
    subscription_link: 'mdi-link',
    other_link: 'mdi-link',
  };
  return iconMap[aiExtract.value.type] || 'mdi-link';
});

const isLink = computed(() => {
  return aiExtract.value && aiExtract.value.type !== 'auth_code';
});

const displayText = computed(() => {
  if (!aiExtract.value) return '';
  if (aiExtract.value.type === 'auth_code') {
    return aiExtract.value.result;
  }
  return aiExtract.value.result_text || aiExtract.value.result;
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(aiExtract.value.result);
    snackbar.value = { show: true, text: t('copySuccess'), color: 'success' };
  } catch (e) {
    snackbar.value = { show: true, text: t('copyFailed'), color: 'error' };
  }
};

const openLink = () => {
  if (isLink.value && aiExtract.value.result) {
    window.open(aiExtract.value.result, '_blank');
  }
};
</script>

<template>
  <div v-if="aiExtract && aiExtract.result" class="ai-extract-info">
    <v-alert v-if="!compact" type="success" closable variant="tonal">
      <template #prepend>
        <v-icon :icon="typeIcon" />
      </template>
      <template #title>
        {{ typeLabel }}
      </template>
      <div class="d-flex align-center ga-2 flex-wrap">
        <span v-if="aiExtract.type === 'auth_code'" class="text-h6 font-weight-bold" style="font-family: monospace;">
          {{ aiExtract.result }}
        </span>
        <span v-else class="text-truncate" style="max-width: 400px;">
          {{ displayText }}
        </span>
        <v-btn size="small" variant="text" icon @click="copyToClipboard">
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
        <v-btn v-if="isLink" size="small" variant="text" color="primary" @click="openLink">
          {{ t('open') }}
        </v-btn>
      </div>
    </v-alert>
    <v-chip v-else color="success" size="small" @click="copyToClipboard" style="cursor: pointer;">
      <v-icon start :icon="typeIcon" size="small" />
      <span class="text-truncate" style="max-width: 150px;">
        {{ typeLabel }}: {{ displayText }}
      </span>
    </v-chip>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.ai-extract-info {
  margin-bottom: 10px;
}
</style>
