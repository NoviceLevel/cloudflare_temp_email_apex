<script setup>
import { useGlobalState } from '../../store'
const { announcement } = useGlobalState()
</script>

<template>
    <div class="d-flex justify-center">
        <v-card variant="flat" max-width="800">
            <v-card-text>
                <div v-html="announcement"></div>
                <div class="d-flex ga-2 flex-wrap mt-4">
                    <v-btn href="https://github.com/dreamhunter2333/cloudflare_temp_email" target="_blank"
                        prepend-icon="mdi-github">
                        Github
                    </v-btn>
                    <v-btn href="https://discord.gg/dQEwTWhA6Q" target="_blank" prepend-icon="mdi-discord">
                        Discord
                    </v-btn>
                    <v-btn href="https://t.me/cloudflare_temp_email" target="_blank" prepend-icon="mdi-send">
                        Telegram
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>
