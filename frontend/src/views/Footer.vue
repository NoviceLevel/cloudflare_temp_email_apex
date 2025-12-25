<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
const { openSettings } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            copyright: "Copyright"
        },
        zh: {
            copyright: "版权所有"
        }
    }
});
</script>

<template>
    <div>
        <v-divider :class="[]"></v-divider>
        <div class="text-center py-1">
            <div class="d-flex justify-center ga-2 text-body-2">
                <span class="text-grey">
                    {{ t('copyright') }} © 2023-{{ new Date().getFullYear() }}
                </span>
                <span class="text-grey" v-html="openSettings.copyright"></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>
