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
    dataLastUpdatedTime: new Date().toLocaleString('zh-CN'),
    bankName: '平安银行深圳分行',
    factoryAlerts: {},
    // 趋势图自动滚动相关
    trendPool: [],       // 30天预生成数据池
    trendCursor: 0,      // 当前7天窗口起始位置 (0~23)
    trendTimer: null,    // 滚动定时器句柄

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
    // ============================================================
    // 核心：预警规则引擎 —— 根据工厂实时数据自动生成预警
    // ============================================================
    generateAlerts() {
      const now = new Date()
      const fmt = (d) => d.toLocaleString('zh-CN')
      const newAlerts = []

      const addAlert = (factory, title, level, theoryVal, actualVal, deviation) => {
        newAlerts.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          factoryId: factory.id,
          title,
          level,
          time: fmt(now),
          theoryValue: theoryVal,
          actualValue: actualVal,
          deviation,
          status: 'pending',
          handler: '',
          conclusion: ''
        })
      }

      this.factories.forEach(f => {
        const total = f.goldWater + f.goldBar + f.finished

        // ---------- 规则1：库存总量预警 ----------
        if (total > 200) {
          addAlert(f,
            `${f.name} 库存总量超警戒线`,
            'red',
            '≤200kg',
            `${total}kg`,
            `+${((total / 200 - 1) * 100).toFixed(1)}%`
          )
        } else if (total > 150) {
          addAlert(f,
            `${f.name} 库存总量接近警戒线`,
            'yellow',
            '≤200kg',
            `${total}kg`,
            `${((total / 200 - 1) * 100).toFixed(1)}%`
          )
        }

        // ---------- 规则2：信用评分预警 ----------
        if (f.creditScore < 60) {
          addAlert(f,
            `${f.name} 信用评分过低`,
            'red',
            '≥60分',
            `${f.creditScore}分`,
            `-${60 - f.creditScore}分`
          )
        } else if (f.creditScore < 75) {
          addAlert(f,
            `${f.name} 信用评分偏低`,
            'yellow',
            '≥75分',
            `${f.creditScore}分`,
            `-${75 - f.creditScore}分`
          )
        }

        // ---------- 规则3：单品类占比失衡 ----------
        const categories = [
          { name: '金水', val: f.goldWater },
          { name: '金块', val: f.goldBar },
          { name: '成品', val: f.finished }
        ]
        if (total > 0) {
          categories.forEach(c => {
            const ratio = c.val / total
            if (ratio > 0.6) {
              addAlert(f,
                `${f.name} ${c.name}库存占比过高`,
                'yellow',
                '占比≤60%',
                `${(ratio * 100).toFixed(1)}%`,
                `+${((ratio - 0.6) * 100).toFixed(1)}%`
              )
            }
          })
        }

        // ---------- 规则4：品类缺失预警 ----------
        categories.forEach(c => {
          if (c.val === 0) {
            addAlert(f,
              `${f.name} ${c.name}库存缺失`,
              'yellow',
              '>0kg',
              '0kg',
              '缺失'
            )
          }
        })
      })

      this.alerts = newAlerts

      // 同步更新 factoryAlerts 映射表，供 FactoryDetailModal 使用
      this.factoryAlerts = {}
      newAlerts.forEach(a => {
        if (!this.factoryAlerts[a.factoryId]) {
          this.factoryAlerts[a.factoryId] = []
        }
        this.factoryAlerts[a.factoryId].push(a)
      })
    },

    // ============================================================
    // 统一重算入口：工厂状态 → KPI → 信用分布 → 预警生成
    // ============================================================
    recalculateKPI() {
      // 1. 根据实际数据动态判定工厂状态 & 信用等级
      this.factories.forEach(f => {
        const total = f.goldWater + f.goldBar + f.finished
        if (total > 200 || f.creditScore < 60) {
          f.status = 'danger'
        } else if (total > 150 || f.creditScore < 75) {
          f.status = 'warning'
        } else {
          f.status = 'normal'
        }
        // 动态重算 creditLevel
        const s = f.creditScore
        f.creditLevel = s >= 90 ? 'AAA' : s >= 80 ? 'AA' : s >= 70 ? 'A' : s >= 60 ? 'B' : 'C'
      })

      // 2. 计算 KPI 数值
      const totalWeight = this.factories.reduce((s, f) => s + f.goldWater + f.goldBar + f.finished, 0)
      this.kpi.totalWeight = Math.round(totalWeight * 10) / 10
      this.kpi.totalValue = Math.round(totalWeight * 13.95)

      // 3. 根据工厂信用等级重算分布
      const dist = { AAA: 0, AA: 0, A: 0, B: 0, C: 0 }
      this.factories.forEach(f => {
        const lv = f.creditLevel || 'A'
        if (lv in dist) dist[lv]++
      })
      this.creditDistribution = Object.entries(dist).map(([level, count]) => ({ level, count }))

      // 4. 触发预警引擎
      this.generateAlerts()

      // 5. 同步预警计数到 KPI 卡片
      const { red, yellow } = this.alertCounts
      this.kpi.alertRed = red
      this.kpi.alertYellow = yellow

      // 6. 初始化趋势数据池（30天）+ 启动自动滚动
      this.initTrendPool()
      this.startTrendAutoScroll()

      this.lastUpdateTime = new Date().toLocaleString('zh-CN')
      this.dataLastUpdatedTime = new Date().toLocaleString('zh-CN')
    },

    loadSampleData() {
      this.factories = JSON.parse(JSON.stringify(defaultData.factories))
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
      this.dataLastUpdatedTime = new Date().toLocaleString('zh-CN')
    },

    setTotalCredit(amount) {
      this.kpi.totalCredit = amount
      this.lastUpdateTime = new Date().toLocaleString('zh-CN')
      this.dataLastUpdatedTime = new Date().toLocaleString('zh-CN')
    },

    // ============================================================
    // 趋势图自动滚动：30天数据池 + 7天滑动窗口
    // ============================================================
    initTrendPool() {
      const baseGoldWater = this.factories.reduce((s, f) => s + f.goldWater, 0) || 100
      const baseGoldBar = this.factories.reduce((s, f) => s + f.goldBar, 0) || 80
      const baseFinished = this.factories.reduce((s, f) => s + f.finished, 0) || 60
      const pool = []
      const now = new Date()
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const rf = () => 1 + (Math.random() - 0.5) * 0.6
        pool.push({
          date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
          goldWater: Math.round(baseGoldWater * rf()),
          goldBar: Math.round(baseGoldBar * rf()),
          finished: Math.round(baseFinished * rf())
        })
      }
      this.trendPool = pool
      this.trendCursor = 0
      this.setTrendWindow(0)
    },

    setTrendWindow(start) {
      const end = start + 7
      if (end > this.trendPool.length) return
      const slice = this.trendPool.slice(start, end)
      this.trendData = {
        dates: slice.map(s => s.date),
        goldWater: slice.map(s => s.goldWater),
        goldBar: slice.map(s => s.goldBar),
        finished: slice.map(s => s.finished)
      }

    },

    startTrendAutoScroll(intervalMs = 5000) {
      this.stopTrendAutoScroll()
      const maxCursor = this.trendPool.length - 7  // 24 for 30-day pool
      if (maxCursor <= 0) return
      this.trendTimer = setInterval(() => {
        this.trendCursor = (this.trendCursor + 1) % (maxCursor + 1)
        this.setTrendWindow(this.trendCursor)
        this.lastUpdateTime = new Date().toLocaleString('zh-CN')
      }, intervalMs)
    },

    stopTrendAutoScroll() {
      if (this.trendTimer) {
        clearInterval(this.trendTimer)
        this.trendTimer = null
      }
    },

    // ============================================================
    // 动态生成趋势数据：根据 factories 实时数据生成最近7天趋势
    // ============================================================
    generateTrendData() {
      // 计算各品类总和作为基数
      const baseGoldWater = this.factories.reduce((s, f) => s + f.goldWater, 0)
      const baseGoldBar = this.factories.reduce((s, f) => s + f.goldBar, 0)
      const baseFinished = this.factories.reduce((s, f) => s + f.finished, 0)

      const dates = []
      const goldWater = []
      const goldBar = []
      const finished = []

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)

        // 上下浮动30%的随机系数 (0.7 ~ 1.3)
        const randomFactor = () => 1 + (Math.random() - 0.5) * 0.6
        goldWater.push(Math.round(baseGoldWater * randomFactor()))
        goldBar.push(Math.round(baseGoldBar * randomFactor()))
        finished.push(Math.round(baseFinished * randomFactor()))
      }

      this.trendData = { dates, goldWater, goldBar, finished }
    }
  }
})
