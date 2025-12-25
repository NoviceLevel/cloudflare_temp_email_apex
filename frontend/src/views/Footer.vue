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
    <footer class="m3-footer">
        <div class="footer-content">
            <span class="text-on-surface-variant">
                {{ t('copyright') }} © 2023-{{ new Date().getFullYear() }}
            </span>
            <span class="text-on-surface-variant" v-html="openSettings.copyright"></span>
        </div>
    </footer>
</template>

<style scoped>
.m3-footer {
    border-top: 1px solid rgb(var(--v-theme-outline-variant));
    padding: 14px 0;
    font-size: 14px;
}

.footer-content {
    display: flex;
    justify-content: center;
    gap: 8px;
}
</style>
