<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const {
    loading, adminTab, openSettings,
    adminMailTabAddress, adminSendBoxTabAddress,
    showSnackbar
} = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            name: 'Name',
            created_at: 'Created At',
            updated_at: 'Update At',
            mail_count: 'Mail Count',
            send_count: 'Send Count',
            showCredential: 'Show Mail Address Credential',
            addressCredential: 'Mail Address Credential',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login to your email account.',
            delete: 'Delete',
            deleteTip: 'Are you sure to delete this email?',
            deleteAccount: 'Delete Account',
            viewMails: 'View Mails',
            viewSendBox: 'View SendBox',
            itemCount: 'itemCount',
            query: 'Query',
            addressQueryTip: 'Leave blank to query all addresses',
            clearInbox: 'Clear Inbox',
            clearSentItems: 'Clear Sent Items',
            clearInboxTip: 'Are you sure to clear inbox for this email?',
            clearSentItemsTip: 'Are you sure to clear sent items for this email?',
            actions: 'Actions',
            success: 'Success',
            resetPassword: 'Reset Password',
            newPassword: 'New Password',
            passwordResetSuccess: 'Password reset successfully',
            selectAll: 'Select All of This Page',
            unselectAll: 'Unselect All',
            pleaseSelectAddress: 'Please select address',
            selectedItems: 'Selected',
            multiDelete: 'Multi Delete',
            multiDeleteTip: 'Are you sure to delete selected addresses?',
            multiClearInbox: 'Multi Clear Inbox',
            multiClearInboxTip: 'Are you sure to clear inbox for selected addresses?',
            multiClearSentItems: 'Multi Clear Sent Items',
            multiClearSentItemsTip: 'Are you sure to clear sent items for selected addresses?',
            cancel: 'Cancel',
            confirm: 'Confirm',
        },
        zh: {
            name: '名称',
            created_at: '创建时间',
            updated_at: '更新时间',
            mail_count: '邮件数量',
            send_count: '发送数量',
            showCredential: '查看邮箱地址凭证',
            addressCredential: '邮箱地址凭证',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            delete: '删除',
            deleteTip: '确定要删除这个邮箱吗？',
            deleteAccount: '删除邮箱',
            viewMails: '查看邮件',
            viewSendBox: '查看发件箱',
            itemCount: '总数',
            query: '查询',
            addressQueryTip: '留空查询所有地址',
            clearInbox: '清空收件箱',
            clearSentItems: '清空发件箱',
            clearInboxTip: '确定要清空这个邮箱的收件箱吗？',
            clearSentItemsTip: '确定要清空这个邮箱的发件箱吗？',
            actions: '操作',
            success: '成功',
            resetPassword: '重置密码',
            newPassword: '新密码',
            passwordResetSuccess: '密码重置成功',
            selectAll: '全选本页',
            unselectAll: '取消全选',
            pleaseSelectAddress: '请选择地址',
            selectedItems: '已选择',
            multiDelete: '批量删除',
            multiDeleteTip: '确定要删除选中的邮箱吗？',
            multiClearInbox: '批量清空收件箱',
            multiClearInboxTip: '确定要清空选中邮箱的收件箱吗？',
            multiClearSentItems: '批量清空发件箱',
            multiClearSentItemsTip: '确定要清空选中邮箱的发件箱吗？',
            cancel: '取消',
            confirm: '确认',
        }
    }
});

const showEmailCredential = ref(false)
const curEmailCredential = ref("")
const curDeleteAddressId = ref(0);
const curClearInboxAddressId = ref(0);
const curClearSentItemsAddressId = ref(0);
const showResetPassword = ref(false);
const curResetPasswordAddressId = ref(0);
const newPassword = ref('');

// Multi-action mode state
const checkedRowKeys = ref([]);
const showMultiActionModal = ref(false);
const multiActionProgress = ref({ percentage: 0, tip: '0/0' });
const multiActionTitle = ref('');

// Confirm dialogs
const showDeleteConfirm = ref(false);
const showClearInboxConfirm = ref(false);
const showClearSentItemsConfirm = ref(false);
const showMultiDeleteConfirm = ref(false);
const showMultiClearInboxConfirm = ref(false);
const showMultiClearSentItemsConfirm = ref(false);

const selectedCount = computed(() => checkedRowKeys.value.length);
const showMultiActionBar = computed(() => checkedRowKeys.value.length > 0);

