import * as pdfjsLib from '../node_modules/pdfjs-dist/build/pdf.min.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

// ── Tractate data ─────────────────────────────────────────────────────────────
const TRACTATES = [
  { id:1,  name:'Berachos',     seder:'Zeraim',  maxDaf:64,  lastAmud:'a', folder:'01_Berachos'     },
  { id:2,  name:'Shabbos',      seder:'Moed',    maxDaf:157, lastAmud:'b', folder:'02_Shabbos'      },
  { id:3,  name:'Eruvin',       seder:'Moed',    maxDaf:105, lastAmud:'a', folder:'03_Eruvin'       },
  { id:4,  name:'Pesachim',     seder:'Moed',    maxDaf:121, lastAmud:'b', folder:'04_Pesachim'     },
  { id:5,  name:'Shekalim',     seder:'Moed',    maxDaf:22,  lastAmud:'b', folder:'05_Shekalim'     },
  { id:6,  name:'Yoma',         seder:'Moed',    maxDaf:88,  lastAmud:'a', folder:'06_Yoma'         },
  { id:7,  name:'Sukkah',       seder:'Moed',    maxDaf:56,  lastAmud:'b', folder:'07_Sukkah'       },
  { id:8,  name:'Beitzah',      seder:'Moed',    maxDaf:40,  lastAmud:'b', folder:'08_Beitzah'      },
  { id:9,  name:'Rosh Hashana', seder:'Moed',    maxDaf:35,  lastAmud:'a', folder:'09_Rosh_Hashana' },
  { id:10, name:'Taanis',       seder:'Moed',    maxDaf:31,  lastAmud:'a', folder:'10_Taanis'       },
  { id:11, name:'Megillah',     seder:'Moed',    maxDaf:32,  lastAmud:'a', folder:'11_Megillah'     },
  { id:12, name:'Moed Katan',   seder:'Moed',    maxDaf:29,  lastAmud:'a', folder:'12_Moed_Katan'   },
  { id:13, name:'Chagigah',     seder:'Moed',    maxDaf:27,  lastAmud:'a', folder:'13_Chagigah'     },
  { id:14, name:'Yevamos',      seder:'Nashim',  maxDaf:122, lastAmud:'b', folder:'14_Yevamos'      },
  { id:15, name:'Kesubos',      seder:'Nashim',  maxDaf:112, lastAmud:'b', folder:'15_Kesubos'      },
  { id:16, name:'Nedarim',      seder:'Nashim',  maxDaf:91,  lastAmud:'b', folder:'16_Nedarim'      },
  { id:17, name:'Nazir',        seder:'Nashim',  maxDaf:66,  lastAmud:'b', folder:'17_Nazir'        },
  { id:18, name:'Sotah',        seder:'Nashim',  maxDaf:49,  lastAmud:'b', folder:'18_Sotah'        },
  { id:19, name:'Gittin',       seder:'Nashim',  maxDaf:90,  lastAmud:'b', folder:'19_Gittin'       },
  { id:20, name:'Kiddushin',    seder:'Nashim',  maxDaf:82,  lastAmud:'b', folder:'20_Kiddushin'    },
  { id:21, name:'Bava Kamma',   seder:'Nezikin', maxDaf:119, lastAmud:'b', folder:'21_Bava_Kamma'   },
  { id:22, name:'Bava Metzia',  seder:'Nezikin', maxDaf:119, lastAmud:'a', folder:'22_Bava_Metzia'  },
  { id:23, name:'Bava Basra',   seder:'Nezikin', maxDaf:176, lastAmud:'b', folder:'23_Bava_Basra'   },
  { id:24, name:'Sanhedrin',    seder:'Nezikin', maxDaf:113, lastAmud:'b', folder:'24_Sanhedrin'    },
  { id:25, name:'Makkos',       seder:'Nezikin', maxDaf:24,  lastAmud:'b', folder:'25_Makkos'       },
  { id:26, name:'Shevuos',      seder:'Nezikin', maxDaf:49,  lastAmud:'b', folder:'26_Shevuos'      },
  { id:27, name:'Avodah Zarah', seder:'Nezikin', maxDaf:76,  lastAmud:'b', folder:'27_Avodah_Zarah' },
  { id:28, name:'Horayos',      seder:'Nezikin', maxDaf:14,  lastAmud:'a', folder:'28_Horayos'      },
  { id:29, name:'Zevachim',     seder:'Kodshim', maxDaf:120, lastAmud:'b', folder:'29_Zevachim'     },
  { id:30, name:'Menachos',     seder:'Kodshim', maxDaf:110, lastAmud:'a', folder:'30_Menachos'     },
  { id:31, name:'Chullin',      seder:'Kodshim', maxDaf:142, lastAmud:'a', folder:'31_Chullin'      },
  { id:32, name:'Bechoros',     seder:'Kodshim', maxDaf:61,  lastAmud:'a', folder:'32_Bechoros'     },
  { id:33, name:'Arachin',      seder:'Kodshim', maxDaf:34,  lastAmud:'a', folder:'33_Arachin'      },
  { id:34, name:'Temurah',      seder:'Kodshim', maxDaf:34,  lastAmud:'a', folder:'34_Temurah'      },
  { id:35, name:'Kereisos',     seder:'Kodshim', maxDaf:28,  lastAmud:'b', folder:'35_Kereisos'     },
  { id:36, name:'Meilah',       seder:'Kodshim', maxDaf:22,  lastAmud:'a', folder:'36_Meilah'       },
  { id:37, name:'Tamid',        seder:'Kodshim', maxDaf:33,  lastAmud:'b', folder:'37_Tamid'        },
  { id:38, name:'Niddah',       seder:'Taharos', maxDaf:73,  lastAmud:'a', folder:'38_Niddah'       },
]

const TOTAL_AMUDIM = TRACTATES.reduce((s, t) => {
  const amudim = (t.maxDaf - 1) * 2 - (t.lastAmud === 'a' ? 1 : 0)
  return s + amudim
}, 0)

const DAF_YOMI_START = new Date('2020-01-05')
const DAF_YOMI_ORDER = [
  {name:'Berachos',     count:63},  {name:'Shabbos',      count:156},
  {name:'Eruvin',       count:104}, {name:'Pesachim',     count:120},
  {name:'Shekalim',     count:21},  {name:'Yoma',         count:87},
  {name:'Sukkah',       count:55},  {name:'Beitzah',      count:39},
  {name:'Rosh Hashana', count:34},  {name:'Taanis',       count:30},
  {name:'Megillah',     count:31},  {name:'Moed Katan',   count:28},
  {name:'Chagigah',     count:26},  {name:'Yevamos',      count:121},
  {name:'Kesubos',      count:111}, {name:'Nedarim',      count:90},
  {name:'Nazir',        count:65},  {name:'Sotah',        count:48},
  {name:'Gittin',       count:89},  {name:'Kiddushin',    count:81},
  {name:'Bava Kamma',   count:118}, {name:'Bava Metzia',  count:118},
  {name:'Bava Basra',   count:175}, {name:'Sanhedrin',    count:112},
  {name:'Makkos',       count:23},  {name:'Shevuos',      count:48},
  {name:'Avodah Zarah', count:75},  {name:'Horayos',      count:13},
  {name:'Zevachim',     count:119}, {name:'Menachos',     count:109},
  {name:'Chullin',      count:141}, {name:'Bechoros',     count:60},
  {name:'Arachin',      count:33},  {name:'Temurah',      count:33},
  {name:'Kereisos',     count:27},  {name:'Meilah',       count:21},
  {name:'Kinnim',       count:3},   {name:'Tamid',        count:9},
  {name:'Middos',       count:4},   {name:'Niddah',       count:72},
]

// ── Sefaria tractate name mapping ─────────────────────────────────────────────
const SEFARIA_NAMES = {
  'Berachos':'Berakhot',    'Shabbos':'Shabbat',       'Eruvin':'Eruvin',
  'Pesachim':'Pesachim',    'Shekalim':'Shekalim',     'Yoma':'Yoma',
  'Sukkah':'Sukkah',        'Beitzah':'Beitzah',       'Rosh Hashana':'Rosh_Hashanah',
  'Taanis':'Taanit',        'Megillah':'Megillah',     'Moed Katan':'Moed_Katan',
  'Chagigah':'Chagigah',    'Yevamos':'Yevamot',       'Kesubos':'Ketubot',
  'Nedarim':'Nedarim',      'Nazir':'Nazir',            'Sotah':'Sotah',
  'Gittin':'Gittin',        'Kiddushin':'Kiddushin',   'Bava Kamma':'Bava_Kamma',
  'Bava Metzia':'Bava_Metzia','Bava Basra':'Bava_Batra','Sanhedrin':'Sanhedrin',
  'Makkos':'Makkot',        'Shevuos':'Shevuot',       'Avodah Zarah':'Avodah_Zarah',
  'Horayos':'Horayot',      'Zevachim':'Zevachim',     'Menachos':'Menachot',
  'Chullin':'Chullin',      'Bechoros':'Bekhorot',     'Arachin':'Arakhin',
  'Temurah':'Temurah',      'Kereisos':'Keritot',      'Meilah':'Meilah',
  'Tamid':'Tamid',          'Niddah':'Niddah',
}

