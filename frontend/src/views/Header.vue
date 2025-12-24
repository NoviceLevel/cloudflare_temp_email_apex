<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import { useIsMobile } from '../utils/composables'

import { useGlobalState } from '../store'
import { api } from '../api'
import { getRouterPathWithLang } from '../utils'

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')

const showMessage = (text, color = 'info') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const {
    toggleDark, isDark, isTelegram, showAdminPage,
    showAuth, auth, loading, openSettings, userSettings
} = useGlobalState()
const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()

const showMobileMenu = ref(false)

const authFunc = async () => {
    try {
        location.reload()
    } catch (error) {
        showMessage(error.message || "error", 'error')
    }
}

const changeLocale = async (lang) => {
    if (lang == 'zh') {
        await router.push(route.fullPath.replace('/en', ''));
    } else {
        await router.push(`/${lang}${route.fullPath}`);
    }
}

const { locale, t } = useI18n({
    messages: {
        en: {
            title: 'Cloudflare Temp Email',
            dark: 'Dark',
            light: 'Light',
            accessHeader: 'Access Password',
            accessTip: 'Please enter the correct access password',
            home: 'Home',
            menu: 'Menu',
            user: 'User',
            ok: 'OK',
        },
        zh: {
            title: 'Cloudflare 临时邮件',
            dark: '暗色',
            light: '亮色',
            accessHeader: '访问密码',
            accessTip: '请输入站点访问密码',
            home: '主页',
            menu: '菜单',
            user: '用户',
            ok: '确定',
        }
    }
});

const version = import.meta.env.PACKAGE_VERSION ? `v${import.meta.env.PACKAGE_VERSION}` : "";

const goHome = async () => {
    await router.push(getRouterPathWithLang('/', locale.value));
    showMobileMenu.value = false;
}

const goUser = async () => {
    await router.push(getRouterPathWithLang("/user", locale.value));
    showMobileMenu.value = false;
}

const goAdmin = async () => {
    loading.value = true;
    await router.push(getRouterPathWithLang('/admin', locale.value));
    loading.value = false;
    showMobileMenu.value = false;
}

const toggleTheme = () => {
    toggleDark();
    showMobileMenu.value = false;
}

const toggleLang = async () => {
    locale.value == 'zh' ? await changeLocale('en') : await changeLocale('zh');
    showMobileMenu.value = false;
}

useHead({
    title: () => openSettings.value.title || t('title'),
    meta: [
        { name: "description", content: openSettings.value.description || t('title') },
    ]
});

const logoClickCount = ref(0);
const logoClick = async () => {
    if (route.path.includes("admin")) {
        logoClickCount.value = 0;
        return;
    }
    if (logoClickCount.value >= 5) {
        logoClickCount.value = 0;
        showMessage("Change to admin Page", 'info');
        loading.value = true;
        await router.push(getRouterPathWithLang('/admin', locale.value));
        loading.value = false;
    } else {
        logoClickCount.value++;
    }
    if (logoClickCount.value > 0) {
        showMessage(`Click ${5 - logoClickCount.value + 1} times to enter the admin page`, 'info');
    }
}

// Mock message/notification for api calls
const message = {
    error: (text) => showMessage(text, 'error'),
    info: (text) => showMessage(text, 'info'),
    success: (text) => showMessage(text, 'success'),
}
const notification = {
    info: (opts) => {
        if (opts.content) {
            showMessage('Announcement', 'info')
        }
    }
}

onMounted(async () => {
    await api.getOpenSettings(message, notification);
    if (!userSettings.value.user_id) await api.getUserSettings(message);
});
</script>

<template>
    <div>
        <v-app-bar color="primary" density="comfortable">
            <template v-slot:prepend>
                <v-img @click="logoClick" src="/logo.png" alt="Logo" width="40" height="40" class="cursor-pointer ml-2"></v-img>
            </template>

            <v-app-bar-title>{{ openSettings.title || t('title') }}</v-app-bar-title>

            <template v-slot:append>
                <!-- Desktop Menu -->
                <template v-if="!isMobile">
                    <v-btn variant="text" @click="goHome">
                        <v-icon start>mdi-home</v-icon>
                        {{ t('home') }}
                    </v-btn>
                    <v-btn v-if="!isTelegram" variant="text" @click="goUser">
                        <v-icon start>mdi-account</v-icon>
                        {{ t('user') }}
                    </v-btn>
                    <v-btn v-if="showAdminPage" variant="text" @click="goAdmin">
                        <v-icon start>mdi-shield-account</v-icon>
                        Admin
                    </v-btn>
                    <v-btn variant="text" @click="toggleTheme">
                        <v-icon start>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
                        {{ isDark ? t('light') : t('dark') }}
                    </v-btn>
                    <v-btn variant="text" @click="toggleLang">
                        <v-icon start>mdi-translate</v-icon>
                        {{ locale == 'zh' ? 'English' : '中文' }}
                    </v-btn>
                    <v-btn v-if="openSettings?.showGithub" variant="text" 
                        href="https://github.com/NoviceLevel/cloudflare_temp_email_apex" target="_blank">
                        <v-icon start>mdi-github</v-icon>
                        {{ version || 'Github' }}
                    </v-btn>
                </template>

                <!-- Mobile Menu Button -->
                <v-btn v-else icon @click="showMobileMenu = !showMobileMenu">
                    <v-icon>mdi-menu</v-icon>
                </v-btn>
            </template>
        </v-app-bar>

        <!-- Mobile Navigation Drawer -->
        <v-navigation-drawer v-model="showMobileMenu" location="top" temporary>
            <v-list>
                <v-list-item prepend-icon="mdi-home" :title="t('home')" @click="goHome"></v-list-item>
                <v-list-item v-if="!isTelegram" prepend-icon="mdi-account" :title="t('user')" @click="goUser"></v-list-item>
                <v-list-item v-if="showAdminPage" prepend-icon="mdi-shield-account" title="Admin" @click="goAdmin"></v-list-item>
                <v-list-item :prepend-icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'" 
                    :title="isDark ? t('light') : t('dark')" @click="toggleTheme"></v-list-item>
                <v-list-item prepend-icon="mdi-translate" :title="locale == 'zh' ? 'English' : '中文'" @click="toggleLang"></v-list-item>
                <v-list-item v-if="openSettings?.showGithub" prepend-icon="mdi-github" :title="version || 'Github'"
                    href="https://github.com/NoviceLevel/cloudflare_temp_email_apex" target="_blank"></v-list-item>
            </v-list>
        </v-navigation-drawer>

        <!-- Access Password Dialog -->
        <v-dialog v-model="showAuth" persistent max-width="400">
            <v-card>
                <v-card-title>{{ t('accessHeader') }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t('accessTip') }}</p>
                    <v-text-field v-model="auth" type="password" 
                        :append-inner-icon="'mdi-eye'"
                        variant="outlined" density="compact"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" :loading="loading" @click="authFunc">
                        {{ t('ok') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar for messages -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar = false">Close</v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>
