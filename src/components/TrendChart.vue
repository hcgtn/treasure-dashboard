<template>
  <div class="panel-inner chart-panel" ref="containerRef">
    <div class="panel-title">
      <div>📈 近7天库存趋势</div>
      <dv-decoration3 style="width:250px;height:30px;" />
    </div>
    <dv-border-box13 class="border-warp">
      <div ref="chartRef" class="chart-body"></div>
    </dv-border-box13>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'
import { Decoration3 as DvDecoration3 } from '@kjgl77/datav-vue3'
import { BorderBox13 as DvBorderBox13 } from '@kjgl77/datav-vue3'

const store = useDashboardStore()
const modals = inject('modals')
const chartRef = ref(null)
const containerRef = ref(null)
const dataImportPending = ref(false)
let chart = null
let updateTimer = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')

  chart.setOption({
    backgroundColor: 'rgba(6, 30, 93, .2)',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6,20,50,0.95)',
      borderColor: 'rgba(0,150,255,0.5)',
      textStyle: { color: '#e0ecff', fontSize: 12 }
    },
    legend: {
      data: ['金水', '金块', '成品'],
      bottom: 0,
      textStyle: { color: '#8899bb', fontSize: 12 },
      itemWidth: 20, itemHeight: 3
    },
    grid: { left: '3%', right: '4%', top: '8%', bottom: '12%' },
    xAxis: {
      type: 'category',
      data: store.trendData.dates,
      axisLine: { lineStyle: { color: 'rgba(0,150,255,0.3)' } },
      axisLabel: { color: '#8899bb' }
    },
    yAxis: {
      type: 'value', name: 'kg',
      nameTextStyle: { color: '#8899bb' },
      splitLine: { lineStyle: { color: 'rgba(0,150,255,0.1)' } },
      axisLabel: { color: '#8899bb' }
    },
    series: [
      {
        name: '金水', type: 'line',
        data: store.trendData.goldWater,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#ffd700', width: 2 },
        itemStyle: { color: '#ffd700' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1,
            [{ offset: 0, color: 'rgba(255,215,0,0.3)' }, { offset: 1, color: 'rgba(255,215,0,0.02)' }])
        }
      }, {
        name: '金块', type: 'line',
        data: store.trendData.goldBar,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#4da6ff', width: 2 },
        itemStyle: { color: '#4da6ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1,
            [{ offset: 0, color: 'rgba(77,166,255,0.3)' }, { offset: 1, color: 'rgba(77,166,255,0.02)' }])
        }
      }, {
        name: '成品', type: 'line',
        data: store.trendData.finished,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#00e676', width: 2 },
        itemStyle: { color: '#00e676' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1,
            [{ offset: 0, color: 'rgba(0,230,118,0.3)' }, { offset: 1, color: 'rgba(0,230,118,0.02)' }])
        }
      }
    ],
    animationEasing: 'elasticOut',
    animationDuration: 1500
  })
}

function handleResize() { chart?.resize() }

/* 从 Store 读取最新数据刷新图表（用于自动滚动等非导入场景） */
function updateChart(newData) {
  if (!chart) return
  chart.setOption({
    xAxis: { data: newData.dates },
    series: [
      { data: newData.goldWater },
      { data: newData.goldBar },
      { data: newData.finished }
    ],
    animationDuration: 500, animationDurationUpdate: 800,
    animationEasing: 'cubicInOut', animationEasingUpdate: 'cubicInOut'
  })
}

onMounted(() => {
  setTimeout(initChart, 200)
  setTimeout(() => store.startTrendAutoScroll(), 500)
  window.addEventListener('resize', handleResize)
})

/* 自动滚动等场景：直接刷新（不经过加载动画） */
watch(() => store.trendData, (newData) => {
  if (dataImportPending.value) return  // 导入中 → 等待 modal watch 统一刷新
  updateChart(newData)
}, { deep: true })

/* 数据管理弹窗：打开时锁定图表，关闭后 1 秒加载动画再刷新 */
watch(() => modals.value.dataManage, (val) => {
  if (!chart) return
  if (val) {
    // 弹窗打开 → 锁定，阻止深 watch 在导入期间抢先刷新
    dataImportPending.value = true
  } else {
    // 弹窗关闭 → 展示加载动画，1 秒后统一刷新
    chart.showLoading({ text: '更新中...', color: '#00e5ff', textColor: '#8899bb', maskColor: 'rgba(3, 8, 26, 0.7)', fontSize: 14 })
    clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      chart.hideLoading()
      updateChart(store.trendData)
      dataImportPending.value = false
    }, 1000)
  }
})

onUnmounted(() => {
  clearTimeout(updateTimer)
  store.stopTrendAutoScroll()
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.panel-inner {
  padding: 12px 16px;
  height: 100%;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cyan);
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.chart-panel {
  height: 100%;
}

.chart-body {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.border-warp {
  height: calc(100% - 38px);
  padding: 12px 6px 4px 6px;
  position: relative;
}
</style>