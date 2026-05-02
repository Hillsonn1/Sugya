const { app, BrowserWindow, ipcMain, shell, Menu, MenuItem } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const zlib = require('zlib')

const TALMUD_PDF_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'pdfs')
  : path.join(require('os').homedir(), 'Documents', 'talmud', 'pdfs')

const OCR_DATA_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'ocr-data')
  : path.join(__dirname, 'src', 'ocr-data')

const COMMENTARY_DATA_ROOT = app.isPackaged
  ? path.join(process.resourcesPath, 'commentary-data')
  : path.join(__dirname, 'src', 'commentary-data')

const DATA_FILE         = path.join(app.getPath('userData'), 'talmud-data.json')
const CONFIG_FILE       = path.join(app.getPath('userData'), 'talmud-config.json')
const TRANSLATION_FILE  = path.join(app.getPath('userData'), 'talmud-translations.json')

// ── Default app data ──────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  bookmarks: [],
  notes: {},
  progress: {},
  highlights: {},
  lastViewed: { tractate: 'Berachos', daf: 2, amud: 'a' },
  settings: { theme: 'dark', zoom: 1.0, notesOpen: true, sidebarOpen: false },
  streak: { lastDate: null, current: 0, longest: 0 },
  learnedDates: []
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8')
      return { ...DEFAULT_DATA, ...JSON.parse(raw) }
    }
  } catch (e) { /* corrupt file, use defaults */ }
  return { ...DEFAULT_DATA }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// ── Window ─────────────────────────────────────────────────────────────────────
let win

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0d14',
    icon: path.join(__dirname, 'src', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // needed to load local file:// PDFs in PDF.js
    },
  })

  win.loadFile(path.join(__dirname, 'src', 'index.html'))
  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  win.on('maximize', () => win.webContents.send('window-state', 'maximized'))
  win.on('unmaximize', () => win.webContents.send('window-state', 'normal'))

  // Right-click → Copy / Select All when text is selected (used by Select-text mode)
  win.webContents.on('context-menu', (_, params) => {
    if (!params.selectionText || !params.selectionText.trim()) return
    const menu = new Menu()
    menu.append(new MenuItem({ label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => win.webContents.copy() }))
    menu.popup({ window: win })
  })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// ── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('get-talmud-path', () => TALMUD_PDF_ROOT)

// OCR word-position database (cached in memory per tractate)
const _ocrCache = new Map()
ipcMain.handle('get-ocr-words', (_, tractate, daf, amud) => {
  let data = _ocrCache.get(tractate)
  if (!data) {
    const file = path.join(OCR_DATA_ROOT, `${tractate.replace(/ /g, '_')}.json.gz`)
    if (!fs.existsSync(file)) return null
    try {
      const compressed = fs.readFileSync(file)
      data = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'))
      _ocrCache.set(tractate, data)
    } catch { return null }
  }
  const pageKey = `${String(daf).padStart(3, '0')}${amud}`
  return data[pageKey] || null
})

// Sefaria-linked commentaries (cached in memory per tractate, like OCR)
const _commentaryCache = new Map()
ipcMain.handle('get-commentaries', (_, tractate, daf, amud) => {
  let data = _commentaryCache.get(tractate)
  if (!data) {
    const file = path.join(COMMENTARY_DATA_ROOT, `${tractate.replace(/ /g, '_')}.json.gz`)
    if (!fs.existsSync(file)) return null
    try {
      const compressed = fs.readFileSync(file)
      data = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'))
      _commentaryCache.set(tractate, data)
    } catch { return null }
  }
  const pageKey = `${String(daf).padStart(3, '0')}${amud}`
  return data[pageKey] || null
})

ipcMain.handle('load-data', () => loadData())

ipcMain.handle('save-data', (_, data) => {
  saveData(data)
  return true
})

// Read PDF as base64 so it can cross the IPC bridge
ipcMain.handle('read-pdf', (_, pdfPath) => {
  try {
    if (!fs.existsSync(pdfPath)) return { exists: false }
    const buf = fs.readFileSync(pdfPath)
    return { exists: true, data: buf.toString('base64'), size: buf.length }
  } catch (e) {
    return { exists: false, error: e.message }
  }
})

// Check which PDFs exist for a tractate
ipcMain.handle('get-tractate-files', (_, tractateFolder) => {
  const dir = path.join(TALMUD_PDF_ROOT, tractateFolder)
  try {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => f.endsWith('.pdf'))
  } catch { return [] }
})

// Generate PDF preview using same pipeline as print
ipcMain.handle('preview-pdf', async () => {
  const buffer = await win.webContents.printToPDF({
    printBackground: false,
    pageSize: 'Letter',
    landscape: false,
  })
  return buffer.toString('base64')
})

// Print current window using webContents.print()
ipcMain.handle('print-window', () => new Promise(resolve => {
  win.webContents.print({ silent: false, printBackground: false }, (success, reason) => {
    resolve({ success, reason })
  })
}))

// Window controls
ipcMain.on('win-minimize', () => win?.minimize())
ipcMain.on('win-maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize())
ipcMain.on('win-close', () => win?.close())

// ── Config (API key etc.) ─────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
  } catch {}
  return {}
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8')
}

ipcMain.handle('get-config', () => loadConfig())
ipcMain.handle('save-config', (_, cfg) => { saveConfig({ ...loadConfig(), ...cfg }); return true })


// ── Translation cache persistence ─────────────────────────────────────────────
ipcMain.handle('load-translations', () => {
  try {
    if (fs.existsSync(TRANSLATION_FILE))
      return JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf8'))
  } catch {}
  return {}
})

ipcMain.handle('save-translations', async (_, data) => {
  await fs.promises.writeFile(TRANSLATION_FILE, JSON.stringify(data), 'utf8')
  return true
})

// ── Translation via Claude API ────────────────────────────────────────────────
ipcMain.handle('translate', async (_, { text, apiKey }) => {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are translating a page from the Talmud Bavli (Babylonian Talmud). The text below was extracted from a PDF of the Vilna Shas and contains Hebrew and Aramaic. It may include the Mishna, Gemara discussion, Rashi commentary, and Tosafot.\n\nPlease translate this into clear, readable English. Organize the translation to match the structure of the page — label sections (Mishna, Gemara, Rashi, Tosafot) where you can identify them. If the extracted text is garbled or out of order due to PDF extraction, do your best to reconstruct the meaning.\n\nText:\n${text}\n\nProvide only the English translation.`
    }]
  })

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(json.error.message)
          resolve(json.content[0].text)
        } catch (e) { reject(e.message) }
      })
    })
    req.on('error', e => reject(e.message))
    req.write(body)
    req.end()
  })
})
