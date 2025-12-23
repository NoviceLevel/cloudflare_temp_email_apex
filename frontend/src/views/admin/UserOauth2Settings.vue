<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import { api } from '../../api'
import constant from '../../constant'
import { UserOauth2Settings } from '../../models';

const { loading, showSnackbar } = useGlobalState()

const { t } = useI18n({
    messages: {
        en: {
            save: 'Save',
            delete: 'Delete',
            successTip: 'Save Success',
            enable: 'Enable',
            enableMailAllowList: 'Enable Mail Address Allow List(Manually enterable)',
            manualInputPrompt: 'Type and press Enter to add',
            mailAllowList: 'Mail Address Allow List',
            addOauth2: 'Add Oauth2',
            name: 'Name',
            oauth2Type: 'Oauth2 Type',
            tip: 'Third-party login will automatically use the user\'s email to register an account (the same email will be regarded as the same account), this account is the same as the registered account, and you can also set the password through the forget password',
            cancel: 'Cancel',
            confirm: 'Confirm',
        },
        zh: {
            save: '保存',
            delete: '删除',
            successTip: '保存成功',
            enable: '启用',
            enableMailAllowList: '启用邮件地址白名单(可手动输入, 回车增加)',
            manualInputPrompt: '输入后按回车键添加',
            mailAllowList: '邮件地址白名单',
            addOauth2: '添加 Oauth2',
            name: '名称',
            oauth2Type: 'Oauth2 类型',
            tip: '第三方登录会自动使用用户邮箱注册账号(邮箱相同将视为同一账号), 此账号和注册的账号相同, 也可以通过忘记密码设置密码',
            cancel: '取消',
            confirm: '确认',
        }
    }
});

const mailAllowOptions = constant.COMMOM_MAIL.map((item) => {
    return { title: item, value: item }
})

const userOauth2Settings = ref([] as UserOauth2Settings[])
const showAddOauth2 = ref(false)
const newOauth2Name = ref('')
const newOauth2Type = ref('custom')
const showDeleteConfirm = ref(false)
const deleteIndex = ref(-1)

