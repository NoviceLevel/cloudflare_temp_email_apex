<script setup>
import { ref, watch, onMounted } from "vue";
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
const { openSettings, isDark } = useGlobalState()

const cfToken = defineModel('value')

const { locale, t } = useI18n({
    messages: {
        en: {
            refresh: 'Refresh'
        },
        zh: {
            refresh: '刷新'
        }
    }
});

const cfTurnstileId = ref("")
const turnstileLoading = ref(false)

const checkCfTurnstile = async (remove) => {
    if (!openSettings.value.cfTurnstileSiteKey) return;
    turnstileLoading.value = true;
    try {
        let container = document.getElementById("cf-turnstile");
        let count = 100;
        while (!container && count-- > 0) {
            container = document.getElementById("cf-turnstile");
            await new Promise(r => setTimeout(r, 10));
        }
        count = 100;
        while (!window.turnstile && count-- > 0) {
            await new Promise(r => setTimeout(r, 10));
        }
        if (remove && cfTurnstileId.value) {
            window.turnstile.remove(cfTurnstileId.value);
        }
        cfTurnstileId.value = window.turnstile.render(
            "#cf-turnstile",
            {
                sitekey: openSettings.value.cfTurnstileSiteKey,
                language: locale.value == 'zh' ? 'zh-CN' : 'en-US',
                theme: isDark.value ? 'dark' : 'light',
                callback: function (token) {
                    cfToken.value = token;
                },
            }
        );
    } finally {
        turnstileLoading.value = false;
    }
}

watch(isDark, async (isDark) => {
    checkCfTurnstile(true)
}, { immediate: true })

onMounted(() => {
    cfToken.value = "";
    checkCfTurnstile(true);
})
</script>

<template>
    <div v-if="openSettings.cfTurnstileSiteKey" class="d-flex justify-center">
        <v-progress-circular v-if="turnstileLoading" indeterminate color="primary" />
        <div v-else class="d-flex flex-column align-center">
            <div id="cf-turnstile"></div>
            <v-btn variant="text" size="small" @click="checkCfTurnstile(true)" class="mt-2">
                {{ t('refresh') }}
            </v-btn>
        </div>
    </div>
</template>
