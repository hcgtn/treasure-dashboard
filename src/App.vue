<template>
  <!-- 加载动画 -->
  <div v-if="isLoading || !showContent" class="loading-overlay" :class="{ 'fading-out': !isLoading && showContent === false }" :style="{ backgroundImage: `url(${bgImg})` }">
    <dv-loading>
      <div class="loading-text">加载中..</div>
    </dv-loading>
  </div>

  <!-- 主页面 -->
  <div v-if="showContent" class="dashboard-container fade-in" :style="{ transform: `scale(${scale})` }">
    <!-- 背景层 -->
    <ParticleBg />

    <!-- 主内容区 -->
    <dv-border-box1 class="main-content-box">
      <div class="main-content">
        <TopNav />
        <KpiCards />
        <div class="charts-row">
          <TrendChart />
          <DistributionChart />
        </div>
        <div class="bottom-row">
            <FactoryTable />
            <div class="bottom-right">
              <AlertList />
              <CreditChart />
            </div>
          </div>
      </div>
    </dv-border-box1>

    <!-- 底部免责声明 -->
    <div class="disclaimer">
      * 本页面展示数据为示例数据，仅供演示参考，不代表工厂真实经营情况
    </div>

    <!-- 弹窗层 -->
    <FactoryDetailModal v-if="modals.factory" @close="modals.factory = false" />
    <AlertDetailModal v-if="modals.alert" @close="modals.alert = false" />
    <DataManageModal v-if="modals.dataManage" @close="modals.dataManage = false" />

    <!-- 右下角时间戳 -->
    <div class="corner-time">{{ store.lastUpdateTime }} 更新</div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import bgImg from '/bg.png'
import { Loading as DvLoading } from '@kjgl77/datav-vue3'
import { useDashboardStore } from './stores/dashboard.js'
import ParticleBg from './components/ParticleBg.vue'
import TopNav from './components/TopNav.vue'
import KpiCards from './components/KpiCards.vue'
import TrendChart from './components/TrendChart.vue'
import DistributionChart from './components/DistributionChart.vue'
import FactoryTable from './components/FactoryTable.vue'
import AlertList from './components/AlertList.vue'
import CreditChart from './components/CreditChart.vue'
import FactoryDetailModal from './components/FactoryDetailModal.vue'
import AlertDetailModal from './components/AlertDetailModal.vue'
import DataManageModal from './components/DataManageModal.vue'
import { BorderBox1 as DvBorderBox1 } from '@kjgl77/datav-vue3'


const store = useDashboardStore()
const scale = ref(1)
const isLoading = ref(true)
const showContent = ref(false)

const modals = ref({
  factory: false,
  alert: false,
  dataManage: false
})

// 暴露给子组件
provide('modals', modals)
provide('selectedFactoryId', ref(null))
provide('selectedAlertId', ref(null))

function handleResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const s = Math.min(w / 1920, h / 1080)
  scale.value = s

  // 居中偏移：当屏幕比设计稿宽时，左右居中显示
  const appEl = document.getElementById('app')
  if (appEl) {
    appEl.style.marginLeft = `${(w - 1920 * s) / 2}px`
    appEl.style.marginTop = `${(h - 1080 * s) / 2}px`
  }
}

// 键盘快捷键：Ctrl+Shift+D 打开数据管理
function handleKeydown(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    console.log('Ctrl+Shift+D pressed: Toggle Data Management Modal')
    e.preventDefault()
    modals.value.dataManage = !modals.value.dataManage
  }
}

onMounted(() => {
  store.recalculateKPI()
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  setTimeout(() => {
    isLoading.value = false
    setTimeout(() => {
      showContent.value = true
    }, 800)
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
/* ========== 全局 CSS 变量 ========== */
:root {
  --bg-deep: #03081a;
  --bg-card: rgba(6, 20, 50, 0.85);
  --border-glow: rgba(0, 150, 255, 0.25);
  --text-primary: #e0ecff;
  --text-secondary: #8899bb;
  --gold: #ffd700;
  --cyan: #00e5ff;
  --blue: #4da6ff;
  --green: #00e676;
  --red: #ff5252;
  --yellow: #ffc107;
  --font-mono: 'SF Mono', 'Cascadia Code', 'JetBrains Mono', monospace;
}

/* ========== 根容器约束（配合 JS 缩放 + 居中） ========== */
#app {
  min-width: 1920px;
  min-height: 1080px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dashboard-container {
  position: relative;
  width: 1920px;
  height: 1080px;
  /* width: 100%;
  height: 100%; */

  transform-origin: left top;
  background: radial-gradient(ellipse at 50% 0%, #0a1a3a 0%, #03081a 60%);
  overflow: hidden;
  font-family: -apple-system, 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color: var(--text-primary);
}

.main-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: 65px 140px 420px 1fr;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 0px 10px 0px 10px;
  height: calc(100% - 30px);
}

/* ========== 图表行 ========== */
.charts-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

/* ========== 底部行 ========== */
.bottom-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  min-height: 0;
}

.bottom-right {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0px;
}

/* ========== 免责声明 ========== */
.disclaimer {
  position: absolute;
  left: 20px;
  z-index: 10;
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.other-content {
  height: calc(100% - 38px);
}

/* ========== 右下角时间 ========== */
.corner-time {
  position: absolute;
  right: 20px;
  z-index: 10;
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* ========== 复用面板样式 ========== */
.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 6px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  opacity: 0.5;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cyan);
  margin-bottom: 8px;
  letter-spacing: 2px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
}

/* ========== 滚动条 ========== */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.3);
  border-radius: 2px;
}

/* ========== 加载动画 ========== */
.loading-overlay {
  position: fixed;
  inset: 0;
  background-color: #03081a;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.8s ease;
}

.loading-overlay.fading-out {
  opacity: 0;
  pointer-events: none;
}

.dashboard-container.fade-in {
  animation: fadeIn 0.6s ease both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-text {
  color: #fff;
  font-size: 18px;
  letter-spacing: 4px;
}

.main-content-box {}
</style>