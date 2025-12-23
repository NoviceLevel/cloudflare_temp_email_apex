<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import MailBox from '../../components/MailBox.vue';

const { adminMailTabAddress } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            addressQueryTip: 'Leave blank to query all addresses',
            query: 'Query',
        },
        zh: {
            addressQueryTip: '留空查询所有地址',
            query: '查询',
        }
    }
});

const mailBoxKey = ref("")

const queryMail = () => {
    adminMailTabAddress.value = adminMailTabAddress.value.trim();
    mailBoxKey.value = Date.now();
}

const fetchMailData = async (limit, offset) => {
    return await api.fetch(
        `/admin/mails`
        + `?limit=${limit}`
        + `&offset=${offset}`
        + (adminMailTabAddress.value ? `&address=${adminMailTabAddress.value}` : '')
    );
}

const deleteMail = async (curMailId) => {
    await api.fetch(`/admin/mails/${curMailId}`, { method: 'DELETE' });
};
</script>

<template>
    <div class="mt-3">
        <div class="d-flex ga-2 mb-3">
            <v-text-field v-model="adminMailTabAddress" :placeholder="t('addressQueryTip')" variant="outlined"
                density="compact" hide-details clearable @keydown.enter="queryMail" style="max-width: 400px;" />
            <v-btn @click="queryMail" color="primary" variant="outlined">
                {{ t('query') }}
            </v-btn>
        </div>
        <MailBox :key="mailBoxKey" :enableUserDeleteEmail="true" :fetchMailData="fetchMailData"
            :deleteMail="deleteMail" :showFilterInput="true" />
    </div>
</template>
