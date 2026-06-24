<template>
  <div class="top-nav">
    <div class="nav-left">
      <div class="logo-area">
        <div class="logo-icon">
          <svg viewBox="0 0 40 40" width="36" height="36">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ffd700"/>
                <stop offset="100%" style="stop-color:#ff8c00"/>
              </linearGradient>
            </defs>
            <polygon points="20,4 36,12 36,28 20,36 4,28 4,12" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" fill="url(#goldGrad)" font-size="18" font-weight="bold">宝</text>
          </svg>
        </div>
        <span class="platform-name">宝铸·黄金加工产业数字基础设施平台</span>
      </div>
    </div>
    <div class="nav-center">
      <span class="bank-label">监管银行：</span>
      <span class="bank-name">{{ store.bankName }}</span>
    </div>
    <div class="nav-right">
      <div class="update-status">
        <span class="status-dot"></span>
        <span>数据已更新</span>
      </div>
      <div class="nav-clock">{{ currentTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()
const currentTime = ref('')

let timer = null
function updateTime() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 100%;
  background: rgba(6, 20, 50, 0.6);
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
}

.nav-left, .nav-center, .nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 3px;
  background: linear-gradient(90deg, #ffd700, #ffec99, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.bank-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.bank-name {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--green);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.5); }
  50% { box-shadow: 0 0 0 6px rgba(0, 230, 118, 0); }
}

.nav-clock {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--cyan);
  letter-spacing: 1px;
  min-width: 190px;
}
</style>
