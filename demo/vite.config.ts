import { defineConfig } from 'vite'
import { vitePluginNoRefreshHtml } from '../vite-plugin-no-refresh-html.js'

export default defineConfig({
    plugins: [
        vitePluginNoRefreshHtml({
            injectToast: true,
            onHotUpdate: (data) => {
                console.log('[demo] Hot update:', data);
                const hist = document.getElementById('hist');
                if (hist)
                    hist.innerHTML += '<br>' + JSON.stringify(data,undefined,2);
            }
        }),
    ],

    server: {
        port: 5173,
        open: false,
    },

    logLevel: 'info'
})
