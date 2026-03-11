import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

export default defineConfig( ( { mode } ) => {
  console.log( 'Vite 运行模式:', mode );
  const env = loadEnv( mode, process.cwd(), '' );

  const cleanupDirectories = ( directories: string[], label: string ) => {
    directories.forEach( ( directory ) => {
      if ( existsSync( directory ) ) {
        console.log( `清理 ${label}: ${directory}` );
        rmSync( directory, { recursive: true, force: true } );
      }
    } );
  };

  // 自定义插件：复制 static 文件到 static 目录并清理 h5/static
  const copyStaticPlugin = {
    name: 'copy-static-files',
    generateBundle() {
      const staticDir = join(process.cwd(), 'dist/build/static');
      if (!existsSync(staticDir)) {
        mkdirSync(staticDir, { recursive: true });
      }
      
      // 复制 src/static 中的文件到 dist/build/static
      const srcStaticDir = join(process.cwd(), 'src/static');
      const files = ['home.png', 'home-active.png', 'book.png', 'book-active.png', 'calendar.png', 'calendar-active.png', 'profile.png', 'profile-active.png'];
      
      files.forEach(file => {
        const srcFile = join(srcStaticDir, file);
        const destFile = join(staticDir, file);
        if (existsSync(srcFile)) {
          copyFileSync(srcFile, destFile);
        }
      });
    },
    writeBundle() {
      // 清理 h5/static 目录 - 在所有文件写入后执行
      const h5StaticDir = join(process.cwd(), 'dist/build/h5/static');
      cleanupDirectories( [
        h5StaticDir,
        join( process.cwd(), 'dist/build/mp-weixin/static/pic1.png' ),
        join( process.cwd(), 'dist/build/mp-weixin/static/pic2.png' ),
        join( process.cwd(), 'dist/build/mp-weixin/static/qr_search.png' )
      ], '构建产物目录' );
    },
    closeBundle() {
      // 最终清理 - 确保在构建完全结束后执行
      const h5StaticDir = join(process.cwd(), 'dist/build/h5/');
      cleanupDirectories( [
        h5StaticDir,
        join( process.cwd(), 'dist/build/mp-weixin/static/pic1.png' ),
        join( process.cwd(), 'dist/build/mp-weixin/static/pic2.png' ),
        join( process.cwd(), 'dist/build/mp-weixin/static/qr_search.png' )
      ], '最终产物目录' );
    }
  };

  return {
    plugins: [ uni( {
      css: {
        preprocessorOptions: {
          scss: {
            api: "modern-compiler"
          },
        },
      },
      // 禁用 UniApp 的 static 处理
      copyStaticFiles: false
    } ), copyStaticPlugin ],
    build: {
      outDir: 'dist/build',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            // 将所有图片文件输出到 static 目录
            if (assetInfo.name && /\.(png|jpg|jpeg|gif|svg|ico)$/.test(assetInfo.name)) {
              return 'static/[name].[extname]';
            }
            return 'assets/[name].[hash][extname]';
          }
        }
      }
    },
    // 禁用 publicDir，手动处理
    publicDir: false,
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
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
