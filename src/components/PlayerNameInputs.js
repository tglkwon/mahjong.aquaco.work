import React from 'react';

function PlayerNameInputs({ playerNames, handlePlayerNameChange, getText, totalScores }) {
  return (
    <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        {playerNames.map((name, index) => (
          <div key={index}>
            <label htmlFor={`player-name-input-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              {`${getText('player')} ${index + 1}`}
            </label>
            <input
              id={`player-name-input-${index}`}
              type="text"
              value={name}
              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder={`${getText('player')} ${index + 1} ${getText('name')}`}
            />
            <div className="mt-2 text-center font-semibold text-blue-800 text-sm sm:text-base">
              <span>{getText('total')}: </span>
              <span className="font-bold">{totalScores[index]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerNameInputs;