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
