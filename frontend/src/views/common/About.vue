<script setup>
import { useGlobalState } from '../../store'
const { announcement } = useGlobalState()
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800" width="100%">
            <v-card-text>
                <div v-html="announcement"></div>
                <div class="d-flex align-center justify-center mt-6">
                    <v-chip variant="outlined" color="primary" size="small">
                        M3 Expressive
                    </v-chip>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>
