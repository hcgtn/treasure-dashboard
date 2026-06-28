<template>
  <div class="panel-inner chart-panel">
    <div class="panel-title">
      <div>🍩 资产分布</div>
      <dv-decoration3 style="width:250px;height:30px;" />
    </div>
      <dv-border-box13 class="border-warp">
        <div dv-bg ref="chartRef" class="chart-body"></div>
      </dv-border-box13>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'
import { Decoration3 as DvDecoration3 } from '@kjgl77/datav-vue3'
import { BorderBox13 as DvBorderBox13 } from '@kjgl77/datav-vue3'
const store = useDashboardStore()
const chartRef = ref(null)
const modals = inject('modals')
let chart = null
let updateTimer = null
let carouselIndex = 0
let carouselTimer = null
let carouselPaused = false

const assetData = computed(() => store.assetDistribution)

/* ===== 环形图中间的文字（含百分比） ===== */
/* highlightIndex >= 0 时显示对应扇形信息，否则显示总计 */
function makeCenterGraphic(data, highlightIndex = -1) {
  const total = data.reduce((sum, d) => sum + d.weight, 0)
  if (highlightIndex >= 0 && data[highlightIndex]) {
    const item = data[highlightIndex]
    const pct = total > 0 ? ((item.weight / total) * 100).toFixed(1) : '0.0'
    return [
      { type: 'text', left: '35%', top: '38%', style: { text: item.name, textAlign: 'center', fill: '#8899bb', fontSize: 14 } },
      { type: 'text', left: '35%', top: '45%', style: { text: pct + '%', textAlign: 'center', fill: '#ffd700', fontSize: 28, fontWeight: 'bold' } },
      { type: 'text', left: '35%', top: '54%', style: { text: item.weight.toFixed(2) + ' kg', textAlign: 'center', fill: '#fb7293', fontSize: 16 } },
    ]
  }
  return [
    { type: 'text', left: '35%', top: '42%', style: { text: '总重', textAlign: 'center', fill: '#8899bb', fontSize: 14 } },
    { type: 'text', left: '35%', top: '48%', style: { text: total.toFixed(2), textAlign: 'center', fill: '#fb7293', fontSize: 24, fontWeight: 'bold' } },
    { type: 'text', left: '35%', top: '56%', style: { text: 'kg', textAlign: 'center', fill: '#8899bb', fontSize: 12 } },
  ]
}

/* ===== 自动轮播高亮 ===== */
function carouselStep() {
  if (!chart || carouselPaused) return
  const data = assetData.value
  if (!data.length) return
  chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: carouselIndex })
  chart.setOption({ graphic: makeCenterGraphic(data, carouselIndex) })
  carouselIndex = (carouselIndex + 1) % data.length
}

function startCarousel() {
  stopCarousel()
  carouselIndex = 0
  carouselPaused = false
  carouselTimer = setInterval(carouselStep, 3000)
  carouselStep()
}

function stopCarousel() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null }
  if (chart) {
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    chart.setOption({ graphic: makeCenterGraphic(assetData.value) })
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, 'dark')

  const data = assetData.value
  chart.setOption({
    backgroundColor: 'rgba(6, 30, 93, .5)',
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
    graphic: makeCenterGraphic(data),
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#03081a', borderWidth: 3 },
      label: { show: false },
      emphasis: { label: { fontSize: 28, fontWeight: 'bold' }, scaleSize: 10 },
      data: [
        {
          value: data[0].weight, name: '金水',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#ffdb5c' }, { offset: 1, color: '#ffdb5c' }])
          }
        },
        {
          value: data[1].weight, name: '金块',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#32c5e9' }, { offset: 1, color: '#32c5e9' }])
          }
        },
        {
          value: data[2].weight, name: '成品',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#9ee6b9' }, { offset: 1, color: '#9ee6b9' }])
          }
        }
      ]
    }],
    animationType: 'scale',
    animationEasing: 'elasticOut',
    animationDuration: 1500
  })

  /* 鼠标悬停时暂停轮播，移开后 1.5 秒恢复 */
  chart.on('mouseover', () => { carouselPaused = true })
  chart.on('mouseout', () => {
    setTimeout(() => {
      carouselPaused = false
      chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
      chart.setOption({ graphic: makeCenterGraphic(assetData.value) })
    }, 1500)
  })

  /* 启动高亮轮播 */
  startCarousel()
}

function updateChart(newData) {
  if (!chart) return
  chart.setOption({
    graphic: makeCenterGraphic(newData),
    backgroundColor: 'rgba(6, 30, 93, .5)',
    series: [{
      data: [
        {
          value: newData[0].weight, name: '金水',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#ffd700' }, { offset: 1, color: '#ffec99' }])
          }
        },
        {
          value: newData[1].weight, name: '金块',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#4da6ff' }, { offset: 1, color: '#80c4ff' }])
          }
        },
        {
          value: newData[2].weight, name: '成品',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0,
              [{ offset: 0, color: '#00e676' }, { offset: 1, color: '#69f0ae' }])
          }
        }
      ]
    }]
  })
  startCarousel()
}

function handleResize() { chart?.resize() }

onMounted(() => {
  setTimeout(initChart, 300)
  window.addEventListener('resize', handleResize)
})

watch(() => modals.value.dataManage, (val) => {
  if (!chart) return
  if (!val) {
    chart.showLoading({ text: '更新中...', color: '#00e5ff', textColor: '#8899bb', maskColor: 'rgba(3, 8, 26, 0.7)', fontSize: 14 })
    clearTimeout(updateTimer)
    updateTimer = setTimeout(() => { chart.hideLoading(); updateChart(assetData.value) }, 1000)
  }
})

onUnmounted(() => {
  clearTimeout(updateTimer)
  stopCarousel()
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-panel {
  height: 100%;
}

.border-warp {
  height: calc(100% - 38px);
  padding: 12px 0px;
  position: relative;
}

.chart-body {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}
</style>