// ── State ─────────────────────────────────────────────────────────────────────
let appData = null
let talmudPath = ''
let currentTractate = TRACTATES[0]
let currentDaf = 2
let currentAmud = 'a'
let currentZoom = 1.0
let preloadCache = {}
let highlightMode = false
let eraseMode = false
let selectMode = false
let commentaryMode = false
const _commentariesCache = new Map()  // pageKey → [{commentator, refs:[{ref, anchorRef, he, en}]}] | null
let activeHlColor = 'rgba(255,220,0,0.35)'
let notesTimer = null
let _zoomDebounce = null
let _scrollRAF = null
let _appendingPage = false
let _prependingPage = false
let _suppressPrepend = false
let apiKey = ''
let translateMode = false
let translateCache = new Map()  // key → [{en, he}]

// ── OCR / Search-word highlighting ────────────────────────────────────────────
const searchWordHls = new Map()  // page key → [[x,y,w,h], …] normalized
let   pendingSearchHL = null      // {key, hlText, segHe} set on search-result click
const _searchResultSegs = []      // parallel array to search results — stores segHe for context fallback

const _ocrPageCache = new Map()  // pageKey → words array (avoids redundant IPC per zoom)
async function fetchOcrWords(t, daf, amud) {
  const key = makePageKey(t, daf, amud)
  if (_ocrPageCache.has(key)) return _ocrPageCache.get(key)
  const words = await window.talmud.getOcrWords(t.name, daf, amud)
  _ocrPageCache.set(key, words)
  return words
}

// Lazy memo of nikud-stripped Hebrew per translation segment.
// Search re-runs on every keystroke; without this, every search re-strips
// every Hebrew segment for every cached amud (5000+ amudim × N segments).
const _strippedSegCache = new Map()  // pageKey → (string|null)[]
function strippedSegmentsFor(key, segments) {
  let cached = _strippedSegCache.get(key)
  if (cached && cached.length === segments.length) return cached
  cached = segments.map(s => s.he ? stripNikud(s.he) : null)
  _strippedSegCache.set(key, cached)
  return cached
}

const pageMap = new Map()   // key → info object
const pageOrder = []         // keys in display order (top → bottom)

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id)
const selTractate    = $('sel-tractate')
const selDaf         = $('sel-daf')
const btnPrev        = $('btn-prev')
const btnNext        = $('btn-next')
const btnBookmark    = $('btn-bookmark')
const btnLearned     = $('btn-learned')
const btnToday       = $('btn-today')
const btnSidebar     = $('btn-sidebar')
const btnNotes       = $('btn-notes')
const btnTheme       = $('btn-theme')
const btnZoomIn      = $('btn-zoom-in')
const btnZoomOut     = $('btn-zoom-out')
const zoomLevel      = $('zoom-level')
const dafTitle       = $('daf-title')
const dafPosition    = $('daf-position')
const sidebar        = $('sidebar')
const notesPanel     = $('notes-panel')
const notesArea      = $('notes-area')
const notesCharcount = $('notes-charcount')
const notesTimestamp = $('notes-timestamp')
const notesSaved     = $('notes-saved-indicator')
const pagesContainer = $('pages-container')
const viewerScroll   = $('viewer-scroll')
const hlToolbar      = $('highlight-toolbar')
const btnHlMode      = $('btn-highlight-mode')
const btnSelectMode  = $('btn-select-mode')
const btnCommentary       = $('btn-commentary')
const commentariesPanel   = $('commentaries-panel')
const commentariesContent = $('commentaries-content')
const cmtCount            = $('cmt-count')
const btnHlDone      = $('btn-hl-done')
const btnHlErase     = $('btn-hl-erase')
const streakCount    = $('streak-count')
const sbDafYomi      = $('sb-daf-yomi')
const bookmarkList    = $('bookmark-list')
const progressList    = $('progress-list')
const overallLabel    = $('overall-progress-label')
const translatePanel  = $('translate-panel')
const translateContent= $('translate-content')
const btnTranslate    = $('btn-translate')
const selectPanel     = $('select-panel')
const selectContent   = $('select-content')

// ── Toast notifications ───────────────────────────────────────────────────────
const toastContainer = document.createElement('div')
toastContainer.id = 'toast-container'
document.body.appendChild(toastContainer)

function toast(msg, type = '') {
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  toastContainer.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, 2500)
}

// ── Key helpers ───────────────────────────────────────────────────────────────
function makePageKey(t, daf, amud) {
  return `${t.name}_${String(daf).padStart(3,'0')}${amud}`
}

function amudKey() { return makePageKey(currentTractate, currentDaf, currentAmud) }

function pdfPath(t, daf, amud) {
  return `${talmudPath}\\${t.folder}\\${t.name} ${String(daf).padStart(3,'0')}${amud}.pdf`
}

function nextAmud(t, daf, amud) {
  if (amud === 'a') {
    if (daf === t.maxDaf && t.lastAmud === 'a') {
      const idx = TRACTATES.indexOf(t)
      return idx < TRACTATES.length - 1 ? { t: TRACTATES[idx+1], daf: 2, amud: 'a' } : null
    }
    return { t, daf, amud: 'b' }
  } else {
    if (daf < t.maxDaf) return { t, daf: daf+1, amud: 'a' }
    const idx = TRACTATES.indexOf(t)
    return idx < TRACTATES.length - 1 ? { t: TRACTATES[idx+1], daf: 2, amud: 'a' } : null
  }
}

function prevAmud(t, daf, amud) {
  if (amud === 'b') return { t, daf, amud: 'a' }
  if (daf > 2) {
    const pd = daf - 1
    return { t, daf: pd, amud: (pd === t.maxDaf && t.lastAmud === 'a') ? 'a' : 'b' }
  }
  const idx = TRACTATES.indexOf(t)
  if (idx > 0) {
    const prev = TRACTATES[idx-1]
    return { t: prev, daf: prev.maxDaf, amud: prev.lastAmud }
  }
  return null
}

// ── Daf Yomi calculation ──────────────────────────────────────────────────────
function getTodaysDafYomi() {
  const today = new Date()
  today.setHours(0,0,0,0)
  const start = new Date(DAF_YOMI_START)
  start.setHours(0,0,0,0)
  let dayNum = Math.floor((today - start) / 86400000) % 2712
  if (dayNum < 0) dayNum += 2712

  let offset = 0
  for (const entry of DAF_YOMI_ORDER) {
    if (dayNum < offset + entry.count) {
      const dafInTractate = dayNum - offset + 2
      const t = TRACTATES.find(t => t.name === entry.name)
      if (t && dafInTractate >= 2 && dafInTractate <= t.maxDaf)
        return { tractate: t.name, daf: dafInTractate, amud: 'a' }
      break
    }
    offset += entry.count
  }
  return null
}

// ── Page factory ──────────────────────────────────────────────────────────────
function createPageEl(t, daf, amud) {
  const key = makePageKey(t, daf, amud)
  if (pageMap.has(key)) return pageMap.get(key)

  const wrap = document.createElement('div')
  wrap.className = 'page-wrap'
  wrap.dataset.key = key

  const inner = document.createElement('div')
  inner.className = 'page-inner'

  const loadDiv = document.createElement('div')
  loadDiv.className = 'page-loading'
  loadDiv.innerHTML = `<div class="spinner"></div>Loading…`

  const canvas = document.createElement('canvas')
  canvas.className = 'pdf-canvas'
  canvas.style.display = 'none'

  const hlCnv = document.createElement('canvas')
  hlCnv.className = 'hl-canvas'
  if (highlightMode && !eraseMode) hlCnv.classList.add('drawing-mode')
  if (highlightMode && eraseMode)  hlCnv.classList.add('erase-mode')

  inner.appendChild(loadDiv)
  inner.appendChild(canvas)
  inner.appendChild(hlCnv)

  const label = document.createElement('div')
  label.className = 'page-label'
  label.textContent = `${t.name} ${daf}${amud}`

  wrap.appendChild(inner)
  wrap.appendChild(label)

  const info = { key, t, daf, amud, wrap, inner, canvas, hlCnv, loadDiv, pdfDoc: null }
  pageMap.set(key, info)
  setupHlEvents(info)
  return info
}

function setupHlEvents(info) {
  const { hlCnv } = info
  let drawing = false
  let start = null

  hlCnv.addEventListener('mousedown', e => {
    if (!highlightMode) return
    const rect = hlCnv.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * (hlCnv.width / rect.width)
    const cy = (e.clientY - rect.top)  * (hlCnv.height / rect.height)
    if (eraseMode) { eraseHighlightAt(info, cx, cy); return }
    drawing = true
    start = { x: cx, y: cy }
  })

  hlCnv.addEventListener('mousemove', e => {
    if (!drawing || !start) return
    const rect = hlCnv.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * (hlCnv.width / rect.width)
    const cy = (e.clientY - rect.top)  * (hlCnv.height / rect.height)
    redrawPageHighlights(info)
    const ctx = hlCnv.getContext('2d')
    ctx.fillStyle = activeHlColor
    ctx.fillRect(start.x, start.y, cx - start.x, cy - start.y)
  })

  hlCnv.addEventListener('mouseup', e => {
    if (!drawing || !start) return
    drawing = false
    const rect = hlCnv.getBoundingClientRect()
    const cx = (e.clientX - rect.left) * (hlCnv.width / rect.width)
    const cy = (e.clientY - rect.top)  * (hlCnv.height / rect.height)
    const w = cx - start.x, h = cy - start.y
    if (Math.abs(w) > 5 && Math.abs(h) > 5) saveHighlight(info, start.x, start.y, w, h)
    else redrawPageHighlights(info)
    start = null
  })
}

