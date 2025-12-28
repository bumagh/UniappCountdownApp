<!-- RepeatSelector.vue -->
<template>
    <view class="repeat-selector">
        <!-- 开关控制重复设置 -->
        <view class="form-item">
            <view class="form-label-row">
                <text class="form-label">重复设置</text>
                <switch :checked=" isRepeatEnabled " @change=" toggleRepeat " color="#1890ff" />
            </view>
        </view>

        <!-- 重复设置内容 -->
        <view v-if=" isRepeatEnabled " class="repeat-content">
            <!-- 模式选择 -->
            <view class="repeat-type-selector">
                <view class="repeat-type-btn" :class=" { active: selectedType === 'quick' } "
                    @click="selectType( 'quick' )">
                    <text>快速选择</text>
                </view>
                <view class="repeat-type-btn" :class=" { active: selectedType === 'custom' } "
                    @click="selectType( 'custom' )">
                    <text>自定义</text>
                </view>
            </view>

            <!-- 快速选择模式 -->
            <view v-if=" selectedType === 'quick' " class="repeat-quick-section">
                <view class="repeat-button-wrapper">
                    <button class="repeat-button" @click=" showRepeatOptions ">
                        {{ selectedOption || '请选择重复频率' }}
                    </button>
                </view>
            </view>

            <!-- 自定义模式 -->
            <view v-else class="repeat-custom-section">
                <view class="custom-repeat-inputs">
                    <view class="custom-input-group">
                        <text class="custom-label">每</text>
                        <input class="custom-input" type="number" v-model=" customInterval " placeholder="1" min="1"
                            max="999" @input=" onCustomInput " />
                        <text class="custom-label">个</text>
                    </view>

                    <view class="custom-unit-selector">
                        <picker mode="selector" :range=" unitOptions " :value=" unitIndex " @change=" onUnitChange ">
                            <view class="unit-picker">
                                <text class="unit-text">{{ selectedUnit }}</text>
                                <text class="unit-arrow">▼</text>
                            </view>
                        </picker>
                    </view>

                    <text class="custom-label">重复一次</text>
                </view>

                <!-- 常用示例 -->
                <view class="custom-examples">
                    <text class="example-label">常用示例：</text>
                    <view class="example-tags">
                        <view v-for=" example in exampleOptions " :key=" example.label " class="example-tag"
                            @click="applyExample( example )">
                            <text>{{ example.label }}</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 当前设置显示 -->
            <view class="repeat-display">
                <text class="repeat-text">当前设置：{{ getDisplayText() }}</text>
            </view>
        </view>

        <!-- 重复选项弹窗 -->
        <view v-if=" showPicker " class="picker-modal" @click=" closePicker ">
            <view class="picker-content" @click.stop>
                <view class="picker-header">
                    <text class="picker-title">选择重复频率</text>
                    <view class="picker-close" @click=" closePicker ">
                        <text>✕</text>
                    </view>
                </view>
                <scroll-view scroll-y class="picker-body">
                    <view class="picker-category" v-for=" category in repeatCategories " :key=" category.title ">
                        <text class="category-title">{{ category.title }}</text>
                        <view class="category-options">
                            <view v-for=" option in category.options " :key=" option " class="picker-option"
                                :class=" { selected: selectedOption === option } " @click="selectOption( option )">
                                <text>{{ option }}</text>
                            </view>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view>
    </view>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

// 类型定义
export interface RepeatOption
{
    cycle: number;
    frequency: string;
    display: string;
}

export interface CustomExample
{
    label: string;
    interval: number;
    unit: string;
}

export interface RepeatData
{
    repeat_cycle: number;
    repeat_frequency: string;
    repeat_interval?: number;
    repeat_unit?: string;
}

