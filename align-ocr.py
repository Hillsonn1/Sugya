"""
Cross-references existing OCR data with the Sefaria Hebrew text and snaps
each OCR word's text + section to the canonical reading.

Input:
  - src/ocr-data/{Tractate}.json.gz   (existing OCR output)
  - Sefaria HTTP API                  (canonical Hebrew, fetched + cached)

Output:
  - src/ocr-data/{Tractate}.json.gz   (overwritten in-place)
  - .sefaria-cache.json               (per-page Hebrew text, idempotent)

What it changes per page:
  - text:    overwritten with the matched Sefaria word (no nikud) when alignment is confident
  - section: a non-Gemara OCR word that confidently aligns to Sefaria's Gemara
             AND sits in the page's center column gets relabeled to 0 (Gemara).

Resumable: if a tractate's pages all already have an "_aligned" marker in the
JSON, that tractate is skipped.

Usage:
  python align-ocr.py                      # all tractates
  python align-ocr.py Berachos             # one tractate
  python align-ocr.py --dry Menachos 107a  # preview a single page (no write)
"""

import sys, os, re, json, gzip, time, urllib.request, urllib.error
from pathlib import Path
from difflib import SequenceMatcher

OCR_DIR     = Path(r"C:\Users\mindy\Documents\talmud-app\src\ocr-data")
CACHE_FILE  = Path(r"C:\Users\mindy\Documents\talmud-app\.sefaria-cache.json")
# The Electron app's background-downloaded translation store. Has every amud's
# Hebrew + English already, so we don't need to re-hit Sefaria's API.
APP_TRANSLATIONS = Path(os.environ.get('APPDATA', '')) / 'Sugya' / 'talmud-translations.json'

# ── Tractate name mapping (mirror of SEFARIA_NAMES in renderer.js) ────────────
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

# Filename uses underscores; lookup needs the spaced display name
NAME_FROM_FILE = {n.replace(' ', '_'): n for n in SEFARIA_NAMES}

_NIKUD_RE = re.compile(r'[֑-ׇ]')
_PUNCT_RE = re.compile(r'[\s־׀׳״–—"\'()\[\].,;:!?]+')
_NON_HEB  = re.compile(r'[^֐-׿]')

SIM_THRESH = 0.70   # fuzzy-match floor for snapping OCR text to Sefaria text
MIN_TOKEN_LEN = 2

# Section codes (mirror build-ocr-db.py)
SEC_GEMARA = 0
SEC_RASHI  = 1
SEC_TOSFOS = 2
SEC_MARGIN = 3
SEC_NOISE  = 4

# Relabel a non-Gemara OCR word as Gemara only if its center-x falls inside this
# horizontal band — guards against accidentally promoting Rashi/Tosfos words
# that happen to coincidentally match a Sefaria word.
GEMARA_X_MIN = 0.22
GEMARA_X_MAX = 0.78


def strip_nikud(s):
    return _NIKUD_RE.sub('', s)


def clean_token(s):
    """Strip nikud, punctuation, and non-Hebrew chars. Returns '' if nothing left."""
    s = _NIKUD_RE.sub('', s)
    s = _NON_HEB.sub('', s)
    return s


def tokenize_text(text):
    """Split Sefaria/OCR text into clean Hebrew word tokens."""
    parts = _PUNCT_RE.split(text or '')
    return [t for t in (clean_token(p) for p in parts) if len(t) >= MIN_TOKEN_LEN]


def sim(a, b):
    """Quick similarity (0..1) between two Hebrew tokens."""
    if a == b: return 1.0
    if not a or not b: return 0.0
    return SequenceMatcher(None, a, b, autojunk=False).ratio()


# ── Sefaria source: prefer the app's local translation cache; API as fallback ─
_app_translations = None        # {tract_underscored_DDDamud: [{he, en}, ...]}
_text_cache = None              # {tract_displayName.<daf><amud>: combined hebrew text}
_last_fetch_time = 0.0
_FETCH_INTERVAL = 0.25          # seconds — be polite to Sefaria's API


