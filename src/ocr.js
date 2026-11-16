// 本地截图识别：优先用 Tesseract.js 在浏览器内离线 OCR（首次需下载中文语言包），
// 失败时回退到"模拟识别"演示流程，保证演示版始终可玩。
// 注意：Tesseract 在浏览器端运行，图片不会上传到任何服务器。

const TESS_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

let tesseractPromise = null
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract)
  if (tesseractPromise) return tesseractPromise
  tesseractPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = TESS_CDN
    s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error('no Tesseract')))
    s.onerror = () => reject(new Error('CDN 加载失败'))
    document.head.appendChild(s)
    setTimeout(() => reject(new Error('加载超时')), 12000)
  })
  return tesseractPromise
}

// 从 OCR 文本里抽取字段
export function parseFields(text) {
  const clean = (text || '').replace(/\s+/g, ' ')
  const money = (text.match(/(?:¥|￥)?\s*(\d{1,4}(?:\.\d{1,2})?)\s*元?/) || [])[1]
  const km = (text.match(/(\d{1,3}(?:\.\d{1,2})?)\s*(?:公里|km|KM|千米)/) || [])[1]
  const phone = (text.match(/1[3-9]\d{9}/) || [])[0]
  const lines = clean.split(/[→\->～~\n]|至|到/).map((s) => s.trim()).filter(Boolean)
  const platformMap = [
    ['滴滴', 'didi'], ['T3', 't3'], ['高德', 'amap'], ['曹操', 'caocao'], ['哈啰', '哈罗', 'hello'],
  ]
  let platform = ''
  for (const [kw, key] of platformMap) {
    if (clean.includes(kw)) { platform = key; break }
  }
  return {
    platform,
    estimate: money ? Number(money) : '',
    distance: km ? Number(km) : '',
    origin: lines[0] || '',
    destination: lines[1] || '',
    passengerPhone: phone || '',
  }
}

// 真实 OCR（浏览器本地）。返回 { ok, fields, raw, engine }
export async function recognizeImage(file, onProgress) {
  try {
    const Tesseract = await loadTesseract()
    onProgress?.(5, '正在加载识别引擎…')
    const { data } = await Tesseract.recognize(file, 'chi_sim+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') onProgress?.(5 + Math.round(m.progress * 85), '正在识别截图文字…')
      },
    })
    onProgress?.(95, '正在整理字段…')
    const fields = parseFields(data.text || '')
    return { ok: true, fields, raw: data.text, engine: '本地 OCR' }
  } catch (e) {
    console.warn('OCR 失败，使用演示识别', e)
    return demoRecognize(onProgress)
  }
}

// 演示识别：无需网络，模拟字段抽取并制造"识别不准"的标黄效果
export function demoRecognize(onProgress) {
  return new Promise((resolve) => {
    let p = 0
    const timer = setInterval(() => {
      p += 18
      onProgress?.(Math.min(p, 90), '正在识别截图（演示模式）…')
      if (p >= 90) {
        clearInterval(timer)
        onProgress?.(100, '识别完成，请核对')
        resolve({
          ok: true,
          fields: {
            platform: 'amap',
            estimate: 42,
            distance: 14.6,
            origin: '南山科技园',
            destination: '福田中心区',
            passengerPhone: '136****5092',
          },
          raw: '（演示识别结果）高德打车 预估 42元 全程 14.6公里',
          engine: '演示识别',
        })
      }
    }, 160)
  })
}
