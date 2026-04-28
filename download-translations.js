#!/usr/bin/env node
// Downloads all Sefaria translations (Hebrew + English) for the full Talmud Bavli.
// Run once from the talmud-app directory:
//   node download-translations.js
//
// Saves to: %APPDATA%\sugya\talmud-translations.json
// Resumes automatically if interrupted.

const https = require('https')
const fs    = require('fs')
const path  = require('path')
const os    = require('os')

const OUT_FILE = path.join(os.homedir(), 'AppData', 'Roaming', 'sugya', 'talmud-translations.json')

const TRACTATES = [
  { name:'Berachos',     maxDaf:64,  lastAmud:'a' },
  { name:'Shabbos',      maxDaf:157, lastAmud:'b' },
  { name:'Eruvin',       maxDaf:105, lastAmud:'a' },
  { name:'Pesachim',     maxDaf:121, lastAmud:'b' },
  { name:'Shekalim',     maxDaf:22,  lastAmud:'b' },
  { name:'Yoma',         maxDaf:88,  lastAmud:'a' },
  { name:'Sukkah',       maxDaf:56,  lastAmud:'b' },
  { name:'Beitzah',      maxDaf:40,  lastAmud:'b' },
  { name:'Rosh Hashana', maxDaf:35,  lastAmud:'a' },
  { name:'Taanis',       maxDaf:31,  lastAmud:'a' },
  { name:'Megillah',     maxDaf:32,  lastAmud:'a' },
  { name:'Moed Katan',   maxDaf:29,  lastAmud:'a' },
  { name:'Chagigah',     maxDaf:27,  lastAmud:'a' },
  { name:'Yevamos',      maxDaf:122, lastAmud:'b' },
  { name:'Kesubos',      maxDaf:112, lastAmud:'b' },
  { name:'Nedarim',      maxDaf:91,  lastAmud:'b' },
  { name:'Nazir',        maxDaf:66,  lastAmud:'b' },
  { name:'Sotah',        maxDaf:49,  lastAmud:'b' },
  { name:'Gittin',       maxDaf:90,  lastAmud:'b' },
  { name:'Kiddushin',    maxDaf:82,  lastAmud:'b' },
  { name:'Bava Kamma',   maxDaf:119, lastAmud:'b' },
  { name:'Bava Metzia',  maxDaf:119, lastAmud:'a' },
  { name:'Bava Basra',   maxDaf:176, lastAmud:'b' },
  { name:'Sanhedrin',    maxDaf:113, lastAmud:'b' },
  { name:'Makkos',       maxDaf:24,  lastAmud:'b' },
  { name:'Shevuos',      maxDaf:49,  lastAmud:'b' },
  { name:'Avodah Zarah', maxDaf:76,  lastAmud:'b' },
  { name:'Horayos',      maxDaf:14,  lastAmud:'a' },
  { name:'Zevachim',     maxDaf:120, lastAmud:'b' },
  { name:'Menachos',     maxDaf:110, lastAmud:'a' },
  { name:'Chullin',      maxDaf:142, lastAmud:'a' },
  { name:'Bechoros',     maxDaf:61,  lastAmud:'a' },
  { name:'Arachin',      maxDaf:34,  lastAmud:'a' },
  { name:'Temurah',      maxDaf:34,  lastAmud:'a' },
  { name:'Kereisos',     maxDaf:28,  lastAmud:'b' },
  { name:'Meilah',       maxDaf:22,  lastAmud:'a' },
  { name:'Tamid',        maxDaf:33,  lastAmud:'b' },
  { name:'Niddah',       maxDaf:73,  lastAmud:'a' },
]

