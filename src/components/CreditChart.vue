<template>
    <div class="panel-inner chart-panel">
      <div class="panel-title">
        <div>📊 信用评分分布</div>
        <dv-decoration2 :dur="2" style="width:200px;height:5px;" />
      </div>
      <div ref="chartRef" class="chart-body"></div>
    </div>
</template>

<script setup>
import { ref, inject, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'
import { Decoration2 as DvDecoration2 } from '@kjgl77/datav-vue3'

const store = useDashboardStore()
const chartRef = ref(null)
const modals = inject('modals')
let chart = null
let updateTimer = null

function buildOption(data) {
  const colors = { 'AAA': '#32c5e9', 'AA': '#a0e6b9', 'A': '#ffdc5c', 'B': '#ffa07f', 'C': '#fb7293' }
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6,20,50,0.95)',
      borderColor: 'rgba(0,150,255,0.5)',
      textStyle: { color: '#e0ecff' },
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p.name} 级<br/>${p.marker} ${p.value} <span style="color:#8899bb">家</span>`
      }
    },
    grid: { left: '4%', right: '16%', top: '5%', bottom: '5%' },
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
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption(buildOption(store.creditDistribution))
}

function updateChart() {
  if (!chart) return
  chart.setOption(buildOption(store.creditDistribution), true)
}

function handleResize() { chart?.resize() }

onMounted(() => {
  setTimeout(initChart, 400)
  window.addEventListener('resize', handleResize)
})

watch(() => modals.value.dataManage, (val) => {
  if (!chart) return
  if (!val) {
    chart.showLoading({ text: '更新中...', color: '#00e5ff', textColor: '#8899bb', maskColor: 'rgba(3, 8, 26, 0.7)', fontSize: 14 })
    clearTimeout(updateTimer)
    updateTimer = setTimeout(() => { chart.hideLoading(); updateChart() }, 1000)
  }
})

onUnmounted(() => {
  clearTimeout(updateTimer)
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.panel-inner { padding: 12px 16px 0 16px; height: calc(100% - 6px); }
.panel-title { font-size: 15px; font-weight: 600; color: var(--cyan); margin-bottom: 0px !important; letter-spacing: 2px; }
.chart-panel { height: 100%; }
.chart-body { width: 100%; height: calc(100% - 48px); }
</style>