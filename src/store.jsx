import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DEFAULT_RULES, DEFAULT_SETTINGS } from './constants'
import { makeSeed } from './seed'

const KEY = 'driver_workbench_v1'

const StoreContext = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        orders: parsed.orders ?? [],
        ledger: parsed.ledger ?? [],
        rules: { ...DEFAULT_RULES, ...(parsed.rules || {}) },
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      }
    }
  } catch (e) {
    console.warn('读取本地数据失败，使用演示数据', e)
  }
  const seed = makeSeed()
  return {
    orders: seed.orders,
    ledger: seed.ledger,
    rules: { ...DEFAULT_RULES },
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('保存本地数据失败', e)
    }
  }, [state])

  const update = useCallback((fn) => setState((s) => fn(s)), [])

  // ---- 订单操作 ----
  const addOrder = useCallback((order) => {
    update((s) => ({ ...s, orders: [order, ...s.orders] }))
  }, [update])

  const patchOrder = useCallback((id, patch) => {
    update((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }))
  }, [update])

  const removeOrder = useCallback((id) => {
    update((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }))
  }, [update])

  // 接单：pending -> active
  const acceptOrder = useCallback((id) => {
    patchOrder(id, { status: 'active', acceptedAt: Date.now() })
  }, [patchOrder])

  // 完成行程：active -> completed，并写入台账
  const completeOrder = useCallback((id, { actual, toll, park }) => {
    update((s) => {
      const order = s.orders.find((o) => o.id === id)
      if (!order) return s
      const a = Number(actual) || 0
      const t = Number(toll) || 0
      const p = Number(park) || 0
      const finishedAt = Date.now()
      const done = {
        ...order,
        status: 'completed',
        actual: a, toll: t, park: p,
        net: a - t - p,
        finishedAt,
      }
      return {
        ...s,
        orders: s.orders.filter((o) => o.id !== id),
        ledger: [done, ...s.ledger],
      }
    })
  }, [update])

  // 取消订单：从看板移除（记入 cancelled 台账可选，这里直接移除）
  const cancelOrder = useCallback((id) => {
    removeOrder(id)
  }, [removeOrder])

  // ---- 规则与设置 ----
  const setRules = useCallback((patch) => {
    update((s) => ({ ...s, rules: { ...s.rules, ...patch } }))
  }, [update])

  const setSettings = useCallback((patch) => {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [update])

  const resetDemo = useCallback(() => {
    const seed = makeSeed()
    setState({
      orders: seed.orders,
      ledger: seed.ledger,
      rules: { ...DEFAULT_RULES },
      settings: { ...DEFAULT_SETTINGS },
    })
  }, [])

  const clearAllData = useCallback(() => {
    setState({ orders: [], ledger: [], rules: { ...DEFAULT_RULES }, settings: { ...DEFAULT_SETTINGS } })
  }, [])

  const value = {
    ...state,
    addOrder, patchOrder, removeOrder, acceptOrder, completeOrder, cancelOrder,
    setRules, setSettings, resetDemo, clearAllData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
