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

// 获取绝对天数
export function getAbsoluteDays ( targetDate: string ): number
{
    return Math.abs( calculateDays( targetDate ) );
}

// 格式化日期
export function formatDate ( dateStr: string ): string
{
    const date = new Date( dateStr );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = [ '日', '一', '二', '三', '四', '五', '六' ];
    const weekDay = weekDays[ date.getDay() ];
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