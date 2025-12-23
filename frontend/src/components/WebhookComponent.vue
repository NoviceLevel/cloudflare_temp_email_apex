<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
    fetchData: {
        type: Function,
        default: () => { },
        required: true
    },
    saveSettings: {
        type: Function,
        default: (webhookSettings: WebhookSettings) => { },
        required: true
    },
    testSettings: {
        type: Function,
        default: (webhookSettings: WebhookSettings) => { },
        required: true
    },
})

const snackbar = ref({ show: false, text: '', color: 'success' })

const showMessage = (text: string, color: string = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            successTip: 'Success',
            test: 'Test',
            save: 'Save',
            notEnabled: 'Webhook is not enabled for you',
            urlMissing: 'URL is required',
            enable: 'Enable',
            messagePusherDemo: 'Fill with Message Pusher Demo',
            messagePusherDoc: 'Message Pusher Doc',
            fillInDemoTip: 'Please modify the URL and other settings to your own',
        },
        zh: {
            successTip: '成功',
            test: '测试',
            save: '保存',
            notEnabled: 'Webhook 未开启，请联系管理员开启',
            urlMissing: 'URL 不能为空',
            enable: '启用',
            messagePusherDemo: '填入MessagePusher示例',
            messagePusherDoc: 'MessagePusher文档',
            fillInDemoTip: '请修改URL和其他设置为您自己的配置',
        }
    }
});

class WebhookSettings {
    enabled: boolean = false
    url: string = ''
    method: string = 'POST'
    headers: string = JSON.stringify({}, null, 2)
    body: string = JSON.stringify({}, null, 2)
}

const messagePusherDocLink = "https://github.com/songquanpeng/message-pusher";

const messagePusherDemo = {
    enabled: true,
    url: 'https://msgpusher.com/push/username',
    method: 'POST',
    headers: JSON.stringify({
        'Content-Type': 'application/json',
    }, null, 2),
    body: JSON.stringify({
        "token": "token",
        "title": "${subject}",
        "description": "${subject}",
        "content": "*${subject}*\n\nFrom: ${from}\nTo: ${to}\n\n${parsedText}\n"
    }, null, 2),
} as WebhookSettings;

const fillMessagePuhserDemo = () => {
    Object.assign(webhookSettings.value, messagePusherDemo)
    showMessage(t('fillInDemoTip'), 'info')
}

const webhookSettings = ref<WebhookSettings>(new WebhookSettings())
const enableWebhook = ref(false)
const methodOptions = [{ title: 'POST', value: 'POST' }]

const fetchData = async () => {
    try {
        const res = await props.fetchData()
        Object.assign(webhookSettings.value, res)
        enableWebhook.value = true
    } catch (error) {
        showMessage((error as Error).message || "error", 'error')
    }
}

const saveSettings = async () => {
    if (!webhookSettings.value.url) {
        showMessage(t('urlMissing'), 'error')
        return
    }
    try {
        await props.saveSettings(webhookSettings.value)
        showMessage(t('successTip'))
    } catch (error) {
        showMessage((error as Error).message || "error", 'error')
    }
}

const testSettings = async () => {
    if (!webhookSettings.value.url) {
        showMessage(t('urlMissing'), 'error')
        return
    }
    try {
        await props.testSettings(webhookSettings.value)
        showMessage(t('successTip'))
    } catch (error) {
        showMessage((error as Error).message || "error", 'error')
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="d-flex justify-center align-center">
        <v-card v-if="enableWebhook" variant="flat" max-width="800" width="100%">
            <v-card-actions class="justify-end flex-wrap ga-2">
                <v-btn :href="messagePusherDocLink" target="_blank" variant="outlined">
                    {{ t('messagePusherDoc') }}
                </v-btn>
                <v-btn @click="fillMessagePuhserDemo" variant="outlined">
                    {{ t('messagePusherDemo') }}
                </v-btn>
                <v-btn v-if="webhookSettings.enabled" @click="testSettings" variant="outlined">
                    {{ t('test') }}
                </v-btn>
                <v-btn @click="saveSettings" color="primary">
                    {{ t('save') }}
                </v-btn>
            </v-card-actions>
            <v-card-text>
                <v-switch v-model="webhookSettings.enabled" :label="t('enable')" color="primary" hide-details />
                <div v-if="webhookSettings.enabled" class="mt-4">
                    <v-text-field v-model="webhookSettings.url" label="URL" variant="outlined" density="compact"
                        class="mb-3" />
                    <v-select v-model="webhookSettings.method" label="METHOD" :items="methodOptions" variant="outlined"
                        density="compact" class="mb-3" />
                    <v-textarea v-model="webhookSettings.headers" label="HEADERS" variant="outlined" rows="3"
                        auto-grow class="mb-3" />
                    <v-textarea v-model="webhookSettings.body" label="BODY" variant="outlined" rows="3" auto-grow />
                </div>
            </v-card-text>
        </v-card>
        <v-empty-state v-else icon="mdi-alert-circle-outline" :title="t('notEnabled')" />
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
