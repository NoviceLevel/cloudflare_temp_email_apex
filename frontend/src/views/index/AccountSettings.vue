<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { hashPassword, getRouterPathWithLang } from '../../utils'

const {
    jwt, settings, showAddressCredential, loading, openSettings
} = useGlobalState()
const router = useRouter()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const showLogout = ref(false)
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)
const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const { locale, t } = useI18n({
    messages: {
        en: {
            logout: "Logout",
            deleteAccount: "Delete Account",
            showAddressCredential: 'Show Address Credential',
            logoutConfirm: 'Are you sure to logout?',
            deleteAccountConfirm: "Are you sure to delete your account and all emails for this account?",
            clearInbox: "Clear Inbox",
            clearSentItems: "Clear Sent Items",
            clearInboxConfirm: "Are you sure to clear all emails in your inbox?",
            clearSentItemsConfirm: "Are you sure to clear all emails in your sent items?",
            success: "Success",
            changePassword: "Change Password",
            newPassword: "New Password",
            confirmPassword: "Confirm Password",
            passwordMismatch: "Passwords do not match",
            passwordChanged: "Password changed successfully",
            cancel: "Cancel",
        },
        zh: {
            logout: '退出登录',
            deleteAccount: "删除账户",
            showAddressCredential: '查看邮箱地址凭证',
            logoutConfirm: '确定要退出登录吗？',
            deleteAccountConfirm: "确定要删除你的账户和其中的所有邮件吗?",
            clearInbox: "清空收件箱",
            clearSentItems: "清空发件箱",
            clearInboxConfirm: "确定要清空你收件箱中的所有邮件吗？",
            clearSentItemsConfirm: "确定要清空你发件箱中的所有邮件吗？",
            success: "成功",
            changePassword: "修改密码",
            newPassword: "新密码",
            confirmPassword: "确认密码",
            passwordMismatch: "密码不匹配",
            passwordChanged: "密码修改成功",
            cancel: "取消",
        }
    }
});

const logout = async () => {
    jwt.value = '';
    await router.push(getRouterPathWithLang("/", locale.value))
    location.reload()
}

const deleteAccount = async () => {
    try {
        await api.fetch(`/api/delete_address`, { method: 'DELETE' });
        jwt.value = '';
        await router.push(getRouterPathWithLang("/", locale.value))
        location.reload()
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
};

const clearInbox = async () => {
    try {
        await api.fetch(`/api/clear_inbox`, { method: 'DELETE' });
        showMessage(t("success"));
    } catch (error) {
        showMessage(error.message || "error", 'error');
    } finally {
        showClearInbox.value = false;
    }
};

const clearSentItems = async () => {
    try {
        await api.fetch(`/api/clear_sent_items`, { method: 'DELETE' });
        showMessage(t("success"));
    } catch (error) {
        showMessage(error.message || "error", 'error');
    } finally {
        showClearSentItems.value = false;
    }
};

const changePassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
        showMessage(t("passwordMismatch"), 'error');
        return;
    }
    try {
        await api.fetch(`/api/address_change_password`, {
            method: 'POST',
            body: JSON.stringify({
                new_password: await hashPassword(newPassword.value)
            })
        });
        showMessage(t("passwordChanged"));
        newPassword.value = '';
        confirmPassword.value = '';
        showChangePassword.value = false;
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
};
</script>

<template>
    <div class="d-flex justify-center" v-if="settings.address">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <v-btn @click="showAddressCredential = true" color="primary" variant="outlined" block class="mb-2">
                    {{ t('showAddressCredential') }}
                </v-btn>
                <v-btn v-if="openSettings?.enableAddressPassword" @click="showChangePassword = true" color="info"
                    variant="outlined" block class="mb-2">
                    {{ t('changePassword') }}
                </v-btn>
                <v-btn v-if="openSettings.enableUserDeleteEmail" @click="showClearInbox = true" color="warning"
                    variant="outlined" block class="mb-2">
                    {{ t('clearInbox') }}
                </v-btn>
                <v-btn v-if="openSettings.enableUserDeleteEmail" @click="showClearSentItems = true" color="warning"
                    variant="outlined" block class="mb-2">
                    {{ t('clearSentItems') }}
                </v-btn>
                <v-btn @click="showLogout = true" variant="outlined" block class="mb-2">
                    {{ t('logout') }}
                </v-btn>
                <v-btn v-if="openSettings.enableUserDeleteEmail" @click="showDeleteAccount = true" color="error"
                    variant="outlined" block>
                    {{ t('deleteAccount') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <v-dialog v-model="showLogout" max-width="400">
            <v-card>
                <v-card-title>{{ t('logout') }}</v-card-title>
                <v-card-text>{{ t('logoutConfirm') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showLogout = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="logout" color="warning">{{ t('logout') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showDeleteAccount" max-width="400">
            <v-card>
                <v-card-title>{{ t('deleteAccount') }}</v-card-title>
                <v-card-text>{{ t('deleteAccountConfirm') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showDeleteAccount = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="deleteAccount" color="error">{{ t('deleteAccount') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showClearInbox" max-width="400">
            <v-card>
                <v-card-title>{{ t('clearInbox') }}</v-card-title>
                <v-card-text>{{ t('clearInboxConfirm') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showClearInbox = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="clearInbox" color="warning">{{ t('clearInbox') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showClearSentItems" max-width="400">
            <v-card>
                <v-card-title>{{ t('clearSentItems') }}</v-card-title>
                <v-card-text>{{ t('clearSentItemsConfirm') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showClearSentItems = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="clearSentItems" color="warning">{{ t('clearSentItems') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showChangePassword" max-width="400">
            <v-card>
                <v-card-title>{{ t('changePassword') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newPassword" :label="t('newPassword')" type="password" variant="outlined"
                        density="compact" class="mb-3" />
                    <v-text-field v-model="confirmPassword" :label="t('confirmPassword')" type="password"
                        variant="outlined" density="compact" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showChangePassword = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="changePassword" color="info">{{ t('changePassword') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
