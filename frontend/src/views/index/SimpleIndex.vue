<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import AccountSettings from './AccountSettings.vue'
import { processItem } from '../../utils/email-parser'
import MailContentRenderer from '../../components/MailContentRenderer.vue'

const { jwt, settings, useSimpleIndex, showAddressCredential, openSettings, loading } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const currentPage = ref(1)
const totalCount = ref(0)
const currentMail = ref(null)
const showAccountSettingsCard = ref(false)
const currentAutoRefreshInterval = ref(60)
const timer = ref(null)

const { t } = useI18n({
    messages: {
        en: {
            exitSimpleIndex: 'Exit Simple',
            copyAddress: 'Copy',
            addressCopied: 'Address copied successfully',
            refreshMails: 'Refresh',
            noMails: 'No mails found',
            prevPage: 'Previous',
            nextPage: 'Next',
            refreshSuccess: 'Mails refreshed successfully',
            mailCount: '{current} / {total} emails',
            accountSettings: "Account Settings",
            addressCredential: 'Mail Address Credential',
            addressCredentialTip: 'Please copy the Mail Address Credential and you can use it to login',
            deleteSuccess: 'Mail deleted successfully',
            refreshAfter: 'Refresh After {msg} Seconds',
            close: 'Close',
        },
        zh: {
            exitSimpleIndex: '退出极简',
            copyAddress: '复制',
            addressCopied: '地址复制成功',
            refreshMails: '刷新',
            noMails: '暂无邮件',
            prevPage: '上一页',
            nextPage: '下一页',
            refreshSuccess: '邮件刷新成功',
            mailCount: '{current} / {total} 封邮件',
            accountSettings: "账户设置",
            addressCredential: '邮箱地址凭证',
            addressCredentialTip: '请复制邮箱地址凭证，你可以使用它登录你的邮箱。',
            deleteSuccess: '邮件删除成功',
            refreshAfter: '{msg}秒后刷新',
            close: '关闭',
        }
    }
})

const copyAddress = async () => {
    try {
        await navigator.clipboard.writeText(settings.value.address)
        showMessage(t('addressCopied'))
    } catch (error) {
        showMessage('复制失败', 'error')
    }
}

const fetchMails = async () => {
    if (!settings.value.address) return
    try {
        const { results, count } = await api.fetch(`/api/mails?limit=1&offset=${currentPage.value - 1}`)
        totalCount.value = count > 0 ? count : totalCount.value;
        const rawMail = results && results.length > 0 ? results[0] : null
        currentMail.value = rawMail ? await processItem(rawMail) : null
    } catch (error) {
        console.error('Failed to fetch mails:', error)
        showMessage('获取邮件失败', 'error')
    }
}

const deleteMail = async () => {
    if (!currentMail.value) return;
    try {
        await api.fetch(`/api/mails/${currentMail.value.id}`, { method: 'DELETE' });
        showMessage(t('deleteSuccess'));
        currentMail.value = null;
        await refreshMails();
    } catch (error) {
        console.error('Failed to delete mail:', error);
        showMessage('删除邮件失败', 'error');
    }
}

const refreshMails = async () => {
    if (loading.value) return
    currentPage.value = 1
    showAccountSettingsCard.value = false
    currentAutoRefreshInterval.value = 60
    await fetchMails()
    showMessage(t('refreshSuccess'))
}

const currentPageDisplay = computed(() => currentPage.value)
const totalPages = computed(() => Math.max(1, totalCount.value))
const canGoPrev = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)
const isFirstPage = computed(() => currentPage.value === 1)

const prevPage = async () => {
    if (canGoPrev.value) {
        currentPage.value--
    }
}

const nextPage = async () => {
    if (canGoNext.value) {
        currentPage.value++
    }
}

watch(currentPage, () => {
    fetchMails()
})

