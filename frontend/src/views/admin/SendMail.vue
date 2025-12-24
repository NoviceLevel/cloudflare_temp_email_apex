<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useI18n } from 'vue-i18n'
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { api } from '../../api'
import { useGlobalState } from '../../store'

const { showSnackbar } = useGlobalState()
const isPreview = ref(false)
const editorRef = shallowRef()

const sendMailModel = useSessionStorage('sendMailByAdminModel', {
    fromName: "",
    fromMail: "",
    toName: "",
    toMail: "",
    subject: "",
    contentType: 'text',
    content: "",
});

const { t } = useI18n({
    locale: 'zh',
    messages: {
        en: {
            successSend: 'Please check your sendbox. If failed, please try again later.',
            fromName: 'Your Name and Address, leave Name blank to use email address',
            toName: 'Recipient Name and Address, leave Name blank to use email address',
            subject: 'Subject',
            options: 'Options',
            edit: 'Edit',
            preview: 'Preview',
            content: 'Content',
            send: 'Send',
            text: 'Text',
            html: 'HTML',
            'rich text': 'Rich Text',
            tooLarge: 'Too large file, please upload file less than 1MB.',
        },
        zh: {
            successSend: '请查看您的发件箱, 如果失败, 请检查稍后重试。',
            fromName: '你的名称和地址，名称不填写则使用邮箱地址',
            toName: '收件人名称和地址，名称不填写则使用邮箱地址',
            subject: '主题',
            options: '选项',
            edit: '编辑',
            preview: '预览',
            content: '内容',
            send: '发送',
            text: '文本',
            html: 'HTML',
            'rich text': '富文本',
            tooLarge: '文件过大, 请上传小于1MB的文件。',
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
        await api.fetch(`/admin/send_mail`, {
            method: 'POST',
            body: JSON.stringify({
                from_name: sendMailModel.value.fromName,
                from_mail: sendMailModel.value.fromMail,
                to_name: sendMailModel.value.toName,
                to_mail: sendMailModel.value.toMail,
                subject: sendMailModel.value.subject,
                is_html: sendMailModel.value.contentType != 'text',
                content: sendMailModel.value.content,
            })
        })
        sendMailModel.value = {
            fromName: "",
            fromMail: "",
            toName: "",
            toMail: "",
            subject: "",
            contentType: 'text',
            content: "",
        }
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        showSnackbar(t("successSend"), 'success')
    }
}

const toolbarConfig = {
    excludeKeys: ["uploadVideo"]
}

const editorConfig = {
    MENU_CONF: {
        'uploadImage': {
            async customUpload() {
                showSnackbar(t('tooLarge'), 'error')
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
</script>

<template>
    <div class="center">
        <v-card variant="flat" max-width="800" width="100%" class="pa-4">
            <div class="d-flex justify-end mb-4">
                <v-btn color="primary" @click="send">{{ t('send') }}</v-btn>
            </div>
            <v-form class="text-left">
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('fromName') }}</div>
                    <div class="d-flex ga-2">
                        <v-text-field v-model="sendMailModel.fromName" variant="outlined" density="compact" hide-details class="flex-grow-1"></v-text-field>
                        <v-text-field v-model="sendMailModel.fromMail" variant="outlined" density="compact" hide-details class="flex-grow-1"></v-text-field>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('toName') }}</div>
                    <div class="d-flex ga-2">
                        <v-text-field v-model="sendMailModel.toName" variant="outlined" density="compact" hide-details class="flex-grow-1"></v-text-field>
                        <v-text-field v-model="sendMailModel.toMail" variant="outlined" density="compact" hide-details class="flex-grow-1"></v-text-field>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('subject') }}</div>
                    <v-text-field v-model="sendMailModel.subject" variant="outlined" density="compact" hide-details></v-text-field>
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('options') }}</div>
                    <div class="d-flex align-center ga-2 flex-wrap">
                        <v-btn v-for="option in contentTypes" :key="option.value" 
                            :variant="sendMailModel.contentType === option.value ? 'tonal' : 'outlined'"
                            @click="sendMailModel.contentType = option.value">
                            {{ option.title }}
                        </v-btn>
                        <v-btn v-if="sendMailModel.contentType != 'text'" variant="outlined" @click="isPreview = !isPreview">
                            {{ isPreview ? t('edit') : t('preview') }}
                        </v-btn>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('content') }}</div>
                    <v-card v-if="isPreview" variant="tonal" class="pa-4">
                        <div v-html="sendMailModel.content"></div>
                    </v-card>
                    <div v-else-if="sendMailModel.contentType == 'rich'" style="border: 1px solid #ccc">
                        <Toolbar style="border-bottom: 1px solid #ccc" :defaultConfig="toolbarConfig" :editor="editorRef" mode="default" />
                        <Editor style="height: 500px; overflow-y: hidden;" v-model="sendMailModel.content" :defaultConfig="editorConfig" mode="default" @onCreated="handleCreated" />
                    </div>
                    <v-textarea v-else v-model="sendMailModel.content" variant="outlined" density="compact" rows="3" auto-grow></v-textarea>
                </div>
            </v-form>
        </v-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: center;
    place-items: center;
    justify-content: center;
}
</style>
