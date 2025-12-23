<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { startRegistration } from '@simplewebauthn/browser';

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { userJwt, userSettings, loading } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const showLogout = ref(false)
const showCreatePasskey = ref(false)
const passkeyName = ref('')
const showPasskeyList = ref(false)
const showRenamePasskey = ref(false)
const showDeleteConfirm = ref(false)
const currentPasskeyId = ref(null)
const currentPasskeyName = ref('')
const passkeyData = ref([])

const { t } = useI18n({
    messages: {
        en: {
            logout: 'Logout',
            logoutConfirm: 'Are you sure you want to logout?',
            passordTip: 'The server will only receive the hash value of the password, and will not receive the plaintext password, so it cannot view or retrieve your password. If the administrator enables email verification, you can reset the password in incognito mode',
            createPasskey: 'Create Passkey',
            showPasskeyList: 'Show Passkey List',
            passkeyCreated: 'Passkey created successfully',
            passkeyNamePlaceholder: 'Please enter the passkey name or leave it empty to generate a random one',
            renamePasskey: 'Rename Passkey',
            deletePasskey: 'Delete Passkey',
            passkey_name: 'Passkey Name',
            created_at: 'Created At',
            updated_at: 'Updated At',
            actions: 'Actions',
            renamePasskeyNamePlaceholder: 'Please enter the new passkey name',
            cancel: 'Cancel',
        },
        zh: {
            logout: '退出登录',
            logoutConfirm: '确定要退出登录吗？',
            passordTip: '服务器只会接收到密码的哈希值，不会接收到明文密码，因此无法查看或者找回您的密码, 如果管理员启用了邮件验证您可以在无痕模式重置密码',
            createPasskey: '创建 Passkey',
            showPasskeyList: '查看 Passkey 列表',
            passkeyCreated: 'Passkey 创建成功',
            passkeyNamePlaceholder: '请输入 Passkey 名称或者留空自动生成',
            renamePasskey: '重命名 Passkey',
            deletePasskey: '删除 Passkey',
            passkey_name: 'Passkey 名称',
            created_at: '创建时间',
            updated_at: '更新时间',
            actions: '操作',
            renamePasskeyNamePlaceholder: '请输入新的 Passkey 名称',
            cancel: '取消',
        }
    }
});

const logout = async () => {
    userJwt.value = '';
    location.reload()
}

const createPasskey = async () => {
    try {
        const options = await api.fetch(`/user_api/passkey/register_request`, {
            method: 'POST',
            body: JSON.stringify({
                domain: location.hostname,
            })
        })
        const credential = await startRegistration(options)

        await api.fetch(`/user_api/passkey/register_response`, {
            method: 'POST',
            body: JSON.stringify({
                origin: location.origin,
                passkey_name: passkeyName.value || (
                    (window.navigator.userAgentData?.platform || "Unknown")
                    + ": " + Math.random().toString(36).substring(7)
                ),
                credential
            })
        })
        showMessage(t('passkeyCreated'));
    } catch (e) {
        console.error(e)
        showMessage(e.message, 'error')
    } finally {
        passkeyName.value = ''
        showCreatePasskey.value = false
    }
}

const fetchPasskeyList = async () => {
    try {
        const data = await api.fetch(`/user_api/passkey`)
        passkeyData.value = data
    } catch (e) {
        console.error(e)
        showMessage(e.message, 'error')
    }
}

const renamePasskey = async () => {
    try {
        await api.fetch(`/user_api/passkey/rename`, {
            method: 'POST',
            body: JSON.stringify({
                passkey_name: currentPasskeyName.value,
                passkey_id: currentPasskeyId.value
            })
        })
        await fetchPasskeyList()
    } catch (e) {
        console.error(e)
        showMessage(e.message, 'error')
    } finally {
        currentPasskeyName.value = ''
        showRenamePasskey.value = false
    }
}

const deletePasskey = async () => {
    try {
        await api.fetch(`/user_api/passkey/${currentPasskeyId.value}`, {
            method: 'DELETE'
        })
        await fetchPasskeyList()
        showDeleteConfirm.value = false
    } catch (e) {
        console.error(e)
        showMessage(e.message, 'error')
    }
}

const openRename = (row) => {
    currentPasskeyId.value = row.passkey_id
    showRenamePasskey.value = true
}

const openDelete = (row) => {
    currentPasskeyId.value = row.passkey_id
    showDeleteConfirm.value = true
}
</script>

<template>
    <div class="d-flex justify-center" v-if="userSettings.user_email">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <v-btn @click="showPasskeyList = true; fetchPasskeyList();" variant="outlined" block class="mb-2">
                    {{ t('showPasskeyList') }}
                </v-btn>
                <v-btn @click="showCreatePasskey = true" color="primary" variant="outlined" block class="mb-2">
                    {{ t('createPasskey') }}
                </v-btn>
                <v-alert type="info" variant="tonal" class="mb-2">
                    {{ t('passordTip') }}
                </v-alert>
                <v-btn @click="showLogout = true" variant="outlined" block>
                    {{ t('logout') }}
                </v-btn>
            </v-card-text>
        </v-card>

        <v-dialog v-model="showCreatePasskey" max-width="500">
            <v-card>
                <v-card-title>{{ t('createPasskey') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="passkeyName" :placeholder="t('passkeyNamePlaceholder')" variant="outlined"
                        density="compact" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showCreatePasskey = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="createPasskey" color="primary">{{ t('createPasskey') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showRenamePasskey" max-width="500">
            <v-card>
                <v-card-title>{{ t('renamePasskey') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="currentPasskeyName" :placeholder="t('renamePasskeyNamePlaceholder')"
                        variant="outlined" density="compact" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showRenamePasskey = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="renamePasskey" color="primary">{{ t('renamePasskey') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showPasskeyList" max-width="900">
            <v-card>
                <v-card-title>{{ t('showPasskeyList') }}</v-card-title>
                <v-card-text>
                    <v-table>
                        <thead>
                            <tr>
                                <th>Passkey ID</th>
                                <th>{{ t('passkey_name') }}</th>
                                <th>{{ t('created_at') }}</th>
                                <th>{{ t('updated_at') }}</th>
                                <th>{{ t('actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in passkeyData" :key="row.passkey_id">
                                <td>{{ row.passkey_id }}</td>
                                <td>{{ row.passkey_name }}</td>
                                <td>{{ row.created_at }}</td>
                                <td>{{ row.updated_at }}</td>
                                <td>
                                    <v-btn size="small" color="primary" variant="text" @click="openRename(row)">
                                        {{ t('renamePasskey') }}
                                    </v-btn>
                                    <v-btn size="small" color="error" variant="text" @click="openDelete(row)">
                                        {{ t('deletePasskey') }}
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showDeleteConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('deletePasskey') }}?</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showDeleteConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="deletePasskey">{{ t('deletePasskey') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
