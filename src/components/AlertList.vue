<template>
  <div class="panel alert-panel">
    <div class="panel-title">🔔 最新预警</div>
    <div class="alert-list" ref="listRef">
      <div
        v-for="alert in store.alerts.slice(0, 5)"
        :key="alert.id"
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
</template>

<script setup>
import { inject, ref, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const modals = inject('modals')
const selectedAlertId = inject('selectedAlertId')
const listRef = ref(null)

const statusMap = {
  pending: '⏳待处置',
  processing: '🔄处置中',
  resolved: '✅已处置'
}

// 自动滚动
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
</script>

<style scoped>
.alert-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

.alert-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  background: rgba(255,255,255,0.02);
}

.alert-item:hover {
  background: rgba(0,150,255,0.1);
}

.level-red { border-left: 3px solid var(--red); }
.level-yellow { border-left: 3px solid var(--yellow); }

.alert-title { flex: 1; color: var(--text-primary); font-weight: 500; }
.alert-time { color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; }
.alert-status { color: var(--text-secondary); font-size: 11px; white-space: nowrap; }
</style>
