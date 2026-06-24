<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" style="width: 560px;">
      <div class="modal-header">
        <h3>
          <span :class="alert.level === 'red' ? 'text-red' : 'text-yellow'">
            {{ alert.level === 'red' ? '🔴' : '🟡' }}
          </span>
          预警详情
        </h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body" v-if="alert">
        <div class="detail-row">
          <span class="detail-label">预警标题</span>
          <span class="detail-value">{{ alert.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">预警等级</span>
          <span class="detail-value">
            <span class="level-badge" :class="`badge-${alert.level}`">
              {{ alert.level === 'red' ? '🔴 红色预警' : '🟡 黄色预警' }}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">触发时间</span>
          <span class="detail-value">{{ alert.time }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">异常指标</span>
          <span class="detail-value">
            理论值：{{ alert.theoryValue }} → 实际值：{{ alert.actualValue }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">偏差</span>
          <span class="detail-value" :class="alert.level === 'red' ? 'text-red' : 'text-yellow'">
            {{ alert.deviation }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">处置状态</span>
          <span class="detail-value">{{ statusLabel }}</span>
        </div>
        <div class="detail-row" v-if="alert.handler">
          <span class="detail-label">处置人</span>
          <span class="detail-value">{{ alert.handler }}</span>
        </div>
        <div class="detail-row" v-if="alert.conclusion">
          <span class="detail-label">处置结论</span>
          <span class="detail-value">{{ alert.conclusion }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const selectedAlertId = inject('selectedAlertId')

const alert = computed(() =>
  store.alerts.find(a => a.id === selectedAlertId.value)
)

const statusLabel = computed(() => {
  const map = { pending: '⏳ 待处置', processing: '🔄 处置中', resolved: '✅ 已处置' }
  return map[alert.value?.status] || '未知'
})
</script>

<style scoped>
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

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; padding-bottom: 12px;
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

.detail-row {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
}

.detail-label {
  min-width: 80px; font-size: 12px; color: var(--text-secondary);
}

.detail-value { font-size: 13px; color: var(--text-primary); }

.level-badge {
  padding: 2px 10px; border-radius: 3px; font-size: 12px;
}

.badge-red { background: rgba(255,82,82,0.15); color: var(--red); }
.badge-yellow { background: rgba(255,193,7,0.15); color: var(--yellow); }

.text-red { color: var(--red); }
.text-yellow { color: var(--yellow); }
</style>
