import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
      vue(),
      qiankun('upload-file',{
        useDevMode: true
      })
  ],
    server: {
        port: 7001,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        proxy: {
            '/api': {
                target: 'http://10.125.134.191:8082/',  //API服务地址
                changeOrigin: true,             //开启跨域
                rewrite: (path) => path.replace(/^\/api/, '')
            },
        }
    },
})