const addressQuery = ref("")

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)

// Action menu
const actionMenuOpen = ref({});

const headers = [
    { title: '', key: 'data-table-select', width: '50px' },
    { title: 'ID', key: 'id', width: '80px' },
    { title: t('name'), key: 'name' },
    { title: t('created_at'), key: 'created_at' },
    { title: t('updated_at'), key: 'updated_at' },
    { title: t('mail_count'), key: 'mail_count', width: '150px' },
    { title: t('send_count'), key: 'send_count', width: '150px' },
    { title: t('actions'), key: 'actions', width: '120px', sortable: false },
];

const showCredential = async (id) => {
    try {
        curEmailCredential.value = await api.adminShowAddressCredential(id)
        showEmailCredential.value = true
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
        showEmailCredential.value = false
        curEmailCredential.value = ""
    }
}

const deleteEmail = async () => {
    try {
        await api.adminDeleteAddress(curDeleteAddressId.value)
        showSnackbar(t("success"), 'success')
        await fetchData()
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        showDeleteAccount.value = false
    }
}

const clearInbox = async () => {
    try {
        await api.fetch(`/admin/clear_inbox/${curClearInboxAddressId.value}`, {
            method: 'DELETE'
        });
        showSnackbar(t("success"), 'success')
        await fetchData()
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        showClearInbox.value = false
    }
}

const clearSentItems = async () => {
    try {
        await api.fetch(`/admin/clear_sent_items/${curClearSentItemsAddressId.value}`, {
            method: 'DELETE'
        });
        showSnackbar(t("success"), 'success')
        await fetchData()
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        showClearSentItems.value = false
    }
}

const resetPassword = async () => {
    try {
        await api.fetch(`/admin/address/${curResetPasswordAddressId.value}/reset_password`, {
            method: 'POST',
            body: JSON.stringify({
                password: newPassword.value
            })
        });
        showSnackbar(t("passwordResetSuccess"), 'success')
        newPassword.value = '';
        showResetPassword.value = false;
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    }
}

// Multi-action mode functions
const multiActionSelectAll = () => {
    checkedRowKeys.value = data.value.map(item => item.id);
}

const multiActionUnselectAll = () => {
    checkedRowKeys.value = [];
}

// 通用批量操作函数
const executeBatchOperation = async ({
    shouldSkip = () => false,
    apiCall,
    title,
    operationName = 'operation'
}) => {
    try {
        loading.value = true;
        const selectedAddresses = data.value.filter((item) =>
            checkedRowKeys.value.includes(item.id)
        );

        if (selectedAddresses.length === 0) {
            showSnackbar(t('pleaseSelectAddress'), 'error')
            return;
        }

        const failedIds = [];
        const totalCount = selectedAddresses.length;

        multiActionProgress.value = {
            percentage: 0,
            tip: `0/${totalCount}`
        };
        multiActionTitle.value = title;
        showMultiActionModal.value = true;

        for (const [index, address] of selectedAddresses.entries()) {
            try {
                if (!shouldSkip(address)) {
                    await apiCall(address.id);
                }
            } catch (error) {
                console.error(`${operationName} failed for address ${address.id}:`, error);
                failedIds.push(address.id);
            }
            multiActionProgress.value = {
                percentage: Math.floor((index + 1) / totalCount * 100),
                tip: `${index + 1}/${totalCount}`
            };
        }

        await fetchData();
        checkedRowKeys.value = failedIds;
        showSnackbar(t("success"), 'success')
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        loading.value = false;
    }
}

const multiActionDeleteAccounts = async () => {
    await executeBatchOperation({
        apiCall: (id) => api.adminDeleteAddress(id),
        title: t('multiDelete') + ' ' + t('success'),
        operationName: 'Delete'
    });
}

const multiActionClearInbox = async () => {
    await executeBatchOperation({
        shouldSkip: (address) => address.mail_count <= 0,
        apiCall: (id) => api.fetch(`/admin/clear_inbox/${id}`, {
            method: 'DELETE'
        }),
        title: t('multiClearInbox') + ' ' + t('success'),
        operationName: 'ClearInbox'
    });
}

const multiActionClearSentItems = async () => {
    await executeBatchOperation({
        shouldSkip: (address) => address.send_count <= 0,
        apiCall: (id) => api.fetch(`/admin/clear_sent_items/${id}`, {
            method: 'DELETE'
        }),
        title: t('multiClearSentItems') + ' ' + t('success'),
        operationName: 'ClearSentItems'
    });
}

