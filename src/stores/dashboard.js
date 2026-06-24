import { defineStore } from 'pinia'
import defaultData from '../assets/sample-data.json'
import * as XLSX from 'xlsx'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    kpi: { ...defaultData.kpi },
    factories: JSON.parse(JSON.stringify(defaultData.factories)),
    trendData: JSON.parse(JSON.stringify(defaultData.trendData)),
    alerts: JSON.parse(JSON.stringify(defaultData.alerts)),
    creditDistribution: JSON.parse(JSON.stringify(defaultData.creditDistribution)),
    lastUpdateTime: new Date().toLocaleString('zh-CN'),
    bankName: '平安银行深圳分行',
    factoryAlerts: {} // { factoryId: [alert, ...] }
  }),

  getters: {
    alertCounts(state) {
      const red = state.alerts.filter(a => a.level === 'red' && a.status !== 'resolved').length
      const yellow = state.alerts.filter(a => a.level === 'yellow' && a.status !== 'resolved').length
      return { red, yellow }
    },

    // 资产分布（用于环形图）
    assetDistribution(state) {
      const total = state.factories.reduce((sum, f) => sum + f.goldWater + f.goldBar + f.finished, 0)
      const goldWater = state.factories.reduce((s, f) => s + f.goldWater, 0)
      const goldBar = state.factories.reduce((s, f) => s + f.goldBar, 0)
      const finished = state.factories.reduce((s, f) => s + f.finished, 0)
      const goldPrice = state.kpi.totalValue / state.kpi.totalWeight // 万元/kg
      return [
        { name: '金水', weight: goldWater, value: Math.round(goldWater * goldPrice), percent: ((goldWater / total) * 100).toFixed(1) },
        { name: '金块', weight: goldBar, value: Math.round(goldBar * goldPrice), percent: ((goldBar / total) * 100).toFixed(1) },
        { name: '成品', weight: finished, value: Math.round(finished * goldPrice), percent: ((finished / total) * 100).toFixed(1) }
      ]
    },

    // 计算单个工厂的进度条百分比（相对于该工厂预设警戒线）
    factoryProgress(state) {
      return (factory) => {
        const maxCapacity = 200 // 预设单工厂最大库存容量 kg
        const total = factory.goldWater + factory.goldBar + factory.finished
        return Math.min((total / maxCapacity) * 100, 100)
      }
    }
  },

  actions: {
    recalculateKPI() {
      const totalWeight = this.factories.reduce((s, f) => s + f.goldWater + f.goldBar + f.finished, 0)
      this.kpi.totalWeight = Math.round(totalWeight * 10) / 10
      // 按实时金价（演示用固定值：约 13.95 万元/kg）
      this.kpi.totalValue = Math.round(totalWeight * 13.95)
      const { red, yellow } = this.alertCounts
      this.kpi.alertRed = red
      this.kpi.alertYellow = yellow
      this.lastUpdateTime = new Date().toLocaleString('zh-CN')
    },

    loadSampleData() {
      this.factories = JSON.parse(JSON.stringify(defaultData.factories))
      this.trendData = JSON.parse(JSON.stringify(defaultData.trendData))
      this.alerts = JSON.parse(JSON.stringify(defaultData.alerts))
      this.creditDistribution = JSON.parse(JSON.stringify(defaultData.creditDistribution))
      this.recalculateKPI()
    },

    resetData() {
      this.loadSampleData()
    },

    importFromExcel(jsonData) {
      try {
        const parsed = jsonData.map(row => ({
          id: row['工厂编号'] || row['id'] || String(Math.random().toString(36).slice(2, 4)).toUpperCase(),
          name: row['工厂名称'] || row['name'] || '未知工厂',
          goldWater: parseFloat(row['金水重量(kg)']) || parseFloat(row['goldWater']) || 0,
          goldBar: parseFloat(row['金块重量(kg)']) || parseFloat(row['goldBar']) || 0,
          finished: parseFloat(row['成品重量(kg)']) || parseFloat(row['finished']) || 0,
          creditScore: Math.min(100, Math.max(1, parseInt(row['信用评分']) || parseInt(row['creditScore']) || 70)),
          creditLevel: row['信用等级'] || row['creditLevel'] || 'A',
          status: 'normal'
        }))
        if (parsed.length === 0) throw new Error('未解析到有效数据')
        this.factories = parsed
        this.recalculateKPI()
        return { success: true, count: parsed.length }
      } catch (e) {
        return { success: false, message: e.message }
      }
    },

    addFactory(form) {
      this.factories.push({
        id: String(Math.random().toString(36).slice(2, 4)).toUpperCase(),
        name: form.name,
        goldWater: parseFloat(form.goldWater) || 0,
        goldBar: parseFloat(form.goldBar) || 0,
        finished: parseFloat(form.finished) || 0,
        creditScore: Math.min(100, Math.max(1, parseInt(form.creditScore) || 70)),
        creditLevel: form.creditLevel || 'A',
        status: 'normal'
      })
      this.recalculateKPI()
    },

    downloadTemplate() {
      const ws = XLSX.utils.json_to_sheet([{
        '工厂编号': 'A',
        '工厂名称': '工厂A',
        '金水重量(kg)': 120,
        '金块重量(kg)': 85,
        '成品重量(kg)': 45,
        '信用评分': 88,
        '信用等级': 'AA'
      }])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '库存数据')
      XLSX.writeFile(wb, '宝铸平台-数据导入模板.xlsx')
    },

    setBankName(name) {
      this.bankName = name
    }
  }
})
