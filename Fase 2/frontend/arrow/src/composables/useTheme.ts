import { ref, watchEffect } from 'vue'

type Mode = 'light' | 'dark'

// calcula el valor inicial (no una función)
const preferred: Mode =
    (localStorage.getItem('theme') as Mode | null) ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

const theme = ref<Mode>(preferred)

watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('theme', theme.value)
})

function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

export function useTheme() {
    return { theme, toggle }
}
