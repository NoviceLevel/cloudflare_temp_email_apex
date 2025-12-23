<script setup>
import { useI18n } from 'vue-i18n'
import { onMounted, ref } from 'vue'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const sourcePrefix = ref("")
const enableAutoReply = ref(false)
const autoReplyMessage = ref("")
const subject = ref("")
const name = ref("")

const { settings } = useGlobalState()

const { t } = useI18n({
    locale: 'zh',
    messages: {
        en: {
            success: 'Success',
            settings: 'Settings',
            sourcePrefix: 'Source Mail Prefix',
            name: 'Name',
            enableAutoReply: 'Enable Auto Reply',
            subject: 'Subject',
            autoReply: 'Auto Reply',
            save: 'Save',
        },
        zh: {
            success: '成功',
            settings: '设置',
            sourcePrefix: '来源邮件前缀',
            name: '名称',
            enableAutoReply: '启用自动回复',
            subject: '主题',
            autoReply: '自动回复',
            save: '保存',
        }
    }
});

const fetchData = async () => {
    try {
        const res = await api.fetch("/api/auto_reply")
        sourcePrefix.value = res.source_prefix || ""
        enableAutoReply.value = res.enabled || false
        name.value = res.name || ""
        autoReplyMessage.value = res.message || ""
        subject.value = res.subject || ""
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const saveData = async () => {
    try {
        await api.fetch("/api/auto_reply", {
            method: "POST",
            body: JSON.stringify({
                auto_reply: {
                    enabled: enableAutoReply.value,
                    source_prefix: sourcePrefix.value,
                    name: name.value,
                    message: autoReplyMessage.value,
                    subject: subject.value,
                }
            })
        })
        showMessage(t("success"))
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div class="d-flex justify-center">
        <v-card v-if="settings.address" variant="flat" max-width="800" width="100%">
            <v-card-title class="d-flex justify-space-between align-center">
                {{ t('settings') }}
                <v-btn color="primary" @click="saveData">{{ t('save') }}</v-btn>
            </v-card-title>
            <v-card-text>
                <v-switch v-model="enableAutoReply" :label="t('enableAutoReply')" color="primary" hide-details
                    class="mb-4" />
                <v-text-field v-model="name" :label="t('name')" :disabled="!enableAutoReply" variant="outlined"
                    density="compact" class="mb-3" />
                <v-text-field v-model="sourcePrefix" :label="t('sourcePrefix')" :disabled="!enableAutoReply"
                    variant="outlined" density="compact" class="mb-3" />
                <v-text-field v-model="subject" :label="t('subject')" :disabled="!enableAutoReply" variant="outlined"
                    density="compact" class="mb-3" />
                <v-textarea v-model="autoReplyMessage" :label="t('autoReply')" :disabled="!enableAutoReply"
                    variant="outlined" rows="4" />
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
