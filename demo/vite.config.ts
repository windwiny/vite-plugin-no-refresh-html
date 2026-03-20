import { defineConfig } from 'vite'
import { vitePluginNCNH } from '../vite-plugin-ncnh.js'

export default defineConfig({
    plugins: [
        vitePluginNCNH({
            injectToast: true,
            onHotUpdate: (data) => {
                console.log('Hot update:', data);
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
