<script setup>
import { defineAsyncComponent, onMounted, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'

import AddressBar from './index/AddressBar.vue';
import MailBox from '../components/MailBox.vue';
import SendBox from '../components/SendBox.vue';
import AutoReply from './index/AutoReply.vue';
import AccountSettings from './index/AccountSettings.vue';
import Appearance from './common/Appearance.vue';
import Webhook from './index/Webhook.vue';
import Attachment from './index/Attachment.vue';
import About from './common/About.vue';
import SimpleIndex from './index/SimpleIndex.vue';

const { loading, settings, openSettings, indexTab, useSimpleIndex } = useGlobalState()
const route = useRoute()
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
  info: (text) => showMessage(text, 'info'),
  success: (text) => showMessage(text, 'success'),
}

const SendMail = defineAsyncComponent(() => {
  loading.value = true;
  return import('./index/SendMail.vue')
    .finally(() => loading.value = false);
});

const { t } = useI18n({
  messages: {
    en: {
      mailbox: 'Mail Box',
      sendbox: 'Send Box',
      sendmail: 'Send Mail',
      auto_reply: 'Auto Reply',
      accountSettings: 'Account Settings',
      appearance: 'Appearance',
      about: 'About',
      s3Attachment: 'S3 Attachment',
      saveToS3Success: 'save to s3 success',
      webhookSettings: 'Webhook Settings',
      query: 'Query',
      enterSimpleMode: 'Simple Mode',
    },
    zh: {
      mailbox: '收件箱',
      sendbox: '发件箱',
      sendmail: '发送邮件',
      auto_reply: '自动回复',
      accountSettings: '账户',
      appearance: '外观',
      about: '关于',
      s3Attachment: 'S3附件',
      saveToS3Success: '保存到s3成功',
      webhookSettings: 'Webhook 设置',
      query: '查询',
      enterSimpleMode: '极简模式',
    }
  }
});

const fetchMailData = async (limit, offset) => {
  if (mailIdQuery.value > 0) {
    const singleMail = await api.fetch(`/api/mail/${mailIdQuery.value}`);
    if (singleMail) return { results: [singleMail], count: 1 };
    return { results: [], count: 0 };
  }
  return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`);
};

const deleteMail = async (curMailId) => {
  await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' });
};

const deleteSenboxMail = async (curMailId) => {
  await api.fetch(`/api/sendbox/${curMailId}`, { method: 'DELETE' });
};

const fetchSenboxData = async (limit, offset) => {
  return await api.fetch(`/api/sendbox?limit=${limit}&offset=${offset}`);
};

const saveToS3 = async (mail_id, filename, blob) => {
  try {
    const { url } = await api.fetch(`/api/attachment/put_url`, {
      method: 'POST',
      body: JSON.stringify({ key: `${mail_id}/${filename}` })
    });
    const formData = new FormData();
    formData.append(filename, blob);
    await fetch(url, {
      method: 'PUT',
      body: formData
    });
    message.success(t('saveToS3Success'));
  } catch (error) {
    console.error(error);
    message.error(error.message || "save to s3 error");
  }
}

const mailBoxKey = ref("")
const mailIdQuery = ref("")
const showMailIdQuery = ref(false)

const queryMail = () => {
  mailBoxKey.value = Date.now();
}

watch(route, () => {
  if (!route.query.mail_id) {
    showMailIdQuery.value = false;
    mailIdQuery.value = "";
    queryMail();
  }
})

onMounted(() => {
  if (route.query.mail_id) {
    showMailIdQuery.value = true;
    mailIdQuery.value = route.query.mail_id;
    queryMail();
  }
})
</script>

<template>
  <div>
    <div v-if="useSimpleIndex">
      <SimpleIndex />
    </div>
    <div v-else>
      <AddressBar />
      <v-card v-if="settings.address" class="mt-4">
        <v-tabs v-model="indexTab" color="primary" grow>
          <v-tab value="mailbox">
            <v-icon start>mdi-inbox</v-icon>
            {{ t('mailbox') }}
          </v-tab>
          <v-tab value="sendbox">
            <v-icon start>mdi-send</v-icon>
            {{ t('sendbox') }}
          </v-tab>
          <v-tab value="sendmail">
            <v-icon start>mdi-email-edit</v-icon>
            {{ t('sendmail') }}
          </v-tab>
          <v-tab value="accountSettings">
            <v-icon start>mdi-account-cog</v-icon>
            {{ t('accountSettings') }}
          </v-tab>
          <v-tab value="appearance">
            <v-icon start>mdi-palette</v-icon>
            {{ t('appearance') }}
          </v-tab>
          <v-tab v-if="openSettings.enableAutoReply" value="auto_reply">
            <v-icon start>mdi-reply-all</v-icon>
            {{ t('auto_reply') }}
          </v-tab>
          <v-tab v-if="openSettings.enableWebhook" value="webhook">
            <v-icon start>mdi-webhook</v-icon>
            {{ t('webhookSettings') }}
          </v-tab>
          <v-tab v-if="openSettings.isS3Enabled" value="s3_attachment">
            <v-icon start>mdi-attachment</v-icon>
            {{ t('s3Attachment') }}
          </v-tab>
          <v-tab v-if="openSettings.enableIndexAbout" value="about">
            <v-icon start>mdi-information</v-icon>
            {{ t('about') }}
          </v-tab>
        </v-tabs>

        <v-btn v-if="!isMobile" variant="text" size="small" class="ma-2" @click="useSimpleIndex = true">
          <v-icon start>mdi-fullscreen-exit</v-icon>
          {{ t('enterSimpleMode') }}
        </v-btn>

        <v-window v-model="indexTab">
          <v-window-item value="mailbox">
            <v-card-text>
              <div v-if="showMailIdQuery" class="mb-4">
                <v-text-field v-model="mailIdQuery" variant="outlined" density="compact" hide-details
                  append-inner-icon="mdi-magnify" @click:append-inner="queryMail">
                </v-text-field>
              </div>
              <MailBox :key="mailBoxKey" :showEMailTo="false" :showReply="true" :showSaveS3="openSettings.isS3Enabled"
                :saveToS3="saveToS3" :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
                :fetchMailData="fetchMailData" :deleteMail="deleteMail" :showFilterInput="true" />
            </v-card-text>
          </v-window-item>

          <v-window-item value="sendbox">
            <v-card-text>
              <SendBox :fetchMailData="fetchSenboxData" :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
                :deleteMail="deleteSenboxMail" />
            </v-card-text>
          </v-window-item>

          <v-window-item value="sendmail">
            <v-card-text>
              <SendMail />
            </v-card-text>
          </v-window-item>

          <v-window-item value="accountSettings">
            <v-card-text>
              <AccountSettings />
            </v-card-text>
          </v-window-item>

          <v-window-item value="appearance">
            <v-card-text>
              <Appearance :showUseSimpleIndex="true" />
            </v-card-text>
          </v-window-item>

          <v-window-item v-if="openSettings.enableAutoReply" value="auto_reply">
            <v-card-text>
              <AutoReply />
            </v-card-text>
          </v-window-item>

          <v-window-item v-if="openSettings.enableWebhook" value="webhook">
            <v-card-text>
              <Webhook />
            </v-card-text>
          </v-window-item>

          <v-window-item v-if="openSettings.isS3Enabled" value="s3_attachment">
            <v-card-text>
              <Attachment />
            </v-card-text>
          </v-window-item>

          <v-window-item v-if="openSettings.enableIndexAbout" value="about">
            <v-card-text>
              <About />
            </v-card-text>
          </v-window-item>
        </v-window>
      </v-card>
    </div>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>
