import { useEffect, useRef } from 'react';
import { useRoute, resetTo, type Route } from './state/router';
import { useApp, getData } from './state/store';
import { setVoicePrefs } from './lib/speech';
import { loadVoice } from './voice/bank';
import { setSoundPrefs, wantBgm } from './lib/sound';
import { attachConfetti } from './lib/confetti';
import { comboReset } from './state/combo';
import ComboBadge from './components/ComboBadge';
import { addPlaySeconds, remainingSeconds } from './state/actions';
import StartScreen from './screens/StartScreen';
import SetupScreen from './screens/SetupScreen';
import BuddyScreen from './screens/BuddyScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import LessonScreen from './screens/LessonScreen';
import SpecialLessonScreen from './screens/SpecialLessonScreen';
import BalloonGame from './screens/games/BalloonGame';
import FirstSoundGame from './screens/games/FirstSoundGame';
import WordBuildGame from './screens/games/WordBuildGame';
import ReadQuizGame from './screens/games/ReadQuizGame';
import MemoryGame from './screens/games/MemoryGame';
import ShiritoriGame from './screens/games/ShiritoriGame';
import PlayMenu from './screens/PlayMenu';
import WriteMenu from './screens/WriteMenu';
import WriteKanaScreen from './screens/WriteKanaScreen';
import NameWriteScreen from './screens/NameWriteScreen';
import ChartScreen from './screens/ChartScreen';
import BookShelf from './screens/BookShelf';
import BookReader from './screens/BookReader';
import StickerBook from './screens/StickerBook';
import DressUpScreen from './screens/DressUpScreen';
import StampScreen from './screens/StampScreen';
import TreeScreen from './screens/TreeScreen';
import ParentScreen from './screens/ParentScreen';
import SleepScreen from './screens/SleepScreen';

const BGM_SCREENS = new Set<Route['name']>(['home', 'map', 'stickers', 'dressup', 'stamps', 'play', 'books', 'chart', 'write', 'buddy', 'tree']);
const UNTIMED = new Set<Route['name']>(['start', 'setup', 'parent', 'sleep']);

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'start':
      return <StartScreen />;
    case 'setup':
      return <SetupScreen />;
    case 'buddy':
      return <BuddyScreen />;
    case 'home':
      return <HomeScreen />;
    case 'map':
      return <MapScreen focus={route.focus} />;
    case 'lesson':
      return <LessonScreen kana={route.kana} nodeId={route.nodeId} />;
    case 'special':
      return <SpecialLessonScreen lessonId={route.lessonId} nodeId={route.nodeId} />;
    case 'balloon':
      return <BalloonGame kana={route.kana} nodeId={route.nodeId} script={route.script} />;
    case 'firstsound':
      return <FirstSoundGame kana={route.kana} nodeId={route.nodeId} script={route.script} />;
    case 'wordbuild':
      return <WordBuildGame nodeId={route.nodeId} script={route.script} />;
    case 'readquiz':
      return <ReadQuizGame nodeId={route.nodeId} script={route.script} />;
    case 'memory':
      return <MemoryGame nodeId={route.nodeId} script={route.script} />;
    case 'shiritori':
      return <ShiritoriGame />;
    case 'play':
      return <PlayMenu />;
    case 'write':
      return <WriteMenu tab={route.tab} />;
    case 'writeKana':
      return <WriteKanaScreen kana={route.kana} list={route.list} nodeId={route.nodeId} />;
    case 'name':
      return <NameWriteScreen />;
    case 'chart':
      return <ChartScreen />;
    case 'books':
      return <BookShelf />;
    case 'book':
      return <BookReader id={route.id} nodeId={route.nodeId} />;
    case 'stickers':
      return <StickerBook />;
    case 'dressup':
      return <DressUpScreen />;
    case 'stamps':
      return <StampScreen />;
    case 'tree':
      return <TreeScreen />;
    case 'parent':
      return <ParentScreen />;
    case 'sleep':
      return <SleepScreen />;
  }
}

function usePlayTimer(name: Route['name']) {
  const nameRef = useRef(name);
  nameRef.current = name;
  useEffect(() => {
    let pending = 0;
    let lastTick = Date.now();
    const flush = () => {
      if (pending > 0) {
        addPlaySeconds(pending);
        pending = 0;
      }
    };
    const t = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(15, Math.round((now - lastTick) / 1000));
      lastTick = now;
      if (document.hidden || UNTIMED.has(nameRef.current)) return;
      pending += dt;
      if (pending >= 30) flush();
      if (getData().settings.limitMin > 0) {
        flush();
        if (remainingSeconds() <= 0) resetTo({ name: 'sleep' });
      }
    }, 5000);
    const onHide = () => {
      if (document.hidden) flush();
      lastTick = Date.now();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(t);
      flush();
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);
}

/** すすむ / もどる で 画面の はいりかたを かえる */
function useNavDirection(version: number, depth: number): 'fwd' | 'back' | 'swap' {
  const last = useRef({ version, depth, dir: 'swap' as 'fwd' | 'back' | 'swap' });
  if (last.current.version !== version) {
    const dir = depth > last.current.depth ? 'fwd' : depth < last.current.depth ? 'back' : 'swap';
    last.current = { version, depth, dir };
  }
  return last.current.dir;
}

export default function App() {
  const { route, version, depth } = useRoute();
  const settings = useApp((s) => s.settings);
  const nav = useNavDirection(version, depth);

  useEffect(() => {
    setVoicePrefs({ voiceURI: settings.voiceURI, rate: settings.rate, pitch: settings.pitch });
    setSoundPrefs({ sfx: settings.sfx, bgm: settings.bgm, volume: settings.volume });
  }, [settings]);

  useEffect(() => {
    // テストでは パックを よみこまない (声の ファイルが あるかだけ しらべる)
    void loadVoice(settings.voice === 'tts' ? null : settings.voice, { packs: !window.__HIRAGANA_FAST_SPEECH__ });
  }, [settings.voice]);


  useEffect(() => {
    wantBgm(BGM_SCREENS.has(route.name));
  }, [route.name]);

  // コンボは その 画面の なかだけ
  useEffect(() => comboReset(), [version]);

  usePlayTimer(route.name);

  return (
    <div className="app" data-nav={nav}>
      <Screen route={route} key={version} />
      <ComboBadge />
      <canvas ref={attachConfetti} className="confetti-layer" aria-hidden />
    </div>
  );
}