// ── PDF loading ───────────────────────────────────────────────────────────────
async function loadPagePdf(info) {
  let pdfDoc
  if (preloadCache[info.key]) {
    pdfDoc = preloadCache[info.key]
  } else {
    const result = await window.talmud.readPDF(pdfPath(info.t, info.daf, info.amud))
    if (!result.exists || result.size < 1000) {
      info.loadDiv.style.display = 'none'
      const nf = document.createElement('div')
      nf.className = 'page-not-found'
      nf.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg><span>PDF not found</span>`
      info.inner.appendChild(nf)
      return
    }
    const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0))
    pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
    preloadCache[info.key] = pdfDoc
  }
  info.pdfDoc = pdfDoc
  await renderPdfPage(info)
  redrawPageHighlights(info)
  if (pendingSearchHL && pendingSearchHL.key === info.key) {
    const hl = pendingSearchHL
    pendingSearchHL = null
    await applySearchHL(info, hl.hlText, hl.segHe || '', hl.occurrenceIdx || 0)
  }
}

async function renderPdfPage(info) {
  if (!info.pdfDoc) return
  const { canvas, hlCnv, inner, loadDiv } = info
  const dpr = window.devicePixelRatio || 1
  const page = await info.pdfDoc.getPage(1)
  const viewport = page.getViewport({ scale: currentZoom * 1.5 * dpr })
  const cssW = viewport.width / dpr
  const cssH = viewport.height / dpr

  const offscreen = document.createElement('canvas')
  offscreen.width = viewport.width
  offscreen.height = viewport.height
  await page.render({ canvasContext: offscreen.getContext('2d'), viewport }).promise

  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width  = cssW + 'px'
  canvas.style.height = cssH + 'px'
  canvas.getContext('2d').drawImage(offscreen, 0, 0)

  hlCnv.width  = viewport.width
  hlCnv.height = viewport.height
  inner.style.width  = cssW + 'px'
  inner.style.height = cssH + 'px'

  loadDiv.style.display = 'none'
  canvas.style.display  = 'block'
}

// ── Scroll view management ────────────────────────────────────────────────────
async function initScrollView(t, daf, amud) {
  _suppressPrepend = true
  pagesContainer.innerHTML = ''
  pageMap.clear()
  pageOrder.length = 0
  _appendingPage = false
  _prependingPage = false

  const info = createPageEl(t, daf, amud)
  pagesContainer.appendChild(info.wrap)
  pageOrder.push(info.key)
  viewerScroll.scrollTop = 0
  await loadPagePdf(info)
  _suppressPrepend = false
}

async function appendNextPage() {
  if (_appendingPage || !pageOrder.length) return
  const lastInfo = pageMap.get(pageOrder[pageOrder.length - 1])
  if (!lastInfo) return
  const nxt = nextAmud(lastInfo.t, lastInfo.daf, lastInfo.amud)
  if (!nxt) return
  const nxtKey = makePageKey(nxt.t, nxt.daf, nxt.amud)
  if (pageMap.has(nxtKey)) return

  _appendingPage = true
  try {
    const info = createPageEl(nxt.t, nxt.daf, nxt.amud)
    pagesContainer.appendChild(info.wrap)
    pageOrder.push(info.key)
    await loadPagePdf(info)
  } finally {
    _appendingPage = false
  }
}

async function prependPrevPage() {
  if (_prependingPage || !pageOrder.length) return
  const firstInfo = pageMap.get(pageOrder[0])
  if (!firstInfo) return
  const prv = prevAmud(firstInfo.t, firstInfo.daf, firstInfo.amud)
  if (!prv) return
  const prvKey = makePageKey(prv.t, prv.daf, prv.amud)
  if (pageMap.has(prvKey)) return

  _prependingPage = true
  try {
    const info = createPageEl(prv.t, prv.daf, prv.amud)
    pagesContainer.insertBefore(info.wrap, pagesContainer.firstChild)
    pageOrder.unshift(info.key)
    await loadPagePdf(info)
  } finally {
    _prependingPage = false
  }
}

viewerScroll.addEventListener('scroll', () => {
  if (_scrollRAF) return
  _scrollRAF = requestAnimationFrame(() => { _scrollRAF = null; onViewerScroll() })
})

function onViewerScroll() {
  const scrollRect = viewerScroll.getBoundingClientRect()
  const mid = scrollRect.top + scrollRect.height / 2

  let closest = null
  let closestDist = Infinity
  for (const key of pageOrder) {
    const info = pageMap.get(key)
    if (!info) continue
    const r = info.wrap.getBoundingClientRect()
    const dist = Math.abs(r.top + r.height / 2 - mid)
    if (dist < closestDist) { closestDist = dist; closest = info }
  }

  if (closest && closest.key !== amudKey()) {
    setCurrentPage(closest.t, closest.daf, closest.amud)
  }

  const st = viewerScroll.scrollTop
  const distToBottom = viewerScroll.scrollHeight - st - viewerScroll.clientHeight
  if (distToBottom < 1200 && !_appendingPage) appendNextPage()
  if (st < 1200 && !_prependingPage && !_suppressPrepend) prependPrevPage()
}

function setCurrentPage(t, daf, amud) {
  flushPendingNotes()
  const tractateChanged = t !== currentTractate
  currentTractate = t
  currentDaf = daf
  currentAmud = amud

  if (tractateChanged) { selTractate.value = t.name; updateDafDropdown() }
  selDaf.value = `${daf}${amud}`

  const totalAmud = (daf - 2) * 2 + (amud === 'a' ? 1 : 2)
  const tractTotal = (t.maxDaf - 1) * 2
  dafTitle.textContent    = `${t.name} ${daf}${amud}`
  dafPosition.textContent = `${totalAmud} of ${tractTotal}`

  updateNavButtons()
  loadNotes()
  updateBookmarkButton()
  updateLearnedButton()
  updateDafYomiHint()

  appData.lastViewed = { tractate: t.name, daf, amud }
  saveAppData()

  if (translateMode) loadTranslation()
  if (selectMode) renderSelectablePanel()
  if (commentaryMode) loadCommentariesForCurrentPage()
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  talmudPath = await window.talmud.getTalmudPath()
  appData    = await window.talmud.loadData()

  const s = appData.settings
  currentZoom = 1.0
  document.documentElement.setAttribute('data-theme', s.theme || 'dark')
  if (s.notesOpen)  notesPanel.classList.add('open')
  if (s.sidebarOpen) sidebar.classList.add('open')

  buildTractateDropdown()

  const lv = appData.lastViewed
  currentTractate = TRACTATES.find(t => t.name === lv.tractate) || TRACTATES[0]
  currentDaf  = lv.daf  || 2
  currentAmud = lv.amud || 'a'

  updateDafDropdown()
  selTractate.value = currentTractate.name
  selDaf.value      = `${currentDaf}${currentAmud}`

  const totalAmud  = (currentDaf - 2) * 2 + (currentAmud === 'a' ? 1 : 2)
  const tractTotal = (currentTractate.maxDaf - 1) * 2
  dafTitle.textContent    = `${currentTractate.name} ${currentDaf}${currentAmud}`
  dafPosition.textContent = `${totalAmud} of ${tractTotal}`

  zoomLevel.value = Math.round(currentZoom * 100) + '%'
  updateNavButtons()
  loadNotes()
  updateBookmarkButton()
  updateLearnedButton()
  updateStreak()
  updateDafYomiHint()
  renderBookmarks()
  renderProgress()

  window.talmud.onWindowState(() => {})

  const cfg = await window.talmud.getConfig()
  apiKey = cfg.apiKey || ''

  await initTranslationCache()
  await initScrollView(currentTractate, currentDaf, currentAmud)
}

// ── Dropdown builders ─────────────────────────────────────────────────────────
function buildTractateDropdown() {
  let lastSeder = ''
  selTractate.innerHTML = ''

  TRACTATES.forEach(t => {
    if (t.seder !== lastSeder) {
      const grp = document.createElement('optgroup')
      grp.label = `── ${t.seder}`
      selTractate.appendChild(grp)
      lastSeder = t.seder
    }
    const opt = document.createElement('option')
    opt.value       = t.name
    opt.textContent = t.name
    selTractate.lastElementChild.appendChild(opt)
  })
  selTractate.value = currentTractate.name
}

function updateDafDropdown() {
  const today    = getTodaysDafYomi()
  const progress = appData.progress
  selDaf.innerHTML = ''

  for (let daf = 2; daf <= currentTractate.maxDaf; daf++) {
    for (const amud of ['a', 'b']) {
      if (daf === currentTractate.maxDaf && amud === 'b' && currentTractate.lastAmud === 'a') continue
      const opt = document.createElement('option')
      opt.value = `${daf}${amud}`
      const learned = progress[`${currentTractate.name}_${String(daf).padStart(3,'0')}${amud}`]
      const isToday = today && today.tractate === currentTractate.name && today.daf === daf && amud === 'a'

      let label = `${daf}${amud}`
      if (learned) label += ' ✓'
      if (isToday) { label += ' ← today'; opt.className = 'today-daf' }
      opt.textContent = label
      selDaf.appendChild(opt)
    }
  }
  selDaf.value = `${currentDaf}${currentAmud}`
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigateTo(t, daf, amud, saveState = true) {
  flushPendingNotes()
  const key = makePageKey(t, daf, amud)

  currentTractate = t
  currentDaf  = daf
  currentAmud = amud

  selTractate.value = t.name
  updateDafDropdown()
  selDaf.value = `${daf}${amud}`

  const totalAmud  = (daf - 2) * 2 + (amud === 'a' ? 1 : 2)
  const tractTotal = (t.maxDaf - 1) * 2
  dafTitle.textContent    = `${t.name} ${daf}${amud}`
  dafPosition.textContent = `${totalAmud} of ${tractTotal}`

  updateNavButtons()
  loadNotes()
  updateBookmarkButton()
  updateLearnedButton()
  updateDafYomiHint()

  if (saveState) {
    appData.lastViewed = { tractate: t.name, daf, amud }
    saveAppData()
  }

  // Scroll to page if already in DOM, otherwise load fresh
  if (pageMap.has(key)) {
    if (pendingSearchHL && pendingSearchHL.key === key) {
      const hl = pendingSearchHL
      pendingSearchHL = null
      applySearchHL(pageMap.get(key), hl.hlText, hl.segHe || '', hl.occurrenceIdx || 0)
    } else {
      pageMap.get(key).wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  } else {
    initScrollView(t, daf, amud)
  }

  if (translateMode) loadTranslation()
  if (selectMode) renderSelectablePanel()
  if (commentaryMode) loadCommentariesForCurrentPage()
}

function stepForward() {
  if (currentAmud === 'a') {
    const isLastAmud = currentDaf === currentTractate.maxDaf && currentTractate.lastAmud === 'a'
    if (isLastAmud) {
      const idx = TRACTATES.indexOf(currentTractate)
      if (idx < TRACTATES.length - 1) {
        navigateTo(TRACTATES[idx + 1], 2, 'a')
        toast(`Starting ${TRACTATES[idx + 1].name}`, 'gold')
      }
    } else {
      navigateTo(currentTractate, currentDaf, 'b')
    }
  } else {
    if (currentDaf < currentTractate.maxDaf) {
      navigateTo(currentTractate, currentDaf + 1, 'a')
    } else {
      const idx = TRACTATES.indexOf(currentTractate)
      if (idx < TRACTATES.length - 1) {
        navigateTo(TRACTATES[idx + 1], 2, 'a')
        toast(`Starting ${TRACTATES[idx + 1].name}`, 'gold')
      }
    }
  }
}

function stepBack() {
  if (currentAmud === 'b') {
    navigateTo(currentTractate, currentDaf, 'a')
  } else {
    if (currentDaf > 2) {
      const pd = currentDaf - 1
      const pa = (pd === currentTractate.maxDaf && currentTractate.lastAmud === 'a') ? 'a' : 'b'
      navigateTo(currentTractate, pd, pa)
    } else {
      const idx = TRACTATES.indexOf(currentTractate)
      if (idx > 0) {
        const prev = TRACTATES[idx - 1]
        navigateTo(prev, prev.maxDaf, prev.lastAmud)
      }
    }
  }
}

function updateNavButtons() {
  const atStart = currentTractate === TRACTATES[0] && currentDaf === 2 && currentAmud === 'a'
  const lastT   = TRACTATES[TRACTATES.length-1]
  const atEnd   = currentTractate === lastT && currentDaf === lastT.maxDaf && currentAmud === lastT.lastAmud
  btnPrev.disabled     = atStart
  btnNext.disabled     = atEnd
  btnPrev.style.opacity = atStart ? '0.4' : ''
  btnNext.style.opacity = atEnd   ? '0.4' : ''
}

// ── Highlights ────────────────────────────────────────────────────────────────
function drawHighlight(ctx, hlCnv, hl) {
  ctx.fillStyle = hl.color
  ctx.fillRect(hl.x * hlCnv.width, hl.y * hlCnv.height, hl.w * hlCnv.width, hl.h * hlCnv.height)
}

function redrawPageHighlights(info) {
  const ctx = info.hlCnv.getContext('2d')
  ctx.clearRect(0, 0, info.hlCnv.width, info.hlCnv.height)
  ;(appData.highlights[info.key] || []).forEach(hl => drawHighlight(ctx, info.hlCnv, hl))
  drawSearchWordHls(ctx, info.hlCnv, searchWordHls.get(info.key) || [])
}

function drawSearchWordHls(ctx, cnv, words) {
  if (!words.length) return
  ctx.save()
  ctx.fillStyle   = 'rgba(255,190,0,0.38)'
  ctx.strokeStyle = 'rgba(220,140,0,0.65)'
  ctx.lineWidth   = 1.5
  for (const [x, y, w, h] of words) {
    ctx.fillRect  (x * cnv.width, y * cnv.height, w * cnv.width, h * cnv.height)
    ctx.strokeRect(x * cnv.width, y * cnv.height, w * cnv.width, h * cnv.height)
  }
  ctx.restore()
}

async function applySearchHL(info, hlText, segHe = '', occurrenceIdx = 0) {
  if (!hlText) return
  try {
    const words = await fetchOcrWords(info.t, info.daf, info.amud)
    if (!words) return
    const gemaraWords = words.filter(w => (w[5] ?? 4) === 0)
    let boxes = []
    // 1. Context match → pinpoints the specific occurrence
    if (segHe) boxes = findByContext(gemaraWords, hlText, segHe)
    if (!boxes.length && segHe) boxes = findByContext(words, hlText, segHe)
    // 2. Context failed: pick the n-th direct match using occurrence index
    if (!boxes.length) {
      let pool = findMatchingBoxes(gemaraWords, hlText)
      if (!pool.length) pool = findMatchingBoxes(words, hlText)
      if (pool.length) boxes = [pool[Math.min(occurrenceIdx, pool.length - 1)]]
    }
    if (!boxes.length) return
    searchWordHls.set(info.key, boxes)
    redrawPageHighlights(info)

    // Scroll so the highlighted word is centred in the viewer
    const box      = boxes[0]
    const cnvRect  = info.canvas.getBoundingClientRect()
    const scrRect  = viewerScroll.getBoundingClientRect()
    const canvasH  = parseFloat(info.canvas.style.height) || info.canvas.height / (window.devicePixelRatio || 1)
    const wordMidY = cnvRect.top - scrRect.top + (box[1] + box[3] / 2) * canvasH
    viewerScroll.scrollTop = Math.max(0, viewerScroll.scrollTop + wordMidY - viewerScroll.clientHeight / 2)
  } catch (e) {
    console.error('[applySearchHL]', e)
  }
}

function findMatchingBoxes(pool, hlText) {
  const tokens = stripNikud(hlText)
    .split(/[\s־׀׳״–—"'()\[\].,;:!?]+/)
    .filter(t => t.length >= 2)
  if (!tokens.length) return []

  // Pre-strip nikud from OCR words once — was being recomputed N×M times
  const stripped = pool.map(w => stripNikud(w[0]))

  if (tokens.length === 1) {
    const results = []
    for (let i = 0; i < pool.length; i++) {
      if (stripped[i].includes(tokens[0])) {
        const w = pool[i]
        results.push([w[1], w[2], w[3], w[4]])
      }
    }
    return results
  }

  const results = []
  for (let i = 0; i <= pool.length - tokens.length; i++) {
    let match = true
    for (let j = 0; j < tokens.length; j++) {
      const tok = tokens[j], txt = stripped[i + j]
      if (!txt.includes(tok) && !tok.includes(txt)) { match = false; break }
    }
    if (match) {
      const slice = pool.slice(i, i + tokens.length)
      const minX = Math.min(...slice.map(w => w[1]))
      const minY = Math.min(...slice.map(w => w[2]))
      const maxX = Math.max(...slice.map(w => w[1] + w[3]))
      const maxY = Math.max(...slice.map(w => w[2] + w[4]))
      results.push([minX, minY, maxX - minX, maxY - minY])
    }
  }
  return results
}

// Fallback: anchor by context words around the target in the Sefaria segment.
// Tries words before the target (expecting OCR target = next word), then words
// after (expecting OCR target = preceding word). Progressively shortens the
// window from 5 tokens down to 2 to tolerate OCR misreads.
function findByContext(gemaraWords, hlText, segHe) {
  const segStripped = stripNikud(segHe)
  const targetIdx   = segStripped.indexOf(hlText)
  if (targetIdx < 0) return []

  function tokenize(s) {
    return s.split(/[\s־׀׳״–—"'()\[\].,;:!?0-9]+/)
      .map(t => t.trim()).filter(t => t.length >= 2)
  }

  const beforeAll = tokenize(segStripped.slice(0, targetIdx))
  const afterAll  = tokenize(segStripped.slice(targetIdx + hlText.length)).slice(0, 5)
  // First token of the search text — used to verify the candidate word is actually the target
  const firstTok = tokenize(hlText)[0] || ''

  // Pre-strip nikud once — inner ctxMatch/targetMatch were recomputing this per check
  const stripped = gemaraWords.map(w => stripNikud(w[0]))

  function ctxMatch(ctx, i) {
    for (let j = 0; j < ctx.length; j++) {
      const ocrTxt = stripped[i + j]
      const tok    = ctx[j]
      if (!ocrTxt.includes(tok) && !tok.includes(ocrTxt)) return false
    }
    return true
  }

  function targetMatch(idx) {
    if (!firstTok) return true
    const txt = stripped[idx]
    return txt.includes(firstTok) || firstTok.includes(txt)
  }

  // Before-context: find last N words before target in OCR → target is next word after run
  for (let len = Math.min(5, beforeAll.length); len >= 2; len--) {
    const ctx = beforeAll.slice(-len)
    for (let i = 0; i + len < gemaraWords.length; i++) {
      if (ctxMatch(ctx, i) && targetMatch(i + len)) {
        const w = gemaraWords[i + len]
        return [[w[1], w[2], w[3], w[4]]]
      }
    }
  }

  // After-context: find first N words after target in OCR → target is word before run
  for (let len = Math.min(5, afterAll.length); len >= 2; len--) {
    const ctx = afterAll.slice(0, len)
    for (let i = 1; i + len <= gemaraWords.length; i++) {
      if (ctxMatch(ctx, i) && targetMatch(i - 1)) {
        const w = gemaraWords[i - 1]
        return [[w[1], w[2], w[3], w[4]]]
      }
    }
  }

  return []
}

function saveHighlight(info, x, y, w, h) {
  if (!appData.highlights[info.key]) appData.highlights[info.key] = []
  appData.highlights[info.key].push({
    x: x / info.hlCnv.width,
    y: y / info.hlCnv.height,
    w: w / info.hlCnv.width,
    h: h / info.hlCnv.height,
    color: activeHlColor,
    id: Date.now()
  })
  saveAppData()
  redrawPageHighlights(info)
}

function eraseHighlightAt(info, cx, cy) {
  const highlights = appData.highlights[info.key] || []
  const px = cx / info.hlCnv.width
  const py = cy / info.hlCnv.height
  const idx = highlights.findIndex(hl =>
    px >= hl.x && px <= hl.x + hl.w && py >= hl.y && py <= hl.y + hl.h)
  if (idx !== -1) {
    highlights.splice(idx, 1)
    appData.highlights[info.key] = highlights
    saveAppData()
    redrawPageHighlights(info)
    toast('Highlight removed')
  }
}

function toggleHighlightMode() {
  highlightMode = !highlightMode
  eraseMode = false
  btnHlMode.classList.toggle('active', highlightMode)
  hlToolbar.classList.toggle('visible', highlightMode)
  btnHlErase.classList.remove('active')

  // Highlight is mutually exclusive with select — both want the mouse
  if (highlightMode && selectMode) toggleSelectMode()

  pageMap.forEach(info => {
    info.hlCnv.classList.toggle('drawing-mode', highlightMode)
    info.hlCnv.classList.remove('erase-mode')
  })
}

function toggleSelectMode() {
  selectMode = !selectMode
  btnSelectMode.classList.toggle('active', selectMode)
  selectPanel.classList.toggle('open', selectMode)
  if (selectMode) {
    if (translateMode) toggleTranslateMode()    // panels share right side
    if (commentaryMode) toggleCommentaryMode()
    renderSelectablePanel()
  }
}

function renderSelectablePanel() {
  const key = amudKey()
  const segments = translateCache.get(key)
  if (!segments || !segments.length) {
    selectContent.innerHTML = `<div class="select-empty">Hebrew text not yet downloaded for this daf.<br>Try the Translate panel first to fetch it.</div>`
    return
  }
  // Strip nikud-only HTML; show each segment as its own RTL paragraph.
  // Native browser selection handles Ctrl+C / right-click → Copy automatically.
  selectContent.innerHTML = segments
    .filter(s => s.he)
    .map(s => `<p class="sel-he">${escHtml(s.he)}</p>`)
    .join('')
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────
function isCurrentBookmarked() {
  return appData.bookmarks.some(
    b => b.tractate === currentTractate.name && b.daf === currentDaf && b.amud === currentAmud)
}

function toggleBookmark() {
  if (isCurrentBookmarked()) {
    appData.bookmarks = appData.bookmarks.filter(
      b => !(b.tractate === currentTractate.name && b.daf === currentDaf && b.amud === currentAmud))
    toast('Bookmark removed')
  } else {
    appData.bookmarks.unshift({
      id: Date.now(),
      tractate: currentTractate.name,
      daf: currentDaf,
      amud: currentAmud,
      label: `${currentTractate.name} ${currentDaf}${currentAmud}`,
      createdAt: new Date().toISOString()
    })
    toast('Bookmarked ✦', 'gold')
  }
  saveAppData()
  updateBookmarkButton()
  renderBookmarks()
}

function updateBookmarkButton() {
  const active = isCurrentBookmarked()
  btnBookmark.classList.toggle('bookmarked-active', active)
  $('icon-bookmark').setAttribute('fill', active ? 'currentColor' : 'none')
}

function renderBookmarks() {
  bookmarkList.innerHTML = ''
  if (!appData.bookmarks.length) {
    bookmarkList.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
        <p>No bookmarks yet.<br>Press <strong>B</strong> to bookmark a daf.</p>
      </div>`
    return
  }
  appData.bookmarks.forEach(bm => {
    const isActive = bm.tractate === currentTractate.name && bm.daf === currentDaf && bm.amud === currentAmud
    const date = new Date(bm.createdAt).toLocaleDateString()
    const el = document.createElement('div')
    el.className = `bookmark-item${isActive ? ' active' : ''}`
    el.innerHTML = `
      <div class="bm-info">
        <div class="bm-name">${bm.label}</div>
        <div class="bm-date">${date}</div>
      </div>
      <button class="bm-delete" data-id="${bm.id}">✕</button>`
    el.addEventListener('click', e => {
      if (e.target.closest('.bm-delete')) {
        appData.bookmarks = appData.bookmarks.filter(b => b.id !== bm.id)
        saveAppData(); renderBookmarks(); updateBookmarkButton()
        return
      }
      const t = TRACTATES.find(t => t.name === bm.tractate)
      if (t) navigateTo(t, bm.daf, bm.amud)
    })
    bookmarkList.appendChild(el)
  })
}

// ── Progress / Learned ────────────────────────────────────────────────────────
function isCurrentLearned() { return !!appData.progress[amudKey()] }

function toggleLearned() {
  const key = amudKey()
  if (appData.progress[key]) {
    delete appData.progress[key]
    toast('Unmarked')
  } else {
    appData.progress[key] = true
    toast('Marked as learned ✓', 'success')
    updateStreak()
  }
  saveAppData()
  updateLearnedButton()
  renderProgress()
  updateDafDropdown()
}

function updateLearnedButton() {
  btnLearned.classList.toggle('learned-active', isCurrentLearned())
  $('icon-learned').style.stroke = isCurrentLearned() ? 'var(--success)' : ''
}

function getTractateProgress(t) {
  const totalAmudim = (t.maxDaf - 1) * 2
  let count = 0
  for (let d = 2; d <= t.maxDaf; d++) {
    if (appData.progress[`${t.name}_${String(d).padStart(3,'0')}a`]) count++
    if (appData.progress[`${t.name}_${String(d).padStart(3,'0')}b`]) count++
  }
  return { learned: count, total: totalAmudim, pct: totalAmudim > 0 ? count / totalAmudim : 0 }
}

function renderProgress() {
  const totalLearned = Object.keys(appData.progress).filter(k => appData.progress[k]).length
  overallLabel.textContent = `${Math.round(totalLearned / TOTAL_AMUDIM * 100)}%`
  progressList.innerHTML = ''

  TRACTATES.forEach(t => {
    const { learned, total, pct } = getTractateProgress(t)
    if (learned === 0 && t !== currentTractate) return
    const el = document.createElement('div')
    el.className = `progress-item${t === currentTractate ? ' active-tractate' : ''}`
    el.innerHTML = `
      <span class="pi-name">${t.name}</span>
      <div class="pi-bar-wrap"><div class="pi-bar-fill" style="width:${pct*100}%"></div></div>
      <span class="pi-pct">${Math.round(pct*100)}%</span>`
    el.addEventListener('click', () => navigateTo(t, 2, 'a'))
    progressList.appendChild(el)
  })
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function loadNotes() {
  const key  = amudKey()
  const note = appData.notes[key]
  notesArea.value           = note ? note.text : ''
  notesCharcount.textContent = notesArea.value.length + ' chars'
  notesTimestamp.textContent = note?.updatedAt
    ? 'Saved ' + new Date(note.updatedAt).toLocaleString() : ''
}

function saveNotes() {
  const key  = amudKey()
  const text = notesArea.value.trim()
  if (text) appData.notes[key] = { text, updatedAt: new Date().toISOString() }
  else delete appData.notes[key]
  saveAppData()
  notesSaved.textContent = 'Saved'
  notesSaved.style.opacity = '1'
  setTimeout(() => { notesSaved.style.opacity = '0' }, 1500)
  notesTimestamp.textContent = text ? 'Saved ' + new Date().toLocaleString() : ''
}

notesArea.addEventListener('input', () => {
  notesCharcount.textContent = notesArea.value.length + ' chars'
  clearTimeout(notesTimer)
  notesTimer = setTimeout(saveNotes, 800)
})

// Flush any pending notes save synchronously — call before currentTractate/Daf/Amud
// change, otherwise the in-flight 800ms timer fires after the change and saves
// the new page's text against the new key, silently losing the typed note.
function flushPendingNotes() {
  if (!notesTimer) return
  clearTimeout(notesTimer)
  notesTimer = null
  saveNotes()
}

// ── Streak tracking ───────────────────────────────────────────────────────────
function updateStreak() {
  const today    = new Date().toISOString().slice(0, 10)
  const streak   = appData.streak
  if (streak.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    streak.current = streak.lastDate === yesterday ? (streak.current || 0) + 1 : 1
    streak.lastDate = today
    streak.longest  = Math.max(streak.longest || 0, streak.current)
    if (!appData.learnedDates) appData.learnedDates = []
    if (!appData.learnedDates.includes(today)) appData.learnedDates.push(today)
    saveAppData()
  }
  streakCount.textContent = streak.current || 0
}

// ── Daf Yomi hint ─────────────────────────────────────────────────────────────
function updateDafYomiHint() {
  const today = getTodaysDafYomi()
  if (!today) { sbDafYomi.textContent = ''; return }
  sbDafYomi.textContent = `Daf Yomi: ${today.tractate} ${today.daf}a`
}

// ── Status bar ────────────────────────────────────────────────────────────────
function updateStatusBar() {
  // Progress spans removed from HTML — daf yomi is updated via updateDafYomiHint()
}

// ── Zoom ──────────────────────────────────────────────────────────────────────
function zoomIn()  { if (currentZoom < 3.0) { currentZoom = Math.round((currentZoom + 0.15)*100)/100; applyZoom() } }
function zoomOut() { if (currentZoom > 0.4) { currentZoom = Math.round((currentZoom - 0.15)*100)/100; applyZoom() } }


async function applyZoom() {
  zoomLevel.value = Math.round(currentZoom * 100) + '%'
  const renders = []
  pageMap.forEach(info => {
    if (info.pdfDoc) renders.push(renderPdfPage(info).then(() => redrawPageHighlights(info)))
  })
  await Promise.all(renders)
  appData.settings.zoom = currentZoom
  saveAppData()
}

// ── Save ──────────────────────────────────────────────────────────────────────
let saveTimer = null
function saveAppData() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => window.talmud.saveData(appData), 400)
}

