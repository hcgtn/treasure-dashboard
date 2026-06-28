<template>
    <div class="panel-inner table-panel">
      <div class="panel-title">
        <div>🏭 各工厂实时库存明细</div>
        <dv-decoration6 style="width:250px;height:30px;" />
      </div>
      <div class="table-wrap">
        <table class="header-table">
          <colgroup>
            <col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:30%"><col style="width:10%"><col style="width:12%">
          </colgroup>
          <thead>
            <tr>
              <th>工厂</th><th>金水 (kg)</th><th>金块 (kg)</th><th>成品 (kg)</th><th>库存进度</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
        </table>
        <div class="scroll-viewport" @mouseenter="paused = true" @mouseleave="paused = false">
          <div class="scroll-body" :class="{ paused }">
            <table class="body-table">
              <colgroup>
                <col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:30%"><col style="width:10%"><col style="width:12%">
              </colgroup>
              <tbody>
                <tr v-for="f in doubledFactories" :key="f.uid" :class="`row-${f.status}`">
                  <td class="factory-name">{{ f.name }}</td>
                  <td>{{ f.goldWater }}</td>
                  <td>{{ f.goldBar }}</td>
                  <td>{{ f.finished }}</td>
                  <td class="progress-cell">
                    <div class="progress-bar">
                      <div class="progress-fill" :class="`fill-${f.status}`"
                        :style="{ width: progressPercent(f) + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ progressPercent(f) }}%</span>
                  </td>
                  <td>
                    <span class="status-tag" :class="`tag-${f.status}`">
                      {{ statusMap[f.status] }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-detail" @click="openDetail(f)">查看详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'
import { Decoration6 as DvDecoration6 } from '@kjgl77/datav-vue3'

const store = useDashboardStore()
const modals = inject('modals')
const selectedFactoryId = inject('selectedFactoryId')

const paused = ref(false)

const doubledFactories = computed(() => {
  const list = store.factories
  if (!list || list.length === 0) return []
  const withUid = (arr, prefix) => arr.map((f, i) => ({ ...f, uid: `${prefix}${f.id}-${i}` }))
  return [...withUid(list, 'a'), ...withUid(list, 'b')]
})

const statusMap = { normal: '● 正常', warning: '⚠ 预警', danger: '🔴 异常' }

function progressPercent(f) {
  const max = 200
  const total = f.goldWater + f.goldBar + f.finished
  return Math.min(Math.round((total / max) * 100), 100)
}

function openDetail(f) {
  selectedFactoryId.value = f.id
  modals.value.factory = true
}
</script>

<style scoped>
.table-panel {
  height: calc(100% - 38px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-inner {
  padding: 0px 16px;
  height: calc(100% - 38px);
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

.table-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.header-table,
.body-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.header-table thead th {
  background: rgba(6, 20, 50, 0.95);
  color: var(--cyan);
  font-weight: 600;
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid rgba(0,150,255,0.3);
}

.scroll-viewport {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.scroll-body {
  animation: factory-scroll-up 20s linear infinite;
}

.scroll-body.paused {
  animation-play-state: paused;
}

@keyframes factory-scroll-up {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.body-table tbody td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(0,150,255,0.08);
  color: var(--text-primary);
}

.body-table tbody tr {
  transition: background 0.2s;
}

.body-table tbody tr:hover {
  background: rgba(0, 150, 255, 0.08);
}

.row-warning { border-left: 3px solid #ffdc5c; }
.row-danger { border-left: 3px solid #fb7293; }
.factory-name { font-weight: 600; color: var(--cyan); }

.progress-cell { display: flex; align-items: center; gap: 8px; min-width: 140px; }
.progress-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.fill-normal { background: #a0e6b9; box-shadow: 0 0 6px #a0e6b9; }
.fill-warning { background: #ffdc5c; box-shadow: 0 0 6px #ffdc5c; }
.fill-danger { background: #fb7293; box-shadow: 0 0 6px #fb7293; }
.progress-text { font-size: 11px; color: var(--text-secondary); min-width: 35px; }

.status-tag { font-size: 12px; padding: 2px 8px; border-radius: 3px; }
.tag-normal { color: #a0e6b9; background: rgba(160,230,185,0.1); }
.tag-warning { color: #ffdc5c; background: rgba(255,220,92,0.1); }
.tag-danger { color: #fb7293; background: rgba(251,114,147,0.1); }

.btn-detail {
  background: transparent; border: 1px solid var(--border-glow);
  color: var(--cyan); padding: 4px 12px; border-radius: 3px;
  cursor: pointer; font-size: 12px; transition: all 0.2s;
}
.btn-detail:hover { background: rgba(0, 229, 255, 0.15); border-color: var(--cyan); }
</style>