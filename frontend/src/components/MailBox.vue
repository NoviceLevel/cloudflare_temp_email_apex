<script setup>
import { watch, onMounted, ref, onBeforeUnmount, computed } from "vue";
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { processItem } from '../utils/email-parser'
import { utcToLocalDate } from '../utils';
import MailContentRenderer from "./MailContentRenderer.vue";
import AiExtractInfo from "./AiExtractInfo.vue";

const isMobile = useIsMobile()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')

const showMessage = (text, color = 'info') => {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
}

const message = {
    error: (text) => showMessage(text, 'error'),
    success: (text) => showMessage(text, 'success'),
}

const props = defineProps({
  enableUserDeleteEmail: { type: Boolean, default: false },
  showEMailTo: { type: Boolean, default: true },
  fetchMailData: { type: Function, default: () => { }, required: true },
  deleteMail: { type: Function, default: () => { } },
  showReply: { type: Boolean, default: false },
  showSaveS3: { type: Boolean, default: false },
  saveToS3: { type: Function, default: () => { } },
  showFilterInput: { type: Boolean, default: false },
})

const localFilterKeyword = ref('')

const {
  isDark, indexTab, loading, useUTCDate,
  autoRefresh, configAutoRefreshInterval, sendMailModel
} = useGlobalState()
const autoRefreshInterval = ref(configAutoRefreshInterval.value)
const rawData = ref([])
const timer = ref(null)

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const data = computed(() => {
  if (!localFilterKeyword.value || localFilterKeyword.value.trim() === '') {
    return rawData.value;
  }
  const keyword = localFilterKeyword.value.toLowerCase();
  return rawData.value.filter(mail => {
    const searchFields = [mail.subject || '', mail.text || '', mail.message || ''].map(f => f.toLowerCase());
    return searchFields.some(field => field.includes(keyword));
  });
})

const canGoPrevMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex > 0 || page.value > 1
})

const canGoNextMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex < data.value.length - 1 || count.value > page.value * pageSize.value
})

const prevMail = async () => {
  if (!canGoPrevMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  if (currentIndex > 0) {
    curMail.value = data.value[currentIndex - 1]
  } else if (page.value > 1) {
    page.value--
    await refresh()
    if (data.value.length > 0) curMail.value = data.value[data.value.length - 1]
  }
}

const nextMail = async () => {
  if (!canGoNextMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  if (currentIndex < data.value.length - 1) {
    curMail.value = data.value[currentIndex + 1]
  } else if (count.value > page.value * pageSize.value) {
    page.value++
    await refresh()
    if (data.value.length > 0) curMail.value = data.value[0]
  }
}

const curMail = ref(null);
const showMailDrawer = ref(false);
const multiActionMode = ref(false)
const showMultiActionDownload = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDownloadZip = ref({})
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })
const deleteConfirmDialog = ref(false)

const { t } = useI18n({
  messages: {
    en: {
      success: 'Success', autoRefresh: 'Auto Refresh', refreshAfter: 'Refresh After {msg}s',
      refresh: 'Refresh', attachments: 'Show Attachments', downloadMail: 'Download Mail',
      pleaseSelectMail: "Please select mail", delete: 'Delete', deleteMailTip: 'Are you sure?',
      reply: 'Reply', forwardMail: 'Forward', showTextMail: 'Show Text', showHtmlMail: 'Show Html',
      saveToS3: 'Save to S3', multiAction: 'Multi', cancelMultiAction: 'Cancel',
      selectAll: 'Select All', unselectAll: 'Unselect All', prevMail: 'Prev', nextMail: 'Next',
      keywordQueryTip: 'Filter', query: 'Query',
    },
    zh: {
      success: '成功', autoRefresh: '自动刷新', refreshAfter: '{msg}秒后刷新',
      refresh: '刷新', downloadMail: '下载邮件', attachments: '查看附件',
      pleaseSelectMail: "请选择邮件", delete: '删除', deleteMailTip: '确定删除?',
      reply: '回复', forwardMail: '转发', showTextMail: '纯文本', showHtmlMail: 'HTML',
      saveToS3: '保存到S3', multiAction: '多选', cancelMultiAction: '取消',
      selectAll: '全选', unselectAll: '取消全选', prevMail: '上一封', nextMail: '下一封',
      keywordQueryTip: '过滤', query: '查询',
    }
  }
});