// ── Today's daf ───────────────────────────────────────────────────────────────
function goToToday() {
  const today = getTodaysDafYomi()
  if (!today) return
  const t = TRACTATES.find(t => t.name === today.tractate)
  if (t) {
    navigateTo(t, today.daf, 'a')
    updateDafDropdown()
    toast(`Jumped to today's Daf Yomi: ${today.tractate} ${today.daf}a`, 'gold')
  }
}

// ── Translation cache: persist & background download ─────────────────────────
function allAmudim() {
  const list = []
  for (const t of TRACTATES) {
    for (let daf = 2; daf <= t.maxDaf; daf++) {
      list.push({ t, daf, amud: 'a' })
      if (!(daf === t.maxDaf && t.lastAmud === 'a')) list.push({ t, daf, amud: 'b' })
    }
  }
  return list
}

async function initTranslationCache() {
  try {
    const data = await window.talmud.loadTranslations()
    Object.entries(data).forEach(([k, v]) => translateCache.set(k, v))
  } catch {}
}

async function persistTranslations() {
  const obj = {}
  translateCache.forEach((v, k) => { obj[k] = v })
  await window.talmud.saveTranslations(obj)
}

async function backgroundDownload() {
  const todo = allAmudim().filter(({ t, daf, amud }) => !translateCache.has(makePageKey(t, daf, amud)))
  if (!todo.length) return

  let dirty = 0
  for (const { t, daf, amud } of todo) {
    const key = makePageKey(t, daf, amud)
    if (translateCache.has(key)) continue
    const segments = await fetchSefaria(t.name, daf, amud)
    if (segments && segments.length) {
      translateCache.set(key, segments)
      if (++dirty % 50 === 0) await persistTranslations()
    }
    await new Promise(r => setTimeout(r, 300))
  }
  if (dirty > 0) await persistTranslations()
}

