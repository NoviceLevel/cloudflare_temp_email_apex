<script setup>
import { ref, h, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { hashPassword } from '../../utils';

import UserAddressManagement from './UserAddressManagement.vue'

const { loading, openSettings, showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            success: 'Success',
            user_email: 'User Email',
            role: 'Role',
            address_count: 'Address Count',
            created_at: 'Created At',
            actions: 'Actions',
            query: 'Query',
            itemCount: 'itemCount',
            deleteUser: 'Delete User',
            delete: 'Delete',
            deleteUserTip: 'Are you sure you want to delete this user?',
            resetPassword: 'Reset Password',
            pleaseInput: 'Please input complete information',
            createUser: 'Create User',
            email: 'Email',
            password: 'Password',
            changeRole: 'Change Role',
            prefix: 'Prefix',
            domains: 'Domains',
            roleDonotExist: 'Current Role does not exist',
            userAddressManagement: 'Address Management',
            cancel: 'Cancel',
        },
        zh: {
            success: '成功',
            user_email: '用户邮箱',
            role: '角色',
            address_count: '地址数量',
            created_at: '创建时间',
            actions: '操作',
            query: '查询',
            itemCount: '总数',
            deleteUser: '删除用户',
            delete: '删除',
            deleteUserTip: '确定要删除此用户吗？',
            resetPassword: '重置密码',
            pleaseInput: '请输入完整信息',
            createUser: '创建用户',
            email: '邮箱',
            password: '密码',
            changeRole: '更改角色',
            prefix: '前缀',
            domains: '域名',
            roleDonotExist: '当前角色不存在',
            userAddressManagement: '地址管理',
            cancel: '取消',
        }
    }
});

const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const userQuery = ref('')
const showResetPassword = ref(false)
const newResetPassword = ref('')
const showDeleteUser = ref(false)
const curUserId = ref(0)
const showCreateUser = ref(false)
const user = ref({
    email: "",
    password: ""
})
const showChangeRole = ref(false)
const showUserAddressManagement = ref(false)
const userRoles = ref([])
const curUserRole = ref('')
const userRolesOptions = computed(() => {
    return userRoles.value.map(role => {
        return {
            title: role.role,
            value: role.role
        }
    });
})

const headers = [
    { title: 'ID', key: 'id', width: '80px' },
    { title: t('user_email'), key: 'user_email' },
    { title: t('role'), key: 'role_text', width: '150px' },
    { title: t('address_count'), key: 'address_count', width: '150px' },
    { title: t('created_at'), key: 'created_at' },
    { title: t('actions'), key: 'actions', width: '120px', sortable: false },
];

