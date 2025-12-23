<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// @ts-ignore
import { api } from '../../api'

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text: string, color: string = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            init: 'Init',
            successTip: 'Success',
            status: 'Check Status',
            enableTelegramAllowList: 'Enable Telegram Allow List(Manually input Chat ID)',
            enable: 'Enable',
            telegramAllowList: 'Telegram Allow List(Manually input telegram Chat ID)',
            manualInputPrompt: 'Type and press Enter to add',
            save: 'Save',
            miniAppUrl: 'Telegram Mini App URL',
            enableGlobalMailPush: 'Enable Global Mail Push(Manually input telegram Chat ID)',
            globalMailPushList: 'Global Mail Push Chat ID List',
            globalMailPushListTip: 'Support chat_id of private chat/group/channel. You can send a message to your bot, then visit this link to see chat_id, https://api.telegram.org/bot<Replace with your BOT TOKEN>/getUpdates',
        },
        zh: {
            init: '初始化',
            successTip: '成功',
            status: '查看状态',
            enableTelegramAllowList: '启用 Telegram 白名单(手动输入 Chat ID, 回车增加)',
            enable: '启用',
            telegramAllowList: 'Telegram 白名单(手动输入 Chat ID, 回车增加)',
            manualInputPrompt: '输入后按回车键添加',
            save: '保存',
            miniAppUrl: '电报小程序 URL(请输入你部署的电报小程序网页地址)',
            enableGlobalMailPush: '启用全局邮件推送(手动输入邮箱管理员的 telegram Chat ID, 回车增加)',
            globalMailPushList: '全局邮件推送 Chat ID 列表',
            globalMailPushListTip: '支持对话/群组/频道的 Chat ID, 您可以发送一条消息给您的机器人，然后访问此链接来查看 chat_id, https://api.telegram.org/bot<这里替换成您的 BOT TOKEN>/getUpdates',
        }
    }
});

const status = ref<any>({ fetched: false })

const fetchStatus = async () => {
    try {
        const res = await api.fetch(`/admin/telegram/status`)
        Object.assign(status.value, res)
        status.value.fetched = true
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

const init = async () => {
    try {
        await api.fetch(`/admin/telegram/init`, { method: 'POST' })
        showMessage(t('successTip'))
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

class TelegramSettings {
    enableAllowList: boolean = false;
    allowList: string[] = [];
    miniAppUrl: string = '';
    enableGlobalMailPush: boolean = false;
    globalMailPushList: string[] = [];
}

const settings = ref(new TelegramSettings())

const getSettings = async () => {
    try {
        const res = await api.fetch(`/admin/telegram/settings`)
        Object.assign(settings.value, res)
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

const saveSettings = async () => {
    try {
        await api.fetch(`/admin/telegram/settings`, {
            method: 'POST',
            body: JSON.stringify(settings.value),
        })
        showMessage(t('successTip'))
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

onMounted(async () => {
    await getSettings();
})
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-actions class="justify-end">
                <v-btn @click="fetchStatus" variant="outlined">{{ t('status') }}</v-btn>
                <v-btn @click="init" color="primary" variant="outlined">{{ t('init') }}</v-btn>
                <v-btn @click="saveSettings" color="primary">{{ t('save') }}</v-btn>
            </v-card-actions>
            <v-card-text>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('enableTelegramAllowList') }}</div>
                    <div class="d-flex align-center ga-2">
                        <v-checkbox v-model="settings.enableAllowList" :label="t('enable')" hide-details
                            style="flex: 0 0 auto;" />
                        <v-combobox v-model="settings.allowList" :placeholder="t('telegramAllowList')" multiple chips
                            closable-chips variant="outlined" density="compact" hide-details />
                    </div>
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('enableGlobalMailPush') }}</div>
                    <div class="d-flex align-center ga-2">
                        <v-checkbox v-model="settings.enableGlobalMailPush" :label="t('enable')" hide-details
                            style="flex: 0 0 auto;" />
                        <v-combobox v-model="settings.globalMailPushList" :placeholder="t('globalMailPushList')"
                            multiple chips closable-chips variant="outlined" density="compact" hide-details />
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">{{ t('globalMailPushListTip') }}</div>
                </div>
                <v-text-field v-model="settings.miniAppUrl" :label="t('miniAppUrl')" variant="outlined"
                    density="compact" />
                <pre v-if="status.fetched" class="mt-4">{{ JSON.stringify(status, null, 2) }}</pre>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