// ── Sefaria translation ───────────────────────────────────────────────────────
// ── Commentaries side panel ──────────────────────────────────────────────────
// Fetches all Sefaria-linked commentaries for the current daf, groups by
// commentator, and shows them in a collapsible side-panel list. No inline
// markers, no PDF overlay — clean separation between the daf view and the
// commentary text view.
async function fetchCommentariesForDaf(t, daf, amud) {
  const cacheKey = makePageKey(t, daf, amud)
  if (_commentariesCache.has(cacheKey)) return _commentariesCache.get(cacheKey)
  // Reads from the gzipped per-tractate file shipped in the installer's
  // resources — no Sefaria API call at runtime, works offline.
  const data = await window.talmud.getCommentaries(t.name, daf, amud)
  _commentariesCache.set(cacheKey, data || null)
  return data || null
}

function renderCommentariesPanel(loading = false) {
  if (loading) {
    commentariesContent.innerHTML = `<div class="select-empty"><div class="spinner"></div>Loading commentaries…</div>`
    cmtCount.textContent = ''
    return
  }
  const data = _commentariesCache.get(amudKey())
  if (!data || !data.length) {
    commentariesContent.innerHTML = `<div class="select-empty">No commentaries available for this daf.</div>`
    cmtCount.textContent = ''
    return
  }

  cmtCount.textContent = `${data.length} commentator${data.length === 1 ? '' : 's'}`
  commentariesContent.innerHTML = data.map((entry, idx) => {
    const segments = entry.refs.map(r => `
      <div class="cmt-seg">
        ${r.anchorRef ? `<div class="cmt-seg-ref">${escHtml(r.anchorRef)}</div>` : ''}
        <div class="cmt-seg-he">${r.he || ''}</div>
      </div>
    `).join('')
    return `
      <div class="cmt-item" data-idx="${idx}">
        <button class="cmt-header">
          <span class="cmt-arrow">▶</span>
          <span class="cmt-name" dir="rtl">${escHtml(entry.he)}</span>
          <span class="cmt-count">${entry.refs.length}</span>
        </button>
        <div class="cmt-body">${segments}</div>
      </div>
    `
  }).join('')

  commentariesContent.querySelectorAll('.cmt-header').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('expanded'))
  })
}

