<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from './UserLogin.vue'

const snackbar = ref({ show: false, text: '', color: 'error' })

const {
    userSettings, userJwt, userOpenSettings
} = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            currentUser: 'Current Login User',
            fetchUserSettingsError: 'Login password is invalid or account not exist, it may be network connection issue, please try again later.',
        },
        zh: {
            currentUser: '当前登录用户',
            fetchUserSettingsError: '登录信息已过期或账号不存在，也可能是网络连接异常，请稍后再尝试。',
        }
    }
});

onMounted(async () => {
    await api.getUserOpenSettings(snackbar);
    if (!userSettings.value.user_id) await api.getUserSettings(snackbar);
});
</script>

<template>
    <div>
        <v-card v-if="!userSettings.fetched" variant="flat">
            <v-skeleton-loader type="card" height="50vh" />
        </v-card>
        <div v-else-if="userSettings.user_email">
            <v-alert type="success" variant="tonal" density="compact" class="text-center my-3">
                <strong>{{ t('currentUser') }}: {{ userSettings.user_email }}</strong>
            </v-alert>
        </div>
        <div v-else class="d-flex justify-center my-5">
            <v-card variant="flat" max-width="600" width="100%" class="login-card">
                <v-card-text>
                    <v-alert v-if="userJwt" type="warning" variant="tonal" closable class="mb-4">
                        {{ t('fetchUserSettingsError') }}
                    </v-alert>
                    <UserLogin />
                </v-card-text>
            </v-card>
        </div>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>

<style scoped>
.login-card {
    overflow: visible !important;
}
.login-card :deep(.v-card-text) {
    overflow: visible !important;
}
</style>
