<template>
    <div class="panel-inner chart-panel">
      <div class="panel-title">📊 信用评分分布</div>
      <div ref="chartRef" class="chart-body"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const chartRef = ref(null)
let chart = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')
  const data = store.creditDistribution
  const colors = { 'AAA': '#32c5e9', 'AA': '#a0e6b9', 'A': '#ffdc5c', 'B': '#ffa07f', 'C': '#fb7293' }

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6,20,50,0.95)',
      borderColor: 'rgba(0,150,255,0.5)',
      textStyle: { color: '#e0ecff' }
    },
    grid: { left: '12%', right: '8%', top: '5%', bottom: '5%' },
    xAxis: {
      type: 'value', name: '家',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(0,150,255,0.1)' } },
      axisLabel: { color: '#8899bb' }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.level),
      axisLine: { lineStyle: { color: 'rgba(0,150,255,0.3)' } },
      axisLabel: { color: '#e0ecff', fontSize: 13, fontWeight: 'bold' }
    },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0,0,1,0, [
            { offset: 0, color: colors[d.level] || '#4da6ff' },
            { offset: 1, color: 'rgba(255,255,255,0.1)' }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 16,
      label: { show: true, position: 'right', color: '#e0ecff', fontSize: 13, fontWeight: 'bold' }
    }],
    animationDuration: 1000
  })
}

function handleResize() { chart?.resize() }

onMounted(() => {
  setTimeout(initChart, 400)
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.panel-inner { padding: 12px 16px 0 16px; height: calc(100% - 6px); }
.panel-title { font-size: 15px; font-weight: 600; color: var(--cyan); margin-bottom: 8px; letter-spacing: 2px; }
.chart-panel { height: 100%; }
.chart-body { width: 100%; height: calc(100% - 30px); }
</style>