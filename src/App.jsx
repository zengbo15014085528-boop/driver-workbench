import React, { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard, ReceiptText, SlidersHorizontal, UserRound, Plus,
  Camera, Phone, Navigation, CheckCircle2, X, ChevronUp, ChevronDown,
  ShieldCheck, Gift, Copy, Settings2, Download, RotateCcw, Trash2,
  Flame, Clock3, TrendingUp, Moon, Sun, ArrowRight, AlertTriangle,
  Sparkles, Check, ChevronRight, Wallet, CarFront,
} from 'lucide-react'
import { useStore } from './store'
import { PLATFORMS, STATUS } from './constants'
import { uid } from './seed'
import {
  money, money2, oneDecimal, fmtTime, fmtDateTime, boardGroups,
  ledgerStats, groupLedger, exportLedgerCSV, navUrl,
} from './utils'
import { recognizeImage, demoRecognize } from './ocr'

/* ============ 通用小组件 ============ */
function PlatBadge({ platform, size = 30 }) {
  const p = PLATFORMS[platform] || { mark: '?', color: '#888' }
  return <div className="plat-badge" style={{ background: p.color, width: size, height: size }}>{p.mark}</div>
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="mask" onMouseDown={onClose}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="close-x" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ============ 订单卡片 ============ */
function OrderCard({ order, variant, onAccept, onComplete, onCancel, onDetail, onNav, onCall }) {
  const p = PLATFORMS[order.platform] || { name: '未知', color: '#888' }
  const isActive = order.status === STATUS.ACTIVE
  const isTop = variant === 'top'
  const hot = order.unitPrice >= 3
  return (
    <div className={`order-card ${isActive ? 'active' : ''} ${isTop ? 'top' : ''}`} onClick={() => onDetail?.(order)}>
      <div className="oc-head">
        <PlatBadge platform={order.platform} />
        <div>
          <div className="plat-name">{p.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtTime(order.createdAt)} 发布</div>
        </div>
        {isActive && <span className="status-pill status-active">● 行程中</span>}
        {isTop && !isActive && <span className="status-pill status-top">🔥 高价</span>}
        {!isActive && !isTop && <span className="chip" style={{ marginLeft: 'auto' }}>待接单</span>}
      </div>

      <div className="route">
        <div className="route-line"><span className="route-dot o" /><span className="route-txt">{order.origin}</span></div>
        <div className="route-line"><span className="route-dot d" /><span className="route-txt">{order.destination}</span></div>
      </div>

      <div className="oc-metrics">
        <div className="metric"><div className="k">里程</div><div className="v">{oneDecimal(order.distance)} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>km</span></div></div>
        <div className="metric"><div className="k">预估</div><div className="v">{money(order.estimate)}</div></div>
        <div className="metric"><div className="k">每公里</div><div className={`v ${hot ? 'hot' : 'price'}`}>{oneDecimal(order.unitPrice)} 元</div></div>
      </div>

      <div className="oc-actions" onClick={(e) => e.stopPropagation()}>
        {isActive ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onCall?.(order)}><Phone size={15} /> 乘客</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav?.(order)}><Navigation size={15} /> 导航</button>
            <button className="btn btn-green btn-sm" onClick={() => onComplete?.(order)}><CheckCircle2 size={15} /> 完成</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onCancel?.(order)}>忽略</button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onAccept?.(order)}><Check size={15} /> 已接单</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ============ 看板页 ============ */
