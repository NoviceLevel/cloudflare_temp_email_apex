<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { api } from '../../api'

const snackbar = ref({ show: false, text: '', color: 'error' })

const { t } = useI18n({
    messages: {
        en: {
            userCount: 'User Count',
            addressCount: 'Address Count',
            activeAddressCount7days: '7 days Active Address Count',
            activeAddressCount30days: '30 days Active Address Count',
            mailCount: 'Mail Count',
            sendMailCount: 'Send Mail Count'
        },
        zh: {
            userCount: '用户总数',
            addressCount: '邮箱地址总数',
            activeAddressCount7days: '7天活跃邮箱地址总数',
            activeAddressCount30days: '30天活跃邮箱地址总数',
            mailCount: '邮件总数',
            sendMailCount: '发送邮件总数'
        }
    }
});

const statistics = ref({
    addressCount: 0,
    userCount: 0,
    mailCount: 0,
    activeAddressCount7days: 0,
    activeAddressCount30days: 0,
    sendMailCount: 0,
})

const fetchStatistics = async () => {
    try {
        const {
            userCount, mailCount, sendMailCount,
            addressCount, activeAddressCount7days,
            activeAddressCount30days,
        } = await api.fetch(`/admin/statistics`);
        statistics.value.mailCount = mailCount || 0;
        statistics.value.sendMailCount = sendMailCount || 0;
        statistics.value.userCount = userCount || 0;
        statistics.value.addressCount = addressCount || 0;
        statistics.value.activeAddressCount7days = activeAddressCount7days || 0;
        statistics.value.activeAddressCount30days = activeAddressCount30days || 0;
    } catch (error) {
        console.log(error)
        snackbar.value = { show: true, text: error.message || "error", color: 'error' }
    }
}

onMounted(async () => {
    await fetchStatistics()
})
</script>

<template>
    <div>
        <v-card variant="flat" class="mb-4">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="primary" class="mb-2">mdi-account</v-icon>
                            <div class="text-h4">{{ statistics.addressCount }}</div>
                            <div class="text-caption">{{ t('addressCount') }}</div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="success" class="mb-2">mdi-account-check</v-icon>
                            <div class="text-h4">{{ statistics.activeAddressCount7days }}</div>
                            <div class="text-caption">{{ t('activeAddressCount7days') }}</div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="success" class="mb-2">mdi-account-check</v-icon>
                            <div class="text-h4">{{ statistics.activeAddressCount30days }}</div>
                            <div class="text-caption">{{ t('activeAddressCount30days') }}</div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <v-card variant="flat">
            <v-card-text>
                <v-row>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="primary" class="mb-2">mdi-account-group</v-icon>
                            <div class="text-h4">{{ statistics.userCount }}</div>
                            <div class="text-caption">{{ t('userCount') }}</div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="info" class="mb-2">mdi-email-multiple</v-icon>
                            <div class="text-h4">{{ statistics.mailCount }}</div>
                            <div class="text-caption">{{ t('mailCount') }}</div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <div class="text-center">
                            <v-icon size="32" color="warning" class="mb-2">mdi-send</v-icon>
                            <div class="text-h4">{{ statistics.sendMailCount }}</div>
                            <div class="text-caption">{{ t('sendMailCount') }}</div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
