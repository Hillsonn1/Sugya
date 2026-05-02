"""
Downloads Sefaria-linked commentaries for every amud and saves them as
gzipped per-tractate JSON files at src/commentary-data/{Tractate}.json.gz.

The renderer's IPC layer reads these directly — no API calls at runtime.

Output shape per tractate file:
  {
    "002a": [
      { "en": "Ben Yehoyada", "he": "בן יהוידע", "refs": [
          { "ref": "Ben Yehoyada on Berakhot 2a:1",
            "anchorRef": "Berakhot 2a:1",
            "he": "...", "en": "..." }, ... ] },
      ...
    ],
    "002b": [...],
    ...
  }

Resumable: loads existing tractate file and skips amudim already populated.
"""

import sys, os, re, json, gzip, time, urllib.request, urllib.error
from pathlib import Path

OUT_DIR = Path(r"C:\Users\mindy\Documents\talmud-app\src\commentary-data")
PROJ    = Path(r"C:\Users\mindy\Documents\talmud-app")

# Tractate name → Sefaria URL name (mirror of SEFARIA_NAMES in renderer.js)
SEFARIA_NAMES = {
    'Berachos':'Berakhot',     'Shabbos':'Shabbat',       'Eruvin':'Eruvin',
    'Pesachim':'Pesachim',     'Shekalim':'Shekalim',     'Yoma':'Yoma',
    'Sukkah':'Sukkah',         'Beitzah':'Beitzah',       'Rosh Hashana':'Rosh_Hashanah',
    'Taanis':'Taanit',         'Megillah':'Megillah',     'Moed Katan':'Moed_Katan',
    'Chagigah':'Chagigah',     'Yevamos':'Yevamot',       'Kesubos':'Ketubot',
    'Nedarim':'Nedarim',       'Nazir':'Nazir',           'Sotah':'Sotah',
    'Gittin':'Gittin',         'Kiddushin':'Kiddushin',   'Bava Kamma':'Bava_Kamma',
    'Bava Metzia':'Bava_Metzia','Bava Basra':'Bava_Batra','Sanhedrin':'Sanhedrin',
    'Makkos':'Makkot',         'Shevuos':'Shevuot',       'Avodah Zarah':'Avodah_Zarah',
    'Horayos':'Horayot',       'Zevachim':'Zevachim',     'Menachos':'Menachot',
    'Chullin':'Chullin',       'Bechoros':'Bekhorot',     'Arachin':'Arakhin',
    'Temurah':'Temurah',       'Kereisos':'Keritot',      'Meilah':'Meilah',
    'Tamid':'Tamid',           'Niddah':'Niddah',
}

# Tractate display name → file-stem (underscored). Also gives us iteration order.
TRACTATES = [
    ('Berachos',     64,  'a'),  ('Shabbos',      157, 'b'),
    ('Eruvin',       105, 'a'),  ('Pesachim',     121, 'b'),
    ('Shekalim',     22,  'b'),  ('Yoma',         88,  'a'),
    ('Sukkah',       56,  'b'),  ('Beitzah',      40,  'b'),
    ('Rosh Hashana', 35,  'a'),  ('Taanis',       31,  'a'),
    ('Megillah',     32,  'a'),  ('Moed Katan',   29,  'a'),
    ('Chagigah',     27,  'a'),  ('Yevamos',      122, 'b'),
    ('Kesubos',      112, 'b'),  ('Nedarim',      91,  'b'),
    ('Nazir',        66,  'b'),  ('Sotah',        49,  'b'),
    ('Gittin',       90,  'b'),  ('Kiddushin',    82,  'b'),
    ('Bava Kamma',   119, 'b'),  ('Bava Metzia',  119, 'a'),
    ('Bava Basra',   176, 'b'),  ('Sanhedrin',    113, 'b'),
    ('Makkos',       24,  'b'),  ('Shevuos',      49,  'b'),
    ('Avodah Zarah', 76,  'b'),  ('Horayos',      14,  'a'),
    ('Zevachim',     120, 'b'),  ('Menachos',     110, 'a'),
    ('Chullin',      142, 'a'),  ('Bechoros',     61,  'a'),
    ('Arachin',      34,  'a'),  ('Temurah',      34,  'a'),
    ('Kereisos',     28,  'b'),  ('Meilah',       22,  'a'),
    ('Tamid',        33,  'b'),  ('Niddah',       73,  'a'),
]

BLOCKLIST = {
    'Rashi', 'Tosafot', 'Steinsaltz', 'Gilyon HaShas',
    'Masoret HaShas', 'Mesorat HaShas',
    'Abraham Cohen', 'Reshimot Shiurim',
}

FETCH_INTERVAL = 0.20  # seconds between API calls — be polite

_last_fetch = 0.0


