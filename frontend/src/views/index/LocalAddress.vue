<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n'

// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import Login from '../common/Login.vue';

const { jwt } = useGlobalState()

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
            tip: 'These addresses are stored in your browser, maybe loss if you clear the browser cache.',
            success: 'success',
            address: 'Address',
            actions: 'Actions',
            changeMailAddress: 'Change Mail Address',
            unbindMailAddress: 'Unbind Mail Address credential',
            create_or_bind: 'Create or Bind',
            bindAddressSuccess: 'Bind Address Success',
            cancel: 'Cancel',
        },
        zh: {
            tip: '这些地址存储在您的浏览器中，如果您清除浏览器缓存，可能会丢失。',
            success: '成功',
            address: '地址',
            actions: '操作',
            changeMailAddress: '切换邮箱地址',
            unbindMailAddress: '解绑邮箱地址',
            create_or_bind: '创建或绑定',
            bindAddressSuccess: '绑定地址成功',
            cancel: '取消',
        }
    }
});

const tabValue = ref('address')
const localAddressCache = useLocalStorage("LocalAddressCache", [] as string[]);

const data = computed(() => {
    if (!localAddressCache.value.includes(jwt.value)) {
        localAddressCache.value.push(jwt.value)
    }
    return localAddressCache.value.map((curJwt: string) => {
        try {
            var payload = JSON.parse(
                decodeURIComponent(
                    atob(curJwt.split(".")[1]
                        .replace(/-/g, "+").replace(/_/g, "/")
                    )
                )
            );
            return {
                valid: true,
                address: payload.address,
                jwt: curJwt
            }
        } catch (e) {
            return {
                valid: false,
                address: `invalid jwt [${curJwt}]`,
                jwt: curJwt
            }
        }
    })
})

const bindAddress = async () => {
    try {
        if (!localAddressCache.value.includes(jwt.value)) {
            localAddressCache.value.push(jwt.value)
        }
        tabValue.value = 'address'
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

const unbindAddress = () => {
    if (jwt.value === selectedRow.value.jwt) {
        return;
    }
    localAddressCache.value = localAddressCache.value.filter(
        (curJwt: string) => curJwt !== selectedRow.value.jwt
    );
    showUnbindConfirm.value = false
}
</script>

<template>
    <div>
        <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            {{ t('tip') }}
        </v-alert>

        <v-tabs v-model="tabValue" color="primary">
            <v-tab value="address">{{ t('address') }}</v-tab>
            <v-tab value="create_or_bind">{{ t('create_or_bind') }}</v-tab>
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
                        <tr v-for="row in data" :key="row.jwt">
                            <td>{{ row.address }}</td>
                            <td>
                                <v-btn size="small" color="primary" variant="text" @click="confirmChange(row)">
                                    {{ t('changeMailAddress') }}
                                </v-btn>
                                <v-btn size="small" color="warning" variant="text" :disabled="jwt === row.jwt"
                                    @click="confirmUnbind(row)">
                                    {{ t('unbindMailAddress') }}
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-window-item>
            <v-window-item value="create_or_bind">
                <div class="mt-4">
                    <Login :bindUserAddress="bindAddress" />
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