const fetchUserRoles = async () => {
    try {
        const results = await api.fetch(`/admin/user_roles`);
        userRoles.value = results;
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const fetchData = async () => {
    try {
        userQuery.value = userQuery.value.trim()
        const { results, count: userCount } = await api.fetch(
            `/admin/users`
            + `?limit=${pageSize.value}`
            + `&offset=${(page.value - 1) * pageSize.value}`
            + (userQuery.value ? `&query=${userQuery.value}` : '')
        );
        data.value = results;
        if (userCount > 0) {
            count.value = userCount;
        }
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const resetPassword = async () => {
    if (!newResetPassword.value) {
        showSnackbar(t('pleaseInput'), 'error')
        return;
    }
    try {
        await api.fetch(`/admin/users/${curUserId.value}/reset_password`, {
            method: "POST",
            body: JSON.stringify({
                password: await hashPassword(newResetPassword.value)
            })
        });
        showSnackbar(t('success'), 'success')
        showResetPassword.value = false;
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const createUser = async () => {
    if (!user.value.email || !user.value.password) {
        showSnackbar(t('pleaseInput'), 'error')
        return;
    }
    try {
        await api.fetch(`/admin/users`, {
            method: "POST",
            body: JSON.stringify({
                email: user.value.email,
                password: await hashPassword(user.value.password)
            })
        });
        showSnackbar(t('success'), 'success')
        await fetchData();
        showCreateUser.value = false;
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const deleteUser = async () => {
    try {
        await api.fetch(`/admin/users/${curUserId.value}`, {
            method: "DELETE"
        });
        showSnackbar(t('success'), 'success')
        showDeleteUser.value = false;
        await fetchData();
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const changeRole = async () => {
    try {
        await api.fetch(`/admin/user_roles`, {
            method: "POST",
            body: JSON.stringify({
                user_id: curUserId.value,
                role_text: curUserRole.value
            })
        });
        showSnackbar(t('success'), 'success')
        showChangeRole.value = false;
        await fetchData();
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

const getRolePrefix = (role) => {
    const res = userRoles.value.find(r => r.role === role)?.prefix;
    if (res === undefined || res === null) return openSettings.value.prefix;
    return res;
}

const getRoleDomains = (role) => {
    const res = userRoles.value.find(r => r.role === role)?.domains;
    if (res === undefined || res === null || res.length == 0) return openSettings.value.defaultDomains;
    return res;
}

const roleDonotExist = computed(() => {
    return curUserRole.value && !userRoles.value.some(r => r.role === curUserRole.value);
})

const totalPages = computed(() => Math.ceil(count.value / pageSize.value));

watch([page, pageSize], async () => {
    await fetchData()
})

onMounted(async () => {
    await fetchUserRoles();
    await fetchData();
})
</script>

<template>
    <div class="mt-4">
        <!-- Create User Dialog -->
        <v-dialog v-model="showCreateUser" max-width="500">
            <v-card>
                <v-card-title>{{ t('createUser') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="user.email" :label="t('email')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                    <v-text-field v-model="user.password" :label="t('password')" type="password" variant="outlined" density="compact"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showCreateUser = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="createUser">{{ t('createUser') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Reset Password Dialog -->
        <v-dialog v-model="showResetPassword" max-width="400">
            <v-card>
                <v-card-title>{{ t('resetPassword') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newResetPassword" :label="t('password')" type="password" variant="outlined" density="compact"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showResetPassword = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="resetPassword">{{ t('resetPassword') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete User Dialog -->
        <v-dialog v-model="showDeleteUser" max-width="400">
            <v-card>
                <v-card-title>{{ t('deleteUser') }}</v-card-title>
                <v-card-text>{{ t('deleteUserTip') }}</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteUser = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" :loading="loading" @click="deleteUser">{{ t('deleteUser') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Change Role Dialog -->
        <v-dialog v-model="showChangeRole" max-width="500">
            <v-card>
                <v-card-title>{{ t('changeRole') }}</v-card-title>
                <v-card-text>
                    <v-alert v-if="roleDonotExist" type="error" variant="tonal" class="mb-4">
                        {{ t('roleDonotExist') }}
                    </v-alert>
                    <p>{{ t('prefix') + ": " + getRolePrefix(curUserRole) }}</p>
                    <p class="mb-4">{{ t('domains') + ": " + JSON.stringify(getRoleDomains(curUserRole)) }}</p>
                    <v-select v-model="curUserRole" :items="userRolesOptions" clearable variant="outlined" density="compact"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showChangeRole = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="changeRole">{{ t('changeRole') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- User Address Management Dialog -->
        <v-dialog v-model="showUserAddressManagement" max-width="800">
            <v-card>
                <v-card-title>{{ t('userAddressManagement') }}</v-card-title>
                <v-card-text>
                    <UserAddressManagement :user_id="curUserId" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showUserAddressManagement = false">{{ t('cancel') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Search Bar -->
        <div class="d-flex mb-4">
            <v-text-field v-model="userQuery" variant="outlined" density="compact" hide-details clearable @keydown.enter="fetchData" class="flex-grow-1 mr-2"></v-text-field>
            <v-btn color="primary" variant="tonal" @click="fetchData">{{ t('query') }}</v-btn>
        </div>

        <!-- Pagination -->
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
            <span>{{ t('itemCount') }}: {{ count }}</span>
            <v-pagination v-model="page" :length="totalPages" density="compact" :total-visible="5"></v-pagination>
            <v-select v-model="pageSize" :items="[20, 50, 100]" variant="outlined" density="compact" hide-details style="max-width: 100px"></v-select>
            <v-btn color="primary" variant="tonal" @click="showCreateUser = true">{{ t('createUser') }}</v-btn>
        </div>

        <!-- Data Table -->
        <div style="overflow: auto;">
            <v-data-table :headers="headers" :items="data" item-value="id" hide-default-footer class="elevation-0" style="min-width: 800px;">
                <template v-slot:item.role_text="{ item }">
                    <v-chip v-if="item.role_text" color="info" size="small">{{ item.role_text }}</v-chip>
                </template>
                <template v-slot:item.address_count="{ item }">
                    <v-btn v-if="item.address_count > 0" variant="text" size="small" @click="curUserId = item.id; showUserAddressManagement = true">
                        <v-badge :content="item.address_count" color="success" inline></v-badge>
                        <span class="ml-1">{{ t('userAddressManagement') }}</span>
                    </v-btn>
                    <v-badge v-else :content="item.address_count" color="success" inline></v-badge>
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-menu" variant="text" v-bind="props" size="small"></v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item v-if="item.address_count > 0" @click="curUserId = item.id; showUserAddressManagement = true">
                                <v-list-item-title>{{ t('userAddressManagement') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="curUserId = item.id; curUserRole = item.role_text; showChangeRole = true">
                                <v-list-item-title>{{ t('changeRole') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="curUserId = item.id; newResetPassword = ''; showResetPassword = true">
                                <v-list-item-title>{{ t('resetPassword') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="curUserId = item.id; showDeleteUser = true">
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
