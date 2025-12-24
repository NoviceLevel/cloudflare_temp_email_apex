<script setup>
import { useGlobalState } from '../../store'
const { announcement } = useGlobalState()
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800">
            <v-card-text>
                <div v-html="announcement"></div>

            </v-card-text>
        </v-card>
    </div>
</template>