function Board({ onAdd, onAccept, onComplete, onCancel, onDetail, onNav, onCall }) {
  const { orders, rules } = useStore()
  const groups = useMemo(() => boardGroups(orders, rules), [orders, rules])
  const total = groups.active.length + groups.top.length + groups.rest.length

  return (
    <div className="section">
      <div className="section-title">
        <h2>订单看板</h2>
        <span className="muted">共 {total} 单 · 自动排序</span>
      </div>

      {total === 0 && groups.hidden.length === 0 ? (
        <div className="card empty">
          <div className="big">🛵</div>
          <h3>看板空空</h3>
          <p>点右下角「+」传截图，订单自动进看板</p>
        </div>
      ) : null}

      {groups.active.length > 0 && (
        <>
          <div className="group-label"><span className="dot" /> 行程中 · {groups.active.length}</div>
          {groups.active.map((o) => <OrderCard key={o.id} order={o} variant="active" {...{ onAccept, onComplete, onCancel, onDetail, onNav, onCall }} />)}
        </>
      )}

      {groups.top.length > 0 && (
        <>
          <div className="group-label hot"><Flame size={14} color="#f04438" /> 单价最高 3 单 · 优先看</div>
          {groups.top.map((o) => <OrderCard key={o.id} order={o} variant="top" {...{ onAccept, onComplete, onCancel, onDetail, onNav, onCall }} />)}
        </>
      )}

      {groups.rest.length > 0 && (
        <>
          <div className="group-label"><Clock3 size={14} /> 其余订单 · 按你的规则排</div>
          {groups.rest.map((o) => <OrderCard key={o.id} order={o} variant="rest" {...{ onAccept, onComplete, onCancel, onDetail, onNav, onCall }} />)}
        </>
      )}

      {groups.hidden.length > 0 && (
        <div className="notice" style={{ marginTop: 8 }}>
          <span className="ni">🙈</span>
          <div>已按你的门槛隐藏 <b>{groups.hidden.length}</b> 个低价单。可在「规则」里调整门槛。</div>
        </div>
      )}
    </div>
  )
}

