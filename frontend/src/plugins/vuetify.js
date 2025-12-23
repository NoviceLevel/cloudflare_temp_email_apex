// Vuetify
import 'vuetify/styles'
// MDI Icons
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Material Design 3 (Material You) 风格配置
export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  defaults: {
    // 全局默认配置 - MD3 风格
    VBtn: {
      rounded: 'pill',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
      border: true,
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'pill',
    },
    VTabs: {
      rounded: true,
    },
    VDialog: {
      rounded: 'xl',
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // MD3 色彩 - 柔和的蓝色调
          primary: '#0061A4',
          'on-primary': '#FFFFFF',
          'primary-container': '#D1E4FF',
          'on-primary-container': '#001D36',
          secondary: '#535F70',
          'on-secondary': '#FFFFFF',
          'secondary-container': '#D7E3F7',
          'on-secondary-container': '#101C2B',
          tertiary: '#6B5778',
          'on-tertiary': '#FFFFFF',
          'tertiary-container': '#F2DAFF',
          'on-tertiary-container': '#251431',
          error: '#BA1A1A',
          'on-error': '#FFFFFF',
          'error-container': '#FFDAD6',
          'on-error-container': '#410002',
          background: '#FDFCFF',
          'on-background': '#1A1C1E',
          surface: '#FDFCFF',
          'on-surface': '#1A1C1E',
          'surface-variant': '#DFE2EB',
          'on-surface-variant': '#43474E',
          outline: '#73777F',
          'outline-variant': '#C3C7CF',
          info: '#0061A4',
          success: '#006D40',
          warning: '#7D5800',
        }
      },
      dark: {
        colors: {
          // MD3 暗色主题
          primary: '#9ECAFF',
          'on-primary': '#003258',
          'primary-container': '#00497D',
          'on-primary-container': '#D1E4FF',
          secondary: '#BBC7DB',
          'on-secondary': '#253140',
          'secondary-container': '#3B4858',
          'on-secondary-container': '#D7E3F7',
          tertiary: '#D6BEE4',
          'on-tertiary': '#3B2948',
          'tertiary-container': '#523F5F',
          'on-tertiary-container': '#F2DAFF',
          error: '#FFB4AB',
          'on-error': '#690005',
          'error-container': '#93000A',
          'on-error-container': '#FFDAD6',
          background: '#1A1C1E',
          'on-background': '#E2E2E6',
          surface: '#1A1C1E',
          'on-surface': '#E2E2E6',
          'surface-variant': '#43474E',
          'on-surface-variant': '#C3C7CF',
          outline: '#8D9199',
          'outline-variant': '#43474E',
          info: '#9ECAFF',
          success: '#6CDBAA',
          warning: '#FABD00',
        }
      }
    }
  }
})