const accessTokenFormatOptions = [
    { title: 'json', value: 'json' },
    { title: 'urlencoded', value: 'urlencoded' },
]

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/user_oauth2_settings`)
        Object.assign(userOauth2Settings.value, res)
    } catch (error) {
        showSnackbar((error as Error).message || "error", 'error')
    }
}

const save = async () => {
    try {
        await api.fetch(`/admin/user_oauth2_settings`, {
            method: 'POST',
            body: JSON.stringify(userOauth2Settings.value)
        })
        showSnackbar(t('successTip'), 'success')
    } catch (error) {
        showSnackbar((error as Error).message || "error", 'error')
    }
}

const addNewOauth2 = () => {
    const authorizationURL = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'https://github.com/login/oauth/authorize'
            case 'authentik': return 'https://youdomain/application/o/authorize/'
            default: return ''
        }
    }
    const accessTokenURL = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'https://github.com/login/oauth/access_token'
            case 'authentik': return 'https://youdomain/application/o/token/'
            default: return ''
        }
    }
    const accessTokenFormat = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'json'
            case 'authentik': return 'urlencoded'
            default: return ''
        }
    }
    const userInfoURL = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'https://api.github.com/user'
            case 'authentik': return 'https://youdomain/application/o/userinfo/'
            default: return ''
        }
    }
    const userEmailKey = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'email'
            case 'authentik': return 'email'
            default: return ''
        }
    }
    const scope = () => {
        switch (newOauth2Type.value) {
            case 'github': return 'user:email'
            case 'authentik': return 'email openid'
            default: return ''
        }
    }
    userOauth2Settings.value.push({
        name: newOauth2Name.value,
        clientID: '',
        clientSecret: '',
        authorizationURL: authorizationURL(),
        accessTokenURL: accessTokenURL(),
        accessTokenFormat: accessTokenFormat(),
        userInfoURL: userInfoURL(),
        userEmailKey: userEmailKey(),
        redirectURL: `${window.location.origin}/user/oauth2/callback`,
        logoutURL: '',
        scope: scope(),
        enableMailAllowList: false,
        mailAllowList: constant.COMMOM_MAIL
    } as UserOauth2Settings)
    newOauth2Name.value = ''
    showAddOauth2.value = false
}

const confirmDelete = (index: number) => {
    deleteIndex.value = index
    showDeleteConfirm.value = true
}

const doDelete = () => {
    if (deleteIndex.value >= 0) {
        userOauth2Settings.value.splice(deleteIndex.value, 1)
    }
    showDeleteConfirm.value = false
    deleteIndex.value = -1
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="center">
        <!-- Add Oauth2 Dialog -->
        <v-dialog v-model="showAddOauth2" max-width="500">
            <v-card>
                <v-card-title>{{ t('addOauth2') }}</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newOauth2Name" :label="t('name')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                    <div class="mb-2">{{ t('oauth2Type') }}</div>
                    <v-btn-toggle v-model="newOauth2Type" mandatory>
                        <v-btn value="github">Github</v-btn>
                        <v-btn value="authentik">Authentik</v-btn>
                        <v-btn value="custom">Custom</v-btn>
                    </v-btn-toggle>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showAddOauth2 = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="primary" :loading="loading" @click="addNewOauth2">{{ t('addOauth2') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirm Dialog -->
        <v-dialog v-model="showDeleteConfirm" max-width="400">
            <v-card>
                <v-card-title>{{ t('delete') }}</v-card-title>
                <v-card-text>{{ t('delete') }}?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="showDeleteConfirm = false">{{ t('cancel') }}</v-btn>
                    <v-btn color="error" @click="doDelete">{{ t('confirm') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-card variant="flat" max-width="600" width="100%">
            <v-alert type="warning" variant="tonal" closable class="mb-4">
                {{ t("tip") }}
            </v-alert>
            <div class="d-flex justify-end ga-2 mb-4">
                <v-btn variant="outlined" :loading="loading" @click="showAddOauth2 = true">{{ t('addOauth2') }}</v-btn>
                <v-btn color="primary" :loading="loading" @click="save">{{ t('save') }}</v-btn>
            </div>
            <v-divider class="mb-4"></v-divider>
            <v-expansion-panels>
                <v-expansion-panel v-for="(item, index) in userOauth2Settings" :key="index">
                    <v-expansion-panel-title>
                        <span>{{ item.name }}</span>
                        <template v-slot:actions>
                            <v-btn color="error" variant="tonal" size="small" @click.stop="confirmDelete(index)">{{ t('delete') }}</v-btn>
                        </template>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-text-field v-model="item.name" :label="t('name')" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.clientID" label="Client ID" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.clientSecret" label="Client Secret" type="password" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.authorizationURL" label="Authorization URL" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.accessTokenURL" label="Access Token URL" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-select v-model="item.accessTokenFormat" :items="accessTokenFormatOptions" label="Access Token Params Format" variant="outlined" density="compact" class="mb-2"></v-select>
                        <v-text-field v-model="item.userInfoURL" label="User Info URL" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.userEmailKey" label="User Email Key (Support JSONPATH like $[0].email)" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.redirectURL" label="Redirect URL" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <v-text-field v-model="item.scope" label="Scope" variant="outlined" density="compact" class="mb-2"></v-text-field>
                        <div class="d-flex align-center ga-2 mb-2">
                            <v-checkbox v-model="item.enableMailAllowList" :label="t('enable')" hide-details density="compact"></v-checkbox>
                            <v-combobox v-if="item.enableMailAllowList" v-model="item.mailAllowList" :items="mailAllowOptions" :label="t('mailAllowList')" multiple chips closable-chips variant="outlined" density="compact" class="flex-grow-1"></v-combobox>
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
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
