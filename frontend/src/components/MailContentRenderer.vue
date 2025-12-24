<script setup>
import { ref } from "vue";
import { useI18n } from 'vue-i18n'
import ShadowHtmlComponent from "./ShadowHtmlComponent.vue";
import AiExtractInfo from "./AiExtractInfo.vue";
import { getDownloadEmlUrl } from '../utils/email-parser';
import { utcToLocalDate } from '../utils';
import { useGlobalState } from '../store';

const { preferShowTextMail, useIframeShowMail, useUTCDate } = useGlobalState();

const { t } = useI18n({
  messages: {
    en: {
      delete: 'Delete', deleteMailTip: 'This action cannot be undone. The email will be permanently removed.', attachments: 'Attachments',
      downloadMail: 'Download', reply: 'Reply', forward: 'Forward',
      showTextMail: 'Text', showHtmlMail: 'HTML', saveToS3: 'Save S3',
      size: 'Size', fullscreen: 'Fullscreen',
    },
    zh: {
      delete: '删除', deleteMailTip: '此操作无法撤销，邮件将被永久删除。', attachments: '附件',
      downloadMail: '下载', reply: '回复', forward: '转发',
      showTextMail: '纯文本', showHtmlMail: 'HTML', saveToS3: '保存S3',
      size: '大小', fullscreen: '全屏',
    }
  }
});

const props = defineProps({
  mail: { type: Object, required: true },
  showEMailTo: { type: Boolean, default: true },
  enableUserDeleteEmail: { type: Boolean, default: false },
  showReply: { type: Boolean, default: false },
  showSaveS3: { type: Boolean, default: false },
  onDelete: { type: Function, default: () => { } },
  onReply: { type: Function, default: () => { } },
  onForward: { type: Function, default: () => { } },
  onSaveToS3: { type: Function, default: () => { } }
});

const showTextMail = ref(preferShowTextMail.value);
const showAttachments = ref(false);
const curAttachments = ref([]);
const attachmentLoading = ref(false);
const showFullscreen = ref(false);
const deleteConfirmDialog = ref(false);

const handleDelete = () => { props.onDelete(); };
const handleViewAttachments = () => { curAttachments.value = props.mail.attachments; showAttachments.value = true; };
const handleReply = () => { props.onReply(); };
const handleForward = () => { props.onForward(); };

const handleSaveToS3 = async (filename, blob) => {
  attachmentLoading.value = true;
  try { await props.onSaveToS3(filename, blob); } finally { attachmentLoading.value = false; }
};
</script>

<template>
  <div class="mail-content-renderer">
    <!-- 邮件头信息 -->
    <div class="mail-meta mb-3">
      <div class="text-body-2"><strong>发件人：</strong>{{ mail.source }}</div>
      <div class="text-body-2"><strong>发送时间：</strong>{{ utcToLocalDate(mail.created_at, useUTCDate.value) }}</div>
      <div v-if="showEMailTo" class="text-body-2"><strong>收件人：</strong>{{ mail.address }}</div>
      <div class="text-body-2"><strong>主题：</strong>{{ mail.subject }}</div>
    </div>

    <!-- 操作按钮 -->
    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-btn v-if="enableUserDeleteEmail" size="small" color="error" variant="text" @click="deleteConfirmDialog = true">
        {{ t('delete') }}
      </v-btn>

      <v-btn :href="getDownloadEmlUrl(mail.raw)" :download="mail.id + '.eml'" size="small" color="info" variant="text">
        <v-icon start>mdi-download</v-icon>{{ t('downloadMail') }}
      </v-btn>

      <v-btn v-if="showReply" size="small" color="info" variant="text" @click="handleReply">
        <v-icon start>mdi-reply</v-icon>{{ t('reply') }}
      </v-btn>

      <v-btn v-if="showReply" size="small" color="info" variant="text" @click="handleForward">
        <v-icon start>mdi-forward</v-icon>{{ t('forward') }}
      </v-btn>

      <v-btn size="small" color="info" variant="text" @click="showTextMail = !showTextMail">
        {{ showTextMail ? t('showHtmlMail') : t('showTextMail') }}
      </v-btn>

      <v-btn size="small" color="info" variant="text" @click="showFullscreen = true">
        <v-icon start>mdi-fullscreen</v-icon>{{ t('fullscreen') }}
      </v-btn>

      <v-btn v-if="mail.attachments && mail.attachments.length > 0" size="small" color="info" variant="text"
        @click="handleViewAttachments">
        {{ t('attachments') }}
      </v-btn>
    </div>

    <AiExtractInfo :metadata="mail.metadata" />

    <div class="mail-content">
      <pre v-if="showTextMail" class="mail-text">{{ mail.text }}</pre>
      <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="mail-iframe"></iframe>
      <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" class="mail-html" />
    </div>
  </div>

  <v-dialog v-model="showFullscreen" fullscreen>
    <v-card flat rounded="0">
      <v-card-title class="d-flex align-center">
        <span class="text-truncate flex-grow-1 mr-2">{{ mail.subject }}</span>
        <v-btn icon variant="text" @click="showFullscreen = false" class="flex-shrink-0"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text class="fullscreen-mail-content">
        <pre v-if="showTextMail" class="mail-text">{{ mail.text }}</pre>
        <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="mail-iframe"></iframe>
        <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" class="mail-html" />
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showAttachments" max-width="500">
    <v-card>
      <v-card-title>{{ t('attachments') }}</v-card-title>
      <v-card-text>
        <v-overlay :model-value="attachmentLoading" contained class="align-center justify-center">
          <v-progress-circular indeterminate></v-progress-circular>
        </v-overlay>
        <v-list>
          <v-list-item v-for="row in curAttachments" :key="row.id">
            <v-list-item-title>{{ row.filename }}</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip size="x-small">{{ t('size') }}: {{ row.size }}</v-chip>
              <v-btn v-if="showSaveS3" @click="handleSaveToS3(row.filename, row.blob)" size="x-small" variant="text">
                {{ t('saveToS3') }}
              </v-btn>
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn :href="row.url" :download="row.filename" icon size="small" variant="text">
                <v-icon>mdi-download</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteConfirmDialog" max-width="320">
    <v-card rounded="xl" class="pa-4">
      <div class="d-flex flex-column align-center text-center">
        <v-icon size="32" color="error" class="mb-4">mdi-delete-outline</v-icon>
        <div class="text-h6 mb-2">{{ t('delete') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ t('deleteMailTip') }}</div>
        <div class="d-flex ga-2">
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn variant="text" color="error" @click="deleteConfirmDialog = false; handleDelete()">{{ t('delete') }}</v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mail-content-renderer { display: flex; flex-direction: column; gap: 10px; }
.mail-meta { background: rgba(var(--v-theme-surface-variant), 0.3); padding: 12px; border-radius: 8px; }
.mail-content { margin-top: 10px; flex: 1; }
.mail-text { white-space: pre-wrap; word-wrap: break-word; margin: 0; padding: 0; }
.mail-iframe { width: 100%; height: 100%; border: none; min-height: 400px; }
.mail-html { width: 100%; height: 100%; }
.fullscreen-mail-content { height: calc(100vh - 120px); overflow: auto; }
.fullscreen-mail-content .mail-iframe { min-height: calc(100vh - 120px); }
</style>
