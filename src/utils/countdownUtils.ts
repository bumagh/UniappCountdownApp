// 计算天数差
export function calculateDays ( targetDate: string ): number
{
    const today = new Date();
    today.setHours( 0, 0, 0, 0 );
    const target = new Date( targetDate );
    target.setHours( 0, 0, 0, 0 );
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil( diffTime / ( 1000 * 60 * 60 * 24 ) );
    return diffDays;
}

function buildDateTime ( dateStr: string, timeStr?: string ): Date
{
    const safeTime = timeStr || '06:00';
    return new Date( `${ dateStr } ${ safeTime }` );
}

function padTimeUnit ( value: number ): string
{
    return String( value ).padStart( 2, '0' );
}

export function calculateTimeDiff ( dateStr: string, timeStr?: string ): number
{
    const now = new Date();
    const target = buildDateTime( dateStr, timeStr );
    return target.getTime() - now.getTime();
}

// 获取绝对天数
export function getAbsoluteDays ( targetDate: string ): number
{
    return Math.abs( calculateDays( targetDate ) );
}

export function getRemainingDays ( dateStr: string, timeStr?: string ): number
{
    const diffMs = calculateTimeDiff( dateStr, timeStr );
    if ( diffMs <= 0 )
    {
        return 0;
    }
    return Math.ceil( diffMs / ( 1000 * 60 * 60 * 24 ) );
}

export function getCountdownStatusText ( dateStr: string, timeStr?: string ): string
{
    const diffMs = calculateTimeDiff( dateStr, timeStr );
    const target = buildDateTime( dateStr, timeStr );
    const now = new Date();

    if ( diffMs > 0 )
    {
        if ( diffMs >= 1000 * 60 * 60 * 24 )
        {
            return `还有 ${ Math.ceil( diffMs / ( 1000 * 60 * 60 * 24 ) ) } 天`;
        }

        const hours = Math.floor( diffMs / ( 1000 * 60 * 60 ) );
        const minutes = Math.floor( ( diffMs % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );
        return `还有 ${ hours } 小时 ${ minutes } 分钟`;
    }

    const passedMs = Math.abs( diffMs );
    if (
        target.getFullYear() === now.getFullYear()
        && target.getMonth() === now.getMonth()
        && target.getDate() === now.getDate()
        && passedMs < 1000 * 60 * 60 * 24
    )
    {
        const hours = Math.floor( passedMs / ( 1000 * 60 * 60 ) );
        const minutes = Math.floor( ( passedMs % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );
        return `已经 ${ hours } 小时 ${ minutes } 分钟`;
    }

    const pastDays = calculateDays( dateStr );
    return `已经 ${ Math.abs( pastDays ) } 天`;
}

// 格式化日期
export function formatDate ( dateStr: string, timeStr?: string ): string
{
    const date = buildDateTime( dateStr, timeStr );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = [ '日', '一', '二', '三', '四', '五', '六' ];
    const weekDay = weekDays[ date.getDay() ];
    if ( timeStr )
    {
        return `${ year }年${ month }月${ day }日 ${ padTimeUnit( date.getHours() ) }:${ padTimeUnit( date.getMinutes() ) } 星期${ weekDay }`;
    }
    return `${ year }年${ month }月${ day }日 星期${ weekDay }`;
}

// 获取重复文本
export function getRepeatText (
    repeatCycle: number,
    repeatFrequency: '不重复' | '天重复' | '周重复' | '月重复' | '年重复'
): string
{
    if ( repeatCycle === 0 || repeatFrequency === '不重复' )
    {
        return '不重复';
    }
    return `每${ repeatCycle }${ repeatFrequency }`;
}