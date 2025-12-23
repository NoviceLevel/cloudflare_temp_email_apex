<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import { api } from '../../api'
// @ts-ignore
import Login from '../common/Login.vue';

const { jwt, telegramApp } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text: string, color: string = 'success') => {
    snackbar.value = { show: true, text, color }
}

const showChangeConfirm = ref(false)
const showUnbindConfirm = ref(false)
const selectedRow = ref<any>(null)

const { t } = useI18n({
    messages: {
        en: {
            success: 'success',
            address: 'Address',
            actions: 'Actions',
            changeMailAddress: 'Change Mail Address',
            unbindMailAddress: 'Unbind Mail Address',
            bind: 'Bind',
            bindAddressSuccess: 'Bind Address Success',
            cancel: 'Cancel',
        },
        zh: {
            success: '成功',
            address: '地址',
            actions: '操作',
            changeMailAddress: '切换邮箱地址',
            unbindMailAddress: '解绑邮箱地址',
            bind: '绑定',
            bindAddressSuccess: '绑定地址成功',
            cancel: '取消',
        }
    }
});

const tabValue = ref('address')
const data = ref<any[]>([]);

const fetchData = async () => {
    try {
        data.value = await api.fetch(`/telegram/get_bind_address`, {
            method: 'POST',
            body: JSON.stringify({
                initData: telegramApp.value.initData
            })
        });
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

const newAddressPath = async (address_name: string, domain: string, cf_token: string) => {
    return await api.fetch("/telegram/new_address", {
        method: "POST",
        body: JSON.stringify({
            initData: telegramApp.value.initData,
            address: `${address_name}@${domain}`,
            cf_token: cf_token,
        }),
    });
}

const bindAddress = async () => {
    try {
        await api.fetch(`/telegram/bind_address`, {
            method: 'POST',
            body: JSON.stringify({
                initData: telegramApp.value.initData,
                jwt: jwt.value
            })
        });
        showMessage(t('bindAddressSuccess'));
    } catch (error) {
        showMessage((error as Error).message || "error", 'error');
    }
}

const confirmChange = (row: any) => {
    selectedRow.value = row
    showChangeConfirm.value = true
}

const confirmUnbind = (row: any) => {
    selectedRow.value = row
    showUnbindConfirm.value = true
}

const changeAddress = () => {
    jwt.value = selectedRow.value.jwt
    location.reload()
}

const unbindAddress = async () => {
    await api.fetch(`/telegram/unbind_address`, {
        method: 'POST',
        body: JSON.stringify({
            initData: telegramApp.value.initData,
            address: selectedRow.value.address
        })
    });
    jwt.value = ""
    location.reload()
}

onMounted(async () => {
    if (!telegramApp.value?.initData || data.value.length > 0) {
        return
    }
    await fetchData()
})
</script>

<template>
    <div>
        <v-tabs v-model="tabValue" color="primary">
            <v-tab value="address">{{ t('address') }}</v-tab>
            <v-tab value="bind">{{ t('bind') }}</v-tab>
        </v-tabs>

        <v-window v-model="tabValue">
            <v-window-item value="address">
                <v-table class="mt-4">
                    <thead>
                        <tr>
                            <th>{{ t('address') }}</th>
                            <th>{{ t('actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in data" :key="row.address">
                            <td>{{ row.address }}</td>
                            <td>
                                <v-btn size="small" color="primary" variant="text" @click="confirmChange(row)">
                                    {{ t('changeMailAddress') }}
                                </v-btn>
                                <v-btn size="small" color="warning" variant="text" @click="confirmUnbind(row)">
                                    {{ t('unbindMailAddress') }}
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-window-item>
            <v-window-item value="bind">
                <div class="mt-4">
                    <Login :newAddressPath="newAddressPath" :bindUserAddress="bindAddress" />
                </div>
            </v-window-item>
        </v-window>

        <v-dialog v-model="showChangeConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('changeMailAddress') }}?</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showChangeConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" @click="changeAddress">{{ t('changeMailAddress') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showUnbindConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('unbindMailAddress') }}?</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showUnbindConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="warning" @click="unbindAddress">{{ t('unbindMailAddress') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
