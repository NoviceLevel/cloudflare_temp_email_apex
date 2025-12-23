<script setup>
import { watch, onMounted, ref, computed } from "vue";
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { utcToLocalDate } from '../utils';

const isMobile = useIsMobile()
const snackbar = ref({ show: false, text: '', color: 'success' })

const showMessage = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false
  },
  showEMailFrom: {
    type: Boolean,
    default: false
  },
  fetchMailData: {
    type: Function,
    default: () => { },
    required: true
  },
  deleteMail: {
    type: Function,
    default: () => { },
    required: false
  },
})

const { isDark, mailboxSplitSize, loading, useUTCDate } = useGlobalState()
const data = ref([])

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 }
]

const curMail = ref(null);
const showCode = ref(false)
const showDrawer = ref(false)

const multiActionMode = ref(false)
const deleteDialog = ref(false)
const multiDeleteDialog = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { t } = useI18n({
  messages: {
    en: {
      success: 'Success',
      refresh: 'Refresh',
      showCode: 'Change View Original Code',
      pleaseSelectMail: "Please select a mail to view.",
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      multiAction: 'Multi Action',
      cancelMultiAction: 'Cancel Multi Action',
      selectAll: 'Select All of This Page',
      unselectAll: 'Unselect All',
      cancel: 'Cancel',
      confirm: 'Confirm',
    },
    zh: {
      success: '成功',
      refresh: '刷新',
      showCode: '切换查看元数据',
      pleaseSelectMail: "请选择一封邮件查看。",
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      multiAction: '多选',
      cancelMultiAction: '取消多选',
      selectAll: '全选本页',
      unselectAll: '取消全选',
      cancel: '取消',
      confirm: '确认',
    }
  }
});

watch([page, pageSize], async ([newPage, newPageSize], [oldPage, oldPageSize]) => {
  if (newPage !== oldPage || newPageSize !== oldPageSize) {
    await refresh();
  }
})

const refresh = async () => {
  try {
    const { results, count: totalCount } = await props.fetchMailData(
      pageSize.value, (page.value - 1) * pageSize.value
    );
    data.value = results.map((item) => {
      try {
        const mailData = JSON.parse(item.raw);
        if (mailData.version == "v2") {
          item.to_mail = mailData.to_name ? `${mailData.to_name} <${mailData.to_mail}>` : mailData.to_mail;
          item.subject = mailData.subject;
          item.is_html = mailData.is_html;
          item.content = mailData.content;
          item.raw = JSON.stringify(mailData, null, 2);
        } else {
          item.to_mail = mailData?.personalizations?.map(
            (p) => p.to?.map((t) => t.email).join(',')
          ).join(';');
          item.subject = mailData.subject;
          item.is_html = (mailData.content[0]?.type != 'text/plain');
          item.content = mailData.content[0]?.value;
          item.raw = JSON.stringify(mailData, null, 2);
        }
      } catch (error) {
        console.log(error);
      }
      return item;
    });
    if (totalCount > 0) {
      count.value = totalCount;
    }
    if (!isMobile.value && !curMail.value && data.value.length > 0) {
      curMail.value = data.value[0];
    }
  } catch (error) {
    showMessage(error.message || "error", 'error');
    console.error(error);
  }
};

const clickRow = async (row) => {
  curMail.value = row;
  if (isMobile.value) {
    showDrawer.value = true;
  }
};

const mailItemClass = (row) => {
  return curMail.value && row.id == curMail.value.id ? 'selected-mail' : '';
};

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id);
    showMessage(t("success"));
    curMail.value = null;
    deleteDialog.value = false;
    await refresh();
  } catch (error) {
    showMessage(error.message || "error", 'error');
  }
};

const showMultiActionMode = computed(() => {
  return props.enableUserDeleteEmail;
});

const multiActionModeClick = (enableMulti) => {
  if (enableMulti) {
    data.value.forEach((item) => {
      item.checked = false;
    });
    multiActionMode.value = true;
  } else {
    multiActionMode.value = false;
    data.value.forEach((item) => {
      item.checked = false;
    });
  }
}

const multiActionSelectAll = (checked) => {
  data.value.forEach((item) => {
    item.checked = checked;
  });
}

const multiActionDeleteMail = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) {
      showMessage(t('pleaseSelectMail'), 'error');
      return;
    }
    multiActionDeleteProgress.value = {
      percentage: 0,
      tip: `0/${selectedMails.length}`
    };
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id);
      showMultiActionDelete.value = true;
      multiActionDeleteProgress.value = {
        percentage: Math.floor((index + 1) / selectedMails.length * 100),
        tip: `${index + 1}/${selectedMails.length}`
      };
    }
    showMessage(t("success"));
    multiDeleteDialog.value = false;
    await refresh();
  } catch (error) {
    showMessage(error.message || "error", 'error');
  } finally {
    loading.value = false;
    showMultiActionDelete.value = true;
  }
}

