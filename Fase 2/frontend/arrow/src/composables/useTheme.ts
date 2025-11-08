import { ref, onMounted } from 'vue'
type Theme = 'light' | 'dark'
const KEY = 'theme'
const theme = ref<Theme>('light')

function apply(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
}

function detect(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
    onMounted(() => {
        const saved = (localStorage.getItem(KEY) as Theme | null)
        theme.value = saved ?? detect()
        apply(theme.value)
    })
    function setTheme(t: Theme) { theme.value = t; localStorage.setItem(KEY, t); apply(t) }
    function toggle() { setTheme(theme.value === 'dark' ? 'light' : 'dark') }
    return { theme, setTheme, toggle }
}
