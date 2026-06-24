<template>
  <div class="panel chart-panel">
    <div class="panel-title">🍩 资产分布</div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const chartRef = ref(null)
let chart = null

const assetData = computed(() => store.assetDistribution)

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')

  const data = assetData.value
  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(6,20,50,0.95)',
      borderColor: 'rgba(0,150,255,0.5)',
      textStyle: { color: '#e0ecff' },
      formatter: '{b}: {c} kg ({d}%)<br/>货值约 {f} 万元'
    },
    legend: {
      orient: 'vertical', right: '5%', top: 'center',
      textStyle: { color: '#8899bb', fontSize: 13 },
      itemWidth: 12, itemHeight: 12, itemGap: 16
    },
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#03081a', borderWidth: 3 },
      label: {
        show: true,
        position: 'inside',
        formatter: '{d}%',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff'
      },
      emphasis: {
        label: { fontSize: 18, fontWeight: 'bold' },
        scaleSize: 10
      },
      data: [
        { value: data[0].weight, name: '金水',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#ffd700' }, { offset: 1, color: '#ffec99' }]) } },
        { value: data[1].weight, name: '金块',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#4da6ff' }, { offset: 1, color: '#80c4ff' }]) } },
        { value: data[2].weight, name: '成品',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#00e676' }, { offset: 1, color: '#69f0ae' }]) } }
      ]
    }],
    animationType: 'scale',
    animationEasing: 'elasticOut',
    animationDuration: 1500
  })
}

function handleResize() { chart?.resize() }

onMounted(() => {
  setTimeout(initChart, 300)
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.chart-panel { height: 100%; }
.chart-body { width: 100%; height: calc(100% - 30px); }
</style>