export default defineComponent( {
    name: 'RepeatSelector',

    props: {
        // 当前重复设置数据
        modelValue: {
            type: Object as PropType<RepeatData>,
            required: true
        },
        // 是否为编辑模式
        editMode: {
            type: Boolean,
            default: false
        }
    },

    emits: [ 'update:modelValue', 'change' ],

    data ()
    {
        return {
            // 重复设置开关
            isRepeatEnabled: false,

            // 选择类型：quick（快速选择）或 custom（自定义）
            selectedType: 'quick' as 'quick' | 'custom',

            // 快速选择选项
            selectedOption: '不重复',

            // 自定义设置
            customInterval: 1,
            selectedUnit: '天',
            unitIndex: 0,

            // 弹窗控制
            showPicker: false,

            // 选项数据
            repeatOptions: [
                '不重复', '每天', '每周', '每月', '每年',
                '每2天', '每3天', '每4天', '每5天', '每6天', '每7天',
                '每2周', '每3周', '每4周',
                '每2月', '每3月', '每6月',
                '每2年', '每3年', '每5年'
            ],

            unitOptions: [ '天', '周', '月', '年' ],

            // 分组选项
            repeatCategories: [
                {
                    title: '日常频率',
                    options: [ '每天', '每2天', '每3天', '每4天', '每5天', '每6天', '每7天' ]
                },
                {
                    title: '每周频率',
                    options: [ '每周', '每2周', '每3周', '每4周' ]
                },
                {
                    title: '每月频率',
                    options: [ '每月', '每2月', '每3月', '每6月' ]
                },
                {
                    title: '每年频率',
                    options: [ '每年', '每2年', '每3年', '每5年' ]
                }
            ],

            // 自定义示例
            exampleOptions: [
                { label: '每15天', interval: 15, unit: '天' },
                { label: '每20天', interval: 20, unit: '天' },
                { label: '每2个月', interval: 2, unit: '月' },
                { label: '每季度', interval: 3, unit: '月' },
                { label: '每半年', interval: 6, unit: '月' },
                { label: '每2.5年', interval: 30, unit: '月' }
            ] as CustomExample[]
        };
    },

    created ()
    {
        this.initFromModelValue();
    },

    watch: {
        modelValue: {
            deep: true,
            handler ( newVal )
            {
                this.initFromModelValue();
            }
        }
    },

    methods: {
        /**
         * 从 modelValue 初始化组件状态
         */
        initFromModelValue (): void
        {
            const { repeat_cycle, repeat_frequency, repeat_interval, repeat_unit } = this.modelValue;

            // 检查是否启用重复
            this.isRepeatEnabled = repeat_cycle > 0 && repeat_frequency !== '不重复';

            if ( this.isRepeatEnabled )
            {
                // 判断是快速选择还是自定义
                const isStandard = this.isStandardRepeat( repeat_cycle, repeat_frequency );
                this.selectedType = isStandard ? 'quick' : 'custom';

                if ( isStandard )
                {
                    // 快速选择模式
                    this.selectedOption = this.getOptionFromCycle( repeat_cycle, repeat_frequency );
                } else
                {
                    // 自定义模式
                    this.customInterval = repeat_interval || repeat_cycle;
                    this.selectedUnit = this.getChineseUnit( repeat_unit || 'day' );
                    this.unitIndex = this.unitOptions.indexOf( this.selectedUnit );
                }
            } else
            {
                this.selectedOption = '不重复';
                this.selectedType = 'quick';
            }
        },

        /**
         * 检查是否为标准重复设置
         */
        isStandardRepeat ( cycle: number, frequency: string ): boolean
        {
            const unitMap: Record<string, string> = {
                '天重复': '天',
                '周重复': '周',
                '月重复': '月',
                '年重复': '年'
            };

            const chineseUnit = unitMap[ frequency ] || frequency.replace( '重复', '' );
            const standardOptions = [
                ...this.repeatCategories[ 0 ].options,
                ...this.repeatCategories[ 1 ].options,
                ...this.repeatCategories[ 2 ].options,
                ...this.repeatCategories[ 3 ].options
            ];

            const option = cycle === 1 ? `每${ chineseUnit }` : `每${ cycle }${ chineseUnit }`;
            return standardOptions.includes( option );
        },

        /**
         * 根据 cycle 和 frequency 获取选项文本
         */
        getOptionFromCycle ( cycle: number, frequency: string ): string
        {
            if ( cycle === 0 || frequency === '不重复' )
            {
                return '不重复';
            }

            const unitMap: Record<string, string> = {
                '天重复': '天',
                '周重复': '周',
                '月重复': '月',
                '年重复': '年'
            };

            const chineseUnit = unitMap[ frequency ] || frequency.replace( '重复', '' );
            return cycle === 1 ? `每${ chineseUnit }` : `每${ cycle }${ chineseUnit }`;
        },

        /**
         * 获取中文单位
         */
        getChineseUnit ( englishUnit: string ): string
        {
            const unitMap: Record<string, string> = {
                'day': '天',
                'week': '周',
                'month': '月',
                'year': '年'
            };
            return unitMap[ englishUnit ] || '天';
        },

        /**
         * 获取英文单位
         */
        getEnglishUnit ( chineseUnit: string ): string
        {
            const unitMap: Record<string, string> = {
                '天': 'day',
                '周': 'week',
                '月': 'month',
                '年': 'year'
            };
            return unitMap[ chineseUnit ] || 'day';
        },

        /**
         * 切换重复设置开关
         */
        toggleRepeat ( e: any ): void
        {
            this.isRepeatEnabled = e.detail.value;

            if ( this.isRepeatEnabled )
            {
                // 启用重复，设置默认值
                this.selectedType = 'quick';
                this.selectedOption = '每天';
                this.updateModelValue( 1, '天重复' );
            } else
            {
                // 关闭重复，重置
                this.selectedOption = '不重复';
                this.updateModelValue( 0, '不重复' );
            }
        },

        /**
         * 选择模式类型
         */
        selectType ( type: 'quick' | 'custom' ): void
        {
            this.selectedType = type;

            if ( type === 'custom' )
            {
                // 切换到自定义模式，使用当前值或默认值
                const { repeat_cycle, repeat_frequency } = this.modelValue;
                if ( repeat_cycle > 0 && repeat_frequency !== '不重复' )
                {
                    this.customInterval = this.modelValue.repeat_interval || repeat_cycle;
                    this.selectedUnit = this.getChineseUnit( this.modelValue.repeat_unit || 'day' );
                    this.unitIndex = this.unitOptions.indexOf( this.selectedUnit );
                } else
                {
                    // 默认值
                    this.customInterval = 1;
                    this.selectedUnit = '天';
                    this.unitIndex = 0;
                    this.updateCustomModelValue();
                }
            }
        },

        /**
         * 显示重复选项弹窗
         */
        showRepeatOptions (): void
        {
            this.showPicker = true;
        },

        /**
         * 关闭弹窗
         */
        closePicker (): void
        {
            this.showPicker = false;
        },

        /**
         * 选择快速选项
         */
        selectOption ( option: string ): void
        {
            this.selectedOption = option;
            this.showPicker = false;

            if ( option === '不重复' )
            {
                this.updateModelValue( 0, '不重复' );
            } else
            {
                this.parseOption( option );
            }
        },

        /**
         * 解析选项字符串
         */
        parseOption ( option: string ): void
        {
            if ( option === '不重复' )
            {
                this.updateModelValue( 0, '不重复' );
                return;
            }

            const match = option.match( /每(\d*)(天|周|月|年)/ );
            if ( match )
            {
                const interval = match[ 1 ] ? parseInt( match[ 1 ] ) : 1;
                const unit = match[ 2 ];

                const frequencyMap: Record<string, string> = {
                    '天': '天重复',
                    '周': '周重复',
                    '月': '月重复',
                    '年': '年重复'
                };

                this.updateModelValue(
                    interval,
                    frequencyMap[ unit ],
                    interval,
                    this.getEnglishUnit( unit )
                );
            }
        },

        /**
         * 自定义输入变化
         */
        onCustomInput ( e: any ): void
        {
            const value = parseInt( e.detail.value ) || 1;
            this.customInterval = Math.max( 1, Math.min( 999, value ) );
            this.updateCustomModelValue();
        },

        /**
         * 单位选择变化
         */
        onUnitChange ( e: any ): void
        {
            this.unitIndex = e.detail.value;
            this.selectedUnit = this.unitOptions[ this.unitIndex ];
            this.updateCustomModelValue();
        },

        /**
         * 应用示例
         */
        applyExample ( example: CustomExample ): void
        {
            this.customInterval = example.interval;
            this.selectedUnit = example.unit;
            this.unitIndex = this.unitOptions.indexOf( example.unit );
            this.updateCustomModelValue();
        },

        /**
         * 更新自定义模式的值
         */
        updateCustomModelValue (): void
        {
            const frequencyMap: Record<string, string> = {
                '天': '天重复',
                '周': '周重复',
                '月': '月重复',
                '年': '年重复'
            };

            this.updateModelValue(
                this.customInterval,
                frequencyMap[ this.selectedUnit ],
                this.customInterval,
                this.getEnglishUnit( this.selectedUnit )
            );
        },

        /**
         * 更新父组件的值
         */
        updateModelValue (
            repeat_cycle: number,
            repeat_frequency: string,
            repeat_interval?: number,
            repeat_unit?: string
        ): void
        {
            const newValue = {
                repeat_cycle,
                repeat_frequency,
                repeat_interval: repeat_interval || repeat_cycle,
                repeat_unit: repeat_unit || this.getEnglishUnit( repeat_frequency.replace( '重复', '' ) )
            };

            this.$emit( 'update:modelValue', newValue );
            this.$emit( 'change', newValue );
        },

        /**
         * 获取显示文本
         */
        getDisplayText (): string
        {
            if ( !this.isRepeatEnabled )
            {
                return '不重复';
            }

            if ( this.selectedType === 'quick' )
            {
                return this.selectedOption;
            } else
            {
                return `每${ this.customInterval }${ this.selectedUnit }`;
            }
        }
    }
} );
</script>

