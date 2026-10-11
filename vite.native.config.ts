import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],publicDir:false,server:{host:'127.0.0.1',port:1435,strictPort:true},build:{outDir:'dist-native',rollupOptions:{input:'native.html'}}});
