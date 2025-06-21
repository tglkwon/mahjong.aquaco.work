import React, { useState } from 'react';

function PlayerManagementAndScores({ playerPool, onAddPlayer, onRemovePlayer, onUpdatePlayer, totalScores, getText }) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddClick = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-4 mb-4">
      {/* Player Pool Management Section */}
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{getText('playerPoolTitle')}</h3>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-gray-50 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={getText('addPlayerPlaceholder')}
        />
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-grow bg-white border border-gray-300 rounded p-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
            />
            <button
              onClick={() => onRemovePlayer(index)}
              className="text-red-500 hover:text-red-700 font-bold p-1 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
              title={`${getText('remove')} ${name}`}
              aria-label={`${getText('remove')} ${name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Player Total Scores Section */}
      <h3 className="text-lg font-semibold mb-3 text-blue-800">{getText('totalScoresTitle')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {playerPool.map((name, index) => (
          <div key={index} className="text-center bg-blue-50 p-2 rounded-md border border-blue-200">
            <div className="font-medium text-gray-700 truncate" title={name}>{name}</div>
            <div className="font-bold text-lg text-blue-900">{totalScores[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerManagementAndScores;