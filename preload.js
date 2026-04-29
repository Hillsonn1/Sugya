const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('talmud', {
  getTalmudPath:      ()       => ipcRenderer.invoke('get-talmud-path'),
  loadData:           ()       => ipcRenderer.invoke('load-data'),
  saveData:           (data)   => ipcRenderer.invoke('save-data', data),
  readPDF:            (p)      => ipcRenderer.invoke('read-pdf', p),
  getTractateFiles:   (folder) => ipcRenderer.invoke('get-tractate-files', folder),

  getConfig:          ()          => ipcRenderer.invoke('get-config'),
  saveConfig:         (cfg)       => ipcRenderer.invoke('save-config', cfg),
  translate:          (args)      => ipcRenderer.invoke('translate', args),
  previewPdf:         ()          => ipcRenderer.invoke('preview-pdf'),
  printWindow:        ()          => ipcRenderer.invoke('print-window'),
  loadTranslations:   ()          => ipcRenderer.invoke('load-translations'),
  saveTranslations:   (data)      => ipcRenderer.invoke('save-translations', data),
  getOcrWords:        (t, d, a)   => ipcRenderer.invoke('get-ocr-words', t, d, a),

  onWindowState: (cb) => ipcRenderer.on('window-state', (_, s) => cb(s)),

  winMinimize: () => ipcRenderer.send('win-minimize'),
  winMaximize: () => ipcRenderer.send('win-maximize'),
  winClose:    () => ipcRenderer.send('win-close'),
})
