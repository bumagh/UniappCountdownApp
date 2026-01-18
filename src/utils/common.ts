export  function getDataUrl (name: string): string
        {
            // 说明：uni-app H5 打包后，/static 资源路径在不同部署目录下可能变化
            // 优先使用 Vite 的 import.meta.url 解析到正确的构建产物 URL；失败则回退到 /static/qr.png
            try
            {
                // @ts-ignore
                const u = new URL( '../../static/'+name+'.png', import.meta.url );
                return u.toString();
            } catch ( e )
            {
                return '/static/'+name+'.png';
            }
        }