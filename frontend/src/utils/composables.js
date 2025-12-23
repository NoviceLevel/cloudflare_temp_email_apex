import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export function useIsMobile() {
    const { mobile } = useDisplay()
    return computed(() => mobile.value)
}
