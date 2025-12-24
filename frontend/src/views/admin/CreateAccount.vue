<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, openSettings } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            address: 'Address',
            enablePrefix: 'If enable Prefix',
            creatNewEmail: 'Create New Email',
            fillInAllFields: 'Please fill in all fields',
            successTip: 'Success Created',
            addressCredential: 'Mail Address Credential',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login to your email account.',
            addressPassword: 'Address Password',
            linkWithAddressCredential: 'Open to auto login email link',
        },
        zh: {
            address: '地址',
            enablePrefix: '是否启用前缀',
            creatNewEmail: '创建新邮箱',
            fillInAllFields: '请填写完整信息',
            successTip: '创建成功',
            addressCredential: '邮箱地址凭证',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            addressPassword: '地址密码',
            linkWithAddressCredential: '打开即可自动登录邮箱的链接',
        }
    }
});

const enablePrefix = ref(true)
const emailName = ref("")
const emailDomain = ref("")
const showResultModal = ref(false)
const result = ref("")
const addressPassword = ref("")
const createdAddress = ref("")
const showAutoLoginLink = ref(false)

const newEmail = async () => {
    if (!emailName.value || !emailDomain.value) {
        showMessage(t('fillInAllFields'), 'error')
        return
    }
    try {
        const res = await api.fetch(`/admin/new_address`, {
            method: 'POST',
            body: JSON.stringify({
                enablePrefix: enablePrefix.value,
                name: emailName.value,
                domain: emailDomain.value,
            })
        })
        result.value = res["jwt"];
        addressPassword.value = res["password"] || '';
        createdAddress.value = res["address"] || '';
        showMessage(t('successTip'))
        showResultModal.value = true
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const getUrlWithJwt = () => {
    return `${window.location.origin}/?jwt=${result.value}`
}

const domainOptions = ref([])

onMounted(async () => {
    if (openSettings.prefix) {
        enablePrefix.value = true
    }
    // domains 可能是字符串数组或对象数组
    const domains = openSettings.value.domains || []
    domainOptions.value = domains.map(d => typeof d === 'string' ? { label: d, value: d } : d)
    emailDomain.value = domainOptions.value[0]?.value || ""
})
</script>

<template>
    <div class="d-flex justify-center my-5">
        <v-card variant="flat" max-width="600" width="100%">
            <v-card-text>
                <v-switch v-if="openSettings.prefix" v-model="enablePrefix" :label="t('enablePrefix')" color="primary"
                    hide-details class="mb-4" />
                <div class="d-flex align-center ga-2 mb-4">
                    <span v-if="enablePrefix && openSettings.prefix" class="text-body-1">{{ openSettings.prefix }}</span>
                    <v-text-field v-model="emailName" variant="outlined" density="compact" hide-details />
                    <span>@</span>
                    <v-select v-model="emailDomain" :items="domainOptions" item-title="label" item-value="value"
                        variant="outlined" density="compact" hide-details style="max-width: 200px;" />
                </div>
                <v-btn @click="newEmail" color="primary" block :loading="loading">
                    {{ t('creatNewEmail') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <v-dialog v-model="showResultModal" max-width="600">
            <v-card>
                <v-card-title>{{ t('addressCredential') }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t("addressCredentialTip") }}</p>
                    <v-card variant="tonal" class="mb-3">
                        <v-card-text>
                            <strong style="word-break: break-all;">{{ result }}</strong>
                        </v-card-text>
                    </v-card>
                    <v-card v-if="addressPassword" variant="tonal" class="mb-3">
                        <v-card-text>
                            <p><strong>{{ createdAddress }}</strong></p>
                            <p>{{ t('addressPassword') }}: <strong>{{ addressPassword }}</strong></p>
                        </v-card-text>
                    </v-card>
                    <v-expansion-panels>
                        <v-expansion-panel :title="t('linkWithAddressCredential')">
                            <v-expansion-panel-text>
                                <strong style="word-break: break-all;">{{ getUrlWithJwt() }}</strong>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
