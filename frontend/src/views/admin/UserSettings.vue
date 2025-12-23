<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            save: 'Save',
            successTip: 'Save Success',
            enable: 'Enable',
            enableUserRegister: 'Allow User Register',
            enableMailVerify: 'Enable Mail Verify (Send address must be an address in the system with a balance and can send mail normally)',
            verifyMailSender: 'Verify Mail Sender',
            enableMailAllowList: 'Enable Mail Address Allow List(Manually enterable)',
            manualInputPrompt: 'Type and press Enter to add',
            mailAllowList: 'Mail Address Allow List',
            maxAddressCount: 'Maximum number of email addresses that can be binded',
        },
        zh: {
            save: '保存',
            successTip: '保存成功',
            enable: '启用',
            enableUserRegister: "允许用户注册",
            enableMailVerify: '启用邮件验证(发送地址必须是系统中能有余额且能正常发送邮件的地址)',
            verifyMailSender: '验证邮件发送地址',
            enableMailAllowList: '启用邮件地址白名单(可手动输入, 回车增加)',
            manualInputPrompt: '输入后按回车键添加',
            mailAllowList: '邮件地址白名单',
            maxAddressCount: '可绑定最大邮箱地址数量',
        }
    }
});

const commonMail = [
    "gmail.com", "163.com", "126.com", "qq.com", "outlook.com", "hotmail.com",
    "icloud.com", "yahoo.com", "foxmail.com"
]

const userSettings = ref({
    enable: false,
    enableMailVerify: false,
    verifyMailSender: "",
    enableMailAllowList: false,
    mailAllowList: commonMail,
    maxAddressCount: 5,
});

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/user_settings`)
        Object.assign(userSettings.value, res)
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const save = async () => {
    try {
        await api.fetch(`/admin/user_settings`, {
            method: 'POST',
            body: JSON.stringify(userSettings.value)
        })
        showMessage(t('successTip'))
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="600" width="100%">
            <v-card-actions class="justify-end">
                <v-btn @click="save" color="primary" :loading="loading">{{ t('save') }}</v-btn>
            </v-card-actions>
            <v-card-text>
                <v-switch v-model="userSettings.enable" :label="t('enableUserRegister')" color="primary" hide-details
                    class="mb-4" />
                <div class="mb-4">
                    <div class="d-flex align-center ga-2">
                        <v-checkbox v-model="userSettings.enableMailVerify" :label="t('enable')" hide-details
                            style="flex: 0 0 auto;" />
                        <v-text-field v-if="userSettings.enableMailVerify" v-model="userSettings.verifyMailSender"
                            :placeholder="t('verifyMailSender')" variant="outlined" density="compact" hide-details />
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">{{ t('enableMailVerify') }}</div>
                </div>
                <div class="mb-4">
                    <div class="d-flex align-center ga-2">
                        <v-checkbox v-model="userSettings.enableMailAllowList" :label="t('enable')" hide-details
                            style="flex: 0 0 auto;" />
                        <v-combobox v-if="userSettings.enableMailAllowList" v-model="userSettings.mailAllowList"
                            :placeholder="t('mailAllowList')" multiple chips closable-chips variant="outlined"
                            density="compact" hide-details />
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">{{ t('enableMailAllowList') }}</div>
                </div>
                <v-text-field v-model.number="userSettings.maxAddressCount" :label="t('maxAddressCount')" type="number"
                    variant="outlined" density="compact" />
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