const fetchData = async () => {
    try {
        addressQuery.value = addressQuery.value.trim()
        const { results, count: addressCount } = await api.fetch(
            `/admin/address`
            + `?limit=${pageSize.value}`
            + `&offset=${(page.value - 1) * pageSize.value}`
            + (addressQuery.value ? `&query=${addressQuery.value}` : "")
        );
        data.value = results;
        if (addressCount > 0) {
            count.value = addressCount;
        }
    } catch (error) {
        console.error(error);
        showSnackbar(error.message || "error", 'error')
    }
}

const totalPages = computed(() => Math.ceil(count.value / pageSize.value));

const viewMails = (row) => {
    if (row.mail_count > 0) {
        adminMailTabAddress.value = row.name;
        adminTab.value = "mails";
    }
}

const viewSendBox = (row) => {
    if (row.send_count > 0) {
        adminSendBoxTabAddress.value = row.name;
        adminTab.value = "sendBox";
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
    <div class="mt-4">
        <!-- Credential Dialog -->
        <v-dialog v-model="showEmailCredential" max-width="500">
            <v-card>
                <v-card-title>{{ t("addressCredential") }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t("addressCredentialTip") }}</p>
                    <v-card variant="tonal" class="pa-4">
                        <strong>{{ curEmailCredential }}</strong>
                    </v-card>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showEmailCredential = false">{{ t('cancel') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Account Dialog -->
        <v-dialog v-model="showDeleteAccount" max-width="400">
            <v-card>
                <v-card-title>{{ t('deleteAccount') }}</v-card-title>
                <v-card-text>{{ t('deleteTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteAccount = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" :loading="loading" @click="deleteEmail">
                        {{ t('deleteAccount') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Clear Inbox Dialog -->
        <v-dialog v-model="showClearInbox" max-width="400">
            <v-card>
                <v-card-title>{{ t('clearInbox') }}</v-card-title>
                <v-card-text>{{ t('clearInboxTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showClearInbox = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" :loading="loading" @click="clearInbox">
                        {{ t('clearInbox') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Clear Sent Items Dialog -->
        <v-dialog v-model="showClearSentItems" max-width="400">
            <v-card>
                <v-card-title>{{ t('clearSentItems') }}</v-card-title>
                <v-card-text>{{ t('clearSentItemsTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showClearSentItems = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" :loading="loading" @click="clearSentItems">
                        {{ t('clearSentItems') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Reset Password Dialog -->
        <v-dialog v-model="showResetPassword" max-width="400">
            <v-card>
                <v-card-title>{{ t('resetPassword') }}</v-card-title>
                <v-card-text>
                    <v-text-field
                        v-model="newPassword"
                        :label="t('newPassword')"
                        type="password"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showResetPassword = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="resetPassword">
                        {{ t('resetPassword') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Multi Delete Confirm -->
        <v-dialog v-model="showMultiDeleteConfirm" max-width="400">
            <v-card>
                <v-card-title>{{ t('multiDelete') }}</v-card-title>
                <v-card-text>{{ t('multiDeleteTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showMultiDeleteConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="showMultiDeleteConfirm = false; multiActionDeleteAccounts()">
                        {{ t('confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Multi Clear Inbox Confirm -->
        <v-dialog v-model="showMultiClearInboxConfirm" max-width="400">
            <v-card>
                <v-card-title>{{ t('multiClearInbox') }}</v-card-title>
                <v-card-text>{{ t('multiClearInboxTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showMultiClearInboxConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="warning" @click="showMultiClearInboxConfirm = false; multiActionClearInbox()">
                        {{ t('confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Multi Clear Sent Items Confirm -->
        <v-dialog v-model="showMultiClearSentItemsConfirm" max-width="400">
            <v-card>
                <v-card-title>{{ t('multiClearSentItems') }}</v-card-title>
                <v-card-text>{{ t('multiClearSentItemsTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showMultiClearSentItemsConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="warning" @click="showMultiClearSentItemsConfirm = false; multiActionClearSentItems()">
                        {{ t('confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Multi Action Progress Dialog -->
        <v-dialog v-model="showMultiActionModal" max-width="300" persistent>
            <v-card>
                <v-card-title class="text-center">{{ multiActionTitle }}</v-card-title>
                <v-card-text class="text-center">
                    <v-progress-circular
                        :model-value="multiActionProgress.percentage"
                        :size="100"
                        :width="10"
                        color="primary"
                    >
                        {{ multiActionProgress.tip }}
                    </v-progress-circular>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showMultiActionModal = false">OK</v-btn>
                    <v-spacer></v-spacer>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Search Bar -->
        <div class="d-flex mb-4">
            <v-text-field
                v-model="addressQuery"
                :placeholder="t('addressQueryTip')"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @keydown.enter="fetchData"
                class="flex-grow-1 mr-2"
            ></v-text-field>
            <v-btn color="primary" variant="tonal" @click="fetchData">
                {{ t('query') }}
            </v-btn>
        </div>

        <!-- Multi Action Bar -->
        <div v-if="showMultiActionBar" class="d-flex flex-wrap align-center ga-2 mb-4">
            <v-btn variant="tonal" @click="multiActionSelectAll">
                {{ t('selectAll') }}
            </v-btn>
            <v-btn variant="tonal" @click="multiActionUnselectAll">
                {{ t('unselectAll') }}
            </v-btn>
            <v-btn variant="tonal" color="error" @click="showMultiDeleteConfirm = true">
                {{ t('multiDelete') }}
            </v-btn>
            <v-btn variant="tonal" color="warning" @click="showMultiClearInboxConfirm = true">
                {{ t('multiClearInbox') }}
            </v-btn>
            <v-btn variant="tonal" color="warning" @click="showMultiClearSentItemsConfirm = true">
                {{ t('multiClearSentItems') }}
            </v-btn>
            <v-chip color="info">
                {{ t('selectedItems') }}: {{ selectedCount }}
            </v-chip>
        </div>

        <!-- Pagination -->
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <span>{{ t('itemCount') }}: {{ count }}</span>
            <v-pagination v-model="page" :length="totalPages" density="compact" :total-visible="5"></v-pagination>
            <v-select
                v-model="pageSize"
                :items="[20, 50, 100]"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 100px"
            ></v-select>
        </div>

        <!-- Data Table -->
        <div style="overflow: auto;">
            <v-data-table
                v-model="checkedRowKeys"
                :headers="headers"
                :items="data"
                item-value="id"
                show-select
                hide-default-footer
                class="elevation-0"
                style="min-width: 1000px;"
            >
                <template v-slot:item.mail_count="{ item }">
                    <v-btn
                        v-if="item.mail_count > 0"
                        variant="text"
                        size="small"
                        @click="viewMails(item)"
                    >
                        <v-badge :content="item.mail_count" color="success" inline></v-badge>
                        <span class="ml-1">{{ t('viewMails') }}</span>
                    </v-btn>
                    <v-badge v-else :content="item.mail_count" color="success" inline></v-badge>
                </template>

                <template v-slot:item.send_count="{ item }">
                    <v-btn
                        v-if="item.send_count > 0"
                        variant="text"
                        size="small"
                        @click="viewSendBox(item)"
                    >
                        <v-badge :content="item.send_count" color="success" inline></v-badge>
                        <span class="ml-1">{{ t('viewSendBox') }}</span>
                    </v-btn>
                    <v-badge v-else :content="item.send_count" color="success" inline></v-badge>
                </template>

                <template v-slot:item.actions="{ item }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-menu" variant="text" v-bind="props" size="small"></v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item @click="showCredential(item.id)">
                                <v-list-item-title>{{ t('showCredential') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="item.mail_count > 0" @click="viewMails(item)">
                                <v-list-item-title>{{ t('viewMails') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="item.send_count > 0" @click="viewSendBox(item)">
                                <v-list-item-title>{{ t('viewSendBox') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="item.mail_count > 0" @click="curClearInboxAddressId = item.id; showClearInbox = true">
                                <v-list-item-title>{{ t('clearInbox') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="item.send_count > 0" @click="curClearSentItemsAddressId = item.id; showClearSentItems = true">
                                <v-list-item-title>{{ t('clearSentItems') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="openSettings?.enableAddressPassword" @click="curResetPasswordAddressId = item.id; showResetPassword = true">
                                <v-list-item-title>{{ t('resetPassword') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="curDeleteAddressId = item.id; showDeleteAccount = true">
                                <v-list-item-title>{{ t('delete') }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table>
        </div>
    </div>
</template>

<style scoped>
</style>