<style scoped>
.repeat-selector {
    width: 100%;
}

.form-item {
    margin-bottom: 30rpx;
}

.form-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 28rpx;
    color: #333333;
    font-weight: bold;
}

/* 模式选择器 */
.repeat-type-selector {
    display: flex;
    margin-bottom: 30rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    overflow: hidden;
}

.repeat-type-btn {
    flex: 1;
    padding: 20rpx;
    text-align: center;
    font-size: 28rpx;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
}

.repeat-type-btn.active {
    background-color: #1890ff;
    color: #fff;
    font-weight: bold;
}

/* 快速选择模式 */
.repeat-quick-section {
    margin-bottom: 20rpx;
}

.repeat-button-wrapper {
    margin-bottom: 20rpx;
}

.repeat-button {
    width: 100%;
    height: 80rpx;
    background-color: #ffffff;
    border: 2rpx solid #e8f4ff;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    color: #333333;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.repeat-button::after {
    content: '▼';
    font-size: 24rpx;
    color: #999999;
}

/* 自定义模式 */
.repeat-custom-section {
    margin-bottom: 20rpx;
}

.custom-repeat-inputs {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border: 2rpx solid #e8f4ff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
}

.custom-input-group {
    display: flex;
    align-items: center;
    margin-right: 20rpx;
}

