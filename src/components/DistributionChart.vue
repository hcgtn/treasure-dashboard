<template>
  <div class="panel chart-panel">
    <div class="panel-title">🍩 资产分布</div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const chartRef = ref(null)
const modals = inject('modals')
let chart = null
let updateTimer = null

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

function updateChart(newData) {
  if (!chart) return
  chart.setOption({
    series: [{
      data: [
        { value: newData[0].weight, name: '金水',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#ffd700' }, { offset: 1, color: '#ffec99' }]) } },
        { value: newData[1].weight, name: '金块',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#4da6ff' }, { offset: 1, color: '#80c4ff' }]) } },
        { value: newData[2].weight, name: '成品',
          itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,
            [{ offset: 0, color: '#00e676' }, { offset: 1, color: '#69f0ae' }]) } }
      ]
    }]
  })
}

function handleResize() { chart?.resize() }

onMounted(() => {
  setTimeout(initChart, 300)
  window.addEventListener('resize', handleResize)
})

// 监听弹窗关闭：显示 loading 1 秒后更新图表
watch(() => modals.value.dataManage, (val) => {
  if (!chart) return
  if (!val) {
    // 弹窗关闭：显示 loading
    chart.showLoading({
      text: '更新中...',
      color: '#00e5ff',
      textColor: '#8899bb',
      maskColor: 'rgba(3, 8, 26, 0.7)',
      fontSize: 14
    })
    // 延迟 1 秒后隐藏 loading 并更新图表
    clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      chart.hideLoading()
      updateChart(assetData.value)
    }, 1000)
  }
})

onUnmounted(() => {
  clearTimeout(updateTimer)
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.chart-panel { height: 100%; }
.chart-body { width: 100%; height: calc(100% - 30px); }
</style>
