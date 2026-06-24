<template>
  <div class="kpi-row">
    <div
      v-for="card in cards"
      :key="card.key"
      class="kpi-card"
      :style="{ '--accent': card.color, '--accent-glow': card.glow }"
      @click="showTip = showTip === card.key ? null : card.key"
    >
      <div class="kpi-icon">{{ card.icon }}</div>
      <div class="kpi-info">
        <div class="kpi-label">{{ card.label }}</div>
        <div class="kpi-value">
          <span class="kpi-number" :class="{ 'number-gold': card.key === 'value' }">
            {{ formatValue(card) }}
          </span>
          <span class="kpi-unit">{{ card.unit }}</span>
        </div>
        <div v-if="card.key === 'alert'" class="alert-sub">
          <span class="alert-red-dot"></span>红色 {{ store.kpi.alertRed }}
          <span class="alert-yellow-dot"></span>黄色 {{ store.kpi.alertYellow }}
        </div>
        <div class="kpi-sub">{{ card.sub }}</div>
      </div>
      <!-- 点击提示 -->
      <transition name="tip">
        <div v-if="showTip === card.key" class="kpi-tip">{{ card.tip }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const showTip = ref(null)

const cards = [{
  key: 'value', label: '在库总货值', icon: '💰',
  get value() { return store.kpi.totalValue },
  unit: '万元', sub: '金块+金水+成品 × 实时金价',
  color: '#ffd700', glow: 'rgba(255,215,0,0.4)',
  tip: '在库总货值 = 金块 + 金水 + 成品，按实时国际金价折算'
}, {
  key: 'credit', label: '总授信额度', icon: '🏦',
  get value() { return store.kpi.totalCredit },
  unit: '万元', sub: '银行对园区工厂总授信',
  color: '#4da6ff', glow: 'rgba(77,166,255,0.4)',
  tip: '总授信额度 = 银行批复的各工厂贷款额度之和'
}, {
  key: 'weight', label: '在库总重量', icon: '⚖️',
  get value() { return store.kpi.totalWeight },
  unit: 'kg', sub: '金块+金水+成品总重',
  color: '#00e676', glow: 'rgba(0,230,118,0.4)',
  tip: '在库总重量 = 园区内所有工厂金块、金水、成品重量加总'
}, {
  key: 'alert', label: '预警数量', icon: '⚠️',
  get value() { return store.kpi.alertRed + store.kpi.alertYellow },
  unit: '条', sub: '待处理预警',
  color: '#ff5252', glow: 'rgba(255,82,82,0.4)',
  tip: '红色预警需立即处理，黄色预警需关注'
}]

function formatValue(card) {
  if (card.key === 'alert') return card.value
  return card.value?.toLocaleString('zh-CN') ?? '--'
}
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  overflow: hidden;
}

.kpi-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 30px var(--accent-glow), inset 0 0 30px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.kpi-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent);
}

.kpi-icon {
  font-size: 40px;
  filter: drop-shadow(0 0 8px var(--accent-glow));
}

.kpi-info {
  flex: 1;
}

.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.kpi-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpi-number {
  font-size: 36px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--accent);
  text-shadow: 0 0 20px var(--accent-glow);
  transition: all 0.6s ease;
}

.kpi-number.number-gold {
  font-size: 40px;
}

.kpi-unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.alert-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.alert-red-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 0 0 8px var(--red);
}

.alert-yellow-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--yellow);
  box-shadow: 0 0 8px var(--yellow);
}

.kpi-sub {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-top: 2px;
}

/* 点击提示 */
.kpi-tip {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background: rgba(0,0,0,0.85);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-primary);
  max-width: 260px;
  z-index: 5;
}

.tip-enter-active { transition: all 0.2s; }
.tip-leave-active { transition: all 0.2s; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateY(5px); }
</style>
