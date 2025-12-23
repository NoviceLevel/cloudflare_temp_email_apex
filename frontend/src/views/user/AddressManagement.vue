<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router';

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { getRouterPathWithLang } from '../../utils'

import Login from '../common/Login.vue';

const { jwt, loading } = useGlobalState()
const router = useRouter()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { locale, t } = useI18n({
    messages: {
        en: {
            success: 'success',
            name: 'Name',
            mail_count: 'Mail Count',
            send_count: 'Send Count',
            actions: 'Actions',
            changeMailAddress: 'Change Address',
            unbindAddress: 'Unbind Address',
            unbindAddressTip: 'Before unbinding, please switch to this email address and save the email address credential.',
            transferAddress: 'Transfer Address',
            targetUserEmail: 'Target User Email',
            transferAddressTip: 'Transfer address to another user will remove the address from your account and transfer it to another user. Are you sure to transfer the address?',
            address: 'Address',
            create_or_bind: 'Create or Bind',
            cancel: 'Cancel',
        },
        zh: {
            success: '成功',
            name: '名称',
            mail_count: '邮件数量',
            send_count: '发送数量',
            actions: '操作',
            changeMailAddress: '切换地址',
            unbindAddress: '解绑地址',
            unbindAddressTip: '解绑前请切换到此邮箱地址并保存邮箱地址凭证。',
            transferAddress: '转移地址',
            targetUserEmail: '目标用户邮箱',
            transferAddressTip: '转移地址到其他用户将会从你的账户中移除此地址并转移给其他用户。确定要转移地址吗？',
            address: '地址',
            create_or_bind: '创建或绑定',
            cancel: '取消',
        }
    }
});

const tabValue = ref('address')
const data = ref([])
const showTransferAddress = ref(false)
const showChangeConfirm = ref(false)
const showUnbindConfirm = ref(false)
const currentAddress = ref("")
const currentAddressId = ref(0)
const targetUserEmail = ref('')

const changeMailAddress = async () => {
    try {
        const res = await api.fetch(`/user_api/bind_address_jwt/${currentAddressId.value}`);
        showMessage(t('changeMailAddress') + " " + t('success'));
        if (!res.jwt) {
            showMessage("jwt not found", 'error');
            return;
        }
        jwt.value = res.jwt;
        await router.push(getRouterPathWithLang("/", locale.value))
        location.reload();
    } catch (error) {
        console.log(error)
        showMessage(error.message || "error", 'error');
    }
}

const unbindAddress = async () => {
    try {
        await api.fetch(`/user_api/unbind_address`, {
            method: 'POST',
            body: JSON.stringify({ address_id: currentAddressId.value })
        });
        showMessage(t('unbindAddress') + " " + t('success'));
        showUnbindConfirm.value = false;
        await fetchData();
    } catch (error) {
        console.log(error)
        showMessage(error.message || "error", 'error');
    }
}

const transferAddress = async () => {
    if (!targetUserEmail.value) {
        showMessage("targetUserEmail is required", 'error');
        return;
    }
    if (!currentAddressId.value) {
        showMessage("currentAddressId is required", 'error');
        return;
    }
    try {
        await api.fetch(`/user_api/transfer_address`, {
            method: 'POST',
            body: JSON.stringify({
                address_id: currentAddressId.value,
                target_user_email: targetUserEmail.value
            })
        });
        showMessage(t('transferAddress') + " " + t('success'));
        await fetchData();
        showTransferAddress.value = false;
        currentAddressId.value = 0;
        currentAddress.value = "";
        targetUserEmail.value = "";
    } catch (error) {
        console.log(error)
        showMessage(error.message || "error", 'error');
    }
}

const fetchData = async () => {
    try {
        const { results } = await api.fetch(`/user_api/bind_address`);
        data.value = results;
    } catch (error) {
        console.log(error)
        showMessage(error.message || "error", 'error');
    }
}

const confirmChange = (row) => {
    currentAddressId.value = row.id;
    currentAddress.value = row.name;
    showChangeConfirm.value = true;
}

const confirmUnbind = (row) => {
    currentAddressId.value = row.id;
    currentAddress.value = row.name;
    showUnbindConfirm.value = true;
}

const openTransfer = (row) => {
    currentAddressId.value = row.id;
    currentAddress.value = row.name;
    showTransferAddress.value = true;
}

onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div>
        <v-tabs v-model="tabValue" color="primary">
            <v-tab value="address">{{ t('address') }}</v-tab>
            <v-tab value="create_or_bind">{{ t('create_or_bind') }}</v-tab>
        </v-tabs>

        <v-window v-model="tabValue">
            <v-window-item value="address">
                <div style="overflow: auto;" class="mt-4">
                    <v-table>
                        <thead>
                            <tr>
                                <th>{{ t('name') }}</th>
                                <th>{{ t('mail_count') }}</th>
                                <th>{{ t('send_count') }}</th>
                                <th>{{ t('actions') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in data" :key="row.id">
                                <td>{{ row.name }}</td>
                                <td>
                                    <v-chip color="success" size="small">{{ row.mail_count }}</v-chip>
                                </td>
                                <td>
                                    <v-chip color="success" size="small">{{ row.send_count }}</v-chip>
                                </td>
                                <td>
                                    <v-btn size="small" color="primary" variant="text" @click="confirmChange(row)">
                                        {{ t('changeMailAddress') }}
                                    </v-btn>
                                    <v-btn size="small" color="primary" variant="text" @click="openTransfer(row)">
                                        {{ t('transferAddress') }}
                                    </v-btn>
                                    <v-btn size="small" color="error" variant="text" @click="confirmUnbind(row)">
                                        {{ t('unbindAddress') }}
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </v-window-item>
            <v-window-item value="create_or_bind">
                <div class="mt-4">
                    <Login />
                </div>
            </v-window-item>
        </v-window>

        <v-dialog v-model="showTransferAddress" max-width="500">
            <v-card>
                <v-card-title>{{ t('transferAddress') }}</v-card-title>
                <v-card-text>
                    <p class="mb-2">{{ t("transferAddressTip") }}</p>
                    <p class="mb-4">{{ t('transferAddress') + ": " + currentAddress }}</p>
                    <v-text-field v-model="targetUserEmail" :label="t('targetUserEmail')" variant="outlined"
                        density="compact" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showTransferAddress = false">{{ t('cancel') }}</v-btn>
                    <v-btn :loading="loading" @click="transferAddress" color="error">{{ t('transferAddress') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showChangeConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('changeMailAddress') }}?</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showChangeConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" @click="changeMailAddress">{{ t('changeMailAddress') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showUnbindConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('unbindAddressTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showUnbindConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="unbindAddress">{{ t('unbindAddress') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
