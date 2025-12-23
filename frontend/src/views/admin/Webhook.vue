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
            successTip: 'Success',
            enableAllowList: 'Enable Allow List (Restrict webhook access to specific users)',
            webhookAllowList: 'Webhook Allow List(Enter the mail address that is allowed to use webhook and enter)',
            manualInputPrompt: 'Type and press Enter to add',
            save: 'Save',
            notEnabled: 'Webhook is not enabled',
        },
        zh: {
            successTip: '成功',
            enableAllowList: '启用白名单 (限制 webhook 访问权限，只有白名单中的用户可以使用)',
            webhookAllowList: 'Webhook 白名单(请输入允许使用webhook 的邮箱地址, 回车增加)',
            manualInputPrompt: '输入后按回车键添加',
            save: '保存',
            notEnabled: 'Webhook 未开启',
        }
    }
});

class WebhookSettings {
    enableAllowList: boolean = false;
    allowList: string[] = [];
}

const webhookSettings = ref(new WebhookSettings())
const webhookEnabled = ref(false)
const errorInfo = ref('')

const getSettings = async () => {
    try {
        const res = await api.fetch(`/admin/webhook/settings`)
        Object.assign(webhookSettings.value, res)
        webhookEnabled.value = true
    } catch (error) {
        errorInfo.value = (error as Error).message || "error";
    }
}

const saveSettings = async () => {
    try {
        await api.fetch(`/admin/webhook/settings`, {
            method: 'POST',
            body: JSON.stringify(webhookSettings.value),
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
        <v-card v-if="webhookEnabled" variant="flat" max-width="800" width="100%">
            <v-card-actions class="justify-end">
                <v-btn @click="saveSettings" color="primary">{{ t('save') }}</v-btn>
            </v-card-actions>
            <v-card-text>
                <v-switch v-model="webhookSettings.enableAllowList" :label="t('enableAllowList')" color="primary"
                    hide-details class="mb-4" />
                <v-combobox v-model="webhookSettings.allowList" :label="t('webhookAllowList')" multiple chips
                    closable-chips variant="outlined" density="compact" />
            </v-card-text>
        </v-card>
        <v-empty-state v-else icon="mdi-alert-circle-outline" :title="t('notEnabled')" :description="errorInfo" />

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
