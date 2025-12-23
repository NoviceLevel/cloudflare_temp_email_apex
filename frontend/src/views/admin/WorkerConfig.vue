<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, showSnackbar } = useGlobalState()

const settings = ref({})

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/worker/configs`)
        Object.assign(settings.value, res)
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
        <v-card variant="flat" max-width="800" width="100%" style="overflow: auto;">
            <pre class="text-left pa-4">{{ JSON.stringify(settings, null, 2) }}</pre>
        </v-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
}
</style>
