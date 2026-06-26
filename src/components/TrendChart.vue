<template>
  <div class="panel chart-panel" ref="containerRef">
    <div class="panel-title">📈 近7天库存趋势</div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const chartRef = ref(null)
const containerRef = ref(null)
let chart = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')

  chart.setOption({
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
      type: 'value',
      name: 'kg',
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
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,
          [{ offset: 0, color: 'rgba(255,215,0,0.3)' }, { offset: 1, color: 'rgba(255,215,0,0.02)' }]) }
      }, {
        name: '金块', type: 'line',
        data: store.trendData.goldBar,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#4da6ff', width: 2 },
        itemStyle: { color: '#4da6ff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,
          [{ offset: 0, color: 'rgba(77,166,255,0.3)' }, { offset: 1, color: 'rgba(77,166,255,0.02)' }]) }
      }, {
        name: '成品', type: 'line',
        data: store.trendData.finished,
        smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#00e676', width: 2 },
        itemStyle: { color: '#00e676' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,
          [{ offset: 0, color: 'rgba(0,230,118,0.3)' }, { offset: 1, color: 'rgba(0,230,118,0.02)' }]) }
      }
    ],
    animationEasing: 'elasticOut',
    animationDuration: 1500
  })
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  setTimeout(initChart, 200)
  // 确保趋势图自动滚动已启动（recalculateKPI 也会触发，此处做兜底）
  setTimeout(() => store.startTrendAutoScroll(), 500)
  window.addEventListener('resize', handleResize)
})

// 监听 trendData 变化，动态更新图表
watch(() => store.trendData, (newData) => {
  if (!chart) return
  chart.setOption({
    xAxis: { data: newData.dates },
    series: [
      { data: newData.goldWater },
      { data: newData.goldBar },
      { data: newData.finished }
    ],
    animationDuration: 500,
    animationDurationUpdate: 800,
    animationEasing: 'cubicInOut',
    animationEasingUpdate: 'cubicInOut'
  })
}, { deep: true })

onUnmounted(() => {
  store.stopTrendAutoScroll()
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.chart-panel { height: 100%; }
.chart-body { width: 100%; height: calc(100% - 30px); }
</style>