async function loadCommentariesForCurrentPage() {
  renderCommentariesPanel(true)  // show loading state
  await fetchCommentariesForDaf(currentTractate, currentDaf, currentAmud)
  if (commentaryMode) renderCommentariesPanel()
}

function toggleCommentaryMode() {
  commentaryMode = !commentaryMode
  btnCommentary.classList.toggle('active', commentaryMode)
  commentariesPanel.classList.toggle('open', commentaryMode)
  if (commentaryMode) {
    if (translateMode) toggleTranslateMode()
    if (selectMode) toggleSelectMode()
    if (highlightMode) toggleHighlightMode()
    loadCommentariesForCurrentPage()
  }
}

async function fetchSefaria(tractate, daf, amud) {
  const name = SEFARIA_NAMES[tractate]
  if (!name) return null
  try {
    const res = await fetch(`https://www.sefaria.org/api/texts/${name}.${daf}${amud}?lang=bi&pad=0`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    const flatten = a => Array.isArray(a) ? a.flatMap(flatten) : [a]
    const clean   = s => (s || '').replace(/<[^>]*>/g, '').trim()
    const en = flatten(data.text || []).map(clean).filter(Boolean)
    const he = flatten(data.he   || []).map(clean).filter(Boolean)
    const n  = Math.min(en.length, he.length)
    return Array.from({ length: n }, (_, i) => ({ en: en[i], he: he[i] }))
  } catch { return null }
}

async function loadTranslation() {
  const key = amudKey()

  if (translateCache.has(key)) {
    renderTranslation(translateCache.get(key))
    return
  }

  translateContent.innerHTML = `<div class="tl-loading"><div class="spinner"></div>Loading…</div>`

  const segments = await fetchSefaria(currentTractate.name, currentDaf, currentAmud)

  if (!segments || !segments.length) {
    translateContent.innerHTML = `<div class="tl-loading">Translation not available for this page.</div>`
    return
  }

  translateCache.set(key, segments)
  renderTranslation(segments)
}

function renderTranslation(segments) {
  translateContent.innerHTML = segments
    .map(s => `<div class="tl-block">
      <p class="tl-he">${s.he}</p>
      <p class="tl-en">${s.en}</p>
    </div>`)
    .join('')
}

function toggleTranslateMode() {
  translateMode = !translateMode
  btnTranslate.classList.toggle('active', translateMode)
  translatePanel.classList.toggle('open', translateMode)

  if (translateMode) {
    if (highlightMode) toggleHighlightMode()
    if (selectMode) toggleSelectMode()  // panels share right side
    if (commentaryMode) toggleCommentaryMode()
    loadTranslation()
  }
}

// ── Translation (kept for potential Claude API use) ────────────────────────────
async function translateCurrentDaf() {
  const info = pageMap.get(amudKey())
  if (!info || !info.pdfDoc || !apiKey) return null
  const page    = await info.pdfDoc.getPage(1)
  const content = await page.getTextContent()
  const text    = content.items.map(i => i.str).join(' ')
  return window.talmud.translate({ text, apiKey })
}

// ── Print ─────────────────────────────────────────────────────────────────────
const printModal      = $('print-preview-modal')
const printFromSel    = $('print-from')
const printToSel      = $('print-to')
const printPageCount  = $('print-page-count')
const printBody       = $('print-preview-body')

// Render a single daf to a data URL via PDF.js (reuses preloadCache when possible)
async function dafToDataUrl(t, daf, amud) {
  const key = makePageKey(t, daf, amud)
  let pdfDoc = preloadCache[key]
  if (!pdfDoc) {
    const result = await window.talmud.readPDF(pdfPath(t, daf, amud))
    if (!result.exists) return null
    const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0))
    pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
    preloadCache[key] = pdfDoc
  }
  const page = await pdfDoc.getPage(1)
  const vp   = page.getViewport({ scale: 2 * (window.devicePixelRatio || 1) })
  const cnv  = document.createElement('canvas')
  cnv.width  = vp.width
  cnv.height = vp.height
  await page.render({ canvasContext: cnv.getContext('2d'), viewport: vp }).promise
  return cnv.toDataURL('image/png')
}

