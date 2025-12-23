<script setup>
import { useGlobalState } from '../../store'
import Login from '../common/Login.vue'

const { userSettings } = useGlobalState()
</script>

<template>
    <div class="d-flex justify-center" v-if="userSettings.user_email">
        <v-card variant="flat" max-width="600" width="100%">
            <v-card-text>
                <Login />
            </v-card-text>
        </v-card>
    </div>
</template>
