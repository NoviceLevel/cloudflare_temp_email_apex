<script setup>
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../store'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import BindAddress from './user/BindAddress.vue';
import UserMailBox from './user/UserMailBox.vue';

const {
    userTab, globalTabplacement, userSettings
} = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            address_management: 'Address Management',
            user_mail_box_tab: 'Mail Box',
            user_settings: 'User Settings',
            bind_address: 'Bind Mail Address',
        },
        zh: {
            address_management: '地址管理',
            user_mail_box_tab: '收件箱',
            user_settings: '用户设置',
            bind_address: '绑定邮箱地址',
        }
    }
});
</script>

<template>
    <div class="d-flex justify-center">
        <div style="max-width: 400px; width: 100%;">
            <UserBar />
            <template v-if="userSettings.user_email">
                <v-tabs v-model="userTab"
                    :direction="globalTabplacement === 'left' || globalTabplacement === 'right' ? 'vertical' : 'horizontal'"
                    color="primary" class="mb-4">
                    <v-tab value="address_management">{{ t('address_management') }}</v-tab>
                    <v-tab value="user_mail_box_tab">{{ t('user_mail_box_tab') }}</v-tab>
                    <v-tab value="user_settings">{{ t('user_settings') }}</v-tab>
                    <v-tab value="bind_address">{{ t('bind_address') }}</v-tab>
                </v-tabs>
                <v-window v-model="userTab">
                    <v-window-item value="address_management">
                        <AddressMangement />
                    </v-window-item>
                    <v-window-item value="user_mail_box_tab">
                        <UserMailBox />
                    </v-window-item>
                    <v-window-item value="user_settings">
                        <UserSettingsPage />
                    </v-window-item>
                    <v-window-item value="bind_address">
                        <BindAddress />
                    </v-window-item>
                </v-window>
            </template>
        </div>
    </div>
</template>
