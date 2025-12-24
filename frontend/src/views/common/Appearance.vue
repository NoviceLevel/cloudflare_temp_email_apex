<script setup>
import { useI18n } from 'vue-i18n'

import { useIsMobile } from '../../utils/composables'
import { useGlobalState } from '../../store'

const props = defineProps({
    showUseSimpleIndex: {
        type: Boolean,
        default: false
    }
})

const {
    mailboxSplitSize, useIframeShowMail, preferShowTextMail, configAutoRefreshInterval,
    globalTabplacement, useSideMargin, useUTCDate, useSimpleIndex
} = useGlobalState()
const isMobile = useIsMobile()

const tabPlacementOptions = [
    { title: 'top', value: 'top' },
    { title: 'left', value: 'left' },
    { title: 'right', value: 'right' },
    { title: 'bottom', value: 'bottom' }
]

const { t } = useI18n({
    messages: {
        en: {
            useSimpleIndex: 'Use Simple Index',
            mailboxSplitSize: 'Mailbox Split Size',
            useIframeShowMail: 'Use iframe Show HTML Mail',
            preferShowTextMail: 'Display text Mail by default',
            useSideMargin: 'Turn on the side margins on the left and right sides of the page',
            globalTabplacement: 'Global Tab Placement',
            left: 'left',
            top: 'top',
            right: 'right',
            bottom: 'bottom',
            useUTCDate: 'Use UTC Date',
            autoRefreshInterval: 'Auto Refresh Interval(Sec)',
        },
        zh: {
            useSimpleIndex: '使用极简主页',
            mailboxSplitSize: '邮箱界面分栏大小',
            preferShowTextMail: '默认以文本显示邮件',
            useIframeShowMail: '使用iframe显示HTML邮件',
            globalTabplacement: '全局选项卡位置',
            useSideMargin: '开启页面左右两侧侧边距',
            left: '左侧',
            top: '顶部',
            right: '右侧',
            bottom: '底部',
            useUTCDate: '使用 UTC 时间',
            autoRefreshInterval: '自动刷新间隔(秒)',
        }
    }
});
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <div v-if="!isMobile" class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('mailboxSplitSize') }}</div>
                    <v-slider v-model="mailboxSplitSize" :min="0.25" :max="0.75" :step="0.01" thumb-label
                        hide-details />
                </div>
                <div class="mb-4">
                    <div class="text-subtitle-2 mb-2">{{ t('autoRefreshInterval') }}</div>
                    <v-slider v-model="configAutoRefreshInterval" :min="30" :max="300" :step="1" thumb-label
                        hide-details />
                </div>
                <v-switch v-if="props.showUseSimpleIndex" v-model="useSimpleIndex" :label="t('useSimpleIndex')"
                    color="primary" hide-details class="mb-2" />
                <v-switch v-model="preferShowTextMail" :label="t('preferShowTextMail')" color="primary" hide-details
                    class="mb-2" />
                <v-switch v-model="useIframeShowMail" :label="t('useIframeShowMail')" color="primary" hide-details
                    class="mb-2" />
                <v-switch v-model="useUTCDate" :label="t('useUTCDate')" color="primary" hide-details class="mb-2" />
                <v-switch v-if="!isMobile" v-model="useSideMargin" :label="t('useSideMargin')" color="primary"
                    hide-details class="mb-4" />
            </v-card-text>
        </v-card>
    </div>
</template>
