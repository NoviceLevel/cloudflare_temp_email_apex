<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

import { api } from '../../api'

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            download: 'Download',
            action: 'Action',
            delete: 'Delete',
            deleteConfirm: 'Are you sure to delete this attachment?',
            deleteSuccess: 'Deleted successfully',
            cancel: 'Cancel',
            key: 'Key',
        },
        zh: {
            download: '下载',
            action: '操作',
            delete: '删除',
            deleteConfirm: '确定要删除此附件吗？',
            deleteSuccess: '删除成功',
            cancel: '取消',
            key: '键',
        }
    }
});

const data = ref([])
const showDownload = ref(false)
const showDeleteConfirm = ref(false)
const curRow = ref({})
const curDownloadUrl = ref('')

const fetchData = async () => {
    try {
        const { results } = await api.fetch(`/api/attachment/list`);
        data.value = results;
    } catch (error) {
        console.log(error)
        showMessage(error.message || "error", 'error');
    }
}

const downloadAttachment = async (row) => {
    try {
        const { url } = await api.fetch(`/api/attachment/get_url`, {
            method: 'POST',
            body: JSON.stringify({ key: row.key })
        });
        curDownloadUrl.value = url;
        curRow.value = row;
        showDownload.value = true;
    } catch (error) {
        console.error(error);
        showMessage(error.message || "error", 'error');
    }
}

const confirmDelete = (row) => {
    curRow.value = row;
    showDeleteConfirm.value = true;
}

const deleteAttachment = async () => {
    try {
        await api.fetch(`/api/attachment/delete`, {
            method: 'POST',
            body: JSON.stringify({ key: curRow.value.key })
        });
        showMessage(t('deleteSuccess'));
        showDeleteConfirm.value = false;
        await fetchData();
    } catch (error) {
        console.error(error);
        showMessage(error.message || "error", 'error');
    }
}

onMounted(async () => {
    await fetchData()
})
</script>

<template>
    <div>
        <v-table>
            <thead>
                <tr>
                    <th>{{ t('key') }}</th>
                    <th>{{ t('action') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in data" :key="row.key">
                    <td>{{ row.key }}</td>
                    <td>
                        <v-btn size="small" color="success" variant="text" @click="downloadAttachment(row)">
                            {{ t('download') }}
                        </v-btn>
                        <v-btn size="small" color="error" variant="text" @click="confirmDelete(row)">
                            {{ t('delete') }}
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <v-dialog v-model="showDownload" max-width="500">
            <v-card>
                <v-card-title>{{ t('download') }}</v-card-title>
                <v-card-text>
                    <v-chip color="info" class="mb-3">{{ curRow.key }}</v-chip>
                    <br />
                    <v-btn :href="curDownloadUrl" target="_blank" :download="curRow.key?.replace('/', '_')"
                        color="info" variant="tonal">
                        {{ t('download') }}
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showDeleteConfirm" max-width="400">
            <v-card>
                <v-card-text>{{ t('deleteConfirm') }}</v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showDeleteConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="deleteAttachment">{{ t('delete') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
