<script setup>
import useClipboard from 'vue-clipboard3'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import AddressManagement from '../user/AddressManagement.vue'
import TelegramAddress from './TelegramAddress.vue'
import LocalAddress from './LocalAddress.vue'
import { getRouterPathWithLang } from '../../utils'

const { toClipboard } = useClipboard()
const router = useRouter()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')

const showMessage = (text, color = 'info') => {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
}

const {
    jwt, settings, showAddressCredential, userJwt,
    isTelegram, openSettings, addressPassword
} = useGlobalState()

const { locale, t } = useI18n({
    messages: {
        en: {
            addressManage: 'Address Manage',
            changeAddress: 'Change Address',
            ok: 'OK',
            copy: 'Copy',
            copied: 'Copied',
            fetchAddressError: 'Mail address credential is invalid or account not exist, it may be network connection issue, please try again later.',
            addressCredential: 'Mail Address Credential',
            linkWithAddressCredential: 'Open to auto login email link',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login to your email account.',
            addressPassword: 'Address Password',
            userLogin: 'User Login',
        },
        zh: {
            addressManage: '地址管理',
            changeAddress: '更换地址',
            ok: '确定',
            copy: '复制',
            copied: '已复制',
            fetchAddressError: '邮箱地址凭证无效或邮箱地址不存在，也可能是网络连接异常，请稍后再尝试。',
            addressCredential: '邮箱地址凭证',
            linkWithAddressCredential: '打开即可自动登录邮箱的链接',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            addressPassword: '地址密码',
            userLogin: '用户登录',
        }
    }
});

const showChangeAddress = ref(false)
const showTelegramChangeAddress = ref(false)
const showLocalAddress = ref(false)
const addressLabel = computed(() => {
    if (settings.value.address) {
        const domain = settings.value.address.split('@')[1]
        const domainLabel = openSettings.value.domains.find(
            d => d.value === domain
        )?.label;
        if (!domainLabel) return settings.value.address;
        return settings.value.address.replace('@' + domain, `@${domainLabel}`);
    }
    return settings.value.address;
})

const copy = async () => {
    try {
        await toClipboard(settings.value.address)
        showMessage(t('copied'), 'success')
    } catch (e) {
        showMessage(e.message || "error", 'error')
    }
}

const getUrlWithJwt = () => {
    return `${window.location.origin}/?jwt=${jwt.value}`
}

const onUserLogin = async () => {
    await router.push(getRouterPathWithLang("/user", locale.value))
}

onMounted(async () => {
    await api.getSettings();
});
</script>

<template>
    <div>
        <v-card v-if="!settings.fetched" flat>
            <v-skeleton-loader type="card" height="200"></v-skeleton-loader>
        </v-card>
        <div v-else-if="settings.address">
            <v-alert type="info" variant="tonal" class="my-2 text-center">
                <span>
                    <b>{{ addressLabel }}</b>
                    <v-btn v-if="isTelegram" class="ml-2" size="small" variant="tonal" color="primary"
                        @click="showTelegramChangeAddress = true">
                        <v-icon start>mdi-swap-horizontal</v-icon>
                        {{ t('addressManage') }}
                    </v-btn>
                    <v-btn v-else-if="userJwt" class="ml-2" size="small" variant="tonal" color="primary"
                        @click="showChangeAddress = true">
                        <v-icon start>mdi-swap-horizontal</v-icon>
                        {{ t('changeAddress') }}
                    </v-btn>
                    <v-btn v-else class="ml-2" size="small" variant="tonal" color="primary"
                        @click="showLocalAddress = true">
                        <v-icon start>mdi-swap-horizontal</v-icon>
                        {{ t('addressManage') }}
                    </v-btn>
                    <v-btn class="ml-2" size="small" variant="tonal" color="primary" @click="copy">
                        <v-icon start>mdi-content-copy</v-icon>
                        {{ t('copy') }}
                    </v-btn>
                </span>
            </v-alert>
        </div>
        <div v-else-if="isTelegram">
            <TelegramAddress />
        </div>
        <div v-else class="d-flex justify-center my-4">
            <v-card flat max-width="400" width="100%" class="pa-4">
                <v-alert v-if="jwt" type="warning" variant="tonal" closable class="mb-4">
                    {{ t('fetchAddressError') }}
                </v-alert>
                <Login />
                <v-divider class="my-4"></v-divider>
                <v-btn @click="onUserLogin" color="primary" variant="outlined" block>
                    <v-icon start>mdi-account</v-icon>
                    {{ t('userLogin') }}
                </v-btn>
            </v-card>
        </div>

        <!-- Telegram Change Address Dialog -->
        <v-dialog v-model="showTelegramChangeAddress" max-width="600">
            <v-card class="address-dialog-card">
                <v-card-title>{{ t('changeAddress') }}</v-card-title>
                <v-card-text>
                    <TelegramAddress />
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Change Address Dialog -->
        <v-dialog v-model="showChangeAddress" max-width="600">
            <v-card class="address-dialog-card">
                <v-card-title>{{ t('changeAddress') }}</v-card-title>
                <v-card-text>
                    <AddressManagement />
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Local Address Dialog -->
        <v-dialog v-model="showLocalAddress" max-width="600">
            <v-card class="address-dialog-card">
                <v-card-title>{{ t('changeAddress') }}</v-card-title>
                <v-card-text>
                    <LocalAddress />
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Address Credential Dialog -->
        <v-dialog v-model="showAddressCredential" max-width="600">
            <v-card>
                <v-card-title>{{ t('addressCredential') }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t("addressCredentialTip") }}</p>
                    <v-card variant="tonal" class="mb-2 pa-2">
                        <b>{{ jwt }}</b>
                    </v-card>
                    <v-card v-if="addressPassword" variant="tonal" class="mb-2 pa-2">
                        <p><b>{{ settings.address }}</b></p>
                        <p>{{ t('addressPassword') }}: <b>{{ addressPassword }}</b></p>
                    </v-card>
                    <v-expansion-panels>
                        <v-expansion-panel :title="t('linkWithAddressCredential')">
                            <v-expansion-panel-text>
                                <v-card variant="tonal" class="pa-2">
                                    <b>{{ getUrlWithJwt() }}</b>
                                </v-card>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
        </v-snackbar>
    </div>
</template>

<style scoped>
.address-dialog-card {
    overflow: visible !important;
}
.address-dialog-card :deep(.v-card-text) {
    overflow: visible !important;
}
</style>
