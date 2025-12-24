import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export function useIsMobile() {
    // 只在 xs 断点 (<600px) 才触发移动端视图
    // 这样平板和桌面都会使用桌面布局
    const { xs } = useDisplay()
    return computed(() => xs.value)
}