onMounted(async () => {
    await api.getSettings()
    await fetchMails()

    timer.value = setInterval(async () => {
        if (!isFirstPage.value) {
            currentAutoRefreshInterval.value = 60
            return
        }

        if (--currentAutoRefreshInterval.value <= 0) {
            await refreshMails()
        }
    }, 1000)
})

onBeforeUnmount(() => {
    clearInterval(timer.value)
})
</script>

<template>
    <div class="simple-index-container">
        <div v-if="!settings.address">
            <v-card variant="flat">
                <v-card-text>
                    <Login />
                </v-card-text>
            </v-card>
        </div>

        <div v-else>
            <v-card variant="flat" class="mb-4">
                <v-card-text class="text-center">
                    <div class="text-h6 font-weight-bold mb-4">{{ settings.address }}</div>
                    <div class="d-flex justify-center ga-2 flex-wrap">
                        <v-btn @click="refreshMails" :loading="loading" color="primary" variant="tonal" size="small"
                            prepend-icon="mdi-refresh">
                            {{ t('refreshMails') }}
                        </v-btn>
                        <v-btn @click="copyAddress" variant="tonal" size="small" prepend-icon="mdi-content-copy">
                            {{ t('copyAddress') }}
                        </v-btn>
                        <v-btn @click="useSimpleIndex = false" variant="tonal" size="small"
                            prepend-icon="mdi-exit-to-app">
                            {{ t('exitSimpleIndex') }}
                        </v-btn>
                        <v-btn @click="showAccountSettingsCard = true" variant="tonal" size="small"
                            prepend-icon="mdi-cog">
                            {{ t('accountSettings') }}
                        </v-btn>
                    </div>
                    <div v-if="isFirstPage" class="text-caption text-medium-emphasis mt-3">
                        {{ t('refreshAfter', { msg: Math.max(0, currentAutoRefreshInterval) }) }}
                    </div>
                </v-card-text>
            </v-card>

            <v-card v-if="showAccountSettingsCard" variant="flat" class="mb-4">
                <v-card-title class="d-flex justify-space-between align-center">
                    {{ t('accountSettings') }}
                    <v-btn icon variant="text" @click="showAccountSettingsCard = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <AccountSettings />
                </v-card-text>
            </v-card>

            <v-card v-else variant="flat" class="text-left">
                <v-card-text>
                    <div v-if="totalCount > 1" class="d-flex justify-space-between align-center mb-4">
                        <v-btn @click="prevPage" :disabled="!canGoPrev" variant="text" size="small"
                            prepend-icon="mdi-chevron-left">
                            {{ t('prevPage') }}
                        </v-btn>
                        <span class="text-caption">
                            {{ t('mailCount', { current: currentPageDisplay, total: totalCount }) }}
                        </span>
                        <v-btn @click="nextPage" :disabled="!canGoNext" variant="text" size="small"
                            append-icon="mdi-chevron-right">
                            {{ t('nextPage') }}
                        </v-btn>
                    </div>

                    <v-empty-state v-if="!currentMail" icon="mdi-email-outline" :title="t('noMails')" />
                    <div v-else>
                        <h3 v-if="currentMail.subject" class="mb-4">{{ currentMail.subject }}</h3>
                        <MailContentRenderer :mail="currentMail" :showEMailTo="false" :showReply="false"
                            :enableUserDeleteEmail="openSettings.enableUserDeleteEmail" :showSaveS3="false"
                            :onDelete="deleteMail" />
                    </div>
                </v-card-text>
            </v-card>
        </div>

        <v-dialog v-model="showAddressCredential" max-width="500">
            <v-card>
                <v-card-title>{{ t('addressCredential') }}</v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ t("addressCredentialTip") }}</p>
                    <v-card variant="tonal">
                        <v-card-text>
                            <strong>{{ jwt }}</strong>
                        </v-card-text>
                    </v-card>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showAddressCredential = false">{{ t('close') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>

<style scoped>
.simple-index-container {
    max-width: 800px;
    margin: 0 auto;
}
</style>
