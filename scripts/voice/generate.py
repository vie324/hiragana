#!/usr/bin/env python3
"""
VOICEVOX で アプリの 声を つくる (ローカルで 1かい だけ うごかす スクリプト)。

  1. VOICEVOX ENGINE を うごかす (http://127.0.0.1:50021)
  2. npm run voice:catalog                   → scripts/voice/phrases.json
  3. python3 scripts/voice/generate.py --speaker 3 --slug zundamon
       → public/voice/<slug>/index.json と パック (.bin)

できた 声は キャッシュ (--cache) に のこるので、ぶんを ふやしたときは ふえた ぶんだけ つくる。
mp3 に するため ffmpeg (libmp3lame) が いる (--ffmpeg で ばしょを しめせる)。
"""
import argparse
import array
import concurrent.futures as cf
import hashlib
import io
import json
import math
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
import wave

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
PACK_ORDER = ['ui', 'kana', 'word', 'book']
# こえの ちょうし (こどもが ききとりやすいように すこし ゆっくり・はっきり)
PARAMS = {'speedScale': 0.95, 'intonationScale': 1.15, 'prePhonemeLength': 0.05, 'postPhonemeLength': 0.12}
QUOTE_PAUSE = 0.12
SMALL = 'ゃゅょぁぃぅぇぉゎ'
UNIT = re.compile(r'^[ぁ-ゖ][' + SMALL + r']?$')


def hira2kata(s):
    return ''.join(chr(ord(c) + 0x60) if 'ぁ' <= c <= 'ゖ' else c for c in s)


def prep(text):
    """「は」を「わ」と よまれないように、1もじの ところは カタカナに する"""
    t = re.sub(r'\s+', ' ', text).strip()
    t = re.sub(r'「([ぁ-ゖ]{1,2})」', lambda m: '「' + (hira2kata(m.group(1)) if UNIT.match(m.group(1)) else m.group(1)) + '」', t)
    if UNIT.match(t):
        t = hira2kata(t)
    return t


SEP = re.compile(r'[\s、。!?！？「」『』…]+')


def fix_pauses(text, query):
    """ことばの あいだの 空白で できる 「ま」を けす (よみにくく なるので)"""
    kinds = []
    for m in SEP.finditer(text):
        if m.start() == 0 or m.end() == len(text):
            continue
        s = m.group()
        if re.search(r'[、。!?！？…]', s):
            kinds.append('punct')
        elif re.search(r'[「」『』]', s):
            kinds.append('quote')
        else:
            kinds.append('space')
    aps = [ap for ap in query['accent_phrases'] if ap.get('pause_mora')]
    if len(aps) != len(kinds):
        return False
    for ap, k in zip(aps, kinds):
        if k == 'space':
            ap['pause_mora'] = None
        elif k == 'quote':
            ap['pause_mora']['vowel_length'] = min(QUOTE_PAUSE, ap['pause_mora']['vowel_length'])
    return True


def post(url, data=None):
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'} if data else {}, method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def synth(engine, speaker, text):
    q = json.loads(post(f'{engine}/audio_query?' + urllib.parse.urlencode({'text': text, 'speaker': speaker})))
    if not q['accent_phrases']:
        return None
    fix_pauses(text, q)
    q.update(PARAMS)
    return post(f'{engine}/synthesis?speaker={speaker}', json.dumps(q).encode())


# 1もじ・みじかい ことばは 20dB ちかく ちいさく できるので、しゃべっている ところの おおきさを そろえる
TARGET_DB = -24.0
PEAK_DB = -1.0
MAX_GAIN_DB = 26.0


def loudness_gain(wav_path):
    """しゃべっている ところ (いちばん おおきい ところから 30dB いない) の RMS を TARGET_DB に する"""
    with wave.open(wav_path) as w:
        rate = w.getframerate()
        a = array.array('h', w.readframes(w.getnframes()))
    if not a:
        return 0.0
    n = max(1, int(rate * 0.02))
    rms = [math.sqrt(sum(x * x for x in a[i:i + n]) / n) / 32768 + 1e-9 for i in range(0, max(1, len(a) - n), n)]
    top = max(rms)
    active = [r for r in rms if r > top * 10 ** (-30 / 20)]
    arms = 20 * math.log10(math.sqrt(sum(r * r for r in active) / len(active)))
    peak = 20 * math.log10(max(abs(x) for x in a) / 32768 + 1e-9)
    return max(-12.0, min(TARGET_DB - arms, PEAK_DB - peak, MAX_GAIN_DB))


