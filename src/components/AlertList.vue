<template>
    <div class="panel-inner alert-panel">
    <div class="panel-title">
      <div>🔔 最新预警</div>
    </div>
      <div class="panel-title"></div>
      <div class="alert-wrap" style="position:relative;flex:1;min-height:0;">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">更新中...</div>
        </div>
        <div class="alert-list" ref="listRef">
        <div
          v-for="alert in store.alerts.slice(0, 5)"
          class="alert-item"
          :class="`level-${alert.level}`"
          @click="openAlert(alert)"
        >
          <span class="alert-level-icon">{{ alert.level === 'red' ? '🔴' : '🟡' }}</span>
          <span class="alert-title">{{ alert.title }}</span>
          <span class="alert-time">{{ alert.time.slice(5) }}</span>
          <span class="alert-status">{{ statusMap[alert.status] }}</span>
        </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { inject, ref, watch, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const modals = inject('modals')
const selectedAlertId = inject('selectedAlertId')
const listRef = ref(null)

const loading = ref(false)
let loadingTimer = null

watch(() => modals.value.dataManage, (val) => {
  if (!val) {
    loading.value = true
    clearTimeout(loadingTimer)
    loadingTimer = setTimeout(() => { loading.value = false }, 1000)
  }
})

const statusMap = { pending: '⏳待处置', processing: '🔄处置中', resolved: '✅已处置' }

let scrollTimer = null
function autoScroll() {
  const el = listRef.value
  if (!el) return
  scrollTimer = setInterval(() => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
      el.scrollTop = 0
    } else {
      el.scrollTop += 1
    }
  }, 50)
}

function openAlert(alert) {
  selectedAlertId.value = alert.id
  modals.value.alert = true
}

onMounted(() => autoScroll())
onUnmounted(() => {
  clearTimeout(loadingTimer)
  if (scrollTimer) clearInterval(scrollTimer)
})
</script>

<style scoped>
.panel-inner {
  padding: 12px 16px 0 16px; height: calc(100% - 6px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--cyan);
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.alert-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

.alert-wrap { position: relative; flex: 1; min-height: 0; }

.alert-list { height: 100%; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }

.alert-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 4px; cursor: pointer;
  font-size: 12px; transition: all 0.2s; background: rgba(255,255,255,0.02);
}
.alert-item:hover { background: rgba(0,150,255,0.1); }

.level-red { border-left: 3px solid var(--red); }
.level-yellow { border-left: 3px solid var(--yellow); }

.alert-title { flex: 1; color: var(--text-primary); font-weight: 500; }
.alert-time { color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; }
.alert-status { color: var(--text-secondary); font-size: 11px; white-space: nowrap; }

/* ===== 加载遮罩 ===== */
.loading-overlay {
  position: absolute; inset: 0; z-index: 10;
  background: rgba(3, 8, 26, 0.7);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border-radius: 4px;
}

.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(0, 229, 255, 0.2);
  border-top-color: #00e5ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  margin-top: 12px;
  color: #8899bb;
  font-size: 14px;
}
</style>