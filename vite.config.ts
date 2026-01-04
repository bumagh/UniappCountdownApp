import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig( ( { mode } ) => {
  console.log( 'Vite 运行模式:', mode );
  const env = loadEnv( mode, process.cwd(), '' );

  return {
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
    },
    define:{
      'process.env': {
        VITE_API_BASE_URL: env.VITE_API_BASE_URL
      }
    }
  };
} );
