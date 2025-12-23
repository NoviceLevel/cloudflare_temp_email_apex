<script setup>
import { computed, onMounted, ref, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../store'
import { api } from '../api'

import SenderAccess from './admin/SenderAccess.vue'
import Statistics from "./admin/Statistics.vue"
import SendBox from './admin/SendBox.vue';
import Account from './admin/Account.vue';
import CreateAccount from './admin/CreateAccount.vue';
import AccountSettings from './admin/AccountSettings.vue';
import UserManagement from './admin/UserManagement.vue';
import UserSettings from './admin/UserSettings.vue';
import UserOauth2Settings from './admin/UserOauth2Settings.vue';
import RoleAddressConfig from './admin/RoleAddressConfig.vue';
import Mails from './admin/Mails.vue';
import MailsUnknow from './admin/MailsUnknow.vue';
import About from './common/About.vue';
import Maintenance from './admin/Maintenance.vue';
import DatabaseManager from './admin/DatabaseManager.vue';
import Appearance from './common/Appearance.vue';
import Telegram from './admin/Telegram.vue';
import Webhook from './admin/Webhook.vue';
import MailWebhook from './admin/MailWebhook.vue';
import WorkerConfig from './admin/WorkerConfig.vue';
import IpBlacklistSettings from './admin/IpBlacklistSettings.vue';
import AiExtractSettings from './admin/AiExtractSettings.vue';

const {
  adminAuth, showAdminAuth, adminTab, loading,
  globalTabplacement, showAdminPage, userSettings
} = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'error' })

const SendMail = defineAsyncComponent(() => {
  loading.value = true;
  return import('./admin/SendMail.vue')
    .finally(() => loading.value = false);
});

const authFunc = async () => {
  try {
    adminAuth.value = tmpAdminAuth.value;
    location.reload()
  } catch (error) {
    snackbar.value = { show: true, text: error.message || "error", color: 'error' }
  }
}

const { t } = useI18n({
  messages: {
    en: {
      accessHeader: 'Admin Password',
      accessTip: 'Please enter the admin password',
      mails: 'Emails',
      sendMail: 'Send Mail',
      qucickSetup: 'Quick Setup',
      account: 'Account',
      account_create: 'Create Account',
      account_settings: 'Account Settings',
      user: 'User',
      user_management: 'User Management',
      user_settings: 'User Settings',
      userOauth2Settings: 'Oauth2 Settings',
      roleAddressConfig: 'Role Address Config',
      unknow: 'Mails with unknow receiver',
      senderAccess: 'Sender Access Control',
      sendBox: 'Send Box',
      telegram: 'Telegram Bot',
      webhookSettings: 'Webhook Settings',
      statistics: 'Statistics',
      maintenance: 'Maintenance',
      database: 'Database',
      workerconfig: 'Worker Config',
      ipBlacklistSettings: 'IP Blacklist',
      aiExtractSettings: 'AI Extract Settings',
      appearance: 'Appearance',
      about: 'About',
      ok: 'OK',
      mailWebhook: 'Mail Webhook',
    },
    zh: {
      accessHeader: 'Admin 密码',
      accessTip: '请输入 Admin 密码',
      mails: '邮件',
      sendMail: '发送邮件',
      qucickSetup: '快速设置',
      account: '账号',
      account_create: '创建账号',
      account_settings: '账号设置',
      user: '用户',
      user_management: '用户管理',
      user_settings: '用户设置',
      userOauth2Settings: 'Oauth2 设置',
      roleAddressConfig: '角色地址配置',
      unknow: '无收件人邮件',
      senderAccess: '发件权限控制',
      sendBox: '发件箱',
      telegram: '电报机器人',
      webhookSettings: 'Webhook 设置',
      statistics: '统计',
      maintenance: '维护',
      database: '数据库',
      workerconfig: 'Worker 配置',
      ipBlacklistSettings: 'IP 黑名单',
      aiExtractSettings: 'AI 提取设置',
      appearance: '外观',
      about: '关于',
      ok: '确定',
      mailWebhook: '邮件 Webhook',
    }
  }
});

const showAdminPasswordModal = computed(() => !showAdminPage.value || showAdminAuth.value)
const tmpAdminAuth = ref('')

// Sub tabs
const quickSetupTab = ref('database')
const accountTab = ref('account')
const userTab = ref('user_management')
const mailsTab = ref('mails')
const maintenanceTab = ref('database')

onMounted(async () => {
  if (!userSettings.value.user_id) await api.getUserSettings(snackbar);
})
</script>

