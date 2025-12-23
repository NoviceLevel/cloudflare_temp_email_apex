<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            address: 'Address',
            success: 'Success',
            is_enabled: 'Is Enabled',
            enable: 'Enable',
            disable: 'Disable',
            modify: 'Modify',
            delete: 'Delete',
            deleteTip: 'Are you sure to delete this?',
            created_at: 'Created At',
            action: 'Action',
            itemCount: 'itemCount',
            modalTip: 'Please input the sender balance',
            balance: 'Balance',
            query: 'Query',
            ok: 'OK',
            cancel: 'Cancel',
        },
        zh: {
            address: '地址',
            success: '成功',
            is_enabled: '是否启用',
            enable: '启用',
            disable: '禁用',
            modify: '修改',
            delete: '删除',
            deleteTip: '确定删除吗？',
            created_at: '创建时间',
            action: '操作',
            itemCount: '总数',
            modalTip: '请输入发件额度',
            balance: '余额',
            query: '查询',
            ok: '确定',
            cancel: '取消',
        }
    }
});

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const curRow = ref({})
const showModal = ref(false)
const senderBalance = ref(0)
const senderEnabled = ref(false)
const showDeleteConfirm = ref(false)
const deleteRowId = ref(null)

const addressQuery = ref('')

const headers = [
    { title: 'ID', key: 'id', width: '80px' },
    { title: t('address'), key: 'address' },
    { title: t('created_at'), key: 'created_at' },
    { title: t('balance'), key: 'balance', width: '100px' },
    { title: t('is_enabled'), key: 'enabled', width: '120px' },
    { title: t('action'), key: 'actions', width: '180px', sortable: false },
];

const totalPages = computed(() => Math.ceil(count.value / pageSize.value));

const updateData = async () => {
    try {
        await api.fetch(`/admin/address_sender`, {
            method: 'POST',
            body: JSON.stringify({
                address: curRow.value.address,
                address_id: curRow.value.id,
                balance: senderBalance.value,
                enabled: senderEnabled.value ? 1 : 0
            })
        });
        showModal.value = false;
        showSnackbar(t("success"), 'success')
        await fetchData()
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    }
}

const fetchData = async () => {
    try {
        addressQuery.value = addressQuery.value.trim();
        const { results, count: addressCount } = await api.fetch(
            `/admin/address_sender`
            + `?limit=${pageSize.value}`
            + `&offset=${(page.value - 1) * pageSize.value}`
            + (addressQuery.value ? `&address=${addressQuery.value}` : '')
        );
        data.value = results;
        if (addressCount > 0) {
            count.value = addressCount;
        }
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const confirmDelete = (id) => {
    deleteRowId.value = id
    showDeleteConfirm.value = true
}

const doDelete = async () => {
    try {
        await api.fetch(`/admin/address_sender/${deleteRowId.value}`, { method: 'DELETE' });
        showSnackbar(t("success"), 'success')
        await fetchData();
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        showDeleteConfirm.value = false
        deleteRowId.value = null
    }
}

watch([page, pageSize], async () => {
    await fetchData()
})

onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div>
        <!-- Modify Dialog -->
        <v-dialog v-model="showModal" max-width="400">
            <v-card>
                <v-card-title>{{ curRow.address }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t('modalTip') }}</p>
                    <v-checkbox v-model="senderEnabled" :label="t('enable')" hide-details class="mb-2"></v-checkbox>
                    <v-text-field v-model.number="senderBalance" type="number" :min="0" :max="1000" variant="outlined" density="compact"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showModal = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="updateData">{{ t('ok') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirm Dialog -->
        <v-dialog v-model="showDeleteConfirm" max-width="400">
            <v-card>
                <v-card-title>{{ t('delete') }}</v-card-title>
                <v-card-text>{{ t('deleteTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="doDelete">{{ t('delete') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Search Bar -->
        <div class="d-flex mb-4">
            <v-text-field v-model="addressQuery" variant="outlined" density="compact" hide-details clearable @keydown.enter="fetchData" class="flex-grow-1 mr-2"></v-text-field>
            <v-btn color="primary" variant="tonal" @click="fetchData">{{ t('query') }}</v-btn>
        </div>

        <!-- Pagination -->
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <span>{{ t('itemCount') }}: {{ count }}</span>
            <v-pagination v-model="page" :length="totalPages" density="compact" :total-visible="5"></v-pagination>
            <v-select v-model="pageSize" :items="[20, 50, 100]" variant="outlined" density="compact" hide-details style="max-width: 100px"></v-select>
        </div>

        <!-- Data Table -->
        <div style="overflow: auto;">
            <v-data-table :headers="headers" :items="data" hide-default-footer class="elevation-0" style="min-width: 700px;">
                <template v-slot:item.enabled="{ item }">
                    <v-chip :color="item.enabled ? 'success' : 'default'" size="small">
                        {{ item.enabled ? t('enable') : t('disable') }}
                    </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-btn color="success" variant="tonal" size="small" class="mr-2" @click="curRow = item; senderEnabled = !!item.enabled; senderBalance = item.balance; showModal = true">
                        {{ t('modify') }}
                    </v-btn>
                    <v-btn color="error" variant="tonal" size="small" @click="confirmDelete(item.id)">
                        {{ t('delete') }}
                    </v-btn>
                </template>
            </v-data-table>
        </div>
    </div>
</template>

<style scoped>
</style>
