import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg"],
            manifest: {
                name: "家庭假期额度数据中心",
                short_name: "额度中心",
                description: "集中管理育儿假、年假及托管服务天数，支持余额追踪、周期管理与使用记录同步。",
                theme_color: "#020617",
                background_color: "#020617",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/pwa-192.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                        purpose: "any maskable"
                    },
                    {
                        src: "/pwa-512.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                        purpose: "any maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
            }
        })
    ]
});