def load_app_translations():
    global _app_translations
    if _app_translations is not None: return _app_translations
    if APP_TRANSLATIONS.exists():
        print(f'  → Loading app translation store: {APP_TRANSLATIONS} '
              f'({APP_TRANSLATIONS.stat().st_size // (1024*1024)} MB)')
        with open(APP_TRANSLATIONS, encoding='utf-8') as f:
            _app_translations = json.load(f)
        print(f'    loaded {len(_app_translations)} amudim from local cache')
    else:
        print(f'  ! App translation store missing at {APP_TRANSLATIONS} — '
              f'will fall back to Sefaria API')
        _app_translations = {}
    return _app_translations


def load_cache():
    global _text_cache
    if _text_cache is not None: return _text_cache
    if CACHE_FILE.exists():
        with open(CACHE_FILE, encoding='utf-8') as f:
            _text_cache = json.load(f)
    else:
        _text_cache = {}
    return _text_cache


def save_cache():
    if _text_cache is None: return
    tmp = CACHE_FILE.with_suffix('.json.tmp')
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(_text_cache, f, ensure_ascii=False)
    tmp.replace(CACHE_FILE)


def _strip_segment_html(s):
    return re.sub(r'<[^>]*>', '', s or '').strip()


def fetch_sefaria(tractate_display, daf, amud):
    """Returns the concatenated Hebrew text for one amud, or '' if unavailable.

    Source priority:
      1. The Electron app's local translation store (talmud-translations.json) —
         already contains every amud the user's app has downloaded.
      2. .sefaria-cache.json (text-only fallback cache built by this script).
      3. Sefaria HTTP API (rate-limited; only as last resort).
    """
    global _last_fetch_time
    sef_name = SEFARIA_NAMES.get(tractate_display)
    if not sef_name: return ''
    cache_key = f'{sef_name}.{daf}{amud}'

    # 1. App translation store — keyed by underscored display name + DDDamud
    app = load_app_translations()
    app_key = f'{tractate_display.replace(" ", " ")}_{daf:03d}{amud}'
    # Note: app keys use the SPACED display name with underscore separator
    # e.g. "Bava Kamma_002a", but with the space preserved inside the name
    # Verified via inspection: keys use "Berachos_002a", "Bava Metzia_002a"
    segs = app.get(app_key)
    if segs:
        text = ' '.join(_strip_segment_html(s.get('he', '')) for s in segs
                        if s.get('he') and _strip_segment_html(s.get('he', '')))
        if text:
            return text

    # 2. Local text-only cache
    cache = load_cache()
    if cache_key in cache:
        return cache[cache_key]

    # 3. Sefaria API (rate-limited)
    delta = time.time() - _last_fetch_time
    if delta < _FETCH_INTERVAL:
        time.sleep(_FETCH_INTERVAL - delta)
    url = f'https://www.sefaria.org/api/texts/{sef_name}.{daf}{amud}?lang=he&pad=0'
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read())
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        print(f'  ! Sefaria fetch failed for {cache_key}: {e}')
        _last_fetch_time = time.time()
        return ''
    _last_fetch_time = time.time()

    def flatten(a):
        if isinstance(a, list):
            for x in a: yield from flatten(x)
        else:
            yield a
    text = ' '.join(_strip_segment_html(s)
                    for s in flatten(data.get('he', []))
                    if s and _strip_segment_html(s))
    cache[cache_key] = text
    return text