def fetch_links(sef_name, daf, amud, max_attempts=5):
    """Returns the JSON array of links from Sefaria, or None after retries."""
    global _last_fetch
    url = f'https://www.sefaria.org/api/links/{sef_name}.{daf}{amud}?with_text=1'
    for attempt in range(1, max_attempts + 1):
        delta = time.time() - _last_fetch
        if delta < FETCH_INTERVAL:
            time.sleep(FETCH_INTERVAL - delta)
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.loads(resp.read())
            _last_fetch = time.time()
            return data
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError,
                ConnectionResetError, ConnectionError, OSError) as e:
            _last_fetch = time.time()
            if attempt < max_attempts:
                backoff = 2 ** attempt  # 2, 4, 8, 16 sec
                print(f'  · retry {attempt}/{max_attempts} for {sef_name}.{daf}{amud} '
                      f'in {backoff}s ({type(e).__name__})', flush=True)
                time.sleep(backoff)
            else:
                print(f'  ! gave up on {sef_name}.{daf}{amud} after {max_attempts} attempts: {e}',
                      flush=True)
                return None


def _flatten_text(v):
    """Sefaria sometimes returns nested arrays for he/text. Flatten to a string."""
    if v is None:
        return ''
    if isinstance(v, str):
        return v
    if isinstance(v, list):
        return ' '.join(filter(None, (_flatten_text(x) for x in v)))
    return str(v)


def parse_amud(links):
    """Returns the per-amud commentaries list (matches renderer's data shape).
    Sefaria returns a list of link dicts on success, or sometimes an error dict
    or string. Non-list responses just yield no commentaries."""
    if not isinstance(links, list):
        return []
    by_book = {}
    for link in links:
        if not isinstance(link, dict) or link.get('category') != 'Commentary':
            continue
        ct = link.get('collectiveTitle') or {}
        en = ct.get('en') or link.get('commentator') or link.get('index_title')
        if not en or en in BLOCKLIST:
            continue
        he = ct.get('he') or en
        he_text = _flatten_text(link.get('he'))
        en_text = _flatten_text(link.get('text'))
        if not he_text and not en_text:
            continue
        if en not in by_book:
            by_book[en] = {'en': en, 'he': he, 'refs': []}
        by_book[en]['refs'].append({
            'ref':       link.get('ref'),
            'anchorRef': link.get('anchorRef'),
            'he':        he_text,
            'en':        en_text,
        })
    # Sort by Hebrew name
    return sorted(by_book.values(), key=lambda v: v['he'])


def amudim_for(tractate_name, max_daf, last_amud):
    out = []
    for daf in range(2, max_daf + 1):
        out.append((daf, 'a'))
        if not (daf == max_daf and last_amud == 'a'):
            out.append((daf, 'b'))
    return out


def page_key(daf, amud):
    return f'{daf:03d}{amud}'


def load_existing(file_path):
    if not file_path.exists():
        return {}
    try:
        with gzip.open(file_path, 'rt', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def save_tractate(file_path, data):
    tmp = file_path.with_suffix('.json.tmp')
    with gzip.open(tmp, 'wt', encoding='utf-8', compresslevel=6) as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    tmp.replace(file_path)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Optional CLI arg: a single tractate name (display form), e.g. "Berachos"
    only = ' '.join(sys.argv[1:]) if len(sys.argv) > 1 else None

    total_amudim = sum(len(amudim_for(n, m, l)) for n, m, l in TRACTATES if not only or n == only)
    done_overall = 0
    t0 = time.time()

    for tractate_name, max_daf, last_amud in TRACTATES:
        if only and tractate_name != only:
            continue
        sef_name = SEFARIA_NAMES.get(tractate_name)
        if not sef_name:
            print(f'  ! No Sefaria name for {tractate_name}; skipping')
            continue
        file_stem = tractate_name.replace(' ', '_')
        file_path = OUT_DIR / f'{file_stem}.json.gz'
        data = load_existing(file_path)

        amudim = amudim_for(tractate_name, max_daf, last_amud)
        pending = [(d, a) for d, a in amudim if page_key(d, a) not in data]

        print(f'\n→ {tractate_name}: {len(amudim)} amudim, {len(pending)} pending')
        if not pending:
            done_overall += len(amudim)
            continue

        for i, (daf, amud) in enumerate(pending, 1):
            links = fetch_links(sef_name, daf, amud)
            if links is None:
                continue
            data[page_key(daf, amud)] = parse_amud(links)
            done_overall += 1
            if i % 25 == 0 or i == len(pending):
                save_tractate(file_path, data)
                elapsed = time.time() - t0
                rate = done_overall / elapsed if elapsed else 0
                eta = (total_amudim - done_overall) / rate if rate else 0
                print(f'   [{i:4d}/{len(pending)}] {tractate_name} {daf}{amud}  '
                      f'overall {done_overall}/{total_amudim}  ETA {eta/60:.0f} min', flush=True)

        save_tractate(file_path, data)
        size_mb = file_path.stat().st_size / (1024*1024)
        print(f'  ✓ {tractate_name}: {len(data)} amudim, {size_mb:.1f} MB')

    print(f'\nAll done in {(time.time()-t0)/60:.1f} min')


if __name__ == '__main__':
    main()
