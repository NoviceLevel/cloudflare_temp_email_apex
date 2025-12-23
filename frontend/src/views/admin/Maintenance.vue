<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, showSnackbar } = useGlobalState()
const cleanupModel = ref({
    enableMailsAutoCleanup: false,
    cleanMailsDays: 30,
    enableUnknowMailsAutoCleanup: false,
    cleanUnknowMailsDays: 30,
    enableSendBoxAutoCleanup: false,
    cleanSendBoxDays: 30,
    enableAddressAutoCleanup: false,
    cleanAddressDays: 30,
    enableInactiveAddressAutoCleanup: false,
    cleanInactiveAddressDays: 30,
    enableUnboundAddressAutoCleanup: false,
    cleanUnboundAddressDays: 30,
    enableEmptyAddressAutoCleanup: false,
    cleanEmptyAddressDays: 30,
    customSqlCleanupList: []
})

const { t } = useI18n({
    messages: {
        en: {
            tip: 'Please input the days',
            mailBoxLabel: 'Cleanup the inbox before n days',
            mailUnknowLabel: "Cleanup the unknow mail before n days",
            sendBoxLabel: "Cleanup the sendbox before n days",
            addressCreateLabel: "Cleanup the address created before n days",
            inactiveAddressLabel: "Cleanup the inactive address before n days",
            unboundAddressLabel: "Cleanup the unbound address before n days",
            emptyAddressLabel: "Cleanup the empty address before n days",
            cleanupNow: "Cleanup now",
            autoCleanup: "Auto cleanup",
            cleanupSuccess: "Cleanup success",
            saveSuccess: "Save success",
            save: "Save",
            cronTip: "Enable cron cleanup, need to configure [crons] in worker, please refer to the document, setting 0 days means clear all",
            basicCleanup: "Basic Cleanup",
            customSqlCleanup: "Custom SQL Cleanup",
            customSqlTip: "Add custom DELETE SQL statements for scheduled cleanup. Only single DELETE statement is allowed per entry.",
            addCustomSql: "Add Custom SQL",
            sqlName: "Name",
            sqlStatement: "SQL Statement (DELETE only)",
            sqlNamePlaceholder: "e.g. Clean old logs",
            sqlPlaceholder: "e.g. DELETE FROM raw_mails WHERE source GLOB '*{'@'}example.com' AND created_at < datetime('now', '-3 day')",
            deleteCustomSql: "Delete",
        },
        zh: {
            tip: '请输入天数',
            mailBoxLabel: '清理 n 天前的收件箱',
            mailUnknowLabel: "清理 n 天前的无收件人邮件",
            sendBoxLabel: "清理 n 天前的发件箱",
            addressCreateLabel: "清理 n 天前创建的地址",
            inactiveAddressLabel: "清理 n 天前的未活跃地址",
            unboundAddressLabel: "清理 n 天前的未绑定用户地址",
            emptyAddressLabel: "清理 n 天前空邮件的邮箱地址",
            autoCleanup: "自动清理",
            cleanupSuccess: "清理成功",
            saveSuccess: "保存成功",
            cleanupNow: "立即清理",
            save: "保存",
            cronTip: "启用定时清理, 需在 worker 配置 [crons] 参数, 请参考文档, 配置为 0 天表示全部清空",
            basicCleanup: "基础清理",
            customSqlCleanup: "自定义 SQL 清理",
            customSqlTip: "添加自定义 DELETE SQL 语句进行定时清理。每条记录仅允许单条 DELETE 语句。",
            addCustomSql: "添加自定义 SQL",
            sqlName: "名称",
            sqlStatement: "SQL 语句 (仅限 DELETE)",
            sqlNamePlaceholder: "例如: 清理旧日志",
            sqlPlaceholder: "例如: DELETE FROM raw_mails WHERE source GLOB '*{'@'}example.com' AND created_at < datetime('now', '-3 day')",
            deleteCustomSql: "删除",
        }
    }
});

const tab = ref('basic')

const cleanup = async (cleanType, cleanDays) => {
    try {
        await api.fetch('/admin/cleanup', {
            method: 'POST',
            body: JSON.stringify({ cleanType, cleanDays })
        });
        showSnackbar(t('cleanupSuccess'), 'success')
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    }
}

const addCustomSql = () => {
    if (!cleanupModel.value.customSqlCleanupList) {
        cleanupModel.value.customSqlCleanupList = [];
    }
    cleanupModel.value.customSqlCleanupList.push({
        id: Date.now().toString(),
        name: '',
        sql: '',
        enabled: false
    });
}

const removeCustomSql = (index) => {
    cleanupModel.value.customSqlCleanupList.splice(index, 1);
}

