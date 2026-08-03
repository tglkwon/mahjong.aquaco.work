import React from 'react';
import { Translation } from '../i18n/translations';

type TranslationKey = keyof Translation;

interface PlayerTotalsProps {
  playerPool: string[];
  totalScores: (string | number)[];
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

function PlayerTotals({ playerPool, totalScores, getText }: PlayerTotalsProps) {
  const sortedPlayers = playerPool
    .map((name, index) => ({ name, index, score: Number(totalScores[index]) || 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return (
    <section className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-4 mb-4">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 text-blue-800">{getText('totalScoresTitle')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedPlayers.map(({ name, index }) => (
          <div key={index} className="text-center bg-blue-50 p-2 rounded-md border border-blue-200">
            <div className="font-medium text-gray-700 truncate" title={name}>{name}</div>
            <div className="font-bold text-lg sm:text-xl text-blue-900">{totalScores[index]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlayerTotals;