const SEFARIA_NAMES = {
  'Berachos':'Berakhot',      'Shabbos':'Shabbat',        'Eruvin':'Eruvin',
  'Pesachim':'Pesachim',      'Shekalim':'Shekalim',      'Yoma':'Yoma',
  'Sukkah':'Sukkah',          'Beitzah':'Beitzah',        'Rosh Hashana':'Rosh_Hashanah',
  'Taanis':'Taanit',          'Megillah':'Megillah',      'Moed Katan':'Moed_Katan',
  'Chagigah':'Chagigah',      'Yevamos':'Yevamot',        'Kesubos':'Ketubot',
  'Nedarim':'Nedarim',        'Nazir':'Nazir',             'Sotah':'Sotah',
  'Gittin':'Gittin',          'Kiddushin':'Kiddushin',    'Bava Kamma':'Bava_Kamma',
  'Bava Metzia':'Bava_Metzia','Bava Basra':'Bava_Batra',  'Sanhedrin':'Sanhedrin',
  'Makkos':'Makkot',          'Shevuos':'Shevuot',        'Avodah Zarah':'Avodah_Zarah',
  'Horayos':'Horayot',        'Zevachim':'Zevachim',      'Menachos':'Menachot',
  'Chullin':'Chullin',        'Bechoros':'Bekhorot',      'Arachin':'Arakhin',
  'Temurah':'Temurah',        'Kereisos':'Keritot',       'Meilah':'Meilah',
  'Tamid':'Tamid',            'Niddah':'Niddah',
}

function makeKey(tractate, daf, amud) {
  return `${tractate}_${String(daf).padStart(3,'0')}${amud}`
}

function allAmudim() {
  const list = []
  for (const t of TRACTATES) {
    for (let daf = 2; daf <= t.maxDaf; daf++) {
      list.push({ tractate: t.name, daf, amud: 'a' })
      if (!(daf === t.maxDaf && t.lastAmud === 'a'))
        list.push({ tractate: t.name, daf, amud: 'b' })
    }
  }
  return list
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'sugya-talmud-app/1.0' } }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function fetchSefaria(tractate, daf, amud) {
  const name = SEFARIA_NAMES[tractate]
  if (!name) return null
  try {
    const data = await fetchJson(`https://www.sefaria.org/api/texts/${name}.${daf}${amud}?lang=bi&pad=0`)
    if (data.error) return null
    const flatten = a => Array.isArray(a) ? a.flatMap(flatten) : [a]
    const clean   = s => (s || '').replace(/<[^>]*>/g, '').trim()
    const en = flatten(data.text || []).map(clean).filter(Boolean)
    const he = flatten(data.he   || []).map(clean).filter(Boolean)
    const n  = Math.min(en.length, he.length)
    return Array.from({ length: n }, (_, i) => ({ en: en[i], he: he[i] }))
  } catch { return null }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function printProgress(done, total, failed) {
  const pct   = ((done / total) * 100).toFixed(1)
  const bar   = '█'.repeat(Math.floor(done / total * 30)).padEnd(30, '░')
  process.stdout.write(`\r[${bar}] ${pct}%  ${done}/${total}  (${failed} failed)  `)
}

async function main() {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })

  let cache = {}
  if (fs.existsSync(OUT_FILE)) {
    try { cache = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) }
    catch {}
  }

  const all  = allAmudim()
  const todo = all.filter(({ tractate, daf, amud }) => !cache[makeKey(tractate, daf, amud)])

  console.log(`Total amudim: ${all.length}`)
  console.log(`Already cached: ${all.length - todo.length}`)
  console.log(`To download: ${todo.length}`)
  if (!todo.length) { console.log('All done!'); return }
  console.log('')

  let done   = all.length - todo.length
  let failed = 0
  let dirty  = 0

  for (const { tractate, daf, amud } of todo) {
    const key = makeKey(tractate, daf, amud)
    const segments = await fetchSefaria(tractate, daf, amud)

    if (segments && segments.length) {
      cache[key] = segments
      dirty++
    } else {
      failed++
    }

    done++
    printProgress(done, all.length, failed)

    if (dirty > 0 && dirty % 50 === 0) {
      fs.writeFileSync(OUT_FILE, JSON.stringify(cache), 'utf8')
    }

    await sleep(300)
  }

  if (dirty > 0) fs.writeFileSync(OUT_FILE, JSON.stringify(cache), 'utf8')

  console.log(`\n\nDone. ${done - failed} saved, ${failed} unavailable.`)
  console.log(`File: ${OUT_FILE}`)
}

main().catch(console.error)