# ── Alignment ─────────────────────────────────────────────────────────────────
def align_sequences(ocr_tokens, sef_tokens, sim_thresh=SIM_THRESH):
    """
    For each OCR token, return the index of its matched Sefaria token (or None).
    Returning indices (not values) avoids the .index() ambiguity when the same
    word appears multiple times in Sefaria.

    Strategy: difflib's matching blocks give us exact-match anchors. Between
    anchors, greedily assign OCR tokens to the most-similar unused Sefaria
    token in the gap, accepting only when similarity >= sim_thresh.
    """
    n = len(ocr_tokens)
    aligned = [None] * n
    if not ocr_tokens or not sef_tokens:
        return aligned

    sm = SequenceMatcher(a=ocr_tokens, b=sef_tokens, autojunk=False)
    blocks = sm.get_matching_blocks()

    # Anchors: exact matches
    for blk in blocks:
        for k in range(blk.size):
            aligned[blk.a + k] = blk.b + k

    # Fuzzy-fill the gaps between consecutive anchor blocks
    prev_a_end = 0
    prev_b_end = 0
    for blk in blocks:
        ocr_gap = range(prev_a_end, blk.a)
        sef_gap = list(range(prev_b_end, blk.b))
        if ocr_gap and sef_gap:
            used = set()
            for i in ocr_gap:
                best_sim, best_j = 0.0, None
                for j in sef_gap:
                    if j in used: continue
                    s = sim(ocr_tokens[i], sef_tokens[j])
                    if s > best_sim:
                        best_sim, best_j = s, j
                if best_j is not None and best_sim >= sim_thresh:
                    aligned[i] = best_j
                    used.add(best_j)
        prev_a_end = blk.a + blk.size
        prev_b_end = blk.b + blk.size

    return aligned


def align_page(words, sef_text):
    """
    Mutates `words` in place. Returns (corrected_count, relabeled_count).
    `words` is the OCR list-of-lists for one page.
    """
    sef_tokens = tokenize_text(sef_text)
    if not sef_tokens:
        return 0, 0

    # ── Pass 1: align section-0 (Gemara) OCR words to Sefaria ────────────────
    gemara_idx = [i for i, w in enumerate(words) if w[5] == SEC_GEMARA]
    gemara_tokens = [clean_token(words[i][0]) for i in gemara_idx]

    aligned = align_sequences(gemara_tokens, sef_tokens)
    sef_used = set()
    corrected = 0
    for k, i in enumerate(gemara_idx):
        if aligned[k] is None: continue
        sef_used.add(aligned[k])
        sef_word = sef_tokens[aligned[k]]
        if sef_word != gemara_tokens[k]:
            words[i][0] = sef_word
            corrected += 1

    # ── Pass 2: rescue mislabeled Gemara words ───────────────────────────────
    # The block-clustering in build-ocr-db.py sometimes mislabels a chunk of
    # Gemara as section 3 (margin) when a chapter heading or layout quirk
    # disrupts clustering. (It also misses Mishna at the top of a chapter — the
    # Mishna is structurally part of Sefaria's Gemara text but sits above the
    # main Gemara block on the page.) We promote a non-Gemara word back to
    # Gemara only when ALL of these hold:
    #   1. Center column horizontally: x_center ∈ [0.22, 0.78]
    #   2. Token is ≥ 3 characters (skip noise-prone short words)
    #   3. Similarity ≥ 0.92 to an unused Sefaria token
    #   4. Part of a run of ≥ 2 consecutive nearby promotions (the strongest
    #      filter — single common-word matches are essentially always noise)
    relabeled = 0
    if len(sef_used) < len(sef_tokens):
        unused = set(range(len(sef_tokens))) - sef_used
        tentative = []
        for i, w in enumerate(words):
            if w[5] == SEC_GEMARA: continue
            xc = w[1] + w[3] / 2
            if not (GEMARA_X_MIN <= xc <= GEMARA_X_MAX): continue
            tok = clean_token(w[0])
            if len(tok) < 3: continue

            best_sim, best_j = 0.0, None
            for j in unused:
                s = sim(tok, sef_tokens[j])
                if s > best_sim:
                    best_sim, best_j = s, j
            if best_j is not None and best_sim >= 0.92:
                tentative.append((i, best_j))

        # Run filter: keep only matches that have at least one neighbor (in OCR
        # reading order, gap ≤ 3 OCR positions) that also matched and whose
        # Sefaria index is also nearby (within 5 tokens).
        tentative.sort()
        keep = [False] * len(tentative)
        for k in range(len(tentative)):
            i_k, j_k = tentative[k]
            # Look back and forward for a neighbor
            for d in (-1, 1):
                idx = k + d
                if 0 <= idx < len(tentative):
                    i_n, j_n = tentative[idx]
                    if abs(i_n - i_k) <= 3 and abs(j_n - j_k) <= 5:
                        keep[k] = True
                        break

        # Apply, double-checking sef_used to avoid duplicate assignments
        for (i, j), ok in zip(tentative, keep):
            if not ok or j in sef_used: continue
            words[i][0] = sef_tokens[j]
            words[i][5] = SEC_GEMARA
            sef_used.add(j)
            relabeled += 1

    return corrected, relabeled