/* ============ 台账页 ============ */
function Ledger({ toast }) {
  const { ledger } = useStore()
  const stats = useMemo(() => ledgerStats(ledger), [ledger])
  const groups = useMemo(() => groupLedger(ledger), [ledger])
  const [period, setPeriod] = useState('month')

  const heroMap = {
    day: ['今日净收入', stats.todayNet, `流水 ${money(stats.todayGross)} · ${stats.todayCount} 单`],
    week: ['本周净收入', stats.weekNet, '周一至今累计'],
    month: ['本月净收入', stats.monthNet, '本月累计净收入'],
  }
  const hero = heroMap[period]

  const doExport = () => {
    const n = exportLedgerCSV(ledger)
    toast(n ? `已导出 ${n} 条流水（CSV）` : '暂无流水可导出')
  }

  return (
    <div className="section">
      <div className="section-title">
        <h2>流水台账</h2>
        <button className="btn btn-ghost btn-sm" onClick={doExport}><Download size={14} /> 导出</button>
      </div>

      <div className="period-switch" style={{ marginBottom: 12 }}>
        {[['day', '日'], ['week', '周'], ['month', '月']].map(([k, l]) => (
          <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{l}</button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-box hero">
          <div className="k">{hero[0]}</div>
          <div className="v">{money2(hero[1])}</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 3 }}>{hero[2]}</div>
        </div>
        <div className="stat-box">
          <div className="k">累计流水</div>
          <div className="v">{money(stats.totalGross)}</div>
        </div>
        <div className="stat-box">
          <div className="k">单均净收入</div>
          <div className="v green">{money2(stats.avgNet)}</div>
        </div>
        <div className="stat-box">
          <div className="k">累计净收入</div>
          <div className="v green">{money(stats.totalNet)}</div>
        </div>
        <div className="stat-box">
          <div className="k">完成单量</div>
          <div className="v">{stats.count} <span style={{ fontSize: 12, color: 'var(--text-3)' }}>单</span></div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 20 }}><h2 style={{ fontSize: 15 }}>按日期分组</h2><span className="muted">共 {stats.count} 单</span></div>
      {groups.length === 0 && <div className="card empty"><div className="big">📒</div><h3>还没有流水</h3><p>完成行程后自动记在这里</p></div>}
      {groups.map((g) => {
        const daySum = g.items.reduce((a, o) => a + (o.net || 0), 0)
        return (
          <div className="day-group" key={g.key}>
            <div className="day-head"><span>{g.label}</span><span className="amt">{money2(daySum)}</span></div>
            {g.items.map((o) => {
              const p = PLATFORMS[o.platform] || { name: '未知' }
              return (
                <div className="ledger-item" key={o.id}>
                  <PlatBadge platform={o.platform} size={34} />
                  <div className="li-main">
                    <div className="li-title">{o.origin} → {o.destination}</div>
                    <div className="li-sub">{p.name} · {oneDecimal(o.distance)}km · {fmtTime(o.finishedAt)}</div>
                  </div>
                  <div className="li-amt">
                    <div className="n">{money2(o.net)}</div>
                    <div className="t">净收入</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      <div className="mini-note">数据仅存本机 · 导出为 CSV，Excel 可直接打开</div>
    </div>
  )
}

/* ============ 规则页 ============ */
function Rules({ toast }) {
  const { rules, setRules, resetDemo, clearAllData } = useStore()

  const move = (idx, dir) => {
    const arr = [...rules.priority]
    const j = idx + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setRules({ priority: arr })
  }
  const toggle = (key) => setRules({ [key]: !rules[key] })

  return (
    <div className="section">
      <div className="section-title"><h2>自定义规则</h2><span className="muted">按你的习惯排序</span></div>

      <div className="card">
        <div className="rule-row">
          <div className="rule-icon"><Sun size={17} /></div>
          <div className="rule-info"><div className="t">作业模式</div><div className="d">切换白天 / 夜间接单策略</div></div>
        </div>
        <div className="seg">
          <button className={rules.mode === 'day' ? 'active' : ''} onClick={() => setRules({ mode: 'day' })}><Sun size={14} /> 白天模式</button>
          <button className={rules.mode === 'night' ? 'active' : ''} onClick={() => setRules({ mode: 'night' })}><Moon size={14} /> 夜间模式</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="rule-row">
          <div className="rule-icon"><TrendingUp size={17} /></div>
          <div className="rule-info"><div className="t">高价单优先</div><div className="d">单价 ≥ {rules.priceThreshold} 元/km 的排前面</div></div>
          <div className={`switch ${rules.priceFirst ? 'on' : ''}`} onClick={() => toggle('priceFirst')} />
        </div>
        <div className="rule-row">
          <div className="rule-icon"><Moon size={17} /></div>
          <div className="rule-info"><div className="t">夜间单提权</div><div className="d">22:00–06:00 的订单自动提前</div></div>
          <div className={`switch ${rules.nightBoost ? 'on' : ''}`} onClick={() => toggle('nightBoost')} />
        </div>
        <div className="rule-row">
          <div className="rule-icon"><span style={{ fontSize: 16 }}>💰</span></div>
          <div className="rule-info"><div className="t">低价单自动隐藏</div><div className="d">低于门槛的单不占看板</div></div>
          <div className={`switch ${rules.lowPriceHide ? 'on' : ''}`} onClick={() => toggle('lowPriceHide')} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>低价门槛</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>每公里单价低于此值自动隐藏</div>
        <div className="field-row">
          <div className="field" style={{ margin: 0 }}>
            <label>单价门槛（元/km）</label>
            <input type="number" step="0.1" value={rules.minPricePerKm} onChange={(e) => setRules({ minPricePerKm: Number(e.target.value) })} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>预估金额门槛（元）</label>
            <input type="number" step="1" value={rules.minEstimate} onChange={(e) => setRules({ minEstimate: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>平台优先级</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>越靠上越优先，拖动或用箭头调整</div>
        {rules.priority.map((key, idx) => {
          const p = PLATFORMS[key]
          return (
            <div className="pri-item" key={key} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              e.preventDefault()
              const from = Number(e.dataTransfer.getData('text/plain'))
              const arr = [...rules.priority]
              const [m] = arr.splice(from, 1)
              arr.splice(idx, 0, m)
              setRules({ priority: arr })
            }}>
              <span className="pri-handle">☰</span>
              <div className="pri-name"><PlatBadge platform={key} size={24} /> {p?.name} {idx === 0 && <span className="chip" style={{ color: 'var(--brand)' }}>最优先</span>}</div>
              <div className="pri-arrows">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}><ChevronUp size={13} /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === rules.priority.length - 1}><ChevronDown size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="rule-row">
          <div className="rule-icon"><RotateCcw size={17} /></div>
          <div className="rule-info"><div className="t">恢复演示数据</div><div className="d">重新载入示例订单与流水</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => { resetDemo(); toast('已恢复演示数据') }}>恢复</button>
        </div>
        <div className="rule-row">
          <div className="rule-icon" style={{ background: '#fdecec', color: 'var(--red)' }}><Trash2 size={17} /></div>
          <div className="rule-info"><div className="t">清空所有数据</div><div className="d">删除本机全部订单与流水</div></div>
          <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('确定清空本机所有数据？不可恢复')) { clearAllData(); toast('已清空') } }}>清空</button>
        </div>
      </div>
      <div className="mini-note">组合规则示意 · 全部在本地生效，不上传</div>
    </div>
  )
}

/* ============ 我的页 ============ */
function Profile({ onSafety, onWelfare, toast }) {
  const { settings, setSettings } = useStore()
  const theme = settings.theme || 'light'
  const setTheme = (t) => { setSettings({ theme: t }); document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light') }

  return (
    <div className="section">
      <div className="profile-hero">
        <div className="avatar"><UserRound size={30} /></div>
        <h3>司机师傅 · 您好</h3>
        {settings.member && <span className="vip-tag"><Sparkles size={12} /> 会员有效期至 {settings.memberUntil}</span>}
      </div>

      <div className="welfare-card">
        <h3><Gift size={17} style={{ verticalAlign: -3, marginRight: 5 }} /> 邀请司机，双方各得 7 天会员</h3>
        <p>已邀请 {settings.invitedCount} 位司机 · 每成功邀请 1 位，双方各+7天</p>
        <button className="btn btn-block" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={onWelfare}>立即邀请 <ArrowRight size={15} /></button>
      </div>

      <div className="card menu-card">
        <div className="menu-row" onClick={onSafety}>
          <div className="mi"><ShieldCheck size={18} color="var(--green)" /></div>
          <div className="mt">安全与隐私说明</div>
          <ChevronRight className="arrow" size={16} />
        </div>
        <div className="menu-row">
          <div className="mi"><Settings2 size={18} /></div>
          <div className="mt">界面主题</div>
          <div className="seg" style={{ padding: 0, width: 150 }}>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>浅色</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>深色</button>
          </div>
        </div>
        <div className="menu-row" onClick={() => { window.open('https://a07e7bcdd5311671c.app.workbuddy.host/?sharecode=POHYKL57Z3', '_blank') }}>
          <div className="mi"><CarFront size={18} /></div>
          <div className="mt">在线演示版</div>
          <div className="mv">手机可直接玩</div>
          <ChevronRight className="arrow" size={16} />
        </div>
        <div className="menu-row" onClick={onWelfare}>
          <div className="mi"><Gift size={18} /></div>
          <div className="mt">邀请福利</div>
          <div className="mv">已邀 {settings.invitedCount} 人</div>
          <ChevronRight className="arrow" size={16} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={16} color="var(--green)" /> 我们的底线</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
          不做抢单外挂。不自动接单、不用无障碍权限、不后台监听其它 APP、不上传任何数据。只做截图识别、人工录入、信息汇总、提醒与记账。
        </div>
      </div>
      <div className="mini-note">网约车司机记账 &amp; 订单辅助工具 · v1.0</div>
    </div>
  )
}

/* ============ 弹层：截图识别 / 手动新增 ============ */
function AddOrderSheet({ onClose, toast }) {
  const { addOrder } = useStore()
  const [tab, setTab] = useState('shot')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [warnKeys, setWarnKeys] = useState([])
  const [form, setForm] = useState({ platform: 'didi', origin: '', destination: '', distance: '', estimate: '', passengerPhone: '' })

  const applyFields = (f, warn) => {
    setForm((prev) => ({
      platform: f.platform || prev.platform,
      origin: f.origin || '', destination: f.destination || '',
      distance: f.distance !== '' && f.distance != null ? String(f.distance) : '',
      estimate: f.estimate !== '' && f.estimate != null ? String(f.estimate) : '',
      passengerPhone: (f.passengerPhone || '').replace(/\D/g, '').slice(0, 11),
    }))
    setWarnKeys(warn)
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setProgress(0); setStatusText('准备识别…'); setWarnKeys([])
    const res = await recognizeImage(file, (p, t) => { setProgress(p); setStatusText(t) })
    const f = res.fields
    const warn = []
    if (!f.origin) warn.push('origin')
    if (!f.destination) warn.push('destination')
    if (!f.distance) warn.push('distance')
    if (!f.estimate) warn.push('estimate')
    applyFields(f, warn)
    setLoading(false)
    toast(`识别完成（${res.engine}）${warn.length ? '，黄色字段请核对' : ''}`)
  }

  const useDemo = async () => {
    setLoading(true); setProgress(0); setStatusText('识别中…')
    const res = await demoRecognize((p, t) => { setProgress(p); setStatusText(t) })
    applyFields(res.fields, ['destination'])
    setLoading(false)
    toast('演示识别完成，请核对黄色字段')
  }

  const submit = () => {
    if (!form.origin || !form.destination || !form.estimate || !form.distance) {
      toast('请填完起点、终点、预估和里程'); return
    }
    const estimate = Number(form.estimate)
    const distance = Number(form.distance)
    if (!distance || distance <= 0) { toast('里程需大于 0'); return }
    addOrder({
      id: uid(), platform: form.platform, status: STATUS.PENDING,
      origin: form.origin, destination: form.destination,
      distance, estimate, unitPrice: +(estimate / distance).toFixed(2),
      passengerPhone: form.passengerPhone || '未填写', createdAt: Date.now(),
    })
    toast('订单已进看板，自动排好序了')
    onClose()
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const showForm = tab === 'manual' || (tab === 'shot' && !loading && (form.origin || warnKeys.length))

  return (
    <Sheet title="添加订单" onClose={onClose}>
      <div className="seg" style={{ padding: 0, marginBottom: 14 }}>
        <button className={tab === 'shot' ? 'active' : ''} onClick={() => setTab('shot')}><Camera size={14} /> 截图识别</button>
        <button className={tab === 'manual' ? 'active' : ''} onClick={() => setTab('manual')}><ReceiptText size={14} /> 手动录入</button>
      </div>

      {tab === 'shot' && !loading && (
        <>
          <label className="card" style={{ display: 'block', padding: 26, textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer' }}>
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
            <div style={{ fontSize: 34 }}>📷</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>上传订单截图</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>本地识别，图片不上传云端</div>
          </label>
          <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 10 }} onClick={useDemo}><Sparkles size={14} /> 用示例体验识别效果</button>
          <div className="notice" style={{ marginTop: 12 }}>
            <span className="ni">ℹ️</span>
            <div>首次使用需联网下载中文识别包（约 15MB），之后在浏览器本地运行。识别后请核对黄色字段。</div>
          </div>
        </>
      )}

      {loading && (
        <div style={{ padding: '18px 4px' }}>
          <div style={{ textAlign: 'center', fontSize: 30 }}>🔍</div>
          <div style={{ textAlign: 'center', fontWeight: 700, marginTop: 8 }}>{statusText}</div>
          <div className="progress"><div style={{ width: progress + '%' }} /></div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>{progress}%</div>
        </div>
      )}

      {showForm && (
        <div style={{ marginTop: 14 }}>
          <div className="field">
            <label>平台</label>
            <select value={form.platform} onChange={(e) => set('platform', e.target.value)}>
              {Object.values(PLATFORMS).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>起点</label>
            <input className={warnKeys.includes('origin') ? 'warn' : ''} value={form.origin} onChange={(e) => set('origin', e.target.value)} placeholder="从哪里出发" />
            {warnKeys.includes('origin') && <div className="hint">识别不准，请核对</div>}
          </div>
          <div className="field">
            <label>终点</label>
            <input className={warnKeys.includes('destination') ? 'warn' : ''} value={form.destination} onChange={(e) => set('destination', e.target.value)} placeholder="到哪里" />
            {warnKeys.includes('destination') && <div className="hint">识别不准，请核对</div>}
          </div>
          <div className="field-row">
            <div className="field">
              <label>里程（km）</label>
              <input className={warnKeys.includes('distance') ? 'warn' : ''} type="number" step="0.1" value={form.distance} onChange={(e) => set('distance', e.target.value)} placeholder="0.0" />
            </div>
            <div className="field">
              <label>预估金额（元）</label>
              <input className={warnKeys.includes('estimate') ? 'warn' : ''} type="number" step="1" value={form.estimate} onChange={(e) => set('estimate', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="field">
            <label>乘客电话（选填，用于一键拨打）</label>
            <input value={form.passengerPhone} onChange={(e) => set('passengerPhone', e.target.value)} placeholder="接单后从平台获取" />
          </div>
          <button className="btn btn-primary btn-block" onClick={submit}>确认，加入看板</button>
        </div>
      )}
    </Sheet>
  )
}

/* ============ 弹层：接单安全提醒 ============ */
function AcceptSheet({ order, onClose, onConfirm }) {
  return (
    <Sheet title="接单前，请确认" onClose={onClose}>
      <div className="notice danger">
        <span className="ni"><AlertTriangle size={18} color="var(--red)" /></span>
        <div>
          <b>请手动去平台接单，并关闭其他平台</b>
          <div style={{ marginTop: 4 }}>避免撞单被罚款。本工具不会替你操作任何平台。</div>
        </div>
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlatBadge platform={order.platform} />
          <div><div style={{ fontWeight: 700 }}>{PLATFORMS[order.platform]?.name}</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>{order.origin} → {order.destination}</div></div>
        </div>
      </div>
      <div className="safety-list" style={{ marginBottom: 18 }}>
        <div className="safety-item"><div className="s-ic"><Check size={14} /></div><div className="s-tx"><b>1</b><div>先打开 {PLATFORMS[order.platform]?.name}，手动接单</div></div></div>
        <div className="safety-item"><div className="s-ic"><Check size={14} /></div><div className="s-tx"><b>2</b><div>关闭/暂停其他平台，避免撞单</div></div></div>
        <div className="safety-item"><div className="s-ic"><Check size={14} /></div><div className="s-tx"><b>3</b><div>回来点「确认已接单」，本单进入行程中</div></div></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={onConfirm}><CheckCircle2 size={17} /> 我已在平台接单，确认</button>
    </Sheet>
  )
}

/* ============ 弹层：完成行程 ============ */
function CompleteSheet({ order, onClose, onConfirm }) {
  const [actual, setActual] = useState(String(order.estimate))
  const [toll, setToll] = useState('0')
  const [park, setPark] = useState('0')
  const net = (Number(actual) || 0) - (Number(toll) || 0) - (Number(park) || 0)
  return (
    <Sheet title="完成行程 · 记一笔" onClose={onClose}>
      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{PLATFORMS[order.platform]?.name} · {order.origin} → {order.destination}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>预估 {money(order.estimate)} · {oneDecimal(order.distance)}km</div>
      </div>
      <div className="field-row">
        <div className="field"><label>实收金额（元）</label><input type="number" step="0.1" value={actual} onChange={(e) => setActual(e.target.value)} /></div>
        <div className="field"><label>高速费（元）</label><input type="number" step="0.1" value={toll} onChange={(e) => setToll(e.target.value)} /></div>
      </div>
      <div className="field"><label>停车费（元）</label><input type="number" step="0.1" value={park} onChange={(e) => setPark(e.target.value)} /></div>
      <div className="card" style={{ padding: 14, background: 'var(--green-soft)', borderColor: 'transparent', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>本单净收入</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>实收 − 高速费 − 停车费</div></div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>{money2(net)}</div>
      </div>
      <button className="btn btn-green btn-block" onClick={() => onConfirm({ actual, toll, park })}><CheckCircle2 size={17} /> 完成并存入台账</button>
    </Sheet>
  )
}

/* ============ 弹层：订单详情 ============ */
function DetailSheet({ order, onClose, onAccept, onComplete }) {
  const p = PLATFORMS[order.platform]
  return (
    <Sheet title="订单详情" onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <PlatBadge platform={order.platform} size={38} />
        <div><div style={{ fontWeight: 800, fontSize: 16 }}>{p?.name}</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(order.createdAt)}</div></div>
      </div>
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div className="route">
          <div className="route-line"><span className="route-dot o" /><span className="route-txt">{order.origin}</span></div>
          <div className="route-line"><span className="route-dot d" /><span className="route-txt">{order.destination}</span></div>
        </div>
        <div className="oc-metrics">
          <div className="metric"><div className="k">里程</div><div className="v">{oneDecimal(order.distance)} km</div></div>
          <div className="metric"><div className="k">预估</div><div className="v">{money(order.estimate)}</div></div>
          <div className="metric"><div className="k">每公里</div><div className="v price">{oneDecimal(order.unitPrice)} 元</div></div>
        </div>
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div className="menu-row" style={{ padding: '8px 0', borderBottom: 'none' }}><div className="mt">乘客电话</div><div className="mv">{order.passengerPhone || '未填写'}</div></div>
        <div className="menu-row" style={{ padding: '8px 0', borderBottom: 'none' }}><div className="mt">订单编号</div><div className="mv">{order.id}</div></div>
      </div>
      {order.status === STATUS.PENDING && <button className="btn btn-primary btn-block" onClick={() => { onClose(); onAccept(order) }}><Check size={16} /> 已接单</button>}
      {order.status === STATUS.ACTIVE && <button className="btn btn-green btn-block" onClick={() => { onClose(); onComplete(order) }}><CheckCircle2 size={16} /> 完成行程</button>}
    </Sheet>
  )
}

/* ============ 弹层：安全说明 ============ */
function SafetySheet({ onClose }) {
  const items = [
    ['🚫', '不自动操作平台', '不自动接单、不自动暂停出车'],
    ['🚫', '不用无障碍权限', '不申请 Accessibility，不模拟点击'],
    ['🚫', '不后台监听 APP', '不读取其他应用通知或界面'],
    ['✅', '只做辅助与记账', '截图识别、人工录入、信息汇总、提醒、记账'],
    ['🔒', '数据只存本机', '订单与流水保存在你自己手机，不上云'],
  ]
  return (
    <Sheet title="安全与隐私说明" onClose={onClose}>
      <div className="notice" style={{ background: 'var(--green-soft)', borderColor: 'transparent' }}>
        <span className="ni"><ShieldCheck size={18} color="var(--green)" /></span>
        <div>这个工具和抢单外挂有<b>本质区别</b>，请放心使用。</div>
      </div>
      <div className="safety-list" style={{ marginTop: 8 }}>
        {items.map(([ic, t, d]) => (
          <div className="safety-item" key={t}>
            <div className="s-ic" style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>{ic}</div>
            <div className="s-tx"><b>{t}</b><div>{d}</div></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 12, marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
          对外统一口径：<b>网约车司机记账 &amp; 订单辅助工具</b>。截图识别在浏览器本地完成，图片不会上传到任何服务器。
        </div>
      </div>
    </Sheet>
  )
}

/* ============ 弹层：邀请福利 ============ */
function WelfareSheet({ onClose, toast }) {
  const { settings, setSettings } = useStore()
  const code = 'ZENGXJ7'
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast('邀请码已复制') }
    catch { toast('邀请码：' + code) }
  }
  const simulate = () => {
    setSettings({ invitedCount: settings.invitedCount + 1 })
    toast('邀请成功！双方各+7天会员 🎉')
  }
  return (
    <Sheet title="邀请福利" onClose={onClose}>
      <div className="welfare-card">
        <h3><Gift size={18} style={{ verticalAlign: -3 }} /> 邀请 1 位司机，双方各得 7 天会员</h3>
        <p>已成功邀请 {settings.invitedCount} 位 · 累计已获 {settings.invitedCount * 7} 天会员</p>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label>你的专属邀请码</label>
        <div className="invite-code" style={{ background: 'transparent' }}>
          <input readOnly value={code} />
          <button onClick={copy}><Copy size={15} /></button>
        </div>
      </div>
      <div className="notice"><span className="ni">📢</span><div>把邀请码发给同行司机，对方注册时填入，你们双方立刻各得 7 天会员。</div></div>
      <button className="btn btn-primary btn-block" onClick={simulate}><Sparkles size={16} /> 演示：模拟一位司机注册</button>
      <p className="mini-note">演示按钮仅用于体验流程，不改变真实会员状态</p>
    </Sheet>
  )
}

/* ============ 主应用 ============ */
const TABS = [
  { key: 'board', label: '看板', icon: LayoutDashboard },
  { key: 'ledger', label: '台账', icon: ReceiptText },
  { key: 'rules', label: '规则', icon: SlidersHorizontal },
  { key: 'profile', label: '我的', icon: UserRound },
]

export default function App() {
  const store = useStore()
  const { settings, orders, acceptOrder, completeOrder, cancelOrder } = store
  const [tab, setTab] = useState('board')
  const [toastMsg, setToastMsg] = useState('')
  const [modal, setModal] = useState(null) // {type, order}

  const toast = (msg) => {
    setToastMsg(msg)
    clearTimeout(window.__toastTimer)
    window.__toastTimer = setTimeout(() => setToastMsg(''), 2600)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme === 'dark' ? 'dark' : 'light')
  }, [settings.theme])

  const pendingCount = orders.filter((o) => o.status === STATUS.PENDING || o.status === STATUS.ACTIVE).length
  const stats = useMemo(() => ledgerStats(store.ledger), [store.ledger])

  const openModal = (type, order) => setModal({ type, order })
  const closeModal = () => setModal(null)

  const doCall = (order) => {
    const phone = (order.passengerPhone || '').replace(/[^\d*]/g, '')
    if (!phone || phone === '未填写') { toast('暂无乘客电话'); return }
    window.location.href = `tel:${phone}`
  }
  const doNav = (order) => {
    window.open(navUrl(settings.navApp || 'amap', order.destination, order.origin), '_blank')
  }

  const confirmAccept = (order) => {
    acceptOrder(order.id)
    closeModal()
    toast('已接单，进入行程中 · 记得已关掉其他平台')
  }
  const confirmComplete = (orderId, payload) => {
    completeOrder(orderId, payload)
    closeModal()
    toast('行程完成，净收入已存入台账')
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-row">
          <div className="brand">
            <div className="brand-logo">🚕</div>
            <div>
              <div className="brand-title">司机聚合工作台</div>
              <div className="brand-sub">记账 &amp; 订单辅助 · 数据只存本机</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => openModal('safety')} title="安全说明"><ShieldCheck size={18} /></button>
          </div>
        </div>
        <div className="today-strip">
          <div className="today-card"><div className="k">今日净收入</div><div className="v">{money(stats.todayNet)}</div></div>
          <div className="today-card"><div className="k">待处理订单</div><div className="v">{pendingCount} <small>单</small></div></div>
          <div className="today-card"><div className="k">本月净收入</div><div className="v">{money(stats.monthNet)}</div></div>
        </div>
      </div>

      {tab === 'board' && <Board onAdd={() => openModal('add')} onAccept={(o) => openModal('accept', o)} onComplete={(o) => openModal('complete', o)} onCancel={(o) => { cancelOrder(o.id); toast('已忽略该订单') }} onDetail={(o) => openModal('detail', o)} onNav={doNav} onCall={doCall} />}
      {tab === 'ledger' && <Ledger toast={toast} />}
      {tab === 'rules' && <Rules toast={toast} />}
      {tab === 'profile' && <Profile onSafety={() => openModal('safety')} onWelfare={() => openModal('welfare')} toast={toast} />}

      {tab === 'board' && <button className="fab" onClick={() => openModal('add')}><Plus size={26} /></button>}

      <nav className="tabbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <span className="ic"><Icon size={21} />{key === 'board' && pendingCount > 0 && <span className="badge">{pendingCount}</span>}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {modal?.type === 'add' && <AddOrderSheet onClose={closeModal} toast={toast} />}
      {modal?.type === 'accept' && <AcceptSheet order={modal.order} onClose={closeModal} onConfirm={() => confirmAccept(modal.order)} />}
      {modal?.type === 'complete' && <CompleteSheet order={modal.order} onClose={closeModal} onConfirm={(p) => confirmComplete(modal.order.id, p)} />}
      {modal?.type === 'detail' && <DetailSheet order={modal.order} onClose={closeModal} onAccept={(o) => openModal('accept', o)} onComplete={(o) => openModal('complete', o)} />}
      {modal?.type === 'safety' && <SafetySheet onClose={closeModal} />}
      {modal?.type === 'welfare' && <WelfareSheet onClose={closeModal} toast={toast} />}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
