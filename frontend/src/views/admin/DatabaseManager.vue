<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { api } from '../../api'
import { useGlobalState } from '../../store'

const { loading } = useGlobalState()
const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const dbVersionData = ref({
    need_initialization: false,
    need_migration: false,
    current_db_version: '',
    code_db_version: ''
})

const { t } = useI18n({
    messages: {
        en: {
            need_initialization_tip: 'Database initialization is required. Please initialize the database.',
            need_migration_tip: 'Database migration is required. Please migrate the database.',
            current_db_version: 'Current DB Version',
            code_db_version: 'Code Needed DB Version',
            init: 'Initialize Database',
            migration: 'Migrate Database',
            initializationSuccess: 'Database initialized successfully',
            migrationSuccess: 'Database migrated successfully',
        },
        zh: {
            need_initialization_tip: '需要初始化数据库，请初始化数据库',
            need_migration_tip: '需要迁移数据库，请迁移数据库',
            current_db_version: '当前数据库版本',
            code_db_version: '需要的数据库版本',
            init: '初始化数据库',
            migration: '升级数据库 Schema',
            initializationSuccess: '数据库初始化成功',
            migrationSuccess: '数据库升级成功',
        }
    }
});

const fetchData = async () => {
    try {
        const res = await api.fetch('/admin/db_version');
        if (res) Object.assign(dbVersionData.value, res);
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const initialization = async () => {
    try {
        await api.fetch('/admin/db_initialize', { method: 'POST' });
        await fetchData();
        showMessage(t('initializationSuccess'));
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const migration = async () => {
    try {
        await api.fetch('/admin/db_migration', { method: 'POST' });
        await fetchData();
        showMessage(t('migrationSuccess'));
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <v-alert v-if="dbVersionData.need_initialization" type="warning" variant="tonal" class="mb-3">
                    {{ t('need_initialization_tip') }}
                    <v-btn @click="initialization" color="primary" variant="outlined" block :loading="loading"
                        class="mt-3">
                        {{ t('init') }}
                    </v-btn>
                </v-alert>
                <v-alert v-if="dbVersionData.need_migration" type="warning" variant="tonal" class="mb-3">
                    {{ t('need_migration_tip') }}
                    <v-btn @click="migration" color="primary" variant="outlined" block :loading="loading" class="mt-3">
                        {{ t('migration') }}
                    </v-btn>
                </v-alert>
                <v-alert type="info" variant="tonal">
                    {{ t('current_db_version') }}: {{ dbVersionData.current_db_version || "unknown" }},
                    {{ t('code_db_version') }}: {{ dbVersionData.code_db_version }}
                </v-alert>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