<template>
  <div v-if="userSettings.fetched">
    <v-dialog v-model="showAdminPasswordModal" persistent max-width="400">
      <v-card>
        <v-card-title>{{ t('accessHeader') }}</v-card-title>
        <v-card-text>
          <p class="mb-4">{{ t('accessTip') }}</p>
          <v-text-field v-model="tmpAdminAuth" type="password" variant="outlined" density="compact"
            :append-inner-icon="'mdi-eye'" @click:append-inner="() => { }" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="authFunc" color="primary" :loading="loading">
            {{ t('ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-tabs v-if="showAdminPage" v-model="adminTab" :direction="globalTabplacement === 'left' || globalTabplacement === 'right' ? 'vertical' : 'horizontal'"
      color="primary" class="mb-4">
      <v-tab value="qucickSetup">{{ t('qucickSetup') }}</v-tab>
      <v-tab value="account">{{ t('account') }}</v-tab>
      <v-tab value="user">{{ t('user') }}</v-tab>
      <v-tab value="mails">{{ t('mails') }}</v-tab>
      <v-tab value="telegram">{{ t('telegram') }}</v-tab>
      <v-tab value="statistics">{{ t('statistics') }}</v-tab>
      <v-tab value="maintenance">{{ t('maintenance') }}</v-tab>
      <v-tab value="appearance">{{ t('appearance') }}</v-tab>
      <v-tab value="about">{{ t('about') }}</v-tab>
    </v-tabs>

    <v-window v-if="showAdminPage" v-model="adminTab">
      <v-window-item value="qucickSetup">
        <v-tabs v-model="quickSetupTab" centered color="primary" class="mb-4">
          <v-tab value="database">{{ t('database') }}</v-tab>
          <v-tab value="account_settings">{{ t('account_settings') }}</v-tab>
          <v-tab value="user_settings">{{ t('user_settings') }}</v-tab>
          <v-tab value="workerconfig">{{ t('workerconfig') }}</v-tab>
        </v-tabs>
        <v-window v-model="quickSetupTab">
          <v-window-item value="database"><DatabaseManager /></v-window-item>
          <v-window-item value="account_settings"><AccountSettings /></v-window-item>
          <v-window-item value="user_settings"><UserSettings /></v-window-item>
          <v-window-item value="workerconfig"><WorkerConfig /></v-window-item>
        </v-window>
      </v-window-item>

      <v-window-item value="account">
        <v-tabs v-model="accountTab" centered color="primary" class="mb-4">
          <v-tab value="account">{{ t('account') }}</v-tab>
          <v-tab value="account_create">{{ t('account_create') }}</v-tab>
          <v-tab value="account_settings">{{ t('account_settings') }}</v-tab>
          <v-tab value="senderAccess">{{ t('senderAccess') }}</v-tab>
          <v-tab value="ipBlacklistSettings">{{ t('ipBlacklistSettings') }}</v-tab>
          <v-tab value="aiExtractSettings">{{ t('aiExtractSettings') }}</v-tab>
          <v-tab value="webhook">{{ t('webhookSettings') }}</v-tab>
        </v-tabs>
        <v-window v-model="accountTab">
          <v-window-item value="account"><Account /></v-window-item>
          <v-window-item value="account_create"><CreateAccount /></v-window-item>
          <v-window-item value="account_settings"><AccountSettings /></v-window-item>
          <v-window-item value="senderAccess"><SenderAccess /></v-window-item>
          <v-window-item value="ipBlacklistSettings"><IpBlacklistSettings /></v-window-item>
          <v-window-item value="aiExtractSettings"><AiExtractSettings /></v-window-item>
          <v-window-item value="webhook"><Webhook /></v-window-item>
        </v-window>
      </v-window-item>

      <v-window-item value="user">
        <v-tabs v-model="userTab" centered color="primary" class="mb-4">
          <v-tab value="user_management">{{ t('user_management') }}</v-tab>
          <v-tab value="user_settings">{{ t('user_settings') }}</v-tab>
          <v-tab value="userOauth2Settings">{{ t('userOauth2Settings') }}</v-tab>
          <v-tab value="roleAddressConfig">{{ t('roleAddressConfig') }}</v-tab>
        </v-tabs>
        <v-window v-model="userTab">
          <v-window-item value="user_management"><UserManagement /></v-window-item>
          <v-window-item value="user_settings"><UserSettings /></v-window-item>
          <v-window-item value="userOauth2Settings"><UserOauth2Settings /></v-window-item>
          <v-window-item value="roleAddressConfig"><RoleAddressConfig /></v-window-item>
        </v-window>
      </v-window-item>

      <v-window-item value="mails">
        <v-tabs v-model="mailsTab" centered color="primary" class="mb-4">
          <v-tab value="mails">{{ t('mails') }}</v-tab>
          <v-tab value="unknow">{{ t('unknow') }}</v-tab>
          <v-tab value="sendBox">{{ t('sendBox') }}</v-tab>
          <v-tab value="sendMail">{{ t('sendMail') }}</v-tab>
          <v-tab value="mailWebhook">{{ t('mailWebhook') }}</v-tab>
        </v-tabs>
        <v-window v-model="mailsTab">
          <v-window-item value="mails"><Mails /></v-window-item>
          <v-window-item value="unknow"><MailsUnknow /></v-window-item>
          <v-window-item value="sendBox"><SendBox /></v-window-item>
          <v-window-item value="sendMail"><SendMail /></v-window-item>
          <v-window-item value="mailWebhook"><MailWebhook /></v-window-item>
        </v-window>
      </v-window-item>

      <v-window-item value="telegram"><Telegram /></v-window-item>
      <v-window-item value="statistics"><Statistics /></v-window-item>

      <v-window-item value="maintenance">
        <v-tabs v-model="maintenanceTab" centered color="primary" class="mb-4">
          <v-tab value="database">{{ t('database') }}</v-tab>
          <v-tab value="workerconfig">{{ t('workerconfig') }}</v-tab>
          <v-tab value="maintenance">{{ t('maintenance') }}</v-tab>
        </v-tabs>
        <v-window v-model="maintenanceTab">
          <v-window-item value="database"><DatabaseManager /></v-window-item>
          <v-window-item value="workerconfig"><WorkerConfig /></v-window-item>
          <v-window-item value="maintenance"><Maintenance /></v-window-item>
        </v-window>
      </v-window-item>

      <v-window-item value="appearance"><Appearance /></v-window-item>
      <v-window-item value="about"><About /></v-window-item>
    </v-window>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