const fetchData = async () => {
    try {
        const res = await api.fetch('/admin/auto_cleanup');
        if (res) Object.assign(cleanupModel.value, res);
        if (!cleanupModel.value.customSqlCleanupList) {
            cleanupModel.value.customSqlCleanupList = [];
        }
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    }
}

const save = async () => {
    try {
        await api.fetch('/admin/auto_cleanup', {
            method: 'POST',
            body: JSON.stringify(cleanupModel.value)
        });
        showSnackbar(t('saveSuccess'), 'success')
    } catch (error) {
        showSnackbar(error.message || "error", 'error')
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-alert type="warning" variant="tonal" class="mb-4">
                {{ t('cronTip') }}
            </v-alert>
            <div class="d-flex justify-end mb-4">
                <v-btn color="primary" :loading="loading" @click="save">
                    {{ t('save') }}
                </v-btn>
            </div>
            <v-tabs v-model="tab" class="mb-4">
                <v-tab value="basic">{{ t('basicCleanup') }}</v-tab>
                <v-tab value="custom_sql">{{ t('customSqlCleanup') }}</v-tab>
            </v-tabs>
            <v-window v-model="tab">
                <v-window-item value="basic">
                    <v-form>
                        <div v-for="(item, index) in [
                            { label: 'mailBoxLabel', enable: 'enableMailsAutoCleanup', days: 'cleanMailsDays', type: 'mails' },
                            { label: 'mailUnknowLabel', enable: 'enableUnknowMailsAutoCleanup', days: 'cleanUnknowMailsDays', type: 'mails_unknow' },
                            { label: 'sendBoxLabel', enable: 'enableSendBoxAutoCleanup', days: 'cleanSendBoxDays', type: 'sendbox' },
                            { label: 'addressCreateLabel', enable: 'enableAddressAutoCleanup', days: 'cleanAddressDays', type: 'addressCreated' },
                            { label: 'inactiveAddressLabel', enable: 'enableInactiveAddressAutoCleanup', days: 'cleanInactiveAddressDays', type: 'inactiveAddress' },
                            { label: 'unboundAddressLabel', enable: 'enableUnboundAddressAutoCleanup', days: 'cleanUnboundAddressDays', type: 'unboundAddress' },
                            { label: 'emptyAddressLabel', enable: 'enableEmptyAddressAutoCleanup', days: 'cleanEmptyAddressDays', type: 'emptyAddress' }
                        ]" :key="index" class="d-flex flex-wrap align-center ga-2 mb-4">
                            <v-checkbox v-model="cleanupModel[item.enable]" :label="t('autoCleanup')" hide-details density="compact"></v-checkbox>
                            <span class="flex-grow-1">{{ t(item.label) }}</span>
                            <v-text-field v-model.number="cleanupModel[item.days]" type="number" :placeholder="t('tip')" variant="outlined" density="compact" hide-details style="max-width: 120px"></v-text-field>
                            <v-btn variant="tonal" @click="cleanup(item.type, cleanupModel[item.days])">
                                <v-icon start>mdi-broom</v-icon>
                                {{ t('cleanupNow') }}
                            </v-btn>
                        </div>
                    </v-form>
                </v-window-item>
                <v-window-item value="custom_sql">
                    <v-alert type="info" variant="tonal" class="mb-4">
                        {{ t('customSqlTip') }}
                    </v-alert>
                    <v-card v-for="(item, index) in cleanupModel.customSqlCleanupList" :key="item.id" variant="outlined" class="mb-4 pa-4">
                        <div class="d-flex flex-wrap align-center ga-2 mb-2">
                            <v-checkbox v-model="item.enabled" :label="t('autoCleanup')" hide-details density="compact"></v-checkbox>
                            <v-text-field v-model="item.name" :placeholder="t('sqlNamePlaceholder')" variant="outlined" density="compact" hide-details style="max-width: 200px"></v-text-field>
                            <v-btn color="error" variant="text" @click="removeCustomSql(index)">
                                <v-icon start>mdi-delete</v-icon>
                                {{ t('deleteCustomSql') }}
                            </v-btn>
                        </div>
                        <v-textarea v-model="item.sql" :placeholder="t('sqlPlaceholder')" variant="outlined" density="compact" rows="2" auto-grow></v-textarea>
                    </v-card>
                    <v-btn variant="tonal" @click="addCustomSql">
                        <v-icon start>mdi-plus</v-icon>
                        {{ t('addCustomSql') }}
                    </v-btn>
                </v-window-item>
            </v-window>
        </v-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: center;
    place-items: center;
    justify-content: center;
}
</style>
