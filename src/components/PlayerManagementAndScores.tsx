import React, { useEffect, useRef, useState } from 'react';
import { Translation } from '../i18n/translations';

type TranslationKey = keyof Translation;

interface PlayerManagementAndScoresProps {
  playerPool: string[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (index: number) => void;
  onUpdatePlayer: (index: number, name: string) => void;
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
  chomboCounts?: number[];
  onAddChombo?: (index: number) => void;
  onUndoChombo?: (index: number) => void;
}

function PlayerManagementAndScores({
  playerPool,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
  getText,
  chomboCounts = [],
  onAddChombo,
  onUndoChombo,
}: PlayerManagementAndScoresProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [openPlayerIndex, setOpenPlayerIndex] = useState<number | null>(null);
  const menuHistoryPushed = useRef(false);

  const closeMenu = () => {
    setOpenPlayerIndex(null);
    if (menuHistoryPushed.current) {
      menuHistoryPushed.current = false;
      window.history.back();
    }
  };

  const openMenu = (index: number) => {
    if (!menuHistoryPushed.current) {
      window.history.pushState({ ...(window.history.state || {}), playerManagementMenu: true }, '');
      menuHistoryPushed.current = true;
    }
    setOpenPlayerIndex(index);
  };

  useEffect(() => {
    if (openPlayerIndex === null) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    const handlePopState = () => {
      menuHistoryPushed.current = false;
      setOpenPlayerIndex(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [openPlayerIndex]);

  useEffect(() => () => {
    if (menuHistoryPushed.current) {
      menuHistoryPushed.current = false;
      window.history.back();
    }
  }, []);

  const handleAddClick = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
  };

  const selectedPlayerName = openPlayerIndex === null ? '' : playerPool[openPlayerIndex];
  const selectedChomboCount = openPlayerIndex === null ? 0 : (chomboCounts[openPlayerIndex] || 0);

  return (
    <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-4 mb-4">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">{getText('playerPoolTitle')}</h3>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-gray-50 border border-gray-300 rounded-md p-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={getText('addPlayerPlaceholder')}
        />
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
        >
          {getText('addPlayer')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {playerPool.map((name, index) => (
          <div key={index} className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            <input
              type="text"
              value={name}
              onChange={(e) => onUpdatePlayer(index, e.target.value)}
              className="flex-grow bg-white border border-gray-300 rounded p-1 text-sm sm:text-base w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
            />
            <button
              onClick={() => openMenu(index)}
              className="text-gray-600 hover:text-gray-900 font-bold p-1 rounded-md hover:bg-gray-200 transition-colors flex-shrink-0"
              title={getText('playerActions')}
              aria-label={`${getText('playerActions')}: ${name}`}
              aria-haspopup="dialog"
              aria-expanded={openPlayerIndex === index}
            >
              <span aria-hidden="true" className="text-lg leading-none">⋮</span>
            </button>
          </div>
        ))}
      </div>

      {openPlayerIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="presentation"
          onClick={closeMenu}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-actions-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 id="player-actions-title" className="text-lg font-semibold text-gray-800">{selectedPlayerName}</h4>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-md p-1 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label={getText('closeMenu')}
              >
                ×
              </button>
            </div>
            {onAddChombo && (
              <button
                type="button"
                onClick={() => onAddChombo(openPlayerIndex)}
                className="mb-2 w-full rounded-md bg-amber-500 px-3 py-2 text-left font-semibold text-white hover:bg-amber-600"
              >
                {getText('addChombo')}
              </button>
            )}
            {onUndoChombo && (
              <button
                type="button"
                onClick={() => onUndoChombo(openPlayerIndex)}
                disabled={selectedChomboCount === 0}
                className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {getText('undoChombo', { count: selectedChomboCount })}
              </button>
            )}
            <button
              type="button"
              onClick={() => { closeMenu(); onRemovePlayer(openPlayerIndex); }}
              className="w-full rounded-md px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
            >
              {getText('remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerManagementAndScores;
