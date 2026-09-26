import { useEffect, useState } from 'react';
import Scene from '../components/Scene';
import ParentGate from '../components/ParentGate';
import { useApp, callName } from '../state/store';
import { speak } from '../lib/speech';
import { resetTo } from '../state/router';
import { grantExtraMinutes, remainingSeconds } from '../state/actions';
import { A } from '../data/scene';
import './sleep.css';

export default function SleepScreen() {
  const profile = useApp((s) => s.profile);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    void speak(`${callName(profile)}、きょうは たくさん がんばったね。また あした あそぼうね。おやすみなさい。`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gate) {
    return (
      <ParentGate
        onPass={() => {
          if (remainingSeconds() <= 0) grantExtraMinutes(10);
          resetTo({ name: 'home' });
        }}
        onCancel={() => setGate(false)}
      />
    );
  }

  return (
    <div className="screen sleep-screen">
      <Scene bg="night" actors={[A('buddy', 50, 50, 42, 'none', { mood: 'sleep' }), A('🌙', 82, 18, 14, 'twinkle'), A('⭐', 16, 20, 8, 'twinkle', { d: 0.5 })]} className="sleep-scene" />
      <div className="sleep-text">また あした あそぼうね。おやすみ</div>
      <button className="sleep-parent ui" onClick={() => setGate(true)}>
        おうちの方(時間をのばす)
      </button>
    </div>
  );
}
