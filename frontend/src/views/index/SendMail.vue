<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useI18n } from 'vue-i18n'
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import AdminContact from '../common/AdminContact.vue'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const isPreview = ref(false)
const editorRef = shallowRef()

const { settings, sendMailModel, indexTab, userSettings } = useGlobalState()

const { t } = useI18n({
    locale: 'zh',
    messages: {
        en: {
            successSend: 'Please check your sendbox. If failed, please check your balance or try again later.',
            fromName: 'Your Name and Address, leave Name blank to use email address',
            toName: 'Recipient Name and Address, leave Name blank to use email address',
            subject: 'Subject',
            options: 'Options',
            edit: 'Edit',
            preview: 'Preview',
            content: 'Content',
            send: 'Send',
            requestAccess: 'Request Access',
            requestAccessTip: 'You need to request access to send mail, if have request, please contact admin.',
            send_balance: 'Send Mail Balance Left',
            text: 'Text',
            html: 'HTML',
            'rich text': 'Rich Text',
            tooLarge: 'Too large file, please upload file less than 1MB.',
            success: 'Success',
        },
        zh: {
            successSend: '请查看您的发件箱, 如果失败, 请检查您的余额或稍后重试。',
            fromName: '你的名称和地址，名称不填写则使用邮箱地址',
            toName: '收件人名称和地址，名称不填写则使用邮箱地址',
            subject: '主题',
            options: '选项',
            edit: '编辑',
            preview: '预览',
            content: '内容',
            send: '发送',
            requestAccess: '申请权限',
            requestAccessTip: '您需要申请权限才能发送邮件, 如果已经申请过, 请联系管理员提升额度。',
            send_balance: '剩余发送邮件额度',
            text: '文本',
            html: 'HTML',
            'rich text': '富文本',
            tooLarge: '文件过大, 请上传小于1MB的文件。',
            success: '成功',
        }
    }
});

const contentTypes = [
    { title: t('text'), value: 'text' },
    { title: t('html'), value: 'html' },
    { title: t('rich text'), value: 'rich' },
]

const send = async () => {
    try {
        await api.fetch(`/api/send_mail`, {
            method: 'POST',
            body: JSON.stringify({
                from_name: sendMailModel.value.fromName,
                to_name: sendMailModel.value.toName,
                to_mail: sendMailModel.value.toMail,
                subject: sendMailModel.value.subject,
                is_html: sendMailModel.value.contentType != 'text',
                content: sendMailModel.value.content,
            })
        })
        sendMailModel.value = {
            fromName: "",
            toName: "",
            toMail: "",
            subject: "",
            contentType: 'text',
            content: "",
        }
    } catch (error) {
        showMessage(error.message || "error", 'error');
    } finally {
        showMessage(t("successSend"));
        indexTab.value = 'sendbox'
    }
}

const requestAccess = async () => {
    try {
        await api.fetch(`/api/requset_send_mail_access`, {
            method: 'POST',
            body: JSON.stringify({})
        })
        showMessage(t("success"))
        await api.getSettings();
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const toolbarConfig = {
    excludeKeys: ["uploadVideo"]
}

const editorConfig = {
    MENU_CONF: {
        'uploadImage': {
            async customUpload() {
                showMessage(t('tooLarge'), 'error')
            },
            maxFileSize: 1 * 1024 * 1024,
            base64LimitSize: 1 * 1024 * 1024,
        }
    }
}

onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor) => {
    editorRef.value = editor;
}

onMounted(async () => {
    if (!userSettings.value.user_id) await api.getUserSettings(snackbar);
    await api.getSettings();
})
</script>

<template>
    <div class="d-flex justify-center" v-if="settings.address">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <div v-if="!settings.send_balance || settings.send_balance <= 0">
                    <v-alert type="warning" variant="tonal" class="mb-3">
                        {{ t('requestAccessTip') }}
                        <v-btn color="primary" variant="tonal" size="small" @click="requestAccess" class="ml-2">
                            {{ t('requestAccess') }}
                        </v-btn>
                    </v-alert>
                    <AdminContact />
                </div>
                <div v-else>
                    <v-alert type="info" variant="tonal" closable class="mb-3">
                        {{ t('send_balance') }}: {{ settings.send_balance }}
                    </v-alert>
                    <div class="d-flex justify-end mb-4">
                        <v-btn color="primary" @click="send">{{ t('send') }}</v-btn>
                    </div>
                    <v-text-field :label="t('fromName')" variant="outlined" density="compact" class="mb-3">
                        <template #prepend-inner>
                            <v-text-field v-model="sendMailModel.fromName" variant="plain" density="compact"
                                hide-details single-line style="max-width: 150px;" />
                        </template>
                        <template #default>
                            <span class="text-medium-emphasis">{{ settings.address }}</span>
                        </template>
                    </v-text-field>
                    <div class="d-flex ga-2 mb-3">
                        <v-text-field v-model="sendMailModel.toName" :label="t('toName')" variant="outlined"
                            density="compact" hide-details />
                        <v-text-field v-model="sendMailModel.toMail" label="Email" variant="outlined" density="compact"
                            hide-details />
                    </div>
                    <v-text-field v-model="sendMailModel.subject" :label="t('subject')" variant="outlined"
                        density="compact" class="mb-3" />
                    <div class="d-flex align-center ga-2 mb-3">
                        <span class="text-subtitle-2">{{ t('options') }}:</span>
                        <v-btn-toggle v-model="sendMailModel.contentType" mandatory color="primary" variant="outlined"
                            density="compact">
                            <v-btn v-for="option in contentTypes" :key="option.value" :value="option.value" size="small">
                                {{ option.title }}
                            </v-btn>
                        </v-btn-toggle>
                        <v-btn v-if="sendMailModel.contentType != 'text'" @click="isPreview = !isPreview"
                            variant="outlined" size="small">
                            {{ isPreview ? t('edit') : t('preview') }}
                        </v-btn>
                    </div>
                    <div class="mb-3">
                        <div class="text-subtitle-2 mb-2">{{ t('content') }}</div>
                        <v-card v-if="isPreview" variant="tonal">
                            <v-card-text v-html="sendMailModel.content" />
                        </v-card>
                        <div v-else-if="sendMailModel.contentType == 'rich'" style="border: 1px solid #ccc">
                            <Toolbar style="border-bottom: 1px solid #ccc" :defaultConfig="toolbarConfig"
                                :editor="editorRef" mode="default" />
                            <Editor style="height: 500px; overflow-y: hidden;" v-model="sendMailModel.content"
                                :defaultConfig="editorConfig" mode="default" @onCreated="handleCreated" />
                        </div>
                        <v-textarea v-else v-model="sendMailModel.content" variant="outlined" rows="5" />
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
