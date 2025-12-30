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
import { defineComponent, PropType, nextTick } from 'vue';

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
        wrapTextUni ( ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2 )
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

        // H5: 生成二维码 dataURL（使用 https://api.qrserver.com 的 SVG，再本地绘制到 canvas，避免引入依赖）
        async getQrDataUrl ( text: string, size: number )
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

        async loadImage ( src: string )
        {
            // #ifndef H5
            return null as any;
            // #endif

            return await new Promise<HTMLImageElement>( ( resolve, reject ) =>
            {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve( img );
                img.onerror = ( e ) => reject( e );
                img.src = src;
            } );
        },

        // H5: 尝试获取原生 canvas（带重试）
        async getNativeCanvasWithRetry ( retries = 10, intervalMs = 16 )
        {
            // #ifndef H5
            return null as any;
            // #endif

            for ( let i = 0; i < retries; i++ )
            {
                await nextTick();

                // 部分 WebView 对 requestAnimationFrame 支持不稳定，改为 setTimeout 轮询
                if ( intervalMs > 0 )
                {
                    await new Promise( r => setTimeout( r, intervalMs ) );
                }

                const el = document.getElementById( this.canvasId ) as any;
                if ( el && typeof el.getContext === 'function' )
                {
                    return el as HTMLCanvasElement;
                }

                // fallback：从整个 document 再查一次
                const qsGlobal = document.querySelector( `#${ this.canvasId }` ) as any;
                if ( qsGlobal && typeof qsGlobal.getContext === 'function' )
                {
                    return qsGlobal as HTMLCanvasElement;
                }

                // fallback：从组件根节点里找
                const root = ( this.$el as any ) as HTMLElement | undefined;
                const qs = root?.querySelector?.( `#${ this.canvasId }` ) as any;
                if ( qs && typeof qs.getContext === 'function' )
                {
                    return qs as HTMLCanvasElement;
                }
            }
            return null;
        },

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
            const c = ctxUni ? null : await this.getNativeCanvasWithRetry( 60, 25 );
            if ( !ctxUni && !c )
            {
                this.generating = false;
                this.hintText = '海报生成失败：未获取到canvas（请稍后重试）';
                return;
            }

            // 海报像素尺寸：用于弹窗预览的图片不需要很大，否则体积大/加载慢
            // 这里改成中等清晰度（600x900）。如果需要“高清保存”，可后续再加一个 highQuality 开关。
            const W = 600;
            const H = 900;

            if ( ctxUni )
            {
                const ctx: any = ctxUni;

                // 关键：先做一个“官方示例级别”的最小绘制验证，避免直接画复杂海报导致难以定位
                try
                {
                    // 清空/重置
                    if ( ctx.setTransform ) ctx.setTransform( 1, 0, 0, 1, 0, 0 );

                    // 画一个圆+十字+文字（参考你给的示例）
                    ctx.beginPath();
                    ctx.arc( 100, 75, 50, 0, 2 * Math.PI );
                    ctx.setFillStyle( '#EEEEEE' );
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo( 40, 75 );
                    ctx.lineTo( 160, 75 );
                    ctx.moveTo( 100, 15 );
                    ctx.lineTo( 100, 135 );
                    ctx.setStrokeStyle( '#AAAAAA' );
                    ctx.stroke();

                    ctx.setFontSize( 14 );
                    ctx.setFillStyle( '#000000' );
                    ctx.fillText( 'canvas ok', 40, 170 );

                    await new Promise<void>( resolve =>
                    {
                        ctx.draw( true, () => resolve() );
                    } );

                    // 立即尝试导出一小张，验证 canvasToTempFilePath 是否可用
                    const testPath = await new Promise<string>( ( resolve, reject ) =>
                    {
                        uni.canvasToTempFilePath( {
                            canvasId: this.canvasId,
                            width: 220,
                            height: 220,
                            destWidth: 220,
                            destHeight: 220,
                            fileType: 'png',
                            quality: 1,
                            success: ( res: any ) => resolve( res.tempFilePath ),
                            fail: ( err: any ) => reject( err )
                        } as any, this );
                    } );

                    // 如果测试导出都失败/是空白，直接提示
                    const testBlob = await ( await fetch( testPath ) ).blob();
                    if ( !testBlob || testBlob.size < 200 )
                    {
                        this.generating = false;
                        this.hintText = '导出空白：canvasToTempFilePath 未生成有效图片（请换浏览器/检查 WebView 权限）';
                        return;
                    }
                } catch ( e )
                {
                    console.error( 'canvas 最小绘制验证失败', e );
                    this.generating = false;
                    this.hintText = 'canvas 不可用：最小绘制/导出失败';
                    return;
                }

                // 通过最小验证后，再绘制正式海报（使用设计稿坐标缩放）
                const designW = 1080;
                const designH = 1920;
                const scale = Math.min( W / designW, H / designH );

                // 重新开始一帧，避免 test draw 的内容叠加
                if ( ctx.setTransform ) ctx.setTransform( 1, 0, 0, 1, 0, 0 );
                if ( ctx.scale ) ctx.scale( scale, scale );

                const CW = designW;
                const CH = designH;

                // 背景
                ctx.setFillStyle( '#f5f9ff' );
                ctx.fillRect( 0, 0, CW, CH );

                // 顶部渐变卡片
                const grad = ctx.createLinearGradient( 0, 0, CW, 720 );
                grad.addColorStop( 0, this.categoryColor || '#1890ff' );
                grad.addColorStop( 1, '#52c4ff' );
                ctx.setFillStyle( grad );
                roundRectUni( ctx, 60, 120, CW - 120, 820, 48 );
                ctx.fill();

                // 分类徽章
                const badgeX = 100;
                const badgeY = 170;
                const badgeW = 520;
                const badgeH = 84;
                ctx.setFillStyle( 'rgba(255,255,255,0.28)' );
                roundRectUni( ctx, badgeX, badgeY, badgeW, badgeH, 999 );
                ctx.fill();

                ctx.setFillStyle( '#fff' );
                ctx.setFontSize( 48 );
                ctx.setTextBaseline( 'middle' );
                const icon = this.categoryIcon || '';
                if ( icon ) ctx.fillText( icon, badgeX + 30, badgeY + badgeH / 2 );

                ctx.setFontSize( 34 );
                ctx.fillText( this.categoryName || '奇妙日', badgeX + 30 + ( icon ? 64 : 0 ), badgeY + badgeH / 2 );

                // 标题
                ctx.setFillStyle( '#fff' );
                ctx.setTextBaseline( 'top' );
                ctx.setFontSize( 72 );
                const titleY = 300;
                // 注意：wrapText 的 maxWidth 仍按设计稿坐标（CW），不要用 W
                const afterTitleY = this.wrapTextUni( ctx, this.title || '分享一个奇妙日', 100, titleY, designW - 200, 88, 2 );

                // 天数
                const days = this.daysText || '';
                if ( days )
                {
                    ctx.setFontSize( 44 );
                    ctx.setFillStyle( 'rgba(255,255,255,0.92)' );
                    ctx.fillText( days, 100, afterTitleY + 20 );
                }

                // 日期
                const dateText = this.dateText || '';
                if ( dateText )
                {
                    ctx.setFontSize( 34 );
                    ctx.setFillStyle( 'rgba(255,255,255,0.9)' );
                    ctx.fillText( dateText, 100, afterTitleY + 92 );
                }

                // 中下部白色信息卡
                ctx.setFillStyle( '#ffffff' );
                roundRectUni( ctx, 60, 1020, designW - 120, 620, 40 );
                ctx.fill();

                // 左侧说明
                ctx.setFillStyle( '#1890ff' );
                ctx.setFontSize( 42 );
                ctx.fillText( '扫码打开详情', 100, 1080 );

                // 二维码
                const qrValue = ( this.qrText || this.shareUrl || '' ).trim();
                if ( qrValue )
                {
                    try
                    {
                        const qrPngUrl = await this.getQrDataUrl( qrValue, this.qrSize );
                        const qrBoxSize = Math.max( 240, Math.min( 420, Number( this.qrSize ) || 360 ) );
                        const qrX = W - 100 - qrBoxSize;
                        const qrY = 1080;

                        ctx.setFillStyle( '#ffffff' );
                        roundRectUni( ctx, qrX - 20, qrY - 20, qrBoxSize + 40, qrBoxSize + 40, 28 );
                        ctx.fill();

                        // uni canvas 使用 drawImage 直接传 URL
                        ctx.drawImage( qrPngUrl, qrX, qrY, qrBoxSize, qrBoxSize );

                        ctx.setFillStyle( '#666' );
                        ctx.setFontSize( 28 );
                        ctx.fillText( '长按/截图识别二维码', 100, 1140 );
                    } catch ( e )
                    {
                        console.error( '二维码生成失败', e );
                        this.hintText = '二维码生成失败，已仅保留链接';
                    }
                }

                // 链接文本
                const url = ( this.shareUrl || '' ).trim();
                ctx.setFillStyle( '#666' );
                ctx.setFontSize( 30 );
                if ( url )
                {
                    this.wrapTextUni( ctx, url, 100, 1240, W - 200, 44, 3 );
                } else
                {
                    ctx.fillText( '（未提供分享链接）', 100, 1240 );
                }

                // 底部品牌
                ctx.setFillStyle( '#999' );
                ctx.setFontSize( 28 );
                ctx.fillText( '奇妙本 · Countdown', 100, 1600 );

                // 关键：draw 触发真正绘制
                await new Promise<void>( resolve =>
                {
                    ctx.draw( false, () => resolve() );
                } );

                // 导出：务必用实际导出尺寸（W/H）
                try
                {
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
                    console.error( e );
                    this.hintText = '海报导出失败';
                }

                this.generating = false;
                return;

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

            // ---- 原生 canvas 兜底保持原逻辑 ----
            c!.width = W;
            c!.height = H;

            const ctx = c!.getContext( '2d' );
            if ( !ctx )
            {
                this.generating = false;
                this.hintText = '海报生成失败：ctx不可用';
                return;
            }
            const ctx2d = ctx as CanvasRenderingContext2D;

            // 背景
            ctx2d.fillStyle = '#f5f9ff';
            ctx2d.fillRect( 0, 0, W, H );

            // 顶部渐变卡片
            const grad = ctx2d.createLinearGradient( 0, 0, W, 720 );
            grad.addColorStop( 0, this.categoryColor || '#1890ff' );
            grad.addColorStop( 1, '#52c4ff' );
            ctx2d.fillStyle = grad;
            roundRect2d( ctx2d, 60, 120, W - 120, 820, 48 );
            ctx2d.fill();

            // 分类徽章
            const badgeX = 100;
            const badgeY = 170;
            const badgeW = 520;
            const badgeH = 84;
            ctx2d.fillStyle = 'rgba(255,255,255,0.28)';
            roundRect2d( ctx2d, badgeX, badgeY, badgeW, badgeH, 999 );
            ctx2d.fill();

            ctx2d.fillStyle = '#fff';
            ctx2d.font = '48px sans-serif';
            ctx2d.textBaseline = 'middle';
            const icon = this.categoryIcon || '';
            if ( icon ) ctx2d.fillText( icon, badgeX + 30, badgeY + badgeH / 2 );

            ctx2d.font = '34px sans-serif';
            ctx2d.fillText( this.categoryName || '奇妙日', badgeX + 30 + ( icon ? 64 : 0 ), badgeY + badgeH / 2 );

            // 标题
            ctx2d.fillStyle = '#fff';
            ctx2d.textBaseline = 'top';
            ctx2d.font = '72px sans-serif';
            const titleY = 300;
            const afterTitleY = this.wrapText( ctx2d, this.title || '分享一个奇妙日', 100, titleY, W - 200, 88, 2 );

            // 天数
            const days = this.daysText || '';
            if ( days )
            {
                ctx2d.font = '44px sans-serif';
                ctx2d.fillStyle = 'rgba(255,255,255,0.92)';
                ctx2d.fillText( days, 100, afterTitleY + 20 );
            }

            // 日期
            const dateText = this.dateText || '';
            if ( dateText )
            {
                ctx2d.font = '34px sans-serif';
                ctx2d.fillStyle = 'rgba(255,255,255,0.9)';
                ctx2d.fillText( dateText, 100, afterTitleY + 92 );
            }

            // 中下部白色信息卡
            ctx2d.fillStyle = '#ffffff';
            roundRect2d( ctx2d, 60, 1020, W - 120, 620, 40 );
            ctx2d.fill();

            // 左侧说明
            ctx2d.fillStyle = '#1890ff';
            ctx2d.font = '42px sans-serif';
            ctx2d.fillText( '扫码打开详情', 100, 1080 );

            // 二维码
            const qrValue = ( this.qrText || this.shareUrl || '' ).trim();
            if ( qrValue )
            {
                try
                {
                    const qrPngUrl = await this.getQrDataUrl( qrValue, this.qrSize );
                    const qrBoxSize = Math.max( 240, Math.min( 420, Number( this.qrSize ) || 360 ) );
                    const qrX = W - 100 - qrBoxSize;
                    const qrY = 1080;

                    ctx2d.fillStyle = '#ffffff';
                    roundRect2d( ctx2d, qrX - 20, qrY - 20, qrBoxSize + 40, qrBoxSize + 40, 28 );
                    ctx2d.fill();

                    await new Promise<void>( ( resolve, reject ) =>
                    {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () =>
                        {
                            ctx2d.drawImage( img, qrX, qrY, qrBoxSize, qrBoxSize );
                            resolve();
                        };
                        img.onerror = () => reject( new Error( 'load qr failed' ) );
                        img.src = qrPngUrl;
                    } );

                    ctx2d.fillStyle = '#666';
                    ctx2d.font = '28px sans-serif';
                    ctx2d.fillText( '长按/截图识别二维码', 100, 1140 );
                } catch ( e )
                {
                    console.error( '二维码生成失败', e );
                    this.hintText = '二维码生成失败，已仅保留链接';
                }
            }

            // 链接文本
            const url = ( this.shareUrl || '' ).trim();
            ctx2d.fillStyle = '#666';
            ctx2d.font = '30px sans-serif';
            if ( url )
            {
                this.wrapText( ctx2d, url, 100, 1240, W - 200, 44, 3 );
            } else
            {
                ctx2d.fillText( '（未提供分享链接）', 100, 1240 );
            }

            // 底部品牌
            ctx2d.fillStyle = '#999';
            ctx2d.font = '28px sans-serif';
            ctx2d.fillText( '奇妙本 · Countdown', 100, 1600 );

            this.posterDataUrl = c!.toDataURL( 'image/png' );
            this.generating = false;

            function roundRect2d ( c2: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number )
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
    height: 360rpx;
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