function printAmudRange() {
  const fromVal = printFromSel.value   // e.g. "2a"
  const toVal   = printToSel.value
  const amudim  = []
  let counting  = false
  for (let daf = 2; daf <= currentTractate.maxDaf; daf++) {
    for (const amud of ['a', 'b']) {
      if (daf === currentTractate.maxDaf && amud === 'b' && currentTractate.lastAmud === 'a') continue
      const val = `${daf}${amud}`
      if (val === fromVal) counting = true
      if (counting) amudim.push({ daf, amud })
      if (val === toVal) return amudim
    }
  }
  return amudim
}

let _cachedPrintUrls = []

async function buildPrintPreview() {
  const pages = printAmudRange()
  printPageCount.textContent = `${pages.length} page${pages.length !== 1 ? 's' : ''}`
  printBody.innerHTML = `<div class="tl-loading"><div class="spinner"></div>Generating preview…</div>`

  _cachedPrintUrls = await Promise.all(pages.map(({ daf, amud }) => dafToDataUrl(currentTractate, daf, amud)))

  printBody.innerHTML = ''
  _cachedPrintUrls.forEach(url => {
    if (!url) return
    const wrap = document.createElement('div')
    wrap.style.cssText = 'background:#888;display:flex;justify-content:center;padding:20px 16px'
    const page = document.createElement('div')
    page.style.cssText = 'background:white;box-shadow:0 4px 24px rgba(0,0,0,0.4);border-radius:2px;width:100%;max-width:520px'
    const img  = document.createElement('img')
    img.src    = url
    img.style.cssText = 'display:block;width:100%;height:auto'
    page.appendChild(img)
    wrap.appendChild(page)
    printBody.appendChild(wrap)
  })
}

async function openPrintModal() {
  // Populate range dropdowns for current tractate
  printFromSel.innerHTML = ''
  printToSel.innerHTML   = ''
  for (let daf = 2; daf <= currentTractate.maxDaf; daf++) {
    for (const amud of ['a', 'b']) {
      if (daf === currentTractate.maxDaf && amud === 'b' && currentTractate.lastAmud === 'a') continue
      const val = `${daf}${amud}`
      const label = `${currentTractate.name} ${val}`
      printFromSel.appendChild(new Option(label, val))
      printToSel.appendChild(new Option(label, val))
    }
  }
  printFromSel.value = `${currentDaf}${currentAmud}`
  printToSel.value   = `${currentDaf}${currentAmud}`

  printModal.classList.add('open')
  await buildPrintPreview()
}

async function confirmPrint() {
  printModal.classList.remove('open')

  const frame = document.createElement('div')
  frame.id = 'print-frame'
  const loads = []
  _cachedPrintUrls.forEach(url => {
    if (!url) return
    const div = document.createElement('div')
    div.className = 'print-page'
    const img = document.createElement('img')
    loads.push(new Promise((res, rej) => { img.onload = res; img.onerror = rej }))
    img.src = url
    div.appendChild(img)
    frame.appendChild(div)
  })
  document.body.appendChild(frame)
  await Promise.all(loads)
  await window.talmud.printWindow()
  frame.remove()
}

function printCurrentDaf() { openPrintModal() }

printFromSel.addEventListener('change', () => {
  // Ensure "to" is never before "from"
  const from = printFromSel.options[printFromSel.selectedIndex]
  const to   = printToSel.options[printToSel.selectedIndex]
  if (printToSel.selectedIndex < printFromSel.selectedIndex) printToSel.selectedIndex = printFromSel.selectedIndex
  buildPrintPreview()
})
printToSel.addEventListener('change', () => {
  if (printToSel.selectedIndex < printFromSel.selectedIndex) printFromSel.selectedIndex = printToSel.selectedIndex
  buildPrintPreview()
})

$('btn-print-confirm').addEventListener('click', confirmPrint)
$('btn-print-cancel').addEventListener('click', () => printModal.classList.remove('open'))
printModal.addEventListener('click', e => { if (e.target === printModal) printModal.classList.remove('open') })

// ── Event listeners ───────────────────────────────────────────────────────────
btnPrev.addEventListener('click', stepBack)
btnNext.addEventListener('click', stepForward)
btnBookmark.addEventListener('click', toggleBookmark)
btnLearned.addEventListener('click', toggleLearned)
btnToday.addEventListener('click', goToToday)
btnZoomIn.addEventListener('click', zoomIn)
btnZoomOut.addEventListener('click', zoomOut)

zoomLevel.addEventListener('focus', () => {
  zoomLevel.removeAttribute('readonly')
  zoomLevel.value = Math.round(currentZoom * 100) + ''
  zoomLevel.select()
})
zoomLevel.addEventListener('blur', () => {
  zoomLevel.setAttribute('readonly', '')
  zoomLevel.value = Math.round(currentZoom * 100) + '%'
})
zoomLevel.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = parseInt(zoomLevel.value)
    if (!isNaN(val)) {
      currentZoom = Math.min(300, Math.max(40, val)) / 100
      applyZoom()
    }
    zoomLevel.blur()
  }
  if (e.key === 'Escape') zoomLevel.blur()
})

btnSidebar.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open')
  btnSidebar.classList.toggle('active', open)
  appData.settings.sidebarOpen = open
  saveAppData()
})

btnNotes.addEventListener('click', () => {
  const open = notesPanel.classList.toggle('open')
  btnNotes.classList.toggle('active', open)
  appData.settings.notesOpen = open
  saveAppData()
  if (open) setTimeout(() => notesArea.focus(), 220)
})

btnTheme.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const next   = isDark ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  appData.settings.theme = next
  saveAppData()
})

selTractate.addEventListener('change', () => {
  const t = TRACTATES.find(t => t.name === selTractate.value)
  if (t) { currentTractate = t; updateDafDropdown(); navigateTo(t, 2, 'a') }
})

selDaf.addEventListener('change', () => {
  const val  = selDaf.value
  const amud = val.slice(-1)
  const daf  = parseInt(val.slice(0, -1))
  navigateTo(currentTractate, daf, amud)
})

btnHlMode.addEventListener('click', toggleHighlightMode)
btnSelectMode.addEventListener('click', toggleSelectMode)
btnCommentary.addEventListener('click', toggleCommentaryMode)
btnHlDone.addEventListener('click', toggleHighlightMode)
btnTranslate.addEventListener('click', toggleTranslateMode)

btnHlErase.addEventListener('click', () => {
  eraseMode = !eraseMode
  pageMap.forEach(info => {
    info.hlCnv.classList.toggle('erase-mode',    eraseMode && highlightMode)
    info.hlCnv.classList.toggle('drawing-mode', !eraseMode && highlightMode)
  })
  btnHlErase.classList.toggle('active', eraseMode)
})

document.querySelectorAll('.hl-color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.hl-color-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeHlColor = btn.dataset.color
    eraseMode = false
    pageMap.forEach(info => {
      info.hlCnv.classList.remove('erase-mode')
      if (highlightMode) info.hlCnv.classList.add('drawing-mode')
    })
    btnHlErase.classList.remove('active')
  })
})

$('btn-clear-bookmarks').addEventListener('click', () => {
  if (!appData.bookmarks.length) return
  appData.bookmarks = []
  saveAppData(); renderBookmarks(); updateBookmarkButton()
})

sbDafYomi.addEventListener('click', goToToday)
$('btn-print').addEventListener('click', printCurrentDaf)
$('btn-minimize').addEventListener('click', () => window.talmud.winMinimize())
$('btn-maximize').addEventListener('click', () => window.talmud.winMaximize())
$('btn-close').addEventListener('click',    () => window.talmud.winClose())

// ── Search ────────────────────────────────────────────────────────────────────
const searchPanel   = $('search-panel')
const searchInput   = $('search-input')
const searchClear   = $('search-clear')
const searchGo      = $('search-go')
const searchStatus  = $('search-status')
const searchResults = $('search-results')
const btnSearch     = $('btn-search')

let searchLang = 'he'

// Strip Hebrew nikud/cantillation so "אמר" matches "אָמַר"
function stripNikud(s) {
  return s.replace(/[֑-ׇ]/g, '')
}

function toggleSearch() {
  const open = searchPanel.classList.toggle('open')
  btnSearch.classList.toggle('active', open)
  if (open) setTimeout(() => searchInput.focus(), 220)
}