const setupAutoRefresh = async (autoRefresh) => {
  autoRefreshInterval.value = configAutoRefreshInterval.value;
  if (autoRefresh) {
    clearInterval(timer.value);
    timer.value = setInterval(async () => {
      if (loading.value) return;
      autoRefreshInterval.value--;
      if (autoRefreshInterval.value <= 0) {
        autoRefreshInterval.value = configAutoRefreshInterval.value;
        await backFirstPageAndRefresh();
      }
    }, 1000)
  } else {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, async (val) => { setupAutoRefresh(val) }, { immediate: true })
watch([page, pageSize], async () => { await refresh(); })
// 当从移动端切换到桌面端时，关闭抽屉
watch(isMobile, (val) => { if (!val) showMailDrawer.value = false; })

const refresh = async () => {
  try {
    const { results, count: totalCount } = await props.fetchMailData(pageSize.value, (page.value - 1) * pageSize.value);
    loading.value = true;
    rawData.value = await Promise.all(results.map(async (item) => {
      item.checked = false;
      return await processItem(item);
    }));
    if (totalCount > 0) count.value = totalCount;
    curMail.value = null;
    if (!isMobile.value && data.value.length > 0) curMail.value = data.value[0];
  } catch (error) {
    message.error(error.message || "error");
  } finally {
    loading.value = false;
  }
};

const backFirstPageAndRefresh = async () => { page.value = 1; await refresh(); }

const clickRow = async (row) => {
  if (multiActionMode.value) { row.checked = !row.checked; return; }
  curMail.value = row;
  if (isMobile.value) showMailDrawer.value = true;
};

const mailItemClass = (row) => {
  return curMail.value && row.id == curMail.value.id ? 'selected-mail' : '';
};

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id);
    message.success(t("success"));
    curMail.value = null;
    await refresh();
  } catch (error) {
    message.error(error.message || "error");
  }
};

const replyMail = async () => {
  const emailRegex = /(.+?) <(.+?)>/;
  let toMail = curMail.value.originalSource;
  let toName = ""
  const match = emailRegex.exec(curMail.value.source);
  if (match) { toName = match[1]; toMail = match[2]; }
  Object.assign(sendMailModel.value, {
    toName, toMail, subject: `${t('reply')}: ${curMail.value.subject}`,
    contentType: 'rich',
    content: curMail.value.text ? `<p><br></p><blockquote>${curMail.value.text}</blockquote>` : '',
  });
  indexTab.value = 'sendmail';
};

const forwardMail = async () => {
  Object.assign(sendMailModel.value, {
    subject: `${t('forwardMail')}: ${curMail.value.subject}`,
    contentType: curMail.value.message ? 'html' : 'text',
    content: curMail.value.message || curMail.value.text,
  });
  indexTab.value = 'sendmail';
};

const saveToS3Proxy = async (filename, blob) => { await props.saveToS3(curMail.value.id, filename, blob); }

const multiActionModeClick = (enable) => {
  data.value.forEach((item) => { item.checked = false; });
  multiActionMode.value = enable;
}

const multiActionSelectAll = (checked) => { data.value.forEach((item) => { item.checked = checked; }); }

const multiActionDeleteMail = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) { message.error(t('pleaseSelectMail')); return; }
    multiActionDeleteProgress.value = { percentage: 0, tip: `0/${selectedMails.length}` };
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id);
      showMultiActionDelete.value = true;
      multiActionDeleteProgress.value = {
        percentage: Math.floor((index + 1) / selectedMails.length * 100),
        tip: `${index + 1}/${selectedMails.length}`
      };
    }
    message.success(t("success"));
    await refresh();
  } catch (error) {
    message.error(error.message || "error");
  } finally {
    loading.value = false;
  }
}

