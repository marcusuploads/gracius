import React from 'react';

const TIERS = [
  { key: 'basic', hours: 3, emoji: '✨', label: 'Basic Glow' },
  { key: 'advanced', hours: 5, emoji: '⚡', label: 'Advanced Aura' },
  { key: 'max', hours: 8, emoji: '💎', label: 'Max Mode' },
  { key: 'godtier', hours: 12, emoji: '🐉', label: 'God-Tier Doodle' }
];

export default function UnlockBanner({ todaySeconds, tier }) {
  const hours = todaySeconds / 3600;
  const next = TIERS.find((t) => hours < t.hours);
  const progressPct = next
    ? Math.min(100, (hours / next.hours) * 100)
    : 100;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-80">Today's study time</p>
          <p className="text-2xl font-bold">{hours.toFixed(1)}h</p>
        </div>
        <div className="flex gap-1 text-2xl">
          {TIERS.map((t) => (
            <span key={t.key} className={hours >= t.hours ? 'opacity-100' : 'opacity-25 grayscale'}>
              {t.emoji}
            </span>
          ))}
        </div>
      </div>
      {next ? (
        <>
          <div className="w-full bg-white/20 rounded-full h-2 mb-1">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs opacity-90">
            {(next.hours - hours).toFixed(1)}h to unlock {next.emoji} {next.label}
          </p>
        </>
      ) : (
        <p className="text-sm font-semibold">🐉 God-Tier unlocked — legendary focus today!</p>
      )}
    </div>
  );
}
