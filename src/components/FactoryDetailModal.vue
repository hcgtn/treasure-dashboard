<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content modal-lg">
      <div class="modal-header">
        <h3>🏭 {{ factory.name }} - 三资明细</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body" v-if="factory">
        <!-- 综合评分 -->
        <div class="score-section">
          <div class="score-circle" :style="scoreCircleStyle">
            <span class="score-num">{{ factory.creditScore }}</span>
            <span class="score-label">分 / {{ factory.creditLevel }}级</span>
          </div>
        </div>

        <!-- 三资明细 -->
        <div class="asset-grid">
          <div class="asset-card">
            <div class="asset-icon">🟡</div>
            <div class="asset-label">金水库存</div>
            <div class="asset-value">{{ factory.goldWater }} <small>kg</small></div>
            <div class="asset-price">≈ {{ Math.round(factory.goldWater * 13.95) }} 万元</div>
          </div>
          <div class="asset-card">
            <div class="asset-icon">🟦</div>
            <div class="asset-label">金块库存</div>
            <div class="asset-value">{{ factory.goldBar }} <small>kg</small></div>
            <div class="asset-price">≈ {{ Math.round(factory.goldBar * 13.95) }} 万元</div>
          </div>
          <div class="asset-card">
            <div class="asset-icon">🟢</div>
            <div class="asset-label">成品库存</div>
            <div class="asset-value">{{ factory.finished }} <small>kg</small></div>
            <div class="asset-price">≈ {{ Math.round(factory.finished * 13.95) }} 万元</div>
          </div>
        </div>

        <!-- 近7天趋势小图 -->
        <div class="mini-chart-title">📈 近7天三资趋势</div>
        <div ref="miniChartRef" class="mini-chart"></div>

        <!-- 该工厂最新预警 -->
        <div class="alert-section" v-if="factoryAlerts.length">
          <div class="mini-chart-title">⚠️ 最新预警</div>
          <div class="alert-mini" v-for="a in factoryAlerts" :key="a.id">
            <span :class="a.level === 'red' ? 'text-red' : 'text-yellow'">
              {{ a.level === 'red' ? '🔴' : '🟡' }}
            </span>
            {{ a.title }} — {{ a.time }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '../stores/dashboard.js'

const props = defineProps({ factoryId: String })
const emit = defineEmits(['close'])

const store = useDashboardStore()
const selectedFactoryId = inject('selectedFactoryId')
const miniChartRef = ref(null)

const factory = computed(() =>
  store.factories.find(f => f.id === selectedFactoryId.value)
)

const factoryAlerts = computed(() =>
  store.alerts.filter(a => a.factoryId === selectedFactoryId.value)
)

const scoreColor = computed(() => {
  const s = factory.value?.creditScore || 0
  if (s >= 90) return '#ffd700'
  if (s >= 80) return '#4da6ff'
  if (s >= 70) return '#00e676'
  return '#ff5252'
})

const scoreCircleStyle = computed(() => ({
  borderColor: scoreColor.value,
  boxShadow: `0 0 30px ${scoreColor.value}4D`
}))

function initMiniChart() {
  if (!miniChartRef.value || !factory.value) return
  const chart = echarts.init(miniChartRef.value, 'dark')
  // 生成该工厂的模拟7天趋势
  const days = store.trendData.dates
  const base = { goldWater: factory.value.goldWater, goldBar: factory.value.goldBar, finished: factory.value.finished }
  const gen = (v) => days.map((_, i) => Math.round(v * (0.92 + Math.random() * 0.16)))

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '3%', top: '8%', bottom: '8%' },
    xAxis: { type: 'category', data: days, axisLabel: { fontSize: 10, color: '#8899bb' } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8899bb' }, splitLine: { lineStyle: { color: 'rgba(0,150,255,0.1)' } } },
    series: [
      { name: '金水', type: 'line', data: gen(base.goldWater), smooth: true, lineStyle: { color: '#ffd700', width: 1.5 }, itemStyle: { color: '#ffd700' }, symbol: 'none' },
      { name: '金块', type: 'line', data: gen(base.goldBar), smooth: true, lineStyle: { color: '#4da6ff', width: 1.5 }, itemStyle: { color: '#4da6ff' }, symbol: 'none' },
      { name: '成品', type: 'line', data: gen(base.finished), smooth: true, lineStyle: { color: '#00e676', width: 1.5 }, itemStyle: { color: '#00e676' }, symbol: 'none' }
    ]
  })
}

onMounted(() => setTimeout(initMiniChart, 300))
</script>

<style scoped>
/* 弹窗基础样式 — 在各 Modal 中复用 */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0, 0, 0, 0.75);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, #0a1a3a 0%, #061432 100%);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 10px;
  padding: 24px 28px;
  min-width: 500px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 0 60px rgba(0, 100, 255, 0.2);
}

.modal-lg { width: 700px; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 150, 255, 0.3);
}

.modal-header h3 { color: var(--cyan); font-size: 20px; }

.close-btn {
  background: transparent; border: 1px solid rgba(255,255,255,0.3);
  color: #fff; width: 32px; height: 32px; border-radius: 50%;
  cursor: pointer; font-size: 16px; display: flex; align-items: center;
  justify-content: center; transition: all 0.2s;
}

.close-btn:hover { border-color: var(--red); color: var(--red); }

.score-section {
  text-align: center; margin-bottom: 24px;
}

.score-circle {
  display: inline-flex; flex-direction: column; align-items: center;
  justify-content: center;
  width: 100px; height: 100px; border-radius: 50%;
  border: 3px solid;
}

.score-num { font-size: 28px; font-weight: 700; }
.score-label { font-size: 11px; color: var(--text-secondary); }

.asset-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

.asset-card {
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-glow);
  border-radius: 8px; padding: 16px; text-align: center;
}

.asset-icon { font-size: 28px; margin-bottom: 4px; }
.asset-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.asset-value { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.asset-value small { font-size: 12px; color: var(--text-secondary); }
.asset-price { font-size: 11px; color: var(--gold); margin-top: 4px; }

.mini-chart-title { font-size: 14px; color: var(--cyan); margin-bottom: 8px; }
.mini-chart { width: 100%; height: 180px; margin-bottom: 16px; }

.alert-section { margin-top: 8px; }
.alert-mini { font-size: 12px; padding: 6px 0; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.05); }
.text-red { color: var(--red); }
.text-yellow { color: var(--yellow); }
</style>
