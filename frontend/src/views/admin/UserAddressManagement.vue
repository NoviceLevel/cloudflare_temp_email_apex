<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { api } from '../../api'
import { useGlobalState } from '../../store'

const props = defineProps({
    user_id: {
        type: Number,
        required: true
    }
});

const { showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            success: 'success',
            name: 'Name',
            mail_count: 'Mail Count',
            send_count: 'Send Count',
        },
        zh: {
            success: '成功',
            name: '名称',
            mail_count: '邮件数量',
            send_count: '发送数量',
        }
    }
});

const data = ref([])

const headers = [
    { title: t('name'), key: 'name' },
    { title: t('mail_count'), key: 'mail_count', width: '150px' },
    { title: t('send_count'), key: 'send_count', width: '150px' },
];

const fetchData = async () => {
    try {
        const { results } = await api.fetch(
            `/admin/users/bind_address/${props.user_id}`,
        );
        data.value = results;
    } catch (error) {
        console.log(error)
        showSnackbar(error.message || "error", 'error')
    }
}

onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div style="overflow: auto;">
        <v-data-table
            :headers="headers"
            :items="data"
            hide-default-footer
            class="elevation-0"
            style="min-width: 500px;"
        >
            <template v-slot:item.mail_count="{ item }">
                <v-badge :content="item.mail_count" color="success" inline></v-badge>
            </template>
            <template v-slot:item.send_count="{ item }">
                <v-badge :content="item.send_count" color="success" inline></v-badge>
            </template>
        </v-data-table>
    </div>
</template>

<style scoped>
</style>
