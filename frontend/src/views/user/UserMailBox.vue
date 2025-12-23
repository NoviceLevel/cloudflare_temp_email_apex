<script setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'

import { api } from '../../api'
import MailBox from '../../components/MailBox.vue';

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
const addressFilter = ref();
const addressFilterOptions = ref([]);

const queryMail = () => {
    addressFilter.value = addressFilter.value ? addressFilter.value.trim() : addressFilter.value;
    mailBoxKey.value = Date.now();
}

const fetchMailData = async (limit, offset) => {
    return await api.fetch(
        `/user_api/mails`
        + `?limit=${limit}`
        + `&offset=${offset}`
        + (addressFilter.value ? `&address=${addressFilter.value}` : '')
    );
}

const fetchAddresData = async () => {
    try {
        const { results } = await api.fetch(`/user_api/bind_address`);
        addressFilterOptions.value = results.map((item) => ({
            title: item.name,
            value: item.name
        }));
    } catch (error) {
        console.log(error)
    }
}

const deleteMail = async (curMailId) => {
    await api.fetch(`/user_api/mails/${curMailId}`, { method: 'DELETE' });
};

watch(addressFilter, async () => {
    queryMail();
});

onMounted(() => {
    fetchAddresData();
});
</script>

<template>
    <div class="mt-3">
        <div class="d-flex ga-2 mb-3">
            <v-select v-model="addressFilter" :items="addressFilterOptions" clearable :label="t('addressQueryTip')"
                variant="outlined" density="compact" style="max-width: 300px;" hide-details />
            <v-btn @click="queryMail" color="primary" variant="outlined">
                {{ t('query') }}
            </v-btn>
        </div>
        <MailBox :key="mailBoxKey" :enableUserDeleteEmail="true" :fetchMailData="fetchMailData"
            :deleteMail="deleteMail" :showFilterInput="true" />
    </div>
</template>
