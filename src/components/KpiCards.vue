<template>
  <div class="kpi-row" style="position: relative;">
    <!-- 加载动画遮罩（弹窗关闭后 1 秒） -->
    <div v-if="isLoading" class="kpi-loading-overlay">
      <dv-loading>
        <div class="kpi-loading-text">更新中...</div>
      </dv-loading>
    </div>

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
        <div :class="['kpi-value', card.key === 'alert' ? 'alert-value' : '']">
          <!-- 数字翻牌器：只有预警数量不用千分位 formatter -->
          <dv-digital-flop :config="flopConfigs[card.key]" />
          <span class="kpi-unit">{{ card.unit }}</span>
          <div v-if="card.key === 'alert'" class="alert-sub">
            <span class="alert-red-dot"></span>红色 {{ store.kpi.alertRed }}
            <span class="alert-yellow-dot"></span>黄色 {{ store.kpi.alertYellow }}
          </div>
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
import { ref, reactive, watch, inject, onMounted, onUnmounted } from 'vue'
import { DigitalFlop as DvDigitalFlop, Loading as DvLoading } from '@kjgl77/datav-vue3'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const showTip = ref(null)
const isLoading = ref(false)
const modals = inject('modals')
let updateTimer = null

/**
 * 千分位格式化（与用户参考一致）
 * 例：123456 -> "123,456"
 */
function formatter(number) {
  const numbers = number.toString().split('').reverse()
  const segs = []
  while (numbers.length) segs.push(numbers.splice(0, 3).join(''))
  return segs.join(',').split('').reverse().join('')
}

/**
 * 四个卡片的翻牌器配置（reactive 保证对象引用不变，数值变化时有翻牌动画）
 */
const flopConfigs = {
  value: reactive({
    number: [0],
    content: '{nt}',
    formatter,
    textAlign: 'left',
    style: { fontSize: 44, fill: '#ffd700' }
  }),
  credit: reactive({
    number: [0],
    content: '{nt}',
    textAlign: 'left',
    formatter,
    style: { fontSize: 44, fill: '#4da6ff' }
  }),
  weight: reactive({
    number: [0],
    content: '{nt}',
    textAlign: 'left',
    formatter,
    style: { fontSize: 44, fill: '#00e676' }
  }),
  alert: reactive({
    number: [0],
    content: '{nt}',
    textAlign: 'left',
    style: { fontSize: 44, fill: '#ff5252' }
  })
}

/**
 * 从 Store 刷新翻牌器数值（仅在此函数中更新 number[0]，触发翻牌动画）
 */
function refreshFlop() {
  flopConfigs.value.number[0] = store.kpi.totalValue ?? 0
  flopConfigs.credit.number[0] = store.kpi.totalCredit ?? 0
  flopConfigs.weight.number[0] = store.kpi.totalWeight ?? 0
  flopConfigs.alert.number[0] = (store.kpi.alertRed + store.kpi.alertYellow) ?? 0
}

// 首次挂载时从 Store 读取初始值
onMounted(() => {
  refreshFlop()
})

// 监听数据管理弹窗关闭 → 显示加载动画 1 秒后翻牌器更新（与资产分布环形图一致）
watch(() => modals?.value?.dataManage, (val) => {
  if (val === false) {
    // 弹窗关闭：显示加载动画（遮罩覆盖翻牌器，旧数值保持不动）
    isLoading.value = true
    clearTimeout(updateTimer)
    updateTimer = setTimeout(() => {
      refreshFlop()       // 1 秒后翻牌器更新 → 触发翻牌动画
      isLoading.value = false  // 遮罩消失，用户看到翻牌后的新数值
    }, 1000)
  }
})

onUnmounted(() => {
  clearTimeout(updateTimer)
})

const cards = [
  {
    key: 'value', label: '在库总货值', icon: '💰',
    unit: '万元', sub: '金块+金水+成品 × 实时金价',
    color: '#ffd700', glow: 'rgba(255,215,0,0.4)',
    tip: '在库总货值 = 金块 + 金水 + 成品，按实时国际金价折算'
  },
  {
    key: 'credit', label: '总授信额度', icon: '🏦',
    unit: '万元', sub: '银行对园区工厂总授信',
    color: '#4da6ff', glow: 'rgba(77,166,255,0.4)',
    tip: '总授信额度 = 银行批复的各工厂贷款额度之和'
  },
  {
    key: 'weight', label: '在库总重量', icon: '⚖️',
    unit: 'kg', sub: '金块+金水+成品总重',
    color: '#00e676', glow: 'rgba(0,230,118,0.4)',
    tip: '在库总重量 = 园区内所有工厂金块、金水、成品重量加总'
  },
  {
    key: 'alert', label: '预警数量', icon: '⚠️',
    unit: '条', sub: '待处理预警',
    color: '#ff5252', glow: 'rgba(255,82,82,0.4)',
    tip: '红色预警需立即处理，黄色预警需关注'
  }
]
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-card {
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  padding: 8px 16px;
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
    height: 100%;
    flex-direction: column;
    justify-content: space-evenly;
    display: flex;
    width: calc(100% - 72px);

}

.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  text-align: left;
}

.kpi-value {
  display: flex;
  align-items: center;
  gap: 4px;
  height: calc(100% - 66px);
  overflow: hidden;
}

.kpi-value :deep(.dv-digital-flop) {
  height: 120%;
  display: flex;
  width: 80%;
  align-items: center;
}
.kpi-value.alert-value :deep(.dv-digital-flop) {
  height: 85%;
  display: flex;
  width: 60%;
  align-items: center;
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
  text-align: left;
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

/* 弹窗关闭后的加载动画（与资产分布环形图风格一致） */
.kpi-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(3, 8, 26, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.kpi-loading-text {
  color: #8899bb;
  font-size: 14px;
  letter-spacing: 3px;
}
</style>
