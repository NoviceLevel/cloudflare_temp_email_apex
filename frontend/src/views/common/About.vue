<script setup>
import { useGlobalState } from '../../store'
import M3LoadingIndicator from '../../components/M3LoadingIndicator.vue'
const { announcement } = useGlobalState()
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <div v-html="announcement"></div>
                <div class="d-flex flex-column align-center justify-center mt-6 ga-4">
                    <M3LoadingIndicator />
                    <v-chip variant="outlined" color="primary" size="small">
                        M3 Expressive
                    </v-chip>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>
