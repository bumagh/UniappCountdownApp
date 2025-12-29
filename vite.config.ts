
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig( {
  plugins: [ uni( {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        },
      },
    }
  } ) ],
  build: {
    outDir: 'dist/build',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      "@": "/src"
    },
  }
} )