.custom-label {
    font-size: 28rpx;
    color: #333;
    margin: 0 10rpx;
}

.custom-input {
    width: 120rpx;
    height: 60rpx;
    border: 2rpx solid #e0e0e0;
    border-radius: 8rpx;
    text-align: center;
    font-size: 28rpx;
    color: #333;
    background-color: #fff;
}

.custom-unit-selector {
    margin: 0 20rpx;
}

.unit-picker {
    min-width: 120rpx;
    padding: 15rpx;
    background-color: #f5f5f5;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.unit-text {
    font-size: 28rpx;
    color: #333;
}

.unit-arrow {
    font-size: 24rpx;
    color: #999;
    margin-left: 10rpx;
}

/* 示例标签 */
.custom-examples {
    background-color: #ffffff;
    border: 2rpx solid #e8f4ff;
    border-radius: 12rpx;
    padding: 20rpx;
}

.example-label {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 15rpx;
}

.example-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 15rpx;
}

.example-tag {
    padding: 12rpx 24rpx;
    background-color: #f0f0f0;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
}

.example-tag:active {
    background-color: #1890ff;
    color: #fff;
}

/* 显示文本 */
.repeat-display {
    background-color: #e8f4ff;
    border-radius: 12rpx;
    padding: 20rpx;
    text-align: center;
}

.repeat-text {
    font-size: 28rpx;
    color: #1890ff;
    font-weight: bold;
}

/* 弹窗样式 */
.picker-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.picker-content {
    width: 90%;
    max-height: 70vh;
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
}

.picker-header {
    padding: 30rpx;
    border-bottom: 2rpx solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.picker-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.picker-close {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.picker-body {
    max-height: 60vh;
    padding: 0 30rpx;
}

.picker-category {
    margin: 30rpx 0;
}

.category-title {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 15rpx;
}

.category-options {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.picker-option {
    min-width: 150rpx;
    padding: 20rpx;
    background-color: #f5f5f5;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.picker-option.selected {
    background-color: #1890ff;
    color: #fff;
    font-weight: bold;
}
</style>