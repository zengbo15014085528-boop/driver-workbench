// 平台配置：名称、短名、主题色、图标文字
export const PLATFORMS = {
  didi: { key: 'didi', name: '滴滴出行', short: '滴滴', color: '#FF7A00', mark: '滴' },
  t3: { key: 't3', name: 'T3出行', short: 'T3', color: '#00B2A9', mark: 'T3' },
  amap: { key: 'amap', name: '高德打车', short: '高德', color: '#2E7CF6', mark: '高' },
  caocao: { key: 'caocao', name: '曹操出行', short: '曹操', color: '#00B578', mark: '曹' },
  hello: { key: 'hello', name: '哈啰出行', short: '哈啰', color: '#F5A623', mark: '哈' },
}

export const PLATFORM_KEYS = Object.keys(PLATFORMS)

// 订单状态
export const STATUS = {
  PENDING: 'pending',    // 待接（看板候选）
  ACTIVE: 'active',      // 行程中
  COMPLETED: 'completed',// 已完成（入台账）
  CANCELLED: 'cancelled',// 已取消
}

// 默认规则
export const DEFAULT_RULES = {
  priority: ['didi', 't3', 'amap', 'caocao', 'hello'], // 平台优先级
  minPricePerKm: 0,        // 单价门槛（元/公里），低于则隐藏
  minEstimate: 0,          // 预估金额门槛（元），低于则隐藏
  mode: 'day',             // day 白天 / night 夜间
  nightBoost: true,        // 夜间单提权
  priceFirst: true,        // 单价超过阈值优先
  priceThreshold: 2.5,     // 单价阈值
  lowPriceHide: true,      // 启用低价隐藏
}

export const DEFAULT_SETTINGS = {
  invitedCount: 2,
  member: true,
  memberUntil: '2026-12-31',
  navApp: 'amap', // amap / baidu
  dataNotice: true,
}
