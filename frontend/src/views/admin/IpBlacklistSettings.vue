<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            title: 'IP Blacklist Settings',
            manualInputPrompt: 'Type pattern and press Enter to add',
            save: 'Save',
            successTip: 'Save Success',
            enable_ip_blacklist: 'Enable IP Blacklist',
            enable_tip: 'Block IPs matching blacklist patterns from accessing rate-limited APIs',
            ip_blacklist: 'IP Blacklist Patterns',
            ip_blacklist_placeholder: 'Enter pattern (e.g., 192.168.1 or ^10\\.0\\.0\\.5$)',
            asn_blacklist: 'ASN Organization Blacklist',
            asn_blacklist_placeholder: 'Enter ASN organization (e.g., Google, Amazon)',
            fingerprint_blacklist: 'Browser Fingerprint Blacklist',
            fingerprint_blacklist_placeholder: 'Enter fingerprint ID (e.g., a1b2c3d4e5f6g7h8)',
            tip_ip: 'IP Blacklist: Supports text matching (e.g., "192.168.1") or regex (e.g., "^10\\.0\\.0\\.5$").',
            tip_asn: 'ASN Organization: Block by ISP/provider. Case-insensitive text matching or regex.',
            tip_fingerprint: 'Browser Fingerprint: Block by browser fingerprint. Supports exact matching or regex patterns.',
            tip_daily_limit: 'Daily Limit: Restrict the maximum number of requests per IP address per day (1-1000000).',
            tip_scope: 'Applies to: Create Address, Send Mail, External Send Mail API, User Registration, Verify Code',
            enable_daily_limit: 'Enable Daily Request Limit',
            enable_daily_limit_tip: 'Limit the number of API requests per IP address per day',
            daily_request_limit: 'Daily Request Limit',
            daily_request_limit_placeholder: 'Enter limit (e.g., 1000)',
        },
        zh: {
            title: 'IP 黑名单设置',
            manualInputPrompt: '输入匹配模式后按回车键添加',
            save: '保存',
            successTip: '保存成功',
            enable_ip_blacklist: '启用 IP 黑名单',
            enable_tip: '阻止匹配黑名单的 IP 访问限流 API',
            ip_blacklist: 'IP 黑名单匹配模式',
            ip_blacklist_placeholder: '输入匹配模式（例如：192.168.1 或 ^10\\.0\\.0\\.5$）',
            asn_blacklist: 'ASN 组织（运营商）黑名单',
            asn_blacklist_placeholder: '输入 ASN 组织名称（例如：Google, Amazon）',
            fingerprint_blacklist: '浏览器指纹黑名单',
            fingerprint_blacklist_placeholder: '输入指纹 ID（例如：a1b2c3d4e5f6g7h8）',
            tip_ip: 'IP 黑名单：支持文本匹配（如 "192.168.1"）或正则表达式（如 "^10\\.0\\.0\\.5$"）。',
            tip_asn: 'ASN 组织：根据运营商/ISP 拉黑。支持不区分大小写的文本匹配或正则表达式。',
            tip_fingerprint: '浏览器指纹：根据浏览器指纹拉黑。支持完全匹配或正则表达式。',
            tip_daily_limit: '每日限流：限制单个 IP 地址每天最多请求次数（1-1000000）。',
            tip_scope: '作用范围：创建邮箱地址、发送邮件、外部发送邮件 API、用户注册、验证码验证',
            enable_daily_limit: '启用每日请求限流',
            enable_daily_limit_tip: '限制每个 IP 地址每天的 API 请求次数',
            daily_request_limit: '每日请求次数上限',
            daily_request_limit_placeholder: '输入限制次数（例如：1000）',
        }
    }
});

const enabled = ref(false)
const ipBlacklist = ref([])
const asnBlacklist = ref([])
const fingerprintBlacklist = ref([])
const enableDailyLimit = ref(false)
const dailyRequestLimit = ref(1000)

const fetchData = async () => {
    try {
        loading.value = true
        const res = await api.fetch(`/admin/ip_blacklist/settings`)
        enabled.value = res.enabled || false
        ipBlacklist.value = res.blacklist || []
        asnBlacklist.value = res.asnBlacklist || []
        fingerprintBlacklist.value = res.fingerprintBlacklist || []
        enableDailyLimit.value = res.enableDailyLimit || false
        dailyRequestLimit.value = res.dailyRequestLimit || 1000
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        loading.value = false
    }
}

const save = async () => {
    try {
        loading.value = true
        await api.fetch(`/admin/ip_blacklist/settings`, {
            method: 'POST',
            body: JSON.stringify({
                enabled: enabled.value,
                blacklist: ipBlacklist.value || [],
                asnBlacklist: asnBlacklist.value || [],
                fingerprintBlacklist: fingerprintBlacklist.value || [],
                enableDailyLimit: enableDailyLimit.value,
                dailyRequestLimit: dailyRequestLimit.value
            })
        })
        showSnackbar(t('successTip'), 'success')
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="center ma-4">
        <v-card :title="t('title')" variant="flat" max-width="800" width="100%">
            <template v-slot:append>
                <v-btn color="primary" :loading="loading" @click="save">{{ t('save') }}</v-btn>
            </template>
            <v-card-text>
                <v-alert type="info" variant="tonal" class="mb-4">
                    <div style="line-height: 1.8;">
                        <div><strong>{{ t("tip_scope") }}</strong></div>
                        <div>• {{ t("tip_ip") }}</div>
                        <div>• {{ t("tip_asn") }}</div>
                        <div>• {{ t("tip_fingerprint") }}</div>
                        <div>• {{ t("tip_daily_limit") }}</div>
                    </div>
                </v-alert>

                <div class="d-flex align-center mb-4">
                    <v-switch v-model="enabled" :label="t('enable_ip_blacklist')" hide-details color="primary"></v-switch>
                    <span class="text-caption text-grey ml-2">{{ t('enable_tip') }}</span>
                </div>

                <v-combobox v-model="ipBlacklist" :label="t('ip_blacklist')" :placeholder="t('ip_blacklist_placeholder')" multiple chips closable-chips variant="outlined" density="compact" :disabled="!enabled" class="mb-4"></v-combobox>

                <v-combobox v-model="asnBlacklist" :label="t('asn_blacklist')" :placeholder="t('asn_blacklist_placeholder')" multiple chips closable-chips variant="outlined" density="compact" :disabled="!enabled" class="mb-4"></v-combobox>

                <v-combobox v-model="fingerprintBlacklist" :label="t('fingerprint_blacklist')" :placeholder="t('fingerprint_blacklist_placeholder')" multiple chips closable-chips variant="outlined" density="compact" :disabled="!enabled" class="mb-4"></v-combobox>

                <v-divider class="mb-4"></v-divider>

                <div class="d-flex align-center mb-4">
                    <v-switch v-model="enableDailyLimit" :label="t('enable_daily_limit')" hide-details color="primary"></v-switch>
                    <span class="text-caption text-grey ml-2">{{ t('enable_daily_limit_tip') }}</span>
                </div>

                <v-text-field v-model.number="dailyRequestLimit" :label="t('daily_request_limit')" type="number" :min="1" :max="1000000" :placeholder="t('daily_request_limit_placeholder')" :disabled="!enableDailyLimit" variant="outlined" density="compact"></v-text-field>
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
}
</style>
