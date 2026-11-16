import { STATUS } from './constants'

function daysAgo(n, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

let seq = 1000
export const uid = (p = 'o') => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`

// 生成演示用种子数据（相对今天，保证台账/看板始终"新鲜"）
export function makeSeed() {
  const orders = [
    // 行程中（置顶）
    {
      id: uid(), platform: 'didi', status: STATUS.ACTIVE,
      origin: '深圳北站 · 东广场', destination: '南山区科技园北区',
      distance: 22.4, estimate: 68, unitPrice: 3.04,
      passengerPhone: '138****6621', createdAt: daysAgo(0, 14, 12),
      note: '行程中',
    },
    // 待接：不同单价，用于演示"单价最高3单"
    {
      id: uid(), platform: 'amap', status: STATUS.PENDING,
      origin: '宝安国际机场 T3', destination: '福田区会展中心',
      distance: 30, estimate: 60, unitPrice: 2.0,
      passengerPhone: '139****1024', createdAt: daysAgo(0, 14, 20),
    },
    {
      id: uid(), platform: 't3', status: STATUS.PENDING,
      origin: '车公庙地铁站 C 口', destination: '罗湖区万象城',
      distance: 10, estimate: 40, unitPrice: 4.0,
      passengerPhone: '137****7788', createdAt: daysAgo(0, 14, 25),
    },
    {
      id: uid(), platform: 'caocao', status: STATUS.PENDING,
      origin: '前海深港合作区', destination: '南山区海岸城',
      distance: 8.6, estimate: 26, unitPrice: 3.02,
      passengerPhone: '186****3390', createdAt: daysAgo(0, 14, 31),
    },
    {
      id: uid(), platform: 'hello', status: STATUS.PENDING,
      origin: '龙岗区大运中心', destination: '福田区市民中心',
      distance: 26, estimate: 52, unitPrice: 2.0,
      passengerPhone: '135****4412', createdAt: daysAgo(0, 14, 38),
    },
    {
      id: uid(), platform: 'didi', status: STATUS.PENDING,
      origin: '龙华区深圳北站', destination: '宝安区壹方中心',
      distance: 18, estimate: 39, unitPrice: 2.17,
      passengerPhone: '188****0093', createdAt: daysAgo(0, 14, 44),
    },
  ]

  // 已完成台账（过去 6 天）
  const ledger = [
    mkDone('didi', '福田口岸', '南山科技园', 16.5, 48, 46, 0, 5, daysAgo(0, 8, 30)),
    mkDone('t3', '深圳北站', '宝安机场', 32, 78, 75, 12, 0, daysAgo(0, 11, 5)),
    mkDone('amap', '车公庙', '罗湖万象城', 9.8, 35, 33, 0, 8, daysAgo(1, 19, 20)),
    mkDone('caocao', '科技园', '前海', 12, 38, 36, 0, 0, daysAgo(1, 21, 10)),
    mkDone('hello', '大运中心', '市民中心', 24, 55, 52, 0, 6, daysAgo(2, 9, 15)),
    mkDone('didi', '机场 T3', '福田 CBD', 34, 82, 80, 15, 0, daysAgo(2, 16, 40)),
    mkDone('amap', '南山', '龙岗', 28, 66, 63, 0, 0, daysAgo(3, 10, 0)),
    mkDone('t3', '罗湖', '龙华', 20, 52, 50, 0, 7, daysAgo(4, 18, 30)),
    mkDone('didi', '福田', '宝安', 22, 58, 56, 10, 0, daysAgo(5, 7, 50)),
    mkDone('caocao', '科技园', '深圳北', 19, 47, 45, 0, 0, daysAgo(6, 20, 12)),
  ]

  return { orders, ledger }
}

function mkDone(platform, origin, destination, distance, estimate, actual, toll, park, finishedAt) {
  const net = actual - toll - park
  return {
    id: uid(), platform, status: STATUS.COMPLETED,
    origin, destination, distance, estimate,
    unitPrice: +(estimate / distance).toFixed(2),
    actual, toll, park, net, finishedAt,
  }
}
