<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, openSettings } = useGlobalState()

const snackbar = ref({ show: false, text: '', color: 'success' })
const showMessage = (text, color = 'success') => {
    snackbar.value = { show: true, text, color }
}

const { t } = useI18n({
    messages: {
        en: {
            tip: 'You can manually input the following multiple select input and enter',
            save: 'Save',
            successTip: 'Save Success',
            address_block_list: 'Address Block Keywords for Users(Admin can skip)',
            send_address_block_list: 'Address Block Keywords for send email',
            noLimitSendAddressList: 'No Balance Limit Send Address List',
            verified_address_list: 'Verified Address List(Can send email by cf internal api)',
            fromBlockList: 'Block Keywords for receive email',
            block_receive_unknow_address_email: 'Block receive unknow address email',
            email_forwarding_config: 'Email Forwarding Configuration',
            domain_list: 'Domain List',
            forward_address: 'Forward Address',
            actions: 'Actions',
            delete_rule: 'Delete',
            forwarding_rule_warning: 'Each rule will run, if domains is empty, all emails will be forwarded, forward address needs to be a verified address',
            add: 'Add',
            config: 'Config',
            cancel: 'Cancel',
        },
        zh: {
            tip: '您可以手动输入以下多选输入框, 回车增加',
            save: '保存',
            successTip: '保存成功',
            address_block_list: '邮件地址屏蔽关键词(管理员可跳过检查)',
            send_address_block_list: '发送邮件地址屏蔽关键词',
            noLimitSendAddressList: '无余额限制发送地址列表',
            verified_address_list: '已验证地址列表(可通过 cf 内部 api 发送邮件)',
            fromBlockList: '接收邮件地址屏蔽关键词',
            block_receive_unknow_address_email: '禁止接收未知地址邮件',
            email_forwarding_config: '邮件转发配置',
            domain_list: '域名列表',
            forward_address: '转发地址',
            actions: '操作',
            delete_rule: '删除',
            forwarding_rule_warning: '每条规则都会运行，如果 domains 为空，则转发所有邮件，转发地址需要为已验证的地址',
            add: '添加',
            config: '配置',
            cancel: '取消',
        }
    }
});

const addressBlockList = ref([])
const sendAddressBlockList = ref([])
const noLimitSendAddressList = ref([])
const verifiedAddressList = ref([])
const fromBlockList = ref([])
const emailRuleSettings = ref({
    blockReceiveUnknowAddressEmail: false,
    emailForwardingList: []
})

const showEmailForwardingModal = ref(false)
const emailForwardingList = ref([])

const openEmailForwardingModal = () => {
    emailForwardingList.value = emailRuleSettings.value.emailForwardingList ?
        [...emailRuleSettings.value.emailForwardingList] : []
    showEmailForwardingModal.value = true
}

const addNewEmailForwardingItem = () => {
    emailForwardingList.value.push({ domains: [], forward: '' })
}

const removeEmailForwardingItem = (index) => {
    emailForwardingList.value.splice(index, 1)
}

const saveEmailForwardingConfig = () => {
    emailRuleSettings.value.emailForwardingList = [...emailForwardingList.value]
    showEmailForwardingModal.value = false
}

const fetchData = async () => {
    try {
        const res = await api.fetch(`/admin/account_settings`)
        addressBlockList.value = res.blockList || []
        sendAddressBlockList.value = res.sendBlockList || []
        verifiedAddressList.value = res.verifiedAddressList || []
        fromBlockList.value = res.fromBlockList || []
        noLimitSendAddressList.value = res.noLimitSendAddressList || []
        emailRuleSettings.value = res.emailRuleSettings || {
            blockReceiveUnknowAddressEmail: false,
            emailForwardingList: []
        }
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

const save = async () => {
    try {
        await api.fetch(`/admin/account_settings`, {
            method: 'POST',
            body: JSON.stringify({
                blockList: addressBlockList.value || [],
                sendBlockList: sendAddressBlockList.value || [],
                verifiedAddressList: verifiedAddressList.value || [],
                fromBlockList: fromBlockList.value || [],
                noLimitSendAddressList: noLimitSendAddressList.value || [],
                emailRuleSettings: emailRuleSettings.value,
            })
        })
        showMessage(t('successTip'))
    } catch (error) {
        showMessage(error.message || "error", 'error');
    }
}

onMounted(async () => {
    await fetchData();
})
</script>

<template>
    <div class="d-flex justify-center my-5">
        <v-card variant="flat" max-width="600" width="100%">
            <v-card-text>
                <v-alert type="warning" variant="tonal" class="mb-4">{{ t("tip") }}</v-alert>
                <div class="d-flex justify-end mb-4">
                    <v-btn @click="save" color="primary" :loading="loading">{{ t('save') }}</v-btn>
                </div>
                <v-combobox v-model="addressBlockList" :label="t('address_block_list')" multiple chips closable-chips
                    variant="outlined" density="compact" class="mb-3" />
                <v-combobox v-model="sendAddressBlockList" :label="t('send_address_block_list')" multiple chips
                    closable-chips variant="outlined" density="compact" class="mb-3" />
                <v-combobox v-model="noLimitSendAddressList" :label="t('noLimitSendAddressList')" multiple chips
                    closable-chips variant="outlined" density="compact" class="mb-3" />
                <v-combobox v-model="verifiedAddressList" :label="t('verified_address_list')" multiple chips
                    closable-chips variant="outlined" density="compact" class="mb-3" />
                <v-combobox v-model="fromBlockList" :label="t('fromBlockList')" multiple chips closable-chips
                    variant="outlined" density="compact" class="mb-3" />
                <v-switch v-model="emailRuleSettings.blockReceiveUnknowAddressEmail"
                    :label="t('block_receive_unknow_address_email')" color="primary" hide-details class="mb-4" />
                <div class="d-flex align-center ga-2">
                    <span>{{ t('email_forwarding_config') }}:</span>
                    <v-btn @click="openEmailForwardingModal" variant="outlined">{{ t('config') }}</v-btn>
                </div>
            </v-card-text>
        </v-card>

        <v-dialog v-model="showEmailForwardingModal" max-width="800">
            <v-card>
                <v-card-title>{{ t('email_forwarding_config') }}</v-card-title>
                <v-card-text>
                    <v-alert type="warning" variant="tonal" class="mb-4">{{ t('forwarding_rule_warning') }}</v-alert>
                    <div class="d-flex justify-end mb-3">
                        <v-btn @click="addNewEmailForwardingItem" variant="outlined">{{ t('add') }}</v-btn>
                    </div>
                    <v-card v-for="(item, index) in emailForwardingList" :key="index" variant="outlined" class="mb-3">
                        <v-card-text>
                            <v-select v-model="item.domains" :items="openSettings?.domains || []" :label="t('domain_list')"
                                multiple chips closable-chips variant="outlined" density="compact" class="mb-2" />
                            <v-text-field v-model="item.forward" :label="t('forward_address')" variant="outlined"
                                density="compact" />
                            <v-btn color="error" variant="text" size="small" @click="removeEmailForwardingItem(index)">
                                {{ t('delete_rule') }}
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showEmailForwardingModal = false">{{ t('cancel') }}</v-btn>
                    <v-btn @click="saveEmailForwardingConfig" color="primary">{{ t('save') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
            {{ snackbar.text }}
        </v-snackbar>
    </div>
</template>
