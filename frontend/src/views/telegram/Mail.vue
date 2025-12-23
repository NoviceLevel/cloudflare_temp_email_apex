<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { processItem } from '../../utils/email-parser'
import { utcToLocalDate } from '../../utils';

const { telegramApp, loading, useUTCDate } = useGlobalState()
const route = useRoute()

const curMail = ref({});
const showEMailTo = ref(false);

watch(telegramApp, async () => {
    if (telegramApp.value.initData) {
        curMail.value = await fetchMailData();
    }
});

const fetchMailData = async () => {
    try {
        const res = await api.fetch(`/telegram/get_mail`, {
            method: 'POST',
            body: JSON.stringify({
                initData: telegramApp.value.initData,
                mailId: route.query.mail_id
            })
        });
        loading.value = true;
        return await processItem(res);
    }
    catch (error) {
        console.error(error);
        return {};
    }
    finally {
        loading.value = false;
    }
};

onMounted(async () => {
    curMail.value = await fetchMailData();
});
</script>

<template>
    <div class="center">
        <v-card v-if="curMail.message" variant="flat" max-width="800" style="height: 100%;">
            <v-card-text>
                <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-chip color="info" size="small">ID: {{ curMail.id }}</v-chip>
                    <v-chip color="info" size="small">Date: {{ utcToLocalDate(curMail.created_at, useUTCDate) }}</v-chip>
                    <v-chip color="info" size="small">FROM: {{ curMail.source }}</v-chip>
                    <v-chip v-if="showEMailTo" color="info" size="small">TO: {{ curMail.address }}</v-chip>
                </div>
                <iframe :srcdoc="curMail.message" style="width: 100%; height: 100%;"></iframe>
            </v-card-text>
        </v-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
    height: 80vh;
}
</style>
