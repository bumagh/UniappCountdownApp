<template>
    <view v-if=" modelValue " class="share-mask" @click=" handleClose ">
        <view class="share-panel" @click.stop>
            <view class="share-header">
                <text class="share-title">分享</text>
                <view class="share-close" @click=" handleClose ">
                    <text>✕</text>
                </view>
            </view>

            <view class="share-preview">
                <image v-if=" posterDataUrl " class="share-image" :src=" posterDataUrl " mode="widthFix"
                    @click=" previewImage " />
                <view v-else class="share-image-placeholder">
                    <text class="placeholder-text">海报生成中…</text>
                </view>
            </view>
            <view v-if=" hintText " class="share-hint">
                <text>{{ hintText }}</text>
            </view>
            <view class="share-actions">
                <view class="share-action" @click=" handleSaveImage ">
                    <text class="action-icon">💾</text>
                    <text class="action-text">保存图片</text>
                </view>
                <view class="share-action" @click=" handleShareImage ">
                    <text class="action-icon">🖼️</text>
                    <text class="action-text">分享图片</text>
                </view>
                <view class="share-action" @click=" handleShareLink ">
                    <text class="action-icon">🔗</text>
                    <text class="action-text">分享链接</text>
                </view>
            </view>



            <!-- H5 海报生成用 canvas：放在面板内但不可见（避免某些 WebView 不渲染离屏元素） -->
            <!-- #ifdef H5 -->
            <canvas ref="posterCanvas" :canvas-id=" canvasId " class="poster-canvas" :id=" canvasId "></canvas>
            <!-- #endif -->
        </view>
    </view>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent( {
    name: 'ShareCountdown',
    props: {
        modelValue: { type: Boolean, required: true },

        // 用于生成海报的内容
        title: { type: String as PropType<string>, default: '分享一个奇妙日' },
        description: { type: String as PropType<string>, default: '' },
        dateText: { type: String as PropType<string>, default: '' },
        daysText: { type: String as PropType<string>, default: '' },
        categoryName: { type: String as PropType<string>, default: '' },
        categoryColor: { type: String as PropType<string>, default: '#1890ff' },
        categoryIcon: { type: String as PropType<string>, default: '' },

        // 分享链接（同时用于生成二维码）
        shareUrl: { type: String as PropType<string | null>, default: null },

        // 二维码内容：默认用 shareUrl
        qrText: { type: String as PropType<string>, default: '' },
        qrSize: { type: Number as PropType<number>, default: 360 }
    },
    emits: [ 'update:modelValue' ],
    data ()
    {
        return {
            hintText: '' as string,
            posterDataUrl: '' as string,
            generating: false as boolean,
            // 统一用同一个 id 作为 canvas-id（uni.createCanvasContext 依赖）与 DOM id（H5 兜底定位）
            canvasId: `poster-canvas-${ Math.random().toString( 36 ).slice( 2 ) }` as string
        };
    },
    watch: {
        modelValue: {
            immediate: true,
            async handler ( v: boolean )
            {
                if ( v )
                {
                    await this.generatePoster();
                }
            }
        },
        // 任何关键内容变动时重绘
        title ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        description ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        dateText ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        daysText ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        categoryName ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        categoryColor ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        categoryIcon ()
        {
            if ( this.modelValue ) this.generatePoster();
        },
        shareUrl ()
        {
            if ( this.modelValue ) this.generatePoster();
        }
    },
    methods: {
        close ()
        {
            this.$emit( 'update:modelValue', false );
        },
        handleClose ()
        {
            this.close();
        },

        previewImage ()
        {
            if ( !this.posterDataUrl ) return;
            // H5 用新窗口预览
            // #ifdef H5
            const w = window.open();
            if ( w )
            {
                w.document.write( `<img src="${ this.posterDataUrl }" style="width:100%;height:auto;"/>` );
                //需要增加返回按钮
                const backBtn = document.createElement( 'button' );
                backBtn.innerText = '返回';
                backBtn.onclick = () => { w.close(); };
                w.document.body.appendChild( backBtn );

            }
            // #endif
        },

        // 2D canvas 版自动换行（原生 canvas 兜底分支使用）
        wrapText ( ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2 )
        {
            const t = String( text || '' );
            const chars = t.split( '' );
            let line = '';
            const lines: string[] = [];

            for ( let i = 0; i < chars.length; i++ )
            {
                const testLine = line + chars[ i ];
                const w = ctx.measureText( testLine ).width;
                if ( w > maxWidth && i > 0 )
                {
                    lines.push( line );
                    line = chars[ i ];
                    if ( lines.length >= maxLines ) break;
                } else
                {
                    line = testLine;
                }
            }
            if ( lines.length < maxLines && line ) lines.push( line );

            if ( lines.length === maxLines && chars.length )
            {
                const last = lines[ lines.length - 1 ];
                let trimmed = last;
                while ( trimmed && ctx.measureText( trimmed + '…' ).width > maxWidth )
                {
                    trimmed = trimmed.slice( 0, -1 );
                }
                lines[ lines.length - 1 ] = trimmed + ( trimmed !== last ? '…' : '' );
            }

            lines.forEach( ( l, idx ) =>
            {
                ctx.fillText( l, x, y + idx * lineHeight );
            } );

            return y + lines.length * lineHeight;
        },

        // 新增：uni canvas 版自动换行（使用 measureText）
        wrapTextUni ( ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number = 2 )
        {
            const s = ( text || '' );
            const chars = s.split( '' );

            // 经验估算：中英文混排时，平均宽度约 0.6 * fontSize
            const avgCharW = Math.max( 10, ctx.fontSizePx * 0.62 );
            const maxCharsPerLine = Math.max( 1, Math.floor( maxWidth / avgCharW ) );

            const lines: string[] = [];
            let line = '';
            for ( let i = 0; i < chars.length; i++ )
            {
                const test = line + chars[ i ];
                if ( test.length > maxCharsPerLine && line.length > 0 )
                {
                    lines.push( line );
                    line = chars[ i ];
                    if ( lines.length >= maxLines ) break;
                } else
                {
                    line = test;
                }
            }
            if ( lines.length < maxLines && line ) lines.push( line );

            // 省略号
            if ( lines.length === maxLines && chars.length )
            {
                const last = lines[ lines.length - 1 ];
                if ( last.length >= 1 && chars.length > maxCharsPerLine * maxLines )
                {
                    lines[ lines.length - 1 ] = last.slice( 0, Math.max( 1, last.length - 1 ) ) + '…';
                }
            }

            lines.forEach( ( l, idx ) =>
            {
                ctx.fillText( l, x, y + idx * lineHeight );
            } );

            return y + lines.length * lineHeight;
        },

        // uni canvas：导出临时文件（H5 下也可用），再转 dataURL 供 <image> 预览
        async canvasToDataUrl ( canvasId: string, width: number, height: number )
        {
            const tempPath = await new Promise<string>( ( resolve, reject ) =>
            {
                uni.canvasToTempFilePath( {
                    canvasId,
                    width,
                    height,
                    destWidth: width,
                    destHeight: height,
                    fileType: 'png',
                    quality: 1,
                    success: ( res: any ) => resolve( res.tempFilePath ),
                    fail: ( err: any ) => reject( err )
                } as any, this );
            } );

            // H5: tempFilePath 往往是 blob: 或 http(s) 可直接用于 <image>
            // 但为了统一预览/分享（如 downloadDataUrl 依赖 dataURL），这里再转成 dataURL
            // #ifdef H5
            try
            {
                const blob = await ( await fetch( tempPath ) ).blob();
                const dataUrl = await new Promise<string>( ( resolve, reject ) =>
                {
                    const fr = new FileReader();
                    fr.onload = () => resolve( String( fr.result || '' ) );
                    fr.onerror = reject;
                    fr.readAsDataURL( blob );
                } );
                return dataUrl;
            } catch ( e )
            {
                return tempPath;
            }
            // #endif

            // #ifndef H5
            return tempPath;
            // #endif
        },

        // H5: 二维码图片地址（改为本地静态图）
        async getQrDataUrl ( text: string, size: number ): Promise<string>
        {
            // 改为使用本地静态图片：/static/qr.png
            // uni-app H5 下 static 目录默认映射为站点根路径 /static
            // 说明：此二维码为固定入口图片，若需要携带参数请改回动态二维码方案
            void text;
            void size;
            return '/static/qr.png';
        },
        async getQrDataUrlNet ( text: string, size: number )
        {
            // #ifndef H5
            return '';
            // #endif

            const content = encodeURIComponent( text );
            const s = Math.max( 180, Math.min( 800, Number( size ) || 360 ) );
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=${ s }x${ s }&data=${ content }`;

            // 注意：依赖第三方二维码服务；如需完全离线，可再换成本地 QR 算法实现
            return url;
        },
        // 获取图片信息（用于等比缩放绘制）
        async getImageInfo ( src: string ): Promise<{ width: number; height: number }>
        {
            return await new Promise<{ width: number; height: number }>( ( resolve, reject ) =>
            {
                uni.getImageInfo( {
                    src,
                    success: ( res: any ) => resolve( { width: Number( res.width ) || 0, height: Number( res.height ) || 0 } ),
                    fail: reject
                } as any );
            } );
        },

        // 关闭
        // （此处为重复定义，已删除；保留上方 methods 起始处的 close/handleClose）

        // 预览图片
        // （此处为重复定义，已删除；保留上方 methods 起始处的 previewImage）

        // 2D canvas 版自动换行
        // （此处为重复定义，已删除；保留上方的 wrapText）

        // uni canvas 版自动换行
        // （此处为重复定义，已删除；保留上方的 wrapTextUni）

        async loadImage ( src: string )
        {
            return await new Promise<HTMLImageElement>( ( resolve, reject ) =>
            {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve( img );
                img.onerror = ( e ) =>
                {
                    console.error( '图片加载失败', e );
                    reject( e );
                };
                img.src = src;
            } );
        },

        // H5: 尝试获取原生 canvas（带重试）
        async getNativeCanvasWithRetry ( retries = 10, intervalMs = 16 ): Promise<HTMLCanvasElement | null>
        {
            // #ifndef H5
            return null as any;
            // #endif

            return new Promise<HTMLCanvasElement | null>( ( resolve, reject ) =>
            {
                const tryGetCanvas = ( remainingRetries: number ) =>
                {
                    const c = document.querySelector( 'canvas' );
                    if ( c )
                    {
                        resolve( c as HTMLCanvasElement );
                    } else if ( remainingRetries > 0 )
                    {
                        setTimeout( () => tryGetCanvas( remainingRetries - 1 ), intervalMs );
                    } else
                    {
                        resolve( null );
                    }
                };

                tryGetCanvas( retries );
            } );
        },

        // 导出海报
        async generatePoster ()
        {
            // 仅实现 H5
            // #ifndef H5
            //   return;
            // #endif

            if ( this.generating ) return;
            this.generating = true;
            this.hintText = '';
            this.posterDataUrl = '';

            await new Promise( r => setTimeout( r, 0 ) );

            // 优先走 uni-app 推荐方式：canvas-id + uni.createCanvasContext
            let ctxUni: any = null;
            try
            {
                ctxUni = uni.createCanvasContext( this.canvasId );
            } catch ( e )
            {
                ctxUni = null;
            }

            // 如果拿不到（极少数 H5 WebView），再尝试原生 canvas 兜底
            const nativeCanvas = ctxUni ? null : await this.getNativeCanvasWithRetry( 60, 25 );
            if ( !ctxUni && !nativeCanvas )
            {
                this.generating = false;
                this.hintText = '海报生成失败：未获取到canvas（请稍后重试）';
                return;
            }

            // 海报像素尺寸（半屏级别）
            const W = 380;
            const H = 420;

            // ====== uni canvas 分支（推荐）======
            if ( ctxUni )
            {
                const ctx: any = ctxUni;

                try
                {
                    if ( ctx.setTransform ) ctx.setTransform( 1, 0, 0, 1, 0, 0 );

                    // 通过最小验证后，再绘制正式海报（使用设计稿坐标缩放）
                    const designW = 1280;
                    const designH = 1720;
                    const compactScaleBoost = 1.08;
                    const scale = Math.min( W / designW, H / designH ) * compactScaleBoost;

                    if ( ctx.setTransform ) ctx.setTransform( 1, 0, 0, 1, 0, 0 );
                    if ( ctx.scale ) ctx.scale( scale, scale );

                    const CW = designW;
                    const FONT_PLUS = 10;
                    const yShift = -30;

                    // 背景
                    ctx.setFillStyle( '#f5f9ff' );
                    ctx.fillRect( 0, 0, CW, designH );

                    // 顶部渐变卡片
                    const grad = ctx.createLinearGradient( 0, 0, CW, 720 );
                    grad.addColorStop( 0, this.categoryColor || '#1890ff' );
                    grad.addColorStop( 1, '#52c4ff' );
                    ctx.setFillStyle( grad );
                    roundRectUni( ctx, 60, 120 + yShift, CW - 120, 520, 48 );
                    ctx.fill();

                    const leftMargin = 150;

                    // 分类徽章
                    const badgeX = leftMargin;
                    const badgeY = 170 + yShift;
                    const badgeW = 520;
                    const badgeH = 84;
                    ctx.setFillStyle( 'rgba(255,255,255,0.28)' );
                    roundRectUni( ctx, badgeX, badgeY, badgeW, badgeH, 999 );
                    ctx.fill();

                    ctx.setFillStyle( '#fff' );
                    ctx.setFontSize( 48 + FONT_PLUS );
                    ctx.setTextBaseline( 'middle' );
                    const icon = this.categoryIcon || '';
                    if ( icon ) ctx.fillText( icon, badgeX + 30, badgeY + badgeH / 2 );

                    ctx.setFontSize( 34 + FONT_PLUS );
                    ctx.fillText( this.categoryName || '奇妙日', badgeX + 30 + ( icon ? 64 : 0 ), badgeY + badgeH / 2 );

                    // 标题
                    ctx.setFillStyle( '#fff' );
                    ctx.setTextBaseline( 'top' );
                    ctx.setFontSize( 72 + FONT_PLUS );
                    const titleY = 300 + yShift;
                    const afterTitleY = this.wrapTextUni( ctx, this.title || '分享一个奇妙日', leftMargin, titleY, designW - 200, 88, 2 );

                    // 天数/日期
                    const days = this.daysText || '';
                    if ( days )
                    {
                        ctx.setFontSize( 48 + FONT_PLUS );
                        ctx.setFillStyle( 'rgba(255,255,255,0.92)' );
                        ctx.fillText( days, leftMargin, afterTitleY + 10 );
                    }

                    const dateText = this.dateText || '';
                    if ( dateText )
                    {
                        ctx.setFontSize( 44 + FONT_PLUS );
                        ctx.setFillStyle( 'rgba(255,255,255,0.9)' );
                        ctx.fillText( dateText, leftMargin, afterTitleY + 92 );
                    }

                    // 信息卡
                    const bottomBaseY = 620 + yShift;
                    ctx.setFillStyle( '#ffffff' );
                    roundRectUni( ctx, 60, bottomBaseY, designW - 120, 420, 40 );
                    ctx.fill();

                    // 二维码（固定入口图：1710x624，按“适应宽度”等比缩放）
                    const qrValue = ( this.qrText || this.shareUrl || '' ).trim();
                    if ( qrValue )
                    {
                        const qrPngUrl = await this.getQrDataUrl( qrValue, 0 );

                        // 容器大小（保持原有外框），图片按容器宽度等比缩放
                        const boxW = designW;
                        const boxH = 420;
                        const qrX = designW - 100 - boxW - 70;
                        const qrY = bottomBaseY + 26;

                        ctx.setFillStyle( '#ffffff' );
                        roundRectUni( ctx, qrX - 20, qrY - 20, boxW + 40, boxH + 40, 28 );
                        ctx.fill();

                        // 已知原图像素 1710*624：按“适应宽度”缩放，保证宽度填满 boxW
                        const iw = 1710;
                        const ih = 624;
                        const dw = boxW - 100 - 100;
                        const dh = Math.max( 1, Math.floor( ( ih / iw ) * dw ) );
                        const dx = qrX + 240;
                        const dy = qrY + Math.floor( ( boxH - dh ) / 2 );
                        ctx.drawImage( qrPngUrl, dx, dy, dw, dh );
                    }

                    // 链接文本
                    // const url = ( this.shareUrl || '' ).trim();
                    // ctx.setFillStyle( '#666' );
                    // ctx.setFontSize( 30 + FONT_PLUS );
                    // if ( url )
                    // {
                    //     this.wrapTextUni( ctx, url, leftMargin, bottomBaseY + 258, designW - 200, 44, 3 );
                    // }

                    // // 底部品牌
                    // ctx.setFillStyle( '#999' );
                    // ctx.setFontSize( 28 + FONT_PLUS );
                    // ctx.fillText( '由长寿奇妙日生成', leftMargin, bottomBaseY + 342 );

                    await new Promise<void>( resolve =>
                    {
                        ctx.draw( false, () => resolve() );
                    } );

                    const tempPath = await new Promise<string>( ( resolve, reject ) =>
                    {
                        uni.canvasToTempFilePath( {
                            canvasId: this.canvasId,
                            width: W,
                            height: H,
                            destWidth: W,
                            destHeight: H,
                            fileType: 'png',
                            quality: 1,
                            success: ( res: any ) => resolve( res.tempFilePath ),
                            fail: ( err: any ) => reject( err )
                        } as any, this );
                    } );

                    // 转为 dataURL
                    // #ifdef H5
                    try
                    {
                        const blob = await ( await fetch( tempPath ) ).blob();
                        this.posterDataUrl = await new Promise<string>( ( resolve, reject ) =>
                        {
                            const reader = new FileReader();
                            reader.onload = () => resolve( String( reader.result || '' ) );
                            reader.onerror = () => reject( new Error( 'read blob failed' ) );
                            reader.readAsDataURL( blob );
                        } );
                    } catch ( e )
                    {
                        this.posterDataUrl = tempPath;
                    }
                    // #endif

                    // #ifndef H5
                    this.posterDataUrl = tempPath;
                    // #endif

                    this.generating = false;
                    return;
                } catch ( e )
                {
                    console.error( 'uni canvas 绘制失败', e );
                    // 继续走原生兜底
                }

                function roundRectUni ( c2: any, x: number, y: number, w: number, h: number, r: number )
                {
                    const radius = Math.min( r, w / 2, h / 2 );
                    c2.beginPath();
                    c2.moveTo( x + radius, y );
                    c2.arcTo( x + w, y, x + w, y + h, radius );
                    c2.arcTo( x + w, y + h, x, y + h, radius );
                    c2.arcTo( x, y + h, x, y, radius );
                    c2.arcTo( x, y, x + w, y, radius );
                    c2.closePath();
                }
            }

            // ====== 原生 canvas 兜底（保持简化实现）======
            try
            {
                // 重新获取原生 canvas（确保变量在该作用域存在）
                const c2 = ( nativeCanvas || await this.getNativeCanvasWithRetry( 10, 16 ) ) as HTMLCanvasElement | null;
                if ( !c2 ) throw new Error( 'missing native canvas' );

                c2.width = W;
                c2.height = H;
                const ctx2d = c2.getContext( '2d' ) as CanvasRenderingContext2D | null;
                if ( !ctx2d ) throw new Error( 'ctx null' );

                // 背景
                ctx2d.fillStyle = '#f5f9ff';
                ctx2d.fillRect( 0, 0, W, H );

                // 二维码容器
                const boxW = 160;
                const boxH = 160;
                const qrX = W - 20 - boxW;
                const qrY = H - 20 - boxH;

                ctx2d.fillStyle = '#fff';
                ctx2d.fillRect( qrX - 10, qrY - 10, boxW + 20, boxH + 20 );

                const qrPngUrl = await this.getQrDataUrl( ( this.qrText || this.shareUrl || '' ).trim(), 0 );
                const img = await this.loadImage( qrPngUrl );

                const iw = 1710;
                const ih = 624;
                const dw = boxW;
                const dh = Math.max( 1, Math.floor( ( ih / iw ) * dw ) );
                const dx = qrX;
                const dy = qrY + Math.floor( ( boxH - dh ) / 2 );
                ctx2d.drawImage( img, dx, dy, dw, dh );

                this.posterDataUrl = c2.toDataURL( 'image/png' );
            } catch ( e )
            {
                console.error( '原生canvas兜底失败', e );
                this.hintText = '海报生成失败';
            } finally
            {
                this.generating = false;
            }
        },

        downloadDataUrl ( dataUrl: string, filename: string )
        {
            // #ifdef H5
            const a = document.createElement( 'a' );
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild( a );
            a.click();
            document.body.removeChild( a );
            // #endif
        },

        async handleSaveImage ()
        {
            if ( !this.posterDataUrl )
            {
                uni.showToast( { title: '海报生成中…', icon: 'none' } );
                return;
            }

            // H5：下载
            this.downloadDataUrl( this.posterDataUrl, 'countdown-poster.png' );
            this.hintText = '已下载海报图片';
        },

        async handleShareImage ()
        {
            if ( !this.posterDataUrl )
            {
                uni.showToast( { title: '海报生成中…', icon: 'none' } );
                return;
            }

            // H5：Web Share（支持 files 的浏览器）
            try
            {
                if ( typeof navigator !== 'undefined' && ( navigator as any ).share )
                {
                    const blob = await ( await fetch( this.posterDataUrl ) ).blob();
                    const file = new File( [ blob ], 'countdown-poster.png', { type: 'image/png' } );
                    await ( navigator as any ).share( {
                        title: this.title,
                        text: this.description || this.title,
                        files: [ file ]
                    } );
                    return;
                }
            } catch ( e )
            {
                // ignore -> fallback
            }

            // 兜底：下载
            this.downloadDataUrl( this.posterDataUrl, 'countdown-poster.png' );
            this.hintText = '当前浏览器不支持直接分享图片，已改为下载';
        },

        async handleShareLink ()
        {
            const url = this.shareUrl?.trim();
            if ( !url )
            {
                uni.showToast( { title: '暂无链接可分享', icon: 'none' } );
                return;
            }

            // H5 优先使用 Web Share
            try
            {
                if ( typeof navigator !== 'undefined' && ( navigator as any ).share )
                {
                    await ( navigator as any ).share( {
                        title: this.title,
                        text: this.description || this.title,
                        url
                    } );
                    return;
                }
            } catch ( e )
            {
                // ignore -> fallback
            }

            // 兜底：复制链接
            uni.setClipboardData( {
                data: url,
                success: () =>
                {
                    uni.showToast( { title: '链接已复制', icon: 'success' } );
                },
                fail: () =>
                {
                    uni.showToast( { title: '复制失败', icon: 'none' } );
                }
            } );
        }
    }
} );
</script>

<style scoped>
.share-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.55);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
}

.share-panel {
    width: 100%;
    background-color: #ffffff;
    border-radius: 28rpx 28rpx 0 0;
    padding: 24rpx 24rpx 40rpx;
}

.share-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #f0f4ff;
}

.share-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #333;
}

.share-close {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 36rpx;
}

.share-preview {
    padding: 24rpx 0;
}

.share-image {
    width: 100%;
    border-radius: 16rpx;
    background-color: #f5f9ff;
}

.share-image-placeholder {
    width: 100%;
    height: 200rpx;
    border-radius: 16rpx;
    background-color: #f5f9ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.placeholder-text {
    color: #999;
    font-size: 26rpx;
}

.share-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.share-action {
    flex: 1;
    background-color: #f5f9ff;
    border-radius: 16rpx;
    padding: 20rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.action-icon {
    font-size: 44rpx;
    margin-bottom: 8rpx;
}

.action-text {
    font-size: 24rpx;
    color: #333;
}

.share-hint {
    margin-top: 16rpx;
    padding: 14rpx 16rpx;
    background-color: #fff7e6;
    border-radius: 12rpx;
    color: #ad6800;
    font-size: 24rpx;
}

/* 让 canvas 处于可布局区域内（避免 left:-99999 导致部分 WebView 不创建真实节点） */
.poster-canvas {
    position: absolute;
    left: 12px;
    top: 12px;
    width: 300px;
    height: 300px;
    opacity: 0.01;
    pointer-events: none;
}
</style>