# ── Driver ────────────────────────────────────────────────────────────────────
def process_tractate(tractate_file_name, only_amud=None, dry=False):
    """tractate_file_name is the underscored form e.g. 'Bava_Basra'."""
    display_name = NAME_FROM_FILE.get(tractate_file_name)
    if not display_name:
        print(f'  ! Unknown tractate file: {tractate_file_name}')
        return

    path = OCR_DIR / f'{tractate_file_name}.json.gz'
    if not path.exists():
        print(f'  ! Missing OCR file: {path.name}')
        return

    with gzip.open(path, 'rt', encoding='utf-8') as f:
        data = json.load(f)

    if data.get('_aligned') and not only_amud:
        print(f'  · {tractate_file_name}: already aligned, skipping')
        return

    page_keys = sorted(k for k in data.keys() if not k.startswith('_'))
    if only_amud:
        page_keys = [k for k in page_keys if k == only_amud]
        if not page_keys:
            print(f'  ! Page {only_amud} not in {tractate_file_name}')
            return

    total_pages = len(page_keys)
    total_corrected = 0
    total_relabeled = 0
    total_words = 0
    no_sefaria = 0

    print(f'  → {display_name} ({total_pages} pages)')
    t0 = time.time()
    for n, key in enumerate(page_keys, 1):
        daf = int(key[:-1])
        amud = key[-1]
        sef_text = fetch_sefaria(display_name, daf, amud)
        if not sef_text:
            no_sefaria += 1
            continue
        corrected, relabeled = align_page(data[key], sef_text)
        total_corrected += corrected
        total_relabeled += relabeled
        total_words += sum(1 for w in data[key] if w[5] == SEC_GEMARA)
        if n % 25 == 0 or n == total_pages:
            elapsed = time.time() - t0
            rate = n / elapsed if elapsed else 0
            eta = (total_pages - n) / rate if rate else 0
            print(f'    [{n:4d}/{total_pages}] corrected={total_corrected} '
                  f'relabeled={total_relabeled} no-sef={no_sefaria} '
                  f'ETA {eta:.0f}s')
        # Save cache periodically so an interrupted run doesn't lose all fetches
        if n % 50 == 0:
            save_cache()

    save_cache()

    if not dry:
        data['_aligned'] = True
        with gzip.open(path, 'wt', encoding='utf-8', compresslevel=6) as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    pct = (total_corrected / total_words * 100) if total_words else 0
    print(f'  ✓ {display_name}: corrected {total_corrected} of ~{total_words} '
          f'Gemara words ({pct:.1f}%), relabeled {total_relabeled}, '
          f'no-Sefaria {no_sefaria} pages')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    dry = '--dry' in flags

    if len(args) >= 2:
        # Single page: <tractate-file-name> <pageKey e.g. "002a">
        process_tractate(args[0], only_amud=args[1], dry=dry)
    elif len(args) == 1:
        process_tractate(args[0], dry=dry)
    else:
        files = sorted(OCR_DIR.glob('*.json.gz'))
        for f in files:
            # Path.stem only strips .gz, leaving "Arachin.json"; chop both suffixes
            process_tractate(f.name.removesuffix('.json.gz'), dry=dry)


if __name__ == '__main__':
    main()
