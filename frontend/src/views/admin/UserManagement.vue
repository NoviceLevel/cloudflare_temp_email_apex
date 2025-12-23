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
