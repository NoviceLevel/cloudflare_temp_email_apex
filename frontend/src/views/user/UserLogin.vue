<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from 'vue-i18n'
import { startAuthentication } from '@simplewebauthn/browser';

import { api } from '../../api';
import { useGlobalState } from '../../store'
import { hashPassword } from '../../utils';

import Turnstile from '../../components/Turnstile.vue';

const {
    userJwt, userOpenSettings, openSettings,
    userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            login: 'Login',
            register: 'Register',
            email: 'Email',
            password: 'Password',
            verifyCode: 'Verification Code',
            verifyCodeSent: 'Verification Code Sent, expires in {timeout} seconds',
            waitforVerifyCode: 'Wait for {timeout} seconds',
            sendVerificationCode: 'Send Verification Code',
            forgotPassword: 'Forgot Password',
            cannotForgotPassword: 'Mail verification is disabled or register is disabled, cannot reset password, please contact administrator',
            resetPassword: 'Reset Password',
            pleaseInput: 'Please input email and password',
            pleaseInputEmail: 'Please input email',
            pleaseInputCode: 'Please input code',
            pleaseCompleteTurnstile: 'Please complete turnstile',
            pleaseLogin: 'Please login',
            loginWithPasskey: 'Login with Passkey',
            loginWith: 'Login with {provider}',
            cancel: 'Cancel',
        },
        zh: {
            login: '登录',
            register: '注册',
            email: '邮箱',
            password: '密码',
            verifyCode: '验证码',
            sendVerificationCode: '发送验证码',
            verifyCodeSent: '验证码已发送, {timeout} 秒后失效',
            waitforVerifyCode: '等待{timeout}秒',
            forgotPassword: '忘记密码',
            cannotForgotPassword: '未开启邮箱验证或未开启注册功能，无法重置密码，请联系管理员',
            resetPassword: '重置密码',
            pleaseInput: '请输入邮箱和密码',
            pleaseInputEmail: '请输入邮箱',
            pleaseInputCode: '请输入验证码',
            pleaseCompleteTurnstile: '请完成人机验证',
            pleaseLogin: '请登录',
            loginWithPasskey: '使用 Passkey 登录',
            loginWith: '使用 {provider} 登录',
            cancel: '取消',
        }
    }
});

const tabValue = ref("signin");
const showModal = ref(false);
const user = ref({
    email: "",
    password: "",
    code: ""
});
const cfToken = ref("")

const emailLogin = async () => {
    if (!user.value.email || !user.value.password) {
        showMessage(t('pleaseInput'), 'error');
        return;
    }
    try {
        const res = await api.fetch(`/user_api/login`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                password: await hashPassword(user.value.password)
            })
        });
        userJwt.value = res.jwt;
        location.reload();
    } catch (error) {
        showMessage(error.message || "login failed", 'error');
    }
};

const verifyCodeExpire = ref(0);
const verifyCodeTimeout = ref(0);

const getVerifyCodeTimeout = () => {
    if (!verifyCodeExpire.value || verifyCodeExpire.value < new Date().getTime()) return 0;
    return Math.round((verifyCodeExpire.value - new Date().getTime()) / 1000);
};

const sendVerificationCode = async () => {
    if (!user.value.email) {
        showMessage(t('pleaseInputEmail'), 'error');
        return;
    }
    if (openSettings.value.cfTurnstileSiteKey && !cfToken.value && userOpenSettings.value.enableMailVerify) {
        showMessage(t('pleaseCompleteTurnstile'), 'error');
        return;
    }
    try {
        const res = await api.fetch(`/user_api/verify_code`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                cf_token: cfToken.value
            })
        });
        if (res && res.expirationTtl) {
            showMessage(t('verifyCodeSent', { timeout: res.expirationTtl }));
            verifyCodeExpire.value = new Date().getTime() + res.expirationTtl * 1000;
            const intervalId = setInterval(() => {
                verifyCodeTimeout.value = getVerifyCodeTimeout();
                if (verifyCodeTimeout.value <= 0) {
                    clearInterval(intervalId);
                    verifyCodeTimeout.value = 0;
                }
            }, 1000);
        }
    } catch (error) {
        showMessage(error.message || "send verification code failed", 'error');
    }
};

const emailSignup = async () => {
    if (!user.value.email || !user.value.password) {
        showMessage(t('pleaseInput'), 'error');
        return;
    }
    if (!user.value.code && userOpenSettings.value.enableMailVerify) {
        showMessage(t('pleaseInputCode'), 'error');
        return;
    }
    try {
        const res = await api.fetch(`/user_api/register`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                password: await hashPassword(user.value.password),
                code: user.value.code
            })
        });
        if (res) {
            tabValue.value = "signin";
            showMessage(t('pleaseLogin'));
        }
        showModal.value = false;
    } catch (error) {
        showMessage(error.message || "register failed", 'error');
    }
};