const multiActionDownload = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) { message.error(t('pleaseSelectMail')); return; }
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default;
    const zip = new JSZip();
    for (const mail of selectedMails) { zip.file(`${mail.id}.eml`, mail.raw); }
    multiActionDownloadZip.value = {
      url: URL.createObjectURL(await zip.generateAsync({ type: "blob" })),
      filename: `mails-${new Date().toISOString().replace(/:/g, '-')}.zip`
    }
    showMultiActionDownload.value = true;
  } catch (error) {
    message.error(error.message || "error");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => { await refresh(); });
onBeforeUnmount(() => { clearInterval(timer.value) })
</script>

<template>
  <div>
    <!-- Desktop View -->
    <div v-if="!isMobile">
      <div class="mb-4">
        <v-row v-if="multiActionMode" align="center" dense>
          <v-col cols="auto"><v-btn @click="multiActionModeClick(false)" variant="text">{{ t('cancelMultiAction') }}</v-btn></v-col>
          <v-col cols="auto"><v-btn @click="multiActionSelectAll(true)" variant="text">{{ t('selectAll') }}</v-btn></v-col>
          <v-col cols="auto"><v-btn @click="multiActionSelectAll(false)" variant="text">{{ t('unselectAll') }}</v-btn></v-col>
          <v-col cols="auto" v-if="enableUserDeleteEmail">
            <v-btn color="error" variant="text" @click="deleteConfirmDialog = true">{{ t('delete') }}</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn color="info" variant="text" @click="multiActionDownload">
              <v-icon start>mdi-download</v-icon>{{ t('downloadMail') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-else align="center" dense>
          <v-col cols="auto"><v-btn @click="multiActionModeClick(true)" color="primary" variant="text">{{ t('multiAction') }}</v-btn></v-col>
          <v-col cols="auto">
            <v-pagination v-model="page" :length="Math.ceil(count / pageSize)" density="compact" size="small"></v-pagination>
          </v-col>
          <v-col cols="auto">
            <v-switch v-model="autoRefresh" density="compact" hide-details color="primary"
              :label="autoRefresh ? t('refreshAfter', { msg: autoRefreshInterval }) : t('autoRefresh')"></v-switch>
          </v-col>
          <v-col cols="auto"><v-btn @click="backFirstPageAndRefresh" color="primary" variant="text">{{ t('refresh') }}</v-btn></v-col>
          <v-col v-if="showFilterInput" cols="3">
            <v-text-field v-model="localFilterKeyword" :placeholder="t('keywordQueryTip')" 
              variant="outlined" density="compact" hide-details clearable></v-text-field>
          </v-col>
        </v-row>
      </div>

      <div class="d-flex" style="gap: 16px;">
        <div style="width: 33%; max-height: 70vh; overflow-y: auto;">
          <v-list lines="three">
            <v-list-item v-for="row in data" :key="row.id" @click="clickRow(row)" :class="mailItemClass(row)">
              <template v-slot:prepend v-if="multiActionMode">
                <v-checkbox-btn v-model="row.checked"></v-checkbox-btn>
              </template>
              <v-list-item-title>{{ row.subject }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip size="x-small" class="mr-1">ID: {{ row.id }}</v-chip>
                <v-chip size="x-small" class="mr-1">{{ utcToLocalDate(row.created_at, useUTCDate) }}</v-chip>
                <v-chip size="x-small">{{ row.source }}</v-chip>
                <AiExtractInfo :metadata="row.metadata" compact />
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
        <div style="flex: 1;">
          <div v-if="curMail" class="d-flex justify-space-between mb-2">
            <v-btn @click="prevMail" :disabled="!canGoPrevMail" variant="text" size="small">
              <v-icon start>mdi-chevron-left</v-icon>{{ t('prevMail') }}
            </v-btn>
            <v-btn @click="nextMail" :disabled="!canGoNextMail" variant="text" size="small">
              {{ t('nextMail') }}<v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
          <v-card v-if="curMail" flat style="max-height: 70vh; overflow-y: auto;">
            <v-card-title>{{ curMail.subject }}</v-card-title>
            <v-card-text>
              <MailContentRenderer :mail="curMail" :showEMailTo="showEMailTo"
                :enableUserDeleteEmail="enableUserDeleteEmail" :showReply="showReply" :showSaveS3="showSaveS3"
                :onDelete="deleteMail" :onReply="replyMail" :onForward="forwardMail" :onSaveToS3="saveToS3Proxy" />
            </v-card-text>
          </v-card>
          <v-card v-else flat class="d-flex align-center justify-center" style="min-height: 200px;">
            <v-card-text class="text-center">{{ t('pleaseSelectMail') }}</v-card-text>
          </v-card>
        </div>
      </div>
    </div>

    <!-- Mobile View -->
    <div v-else>
      <v-row align="center" dense class="mb-2">
        <v-col cols="auto">
          <v-pagination v-model="page" :length="Math.ceil(count / pageSize)" density="compact" size="small"></v-pagination>
        </v-col>
        <v-col cols="auto">
          <v-switch v-model="autoRefresh" density="compact" hide-details size="small"
            :label="autoRefresh ? `${autoRefreshInterval}s` : t('autoRefresh')"></v-switch>
        </v-col>
        <v-col cols="auto"><v-btn @click="backFirstPageAndRefresh" size="small" variant="text">{{ t('refresh') }}</v-btn></v-col>
      </v-row>
      <v-text-field v-if="showFilterInput" v-model="localFilterKeyword" :placeholder="t('keywordQueryTip')"
        variant="outlined" density="compact" hide-details clearable class="mb-2"></v-text-field>

      <v-list lines="three" style="max-height: 70vh; overflow-y: auto;">
        <v-list-item v-for="row in data" :key="row.id" @click="clickRow(row)">
          <v-list-item-title>{{ row.subject }}</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip size="x-small" class="mr-1">{{ utcToLocalDate(row.created_at, useUTCDate) }}</v-chip>
            <v-chip size="x-small">{{ row.source }}</v-chip>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>

    <!-- Mobile Mail Drawer - 只在移动端显示 -->
    <v-bottom-sheet v-if="isMobile" v-model="showMailDrawer" inset content-class="mobile-mail-sheet">
      <v-card v-if="curMail" variant="flat" :border="false" class="bg-surface">
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-truncate" style="max-width: 80%;">{{ curMail.subject }}</span>
          <v-btn icon variant="text" size="small" @click="showMailDrawer = false; curMail = null"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <MailContentRenderer :mail="curMail" :showEMailTo="showEMailTo"
            :enableUserDeleteEmail="enableUserDeleteEmail" :showReply="showReply" :showSaveS3="showSaveS3"
            :onDelete="deleteMail" :onReply="replyMail" :onForward="forwardMail" :onSaveToS3="saveToS3Proxy" />
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <!-- Dialogs -->
    <v-dialog v-model="showMultiActionDownload" max-width="400">
      <v-card>
        <v-card-title>{{ t('downloadMail') }}</v-card-title>
        <v-card-text>
          <v-chip class="mb-2">{{ multiActionDownloadZip.filename }}</v-chip>
          <v-btn :href="multiActionDownloadZip.url" :download="multiActionDownloadZip.filename" color="info" block>
            <v-icon start>mdi-download</v-icon>{{ t('downloadMail') }} zip
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showMultiActionDelete" max-width="300">
      <v-card>
        <v-card-title>{{ t('delete') }}</v-card-title>
        <v-card-text class="text-center">
          <v-progress-circular :model-value="multiActionDeleteProgress.percentage" color="error" size="80">
            {{ multiActionDeleteProgress.tip }}
          </v-progress-circular>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteConfirmDialog" max-width="300">
      <v-card>
        <v-card-title>{{ t('delete') }}</v-card-title>
        <v-card-text>{{ t('deleteMailTip') }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteConfirmDialog = false; multiActionDeleteMail()">{{ t('delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<style scoped>
.selected-mail { background-color: rgba(var(--v-theme-primary), 0.1); }
</style>

<style>
/* 移动端邮件底部弹出层 - 修复圆角露出底色问题 */
.mobile-mail-sheet {
  background: transparent !important;
}
.mobile-mail-sheet > .v-bottom-sheet {
  background: transparent !important;
}
.mobile-mail-sheet .v-card {
  background-color: rgb(var(--v-theme-surface)) !important;
}
</style>
