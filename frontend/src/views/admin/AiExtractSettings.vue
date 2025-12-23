<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import { api } from '../../api'

const { showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            title: 'AI Email Extraction Settings',
            successTip: 'Success',
            save: 'Save',
            enableAllowList: 'Enable Address Allowlist',
            enableAllowListTip: 'When enabled, AI extraction will only process emails sent to addresses in the allowlist',
            allowList: 'Address Allowlist (Enter address and press Enter, wildcards supported)',
            allowListTip: "Wildcard * matches any characters, e.g. *{'@'}example.com matches all addresses under example.com domain",
            manualInputPrompt: 'Type and press Enter to add',
            disabledTip: 'When disabled, AI extraction will process all email addresses',
        },
        zh: {
            title: 'AI 邮件提取设置',
            successTip: '成功',
            save: '保存',
            enableAllowList: '启用地址白名单',
            enableAllowListTip: '启用后，AI 提取功能仅对白名单中的邮箱地址生效',
            allowList: '地址白名单 (请输入地址并回车，支持通配符)',
            allowListTip: "通配符 * 可匹配任意字符，如 *{'@'}example.com 可匹配 example.com 域名下的所有地址",
            manualInputPrompt: '输入后按回车键添加',
            disabledTip: '未启用时，所有邮箱地址都可使用 AI 提取功能',
        }
    }
});

type AiExtractSettings = {
    enableAllowList: boolean
    allowList: string[]
}

const settings = ref<AiExtractSettings>({
    enableAllowList: false,
    allowList: []
})

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/ai_extract/settings`) as AiExtractSettings
        Object.assign(settings.value, res)
    } catch (error) {
        showSnackbar((error as Error).message || "error", 'error')
    }
}

const saveSettings = async () => {
    try {
        await api.fetch(`/admin/ai_extract/settings`, {
            method: 'POST',
            body: JSON.stringify(settings.value),
        })
        showSnackbar(t('successTip'), 'success')
    } catch (error) {
        showSnackbar((error as Error).message || "error", 'error')
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="center">
        <v-card :title="t('title')" variant="flat" max-width="800" width="100%" style="overflow: auto;">
            <template v-slot:append>
                <v-btn color="primary" @click="saveSettings">{{ t('save') }}</v-btn>
            </template>
            <v-card-text>
                <v-switch v-model="settings.enableAllowList" :label="t('enableAllowList')" hide-details color="primary" class="mb-4"></v-switch>

                <v-alert v-if="!settings.enableAllowList" type="info" variant="tonal" class="mb-4">
                    {{ t('disabledTip') }}
                </v-alert>

                <div v-if="settings.enableAllowList">
                    <v-alert type="warning" variant="tonal" class="mb-4">
                        {{ t('enableAllowListTip') }}
                    </v-alert>

                    <v-combobox v-model="settings.allowList" :label="t('allowList')" :placeholder="t('allowListTip')" multiple chips closable-chips variant="outlined" density="compact" class="mb-2"></v-combobox>

                    <p class="text-caption text-grey">{{ t('allowListTip') }}</p>
                </div>
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
