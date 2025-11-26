import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
        vuetify({ autoImport: true }),
    ],
    test: {
        globals: true,
        environment: 'happy-dom',
        server: {
            deps: {
                inline: ['vuetify'],
            },
        },
    },
})
