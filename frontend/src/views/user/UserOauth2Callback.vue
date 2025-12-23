<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router';

import { useGlobalState } from '../../store'
import { api } from '../../api';

const {
    userJwt, userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'error' })
const showMessage = (text, color = 'error') => {
    snackbar.value = { show: true, text, color }
}

const route = useRoute()
const router = useRouter()
const errorInfo = ref('')

const { t } = useI18n({
    messages: {
        en: {
            logging: 'Logging in...',
            stateNotMatch: 'state not match',
        },
        zh: {
            logging: '登录中...',
            stateNotMatch: 'state 不匹配',
        }
    }
});

onMounted(async () => {
    const state = route.query.state;
    if (state != userOauth2SessionState.value) {
        console.error('state not match');
        showMessage(t('stateNotMatch'));
        return;
    }
    const code = route.query.code;
    if (!code) {
        console.error('code not found');
        showMessage('code not found');
        return;
    }
    try {
        const res = await api.fetch(`/user_api/oauth2/callback`, {
            method: 'POST',
            body: JSON.stringify({
                code: code,
                clientID: userOauth2SessionClientID.value
            })
        });
        userJwt.value = res.jwt;
        router.push('/user');
    } catch (error) {
        console.error(error);
        showMessage(error.message || 'error');
    }
});
</script>

<template>
    <v-card variant="flat">
        <v-card-text class="text-center">
            <v-progress-circular indeterminate color="primary" class="mb-4" />
            <div class="text-h6">{{ t('logging') }}</div>
            <div v-if="errorInfo" class="text-error mt-2">{{ errorInfo }}</div>
        </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.text }}
    </v-snackbar>
</template>