def encode_mp3(ffmpeg, wav_path, bitrate):
    gain = loudness_gain(wav_path)
    p = subprocess.run(
        [ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', wav_path, '-af', f'volume={gain:.2f}dB', '-ac', '1', '-ar', '24000',
         '-codec:a', 'libmp3lame', '-b:a', bitrate, '-f', 'mp3', 'pipe:1'],
        capture_output=True, check=True)
    return p.stdout


def wav_ms(wav):
    with wave.open(io.BytesIO(wav)) as w:
        return round(w.getnframes() * 1000 / w.getframerate())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--speaker', type=int, required=True, help='VOICEVOX の スタイル ID')
    ap.add_argument('--slug', required=True, help='public/voice/<slug>')
    ap.add_argument('--engine', default='http://127.0.0.1:50021')
    ap.add_argument('--ffmpeg', default='ffmpeg')
    ap.add_argument('--cache', default=os.path.join(ROOT, '.voice-cache'))
    ap.add_argument('--jobs', type=int, default=3)
    ap.add_argument('--bitrate', default='32k', help='mp3 の ビットレート')
    ap.add_argument('--limit', type=int, default=0, help='ためしに すこしだけ つくる')
    args = ap.parse_args()

    phrases = json.load(open(os.path.join(ROOT, 'scripts/voice/phrases.json'), encoding='utf-8'))
    if args.limit:
        phrases = phrases[: args.limit]
    speakers = json.loads(urllib.request.urlopen(f'{args.engine}/speakers').read())
    who = next((s, st) for s in speakers for st in s['styles'] if st['id'] == args.speaker)
    version = json.loads(urllib.request.urlopen(f'{args.engine}/version').read())
    cache_dir = os.path.join(args.cache, str(args.speaker))
    os.makedirs(cache_dir, exist_ok=True)
    params_sig = json.dumps(PARAMS, sort_keys=True) + f'q{QUOTE_PAUSE}'

    def job(entry):
        # 声は wav で キャッシュして、mp3 は ビットレートごとに つくる
        text = prep(entry['text'])
        h = hashlib.sha1((text + '|' + params_sig).encode()).hexdigest()[:16]
        wav_path = os.path.join(cache_dir, h + '.wav')
        if not os.path.exists(wav_path):
            wav = synth(args.engine, args.speaker, text)
            if wav is None:
                return entry, None, 0
            open(wav_path + '.tmp', 'wb').write(wav)
            os.replace(wav_path + '.tmp', wav_path)
        ms = wav_ms(open(wav_path, 'rb').read())
        mp3_path = os.path.join(cache_dir, f'{h}.{args.bitrate}.n{TARGET_DB:g}.mp3')
        if not os.path.exists(mp3_path):
            open(mp3_path + '.tmp', 'wb').write(encode_mp3(args.ffmpeg, wav_path, args.bitrate))
            os.replace(mp3_path + '.tmp', mp3_path)
        return entry, mp3_path, ms

    results = []
    with cf.ThreadPoolExecutor(args.jobs) as ex:
        for i, r in enumerate(ex.map(job, phrases), 1):
            results.append(r)
            if i % 200 == 0 or i == len(phrases):
                print(f'{i}/{len(phrases)}', flush=True)

    out_dir = os.path.join(ROOT, 'public', 'voice', args.slug)
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        os.remove(os.path.join(out_dir, f))
    packs, clips = [], {}
    for pi, pack in enumerate(PACK_ORDER):
        buf = bytearray()
        for entry, path, ms in results:
            if entry['pack'] != pack or not path:
                continue
            data = open(path, 'rb').read()
            clips[entry['key']] = [pi, len(buf), len(data), ms]
            buf += data
        name = f'{pack}.{hashlib.sha1(buf).hexdigest()[:10]}.bin'
        open(os.path.join(out_dir, name), 'wb').write(buf)
        packs.append({'file': name, 'bytes': len(buf)})
    style = who[1]['name']
    index = {
        'v': 1,
        'voice': {'slug': args.slug, 'name': who[0]['name'], 'style': style, 'credit': f"VOICEVOX:{who[0]['name']}", 'engine': version},
        'packs': packs,
        'clips': clips,
    }
    json.dump(index, open(os.path.join(out_dir, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    total = sum(p['bytes'] for p in packs)
    missing = [e['key'] for e, p, _ in results if not p]
    print(f'{len(clips)} clips, {total / 1e6:.1f} MB, skipped {len(missing)}: {missing[:10]}')


if __name__ == '__main__':
    sys.exit(main())
