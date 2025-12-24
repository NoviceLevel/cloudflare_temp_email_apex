<script setup>
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import SendBox from '../../components/SendBox.vue';

const { adminSendBoxTabAddress } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            query: 'Query',
            queryTip: 'Please input address to query, leave blank to query all',
        },
        zh: {
            query: '查询',
            queryTip: '请输入地址查询, 留空则查询所有',
        }
    }
});

const fetchData = async (limit, offset) => {
    adminSendBoxTabAddress.value = adminSendBoxTabAddress.value.trim();
    return await api.fetch(
        `/admin/sendbox?limit=${limit}&offset=${offset}`
        + (adminSendBoxTabAddress.value ? `&address=${adminSendBoxTabAddress.value}` : '')
    );
}

const deleteSenboxMail = async (curMailId) => {
    await api.fetch(`/admin/sendbox/${curMailId}`, { method: 'DELETE' });
};
</script>

<template>
    <div>
        <div class="d-flex ga-2 mb-3">
            <v-text-field v-model="adminSendBoxTabAddress" :placeholder="t('queryTip')" variant="outlined"
                density="compact" hide-details @keydown.enter="fetchData" style="max-width: 400px;" />
            <v-btn @click="fetchData" color="primary" variant="tonal">
                {{ t('query') }}
            </v-btn>
        </div>
        <SendBox :enableUserDeleteEmail="true" :deleteMail="deleteSenboxMail" :fetchMailData="fetchData"
            :showEMailFrom="true" />
    </div>
</template>
