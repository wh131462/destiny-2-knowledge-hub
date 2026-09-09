import { collectImageUrls, exportDimensions, SHEET_WIDTH } from '../../../packages/loadout-export/index.js'

export function allowedImageSource(value, origin) {
  try {
    const url = new URL(value, origin)
    return url.origin === origin || (url.origin === 'https://www.bungie.net' && url.pathname.startsWith('/common/destiny2_content/'))
  } catch { return false }
}
const abortError = () => new DOMException('导出已取消', 'AbortError')
const checkAbort = signal => { if (signal?.aborted) throw abortError() }
async function dataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768))
  return `data:${blob.type.split(';')[0]};base64,${btoa(binary)}`
}

export async function embedLoadoutImages(model, { signal, origin = location.origin, fetcher = fetch, onProgress = () => {} } = {}) {
  const urls = collectImageUrls(model), assets = new Map(), failed = []
  let cursor = 0, done = 0
  async function worker() {
    while (cursor < urls.length) {
      checkAbort(signal)
      const url = urls[cursor++]
      const controller = new AbortController(), abort = () => controller.abort()
      signal?.addEventListener('abort', abort, { once: true })
      const timer = setTimeout(abort, 12000)
      try {
        if (!allowedImageSource(url, origin)) throw new Error('不支持的图片来源')
        const response = await fetcher(url, { signal: controller.signal, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        if (!/^image\/(png|jpeg|webp|gif)$/.test(blob.type) || blob.size > 2_000_000 || !blob.size) throw new Error('图片格式或大小不符合要求')
        assets.set(url, await dataUrl(blob))
      } catch {
        checkAbort(signal)
        failed.push(url)
      } finally {
        clearTimeout(timer); signal?.removeEventListener('abort', abort)
        onProgress(++done, urls.length)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, worker))
  checkAbort(signal)
  return { assets, failed }
}

function deadline(promise, ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => finish(reject, abortError())
    const timer = setTimeout(() => finish(reject, new Error('长图生成超时，请重试或下载 HTML。')), ms)
    function finish(callback, value) { clearTimeout(timer); signal?.removeEventListener('abort', abort); callback(value) }
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
    promise.then(value => finish(resolve, value), error => finish(reject, error))
  })
}

export async function rasterizeLoadoutHtml(html, { signal } = {}) {
  checkAbort(signal)
  const frame = document.createElement('iframe')
  frame.title = '一图流独立排版画布'
  frame.setAttribute('aria-hidden', 'true')
  frame.setAttribute('sandbox', 'allow-same-origin')
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${SHEET_WIDTH}px;height:900px;border:0;pointer-events:none`
  try {
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }))
    frame.srcdoc = html
    document.body.appendChild(frame)
    await deadline(loaded, 20000, signal)
    const doc = frame.contentDocument
    if (!doc) throw new Error('无法创建独立 HTML 画布')
    await deadline(Promise.all([doc.fonts.ready, ...Array.from(doc.images, img => img.decode())]), 20000, signal)
    const node = doc.getElementById('loadout-export')
    const dimensions = exportDimensions(node.scrollHeight)
    checkAbort(signal)
    const { toBlob } = await import('html-to-image')
    const blob = await deadline(toBlob(node, { width: dimensions.width, height: dimensions.height, pixelRatio: dimensions.pixelRatio, skipFonts: true, backgroundColor: '#10151c', skipAutoScale: true }), 90000, signal)
    checkAbort(signal)
    if (!blob?.size) throw new Error('浏览器未能生成图片，请下载 HTML 或重试。')
    return { blob, ...dimensions }
  } finally { frame.remove() }
}
