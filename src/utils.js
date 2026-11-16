import { STATUS } from './constants'

export const money = (n) => {
  const v = Number(n)
  if (!isFinite(v)) return '¥0'
  return `¥${v.toFixed(v % 1 === 0 ? 0 : 1)}`
}

export const money2 = (n) => `¥${(Number(n) || 0).toFixed(2)}`

export const oneDecimal = (n) => (Number(n) || 0).toFixed(1)

export const fmtTime = (ts) => {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const fmtDate = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export const fmtDateTime = (ts) => `${fmtDate(ts)} ${fmtTime(ts)}`

// 今天 00:00 的时间戳
export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfWeek() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // 周一为 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// 对看板订单做智能排序分区
// 返回 { active:[], top:[], rest:[], hidden:[] }
export function boardGroups(orders, rules) {
  const candidates = orders.filter((o) => o.status === STATUS.PENDING || o.status === STATUS.ACTIVE)
  const active = candidates.filter((o) => o.status === STATUS.ACTIVE)
  let pending = candidates.filter((o) => o.status === STATUS.PENDING)

  const hidden = []
  if (rules.lowPriceHide) {
    pending = pending.filter((o) => {
      const hide = o.unitPrice < rules.minPricePerKm || (rules.minEstimate > 0 && o.estimate < rules.minEstimate)
      if (hide) hidden.push(o)
      return !hide
    })
  }

  // 单价最高 3 单
  const byPrice = [...pending].sort((a, b) => b.unitPrice - a.unitPrice)
  const top = byPrice.slice(0, 3)
  const topIds = new Set(top.map((o) => o.id))

  // 其余按规则排：夜间提权 + 平台优先级 + 单价优先
  const rest = pending.filter((o) => !topIds.has(o.id)).sort((a, b) => {
    if (rules.nightBoost && rules.mode === 'night') {
      const an = isNightOrder(a) ? 1 : 0
      const bn = isNightOrder(b) ? 1 : 0
      if (an !== bn) return bn - an
    }
    if (rules.priceFirst) {
      const ah = a.unitPrice >= rules.priceThreshold ? 1 : 0
      const bh = b.unitPrice >= rules.priceThreshold ? 1 : 0
      if (ah !== bh) return bh - ah
    }
    const ap = rules.priority.indexOf(a.platform)
    const bp = rules.priority.indexOf(b.platform)
    if (ap !== bp) return ap - bp
    return b.unitPrice - a.unitPrice
  })

  return { active, top, rest, hidden }
}

export function isNightOrder(order) {
  const h = new Date(order.createdAt || Date.now()).getHours()
  return h >= 22 || h < 6
}

// 台账统计
export function ledgerStats(ledger) {
  const day = startOfToday()
  const week = startOfWeek()
  const month = startOfMonth()
  const done = ledger.filter((o) => o.status === 'completed')

  const sum = (arr) => arr.reduce((acc, o) => acc + (o.net || 0), 0)
  const gross = (arr) => arr.reduce((acc, o) => acc + (o.actual || 0), 0)

  const today = done.filter((o) => (o.finishedAt || 0) >= day)
  const weekArr = done.filter((o) => (o.finishedAt || 0) >= week)
  const monthArr = done.filter((o) => (o.finishedAt || 0) >= month)

  return {
    count: done.length,
    todayNet: sum(today),
    todayGross: gross(today),
    todayCount: today.length,
    weekNet: sum(weekArr),
    monthNet: sum(monthArr),
    avgNet: done.length ? sum(done) / done.length : 0,
    totalNet: sum(done),
    totalGross: gross(done),
  }
}

// 按日期分组台账
export function groupLedger(ledger) {
  const map = new Map()
  const done = ledger
    .filter((o) => o.status === 'completed')
    .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
  for (const o of done) {
    const key = new Date(o.finishedAt).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(o)
  }
  return [...map.entries()].map(([key, items]) => ({ key, items, label: dayLabel(items[0].finishedAt) }))
}

function dayLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const same = (a, b) => a.toDateString() === b.toDateString()
  if (same(d, today)) return `今天 · ${d.getMonth() + 1}月${d.getDate()}日`
  if (same(d, yest)) return `昨天 · ${d.getMonth() + 1}月${d.getDate()}日`
  return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`
}

// 导出 CSV（带 BOM，Excel 直接打开不乱码）
export function exportLedgerCSV(ledger) {
  const rows = [['日期', '平台', '起点', '终点', '里程(km)', '预估', '实收', '高速费', '停车费', '净收入', '每公里单价']]
  const done = [...ledger]
    .filter((o) => o.status === 'completed')
    .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))
  for (const o of done) {
    const d = new Date(o.finishedAt)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${fmtTime(o.finishedAt)}`
    rows.push([
      ds, o.platform, o.origin, o.destination, o.distance,
      o.estimate, o.actual, o.toll || 0, o.park || 0, o.net, o.unitPrice,
    ])
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `司机流水台账_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return done.length
}

// 导航链接
export function navUrl(type, destination, origin) {
  const name = encodeURIComponent(destination || '')
  if (type === 'baidu') {
    return `https://api.map.baidu.com/marker?location=&title=${name}&content=${name}&output=html&coord_type=gcj02&src=driver_workbench`
  }
  // 高德 URI API（网页唤起）
  return `https://uri.amap.com/marker?position=&name=${name}&src=driver_workbench&coordinate=gaode&callnative=1`
}
