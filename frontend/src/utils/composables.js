import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export function useIsMobile() {
    // 使用 Vuetify 默认的 mobile 检测 (< 960px)
    const { mobile } = useDisplay()
    return computed(() => mobile.value)
}
