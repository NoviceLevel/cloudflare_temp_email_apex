<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            role: 'Role',
            maxAddressCount: 'Max Address Count',
            save: 'Save',
            successTip: 'Success',
            noRolesAvailable: 'No roles available in system config',
            roleConfigDesc: 'Configure maximum address count for each user role. Role-based limits take priority over global settings.',
            notConfigured: 'Not Configured (Use Global Settings)',
        },
        zh: {
            role: '角色',
            maxAddressCount: '最大地址数量',
            save: '保存',
            successTip: '成功',
            noRolesAvailable: '系统配置中没有可用的角色',
            roleConfigDesc: '为每个用户角色配置最大地址数量。角色配置优先于全局设置。',
            notConfigured: '未配置（使用全局设置）',
        }
    }
});

const systemRoles = ref([])
const tableData = ref([])

const headers = [
    { title: t('role'), key: 'role', width: '200px' },
    { title: t('maxAddressCount'), key: 'max_address_count' },
];

const fetchUserRoles = async () => {
    try {
        const results = await api.fetch(`/admin/user_roles`);
        systemRoles.value = results;
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const fetchRoleConfigs = async () => {
    try {
        const { configs } = await api.fetch(`/admin/role_address_config`);
        tableData.value = systemRoles.value.map(roleObj => ({
            role: roleObj.role,
            max_address_count: configs[roleObj.role]?.maxAddressCount ?? null,
        }));
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const saveConfig = async () => {
    try {
        const configs = {};
        tableData.value.forEach(row => {
            if (row.max_address_count !== null && row.max_address_count !== undefined) {
                configs[row.role] = { maxAddressCount: row.max_address_count };
            }
        });
        await api.fetch(`/admin/role_address_config`, {
            method: 'POST',
            body: JSON.stringify({ configs })
        });
        showSnackbar(t('successTip'), 'success')
        await fetchRoleConfigs();
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

onMounted(async () => {
    await fetchUserRoles();
    await fetchRoleConfigs();
})
</script>

<template>
    <div class="mt-4">
        <v-alert type="info" variant="tonal" class="mb-4">
            {{ t('roleConfigDesc') }}
        </v-alert>

        <v-alert v-if="systemRoles.length === 0" type="warning" variant="tonal">
            {{ t('noRolesAvailable') }}
        </v-alert>

        <div v-else>
            <div class="d-flex justify-end mb-4">
                <v-btn :loading="loading" color="primary" @click="saveConfig">
                    {{ t('save') }}
                </v-btn>
            </div>

            <v-data-table :headers="headers" :items="tableData" hide-default-footer class="elevation-0" style="min-width: 600px;">
                <template v-slot:item.role="{ item }">
                    <v-chip color="info" size="small">{{ item.role }}</v-chip>
                </template>
                <template v-slot:item.max_address_count="{ item }">
                    <v-text-field
                        v-model.number="item.max_address_count"
                        type="number"
                        :min="0"
                        :max="999"
                        clearable
                        :placeholder="t('notConfigured')"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 200px"
                    ></v-text-field>
                </template>
            </v-data-table>
        </div>
    </div>
</template>

<style scoped>
</style>
