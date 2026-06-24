<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" style="width: 600px;">
      <div class="modal-header">
        <h3>📁 数据管理（仅演示人员）</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- 操作按钮区 -->
        <div class="dm-section">
          <div class="dm-section-title">快捷操作</div>
          <div class="dm-btn-row">
            <button class="dm-btn primary" @click="loadSample">📥 加载样例数据</button>
            <button class="dm-btn warning" @click="resetData">🔄 重置数据</button>
            <button class="dm-btn" @click="downloadTemplate">📋 下载导入模板</button>
          </div>
        </div>

        <!-- Excel 导入 -->
        <div class="dm-section">
          <div class="dm-section-title">Excel 导入</div>
          <div class="drop-zone" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
            <input type="file" ref="fileInput" accept=".xlsx,.csv" @change="handleFile" hidden />
            <div class="drop-icon">📂</div>
            <div>拖拽 .xlsx / .csv 文件到此处，或点击选择</div>
            <div class="drop-hint">按模板格式：工厂编号 | 工厂名称 | 金水重量(kg) | 金块重量(kg) | 成品重量(kg) | 信用评分 | 信用等级</div>
          </div>
          <div v-if="importMsg" class="import-msg" :class="importMsg.type">{{ importMsg.text }}</div>
        </div>

        <!-- 手动录入 -->
        <div class="dm-section">
          <div class="dm-section-title">手动录入</div>
          <div class="manual-form">
            <input v-model="form.name" placeholder="工厂名称 (如: 工厂G)" class="dm-input" />
            <input v-model="form.goldWater" type="number" placeholder="金水重量 (kg)" class="dm-input" />
            <input v-model="form.goldBar" type="number" placeholder="金块重量 (kg)" class="dm-input" />
            <input v-model="form.finished" type="number" placeholder="成品重量 (kg)" class="dm-input" />
            <input v-model="form.creditScore" type="number" min="1" max="100" placeholder="信用评分 (1-100)" class="dm-input" @input="clampCreditScore" />
            <select v-model="form.creditLevel" class="dm-input">
              <option value="">信用等级</option>
              <option>AAA</option><option>AA</option><option>A</option><option>B</option><option>C</option>
            </select>
            <button class="dm-btn primary" @click="addManual">➕ 添加到列表</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'
import * as XLSX from 'xlsx'

const store = useDashboardStore()
const fileInput = ref(null)
const importMsg = ref(null)

const form = reactive({
  name: '', goldWater: '', goldBar: '', finished: '',
  creditScore: '70', creditLevel: 'A'
})

function loadSample() {
  store.loadSampleData()
  importMsg.value = { type: 'success', text: '✅ 样例数据已加载（6家工厂）' }
  setTimeout(() => importMsg.value = null, 3000)
}

function resetData() {
  store.resetData()
  importMsg.value = { type: 'info', text: '🔄 数据已重置为默认值' }
  setTimeout(() => importMsg.value = null, 3000)
}

function downloadTemplate() {
  store.downloadTemplate()
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  processFile(file)
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  processFile(file)
}

function processFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      if (data.length === 0) {
        importMsg.value = { type: 'error', text: '❌ 文件为空或格式不正确' }
        return
      }
      const result = store.importFromExcel(data)
      if (result.success) {
        importMsg.value = { type: 'success', text: `✅ 成功导入 ${result.count} 家工厂数据` }
      } else {
        importMsg.value = { type: 'error', text: `❌ ${result.message}` }
      }
    } catch (err) {
      importMsg.value = { type: 'error', text: `❌ 文件解析失败：${err.message}` }
    }
    setTimeout(() => importMsg.value = null, 4000)
  }
  reader.readAsArrayBuffer(file)
}

function clampCreditScore() {
  const val = parseInt(form.creditScore)
  if (form.creditScore !== '' && (isNaN(val) || val < 1)) {
    form.creditScore = '1'
  } else if (val > 100) {
    form.creditScore = '100'
  }
}

function addManual() {
  if (!form.name) {
    importMsg.value = { type: 'error', text: '❌ 请输入工厂名称' }
    setTimeout(() => importMsg.value = null, 3000)
    return
  }
  const score = parseInt(form.creditScore)
  if (isNaN(score) || score < 1 || score > 100) {
    importMsg.value = { type: 'error', text: '❌ 信用评分必须在 1-100 之间' }
    setTimeout(() => importMsg.value = null, 3000)
    return
  }
  store.addFactory(form)
  importMsg.value = { type: 'success', text: `✅ 已添加 ${form.name}` }
  // 清空表单
  form.name = ''; form.goldWater = ''; form.goldBar = ''
  form.finished = ''; form.creditScore = '70'; form.creditLevel = 'A'
  setTimeout(() => importMsg.value = null, 3000)
}
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

.dm-section {
  margin-bottom: 20px;
}

.dm-section-title {
  font-size: 14px; font-weight: 600; color: var(--cyan);
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px solid rgba(0,150,255,0.15);
}

.dm-btn-row {
  display: flex; gap: 10px; flex-wrap: wrap;
}

.dm-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-glow);
  color: var(--text-primary);
  padding: 8px 18px; border-radius: 5px;
  cursor: pointer; font-size: 13px;
  transition: all 0.2s;
}

.dm-btn:hover { background: rgba(0,150,255,0.15); border-color: var(--cyan); }
.dm-btn.primary { background: rgba(0,150,255,0.2); border-color: var(--blue); }
.dm-btn.warning { background: rgba(255,193,7,0.1); border-color: var(--yellow); }

.drop-zone {
  border: 2px dashed rgba(0,150,255,0.3);
  border-radius: 8px; padding: 24px; text-align: center;
  cursor: pointer; transition: all 0.2s; font-size: 13px;
  color: var(--text-secondary);
}

.drop-zone:hover { border-color: var(--cyan); background: rgba(0,150,255,0.05); }

.drop-icon { font-size: 32px; margin-bottom: 8px; }

.drop-hint {
  font-size: 11px; color: var(--text-secondary); opacity: 0.6; margin-top: 8px;
}

.import-msg {
  margin-top: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;
}

.import-msg.success { background: rgba(0,230,118,0.1); color: var(--green); }
.import-msg.error { background: rgba(255,82,82,0.1); color: var(--red); }
.import-msg.info { background: rgba(0,150,255,0.1); color: var(--cyan); }

.manual-form {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.dm-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-glow);
  color: var(--text-primary); padding: 8px 12px;
  border-radius: 4px; font-size: 13px; outline: none;
}

.dm-input:focus { border-color: var(--cyan); }

.dm-input::placeholder { color: var(--text-secondary); opacity: 0.5; }

select.dm-input option { background: #0a1a3a; color: #fff; }
</style>
