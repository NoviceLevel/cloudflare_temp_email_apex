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