const passkeyLogin = async () => {
    try {
        const options = await api.fetch(`/user_api/passkey/authenticate_request`, {
            method: 'POST',
            body: JSON.stringify({
                domain: location.hostname,
            })
        })
        const credential = await startAuthentication(options)

        const res = await api.fetch(`/user_api/passkey/authenticate_response`, {
            method: 'POST',
            body: JSON.stringify({
                origin: location.origin,
                domain: location.hostname,
                credential
            })
        })
        userJwt.value = res.jwt;
        location.reload();
    } catch (e) {
        console.error(e)
        showMessage(e.message, 'error')
    }
};

const oauth2Login = async (clientID) => {
    try {
        userOauth2SessionClientID.value = clientID;
        userOauth2SessionState.value = Math.random().toString(36).substring(2);
        const res = await api.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${userOauth2SessionState.value}`);
        location.href = res.url;
    } catch (error) {
        showMessage(error.message || "login failed", 'error');
    }
};
</script>

<template>
    <div class="d-flex justify-center">
        <div v-if="userOpenSettings.fetched" style="max-width: 600px; width: 100%;">
            <v-tabs v-model="tabValue" color="primary" class="mb-4">
                <v-tab value="signin">{{ t('login') }}</v-tab>
                <v-tab v-if="userOpenSettings.enable" value="signup">{{ t('register') }}</v-tab>
            </v-tabs>

            <v-window v-model="tabValue">
                <v-window-item value="signin">
                    <v-text-field v-model="user.email" :label="t('email')" variant="outlined" density="compact"
                        class="mt-4 mb-3" />
                    <v-text-field v-model="user.password" :label="t('password')" type="password" variant="outlined"
                        density="compact" class="mb-3" />
                    <v-btn @click="emailLogin" color="primary" variant="outlined" block class="mb-2">
                        {{ t('login') }}
                    </v-btn>
                    <v-btn @click="showModal = true" variant="text" size="small" class="mb-4">
                        {{ t('forgotPassword') }}
                    </v-btn>
                    <v-divider class="mb-4" />
                    <v-btn @click="passkeyLogin" color="primary" variant="outlined" block prepend-icon="mdi-key"
                        class="mb-2">
                        {{ t('loginWithPasskey') }}
                    </v-btn>
                    <v-btn v-for="item in userOpenSettings.oauth2ClientIDs" :key="item.clientID"
                        @click="oauth2Login(item.clientID)" variant="outlined" block class="mb-2"
                        :prepend-icon="item.name.toLowerCase() === 'github' ? 'mdi-github' : 'mdi-login'">
                        {{ t('loginWith', { provider: item.name }) }}
                    </v-btn>
                </v-window-item>

                <v-window-item v-if="userOpenSettings.enable" value="signup">
                    <v-text-field v-model="user.email" :label="t('email')" variant="outlined" density="compact"
                        class="mt-4 mb-3" />
                    <v-text-field v-model="user.password" :label="t('password')" type="password" variant="outlined"
                        density="compact" class="mb-3" />
                    <Turnstile v-if="userOpenSettings.enableMailVerify" v-model:value="cfToken" />
                    <div v-if="userOpenSettings.enableMailVerify" class="d-flex ga-2 mb-3">
                        <v-text-field v-model="user.code" :label="t('verifyCode')" variant="outlined" density="compact"
                            hide-details />
                        <v-btn @click="sendVerificationCode" color="primary" variant="outlined"
                            :disabled="verifyCodeTimeout > 0">
                            {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) :
                                t('sendVerificationCode') }}
                        </v-btn>
                    </div>
                    <v-btn @click="emailSignup" color="primary" variant="outlined" block>
                        {{ t('register') }}
                    </v-btn>
                </v-window-item>
            </v-window>
        </div>

        <v-dialog v-model="showModal" max-width="500">
            <v-card>
                <v-card-title>{{ t('forgotPassword') }}</v-card-title>
                <v-card-text>
                    <div v-if="userOpenSettings.enable && userOpenSettings.enableMailVerify">
                        <v-text-field v-model="user.email" :label="t('email')" variant="outlined" density="compact"
                            class="mb-3" />
                        <v-text-field v-model="user.password" :label="t('password')" type="password" variant="outlined"
                            density="compact" class="mb-3" />
                        <Turnstile v-model:value="cfToken" />
                        <div class="d-flex ga-2 mb-3">
                            <v-text-field v-model="user.code" :label="t('verifyCode')" variant="outlined"
                                density="compact" hide-details />
                            <v-btn @click="sendVerificationCode" color="primary" variant="outlined"
                                :disabled="verifyCodeTimeout > 0">
                                {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) :
                                    t('sendVerificationCode') }}
                            </v-btn>
                        </div>
                        <v-btn @click="emailSignup" color="primary" variant="outlined" block>
                            {{ t('resetPassword') }}
                        </v-btn>
                    </div>
                    <v-alert v-else type="warning" variant="tonal">
                        {{ t('cannotForgotPassword') }}
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showModal = false">{{ t('cancel') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>


<style scoped>
/* v-window 保持 hidden 确保切换动画正常 */
.v-window {
    overflow: hidden !important;
}
/* v-window-item 内容加 padding 防止按钮动画被裁剪 */
.v-window-item {
    padding: 4px !important;
}
</style>
