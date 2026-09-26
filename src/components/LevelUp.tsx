import './status.css';

/** レベル アップ の おおきな しるし */
export function LevelUpBanner({ level }: { level: number }) {
  return (
    <div className="levelup" data-testid="levelup" data-level={level}>
      <span className="levelup-rays" aria-hidden />
      <div className="levelup-banner">
        <span className="levelup-text">レベル アップ!</span>
        <span className="levelup-num">
          レベル <b>{level}</b>
        </span>
      </div>
    </div>
  );
}