const totalPages = computed(() => Math.ceil(count.value / pageSize.value))

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <div>
    <!-- Desktop View -->
    <div v-if="!isMobile" class="text-left">
      <div class="mb-3">
        <div v-if="multiActionMode" class="d-flex ga-2 flex-wrap">
          <v-btn @click="multiActionModeClick(false)" variant="outlined">
            {{ t('cancelMultiAction') }}
          </v-btn>
          <v-btn @click="multiActionSelectAll(true)" variant="outlined">
            {{ t('selectAll') }}
          </v-btn>
          <v-btn @click="multiActionSelectAll(false)" variant="outlined">
            {{ t('unselectAll') }}
          </v-btn>
          <v-btn v-if="enableUserDeleteEmail" color="error" variant="outlined" @click="multiDeleteDialog = true">
            {{ t('delete') }}
          </v-btn>
        </div>
        <div v-else class="d-flex ga-2 align-center flex-wrap">
          <v-btn v-if="showMultiActionMode" @click="multiActionModeClick(true)" color="primary" variant="outlined">
            {{ t('multiAction') }}
          </v-btn>
          <v-pagination v-model="page" :length="totalPages" density="compact" />
          <v-select v-model="pageSize" :items="pageSizeOptions" density="compact" variant="outlined"
            style="max-width: 100px;" hide-details />
          <v-btn @click="refresh" color="primary" variant="outlined">
            {{ t('refresh') }}
          </v-btn>
        </div>
      </div>

      <v-row>
        <v-col cols="5">
          <div style="overflow: auto; height: 80vh;">
            <v-list lines="two">
              <v-list-item v-for="row in data" :key="row.id" @click="() => clickRow(row)" :class="mailItemClass(row)"
                :active="curMail && row.id === curMail.id">
                <template #prepend v-if="multiActionMode">
                  <v-checkbox v-model="row.checked" hide-details @click.stop />
                </template>
                <v-list-item-title>{{ row.subject }}</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip size="x-small" color="info" class="mr-1">ID: {{ row.id }}</v-chip>
                  <v-chip size="x-small" color="info" class="mr-1">{{ utcToLocalDate(row.created_at, useUTCDate)
                    }}</v-chip>
                  <v-chip v-if="showEMailFrom" size="x-small" color="info" class="mr-1">FROM: {{ row.address }}</v-chip>
                  <v-chip size="x-small" color="info">TO: {{ row.to_mail }}</v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-col>
        <v-col cols="7">
          <v-card v-if="curMail" variant="flat" style="overflow: auto; max-height: 100vh;">
            <v-card-title>{{ curMail.subject }}</v-card-title>
            <v-card-text>
              <div class="d-flex ga-2 flex-wrap mb-3">
                <v-chip size="small" color="info">ID: {{ curMail.id }}</v-chip>
                <v-chip size="small" color="info">{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</v-chip>
                <v-chip size="small" color="info">FROM: {{ curMail.address }}</v-chip>
                <v-chip size="small" color="info">TO: {{ curMail.to_mail }}</v-chip>
                <v-btn size="small" variant="text" color="info" @click="showCode = !showCode">
                  {{ t('showCode') }}
                </v-btn>
                <v-btn v-if="enableUserDeleteEmail" size="small" variant="text" color="error"
                  @click="deleteDialog = true">
                  {{ t('delete') }}
                </v-btn>
              </div>
              <pre v-if="showCode" class="mt-3">{{ curMail.raw }}</pre>
              <pre v-else-if="!curMail.is_html" class="mt-3">{{ curMail.content }}</pre>
              <div v-else v-html="curMail.content" class="mt-3"></div>
            </v-card-text>
          </v-card>
          <v-card v-else variant="flat">
            <v-empty-state icon="mdi-email-outline" :title="t('pleaseSelectMail')" />
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Mobile View -->
    <div v-else class="text-left">
      <div class="text-center mb-3">
        <v-pagination v-model="page" :length="totalPages" density="compact" size="small" />
        <v-btn @click="refresh" size="small" color="primary" class="mt-2">
          {{ t('refresh') }}
        </v-btn>
      </div>
      <div style="overflow: auto; height: 80vh;">
        <v-list lines="two">
          <v-list-item v-for="row in data" :key="row.id" @click="() => clickRow(row)">
            <v-list-item-title>{{ row.subject }}</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip size="x-small" color="info" class="mr-1">ID: {{ row.id }}</v-chip>
              <v-chip size="x-small" color="info" class="mr-1">{{ utcToLocalDate(row.created_at, useUTCDate) }}</v-chip>
              <v-chip v-if="showEMailFrom" size="x-small" color="info" class="mr-1">FROM: {{ row.address }}</v-chip>
              <v-chip size="x-small" color="info">TO: {{ row.to_mail }}</v-chip>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <v-navigation-drawer v-model="showDrawer" location="bottom" temporary style="height: 80vh;">
        <v-card v-if="curMail" variant="flat" style="overflow: auto;">
          <v-card-title class="d-flex justify-space-between align-center">
            {{ curMail.subject }}
            <v-btn icon variant="text" @click="showDrawer = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div class="d-flex ga-2 flex-wrap mb-3">
              <v-chip size="small" color="info">ID: {{ curMail.id }}</v-chip>
              <v-chip size="small" color="info">{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</v-chip>
              <v-chip size="small" color="info">FROM: {{ curMail.address }}</v-chip>
              <v-chip size="small" color="info">TO: {{ curMail.to_mail }}</v-chip>
              <v-btn size="small" variant="text" color="info" @click="showCode = !showCode">
                {{ t('showCode') }}
              </v-btn>
              <v-btn v-if="enableUserDeleteEmail" size="small" variant="text" color="error"
                @click="deleteDialog = true">
                {{ t('delete') }}
              </v-btn>
            </div>
            <pre v-if="showCode" class="mt-3">{{ curMail.raw }}</pre>
            <pre v-else-if="!curMail.is_html" class="mt-3">{{ curMail.content }}</pre>
            <div v-else v-html="curMail.content" class="mt-3"></div>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-text>{{ t('deleteMailTip') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">{{ t('cancel') }}</v-btn>
          <v-btn color="error" @click="deleteMail">{{ t('confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Multi Delete Confirmation Dialog -->
    <v-dialog v-model="multiDeleteDialog" max-width="400">
      <v-card>
        <v-card-text>{{ t('deleteMailTip') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="multiDeleteDialog = false">{{ t('cancel') }}</v-btn>
          <v-btn color="error" @click="multiActionDeleteMail">{{ t('confirm') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.text-left {
  text-align: left;
}

.selected-mail {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