function parseSearchKey(key) {
  const amud = key.slice(-1)
  const daf  = parseInt(key.slice(-4, -1), 10)
  const name = key.slice(0, -5)
  return { name, daf, amud }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function makeSnippet(text, query, isHe) {
  const normalized = isHe ? stripNikud(text) : text.toLowerCase()
  const idx = normalized.indexOf(query)
  if (idx === -1) return escHtml(text.slice(0, 200))

  if (isHe) {
    // Build map from stripped index → original index
    const map = []
    for (let i = 0; i < text.length; i++) {
      if (!/[֑-ׇ]/.test(text[i])) map.push(i)
    }
    map.push(text.length) // sentinel

    const origMatchStart = map[idx]
    const origMatchEnd   = map[Math.min(idx + query.length, map.length - 1)]
    const winStart = Math.max(0, origMatchStart - 80)
    const winEnd   = Math.min(text.length, origMatchEnd + 120)

    return (winStart > 0 ? '…' : '') +
      escHtml(text.slice(winStart, origMatchStart)) +
      `<mark>${escHtml(text.slice(origMatchStart, origMatchEnd))}</mark>` +
      escHtml(text.slice(origMatchEnd, winEnd)) +
      (winEnd < text.length ? '…' : '')
  } else {
    // English: positions in text.toLowerCase() align 1-to-1 with text
    const winStart = Math.max(0, idx - 80)
    const winEnd   = Math.min(text.length, idx + query.length + 120)

    return (winStart > 0 ? '…' : '') +
      escHtml(text.slice(winStart, idx)) +
      `<mark>${escHtml(text.slice(idx, idx + query.length))}</mark>` +
      escHtml(text.slice(idx + query.length, winEnd)) +
      (winEnd < text.length ? '…' : '')
  }
}

function preloadSearchResultPdfs(results) {
  const seen = new Set()
  const toLoad = []
  for (const { key } of results) {
    if (seen.has(key) || pageMap.has(key) || preloadCache[key]) continue
    seen.add(key)
    toLoad.push(key)
    if (toLoad.length >= 10) break
  }
  for (const key of toLoad) {
    const { name, daf, amud } = parseSearchKey(key)
    const t = TRACTATES.find(x => x.name === name)
    if (!t) continue
    ;(async () => {
      try {
        const result = await window.talmud.readPDF(pdfPath(t, daf, amud))
        if (!result.exists || result.size < 1000 || preloadCache[key]) return
        const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0))
        preloadCache[key] = await pdfjsLib.getDocument({ data: bytes }).promise
      } catch {}
    })()
  }
}

function runSearch() {
  const raw = searchInput.value.trim()
  if (raw.length < 1) {
    searchStatus.textContent = ''
    searchResults.innerHTML = ''
    return
  }

  const qStripped = stripNikud(raw)
  const qLower    = raw.toLowerCase()

  const results = []

  const wantHe = searchLang === 'both' || searchLang === 'he'
  const wantEn = searchLang === 'both' || searchLang === 'en'

  for (const [key, segments] of translateCache) {
    const stripped = wantHe ? strippedSegmentsFor(key, segments) : null
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const heMatch = wantHe && stripped[i] && stripped[i].includes(qStripped)
      const enMatch = wantEn && seg.en && seg.en.toLowerCase().includes(qLower)
      if (heMatch || enMatch) {
        // hlText: Hebrew query for Hebrew matches; empty for English-only
        // (can't reliably map English match → specific Hebrew phrase on page)
        const hlText = heMatch ? qStripped : ''
        results.push({ key, he: heMatch ? seg.he : null, en: enMatch ? seg.en : null, hlText })
      }
    }
  }

  const total = results.length
  searchStatus.textContent = total === 0
    ? 'No results'
    : `${total} result${total === 1 ? '' : 's'}`

  if (total === 0) {
    searchResults.innerHTML = `<div class="search-empty">Nothing found for "${escHtml(raw)}"</div>`
    return
  }

  _searchResultSegs.length = 0
  const _pageOccCount = {}
  searchResults.innerHTML = results.map(({ key, he, en, hlText }, i) => {
    _searchResultSegs.push(he || '')
    const occ = (_pageOccCount[key] = (_pageOccCount[key] || 0))
    _pageOccCount[key]++
    const { name, daf, amud } = parseSearchKey(key)
    const heSnippet = he ? `<div class="sr-snippet rtl">${makeSnippet(he, qStripped, true)}</div>` : ''
    const enSnippet = en ? `<div class="sr-snippet">${makeSnippet(en, qLower, false)}</div>` : ''
    return `<div class="search-result" data-key="${escHtml(key)}" data-hl="${escHtml(hlText)}" data-idx="${i}" data-occ="${occ}">
      <div class="sr-label">${escHtml(name)} ${daf}${amud}</div>
      ${heSnippet}${enSnippet}
    </div>`
  }).join('')

  preloadSearchResultPdfs(results)

  searchResults.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      const { name, daf, amud } = parseSearchKey(el.dataset.key)
      const t = TRACTATES.find(x => x.name === name)
      if (!t) return
      const segHe         = _searchResultSegs[+el.dataset.idx] || ''
      const hlText        = el.dataset.hl || ''
      const occurrenceIdx = +el.dataset.occ || 0

      currentZoom = 1.0
      zoomLevel.value = '100%'
      appData.settings.zoom = 1.0

      if (el.dataset.key === amudKey() && pageMap.has(el.dataset.key)) {
        applyZoom().then(() => applySearchHL(pageMap.get(el.dataset.key), hlText, segHe, occurrenceIdx))
        return
      }

      searchWordHls.clear()
      pageMap.forEach(info => redrawPageHighlights(info))
      pendingSearchHL = { key: el.dataset.key, hlText, segHe, occurrenceIdx }
      navigateTo(t, daf, amud)
    })
  })
}

function clearSearch() {
  searchInput.value = ''
  searchStatus.textContent = ''
  searchResults.innerHTML = ''
  searchClear.classList.remove('visible')
  searchWordHls.clear()
  pageMap.forEach(info => redrawPageHighlights(info))
  searchInput.focus()
}

btnSearch.addEventListener('click', toggleSearch)
searchGo.addEventListener('click', runSearch)
searchClear.addEventListener('click', clearSearch)
searchInput.addEventListener('input', () => {
  searchClear.classList.toggle('visible', searchInput.value.length > 0)
})
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch()
  if (e.key === 'Escape') clearSearch()
})

document.querySelectorAll('.search-lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    searchLang = btn.dataset.lang
    document.querySelectorAll('.search-lang-btn').forEach(b => b.classList.toggle('active', b === btn))
  })
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag    = document.activeElement.tagName
  const typing = tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT'

  if (e.key === 'ArrowRight' && !typing) { e.preventDefault(); stepForward() }
  if (e.key === 'ArrowLeft'  && !typing) { e.preventDefault(); stepBack() }

  if (!typing) {
    if (e.key === 'b' || e.key === 'B') toggleBookmark()
    if (e.key === 'l' || e.key === 'L') toggleLearned()
    if (e.key === 'h' || e.key === 'H') toggleHighlightMode()
    if (e.key === 's' || e.key === 'S') toggleSelectMode()
    if (e.key === 'c' || e.key === 'C') toggleCommentaryMode()
    if (e.key === 't' || e.key === 'T') toggleTranslateMode()
    if (e.key === 'n' || e.key === 'N') {
      const open = notesPanel.classList.toggle('open')
      btnNotes.classList.toggle('active', open)
      appData.settings.notesOpen = open
      saveAppData()
      if (open) setTimeout(() => notesArea.focus(), 220)
    }
    if (e.key === '+' || e.key === '=') zoomIn()
    if (e.key === '-') zoomOut()
    if (e.key === '0') { currentZoom = 1.0; applyZoom() }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); toggleBookmark() }
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); printCurrentDaf() }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); toggleSearch() }
})

// ── Smooth pinch-to-zoom (trackpad) ──────────────────────────────────────────
viewerScroll.addEventListener('wheel', e => {
  if (!e.ctrlKey) return
  e.preventDefault()

  const rect    = viewerScroll.getBoundingClientRect()
  const cursorY = e.clientY - rect.top
  const contentY = viewerScroll.scrollTop + cursorY

  const rawDelta = e.deltaY * (e.deltaMode === 1 ? 15 : e.deltaMode === 2 ? 600 : 1)
  const factor   = Math.exp(-rawDelta * 0.004)
  const newZoom  = Math.min(3.0, Math.max(0.4, currentZoom * factor))
  if (Math.abs(newZoom - currentZoom) < 0.001) return

  const ratio   = newZoom / currentZoom
  currentZoom   = newZoom
  zoomLevel.value = Math.round(newZoom * 100) + '%'

  // Synchronously scale all page canvases so the user sees immediate feedback
  pageMap.forEach(info => {
    const cw = parseFloat(info.canvas.style.width)  || info.canvas.width  / (window.devicePixelRatio || 1)
    const ch = parseFloat(info.canvas.style.height) || info.canvas.height / (window.devicePixelRatio || 1)
    info.canvas.style.width  = (cw * ratio) + 'px'
    info.canvas.style.height = (ch * ratio) + 'px'
    info.inner.style.width   = (cw * ratio) + 'px'
    info.inner.style.height  = (ch * ratio) + 'px'
  })

  viewerScroll.scrollTop = contentY * ratio - cursorY

  clearTimeout(_zoomDebounce)
  _zoomDebounce = setTimeout(applyZoom, 200)
}, { passive: false })

// ── Boot ──────────────────────────────────────────────────────────────────────
init()
