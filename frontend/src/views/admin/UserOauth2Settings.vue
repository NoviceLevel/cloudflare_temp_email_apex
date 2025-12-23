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
