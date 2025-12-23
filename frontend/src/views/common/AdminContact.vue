<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
const { openSettings } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            adminContact: 'If you need help, please contact the administrator ({msg})',
        },
        zh: {
            adminContact: '如果你需要帮助，请联系管理员 ({msg})',
        }
    }
});
</script>

<template>
    <v-alert v-if="openSettings.adminContact" type="info" variant="tonal" density="compact">
        {{ t('adminContact', { msg: openSettings.adminContact }) }}
    </v-alert>
</template>
