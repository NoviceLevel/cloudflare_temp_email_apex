import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import vuetify from './plugins/vuetify'

const head = createHead()
const app = createApp(App)
app.use(i18n)
app.use(router)
app.use(head)
app.use(vuetify)
app.mount('#app')
