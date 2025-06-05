import React from 'react';

function Table({ playerNames, games, totalScores, getText, handlePlayerNameChange, handleScoreChange, handleDeleteGame }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-6xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center justify-center"></span>
            </th>
            {playerNames.map((name, index) => (
              <th
                key={index}
                className="px-6 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center text-sm sm:text-base md:text-lg font-medium text-gray-700"
                  aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                  placeholder={`${getText('player')} ${index + 1}`}
                />
              </th>
            ))}
            <th className="px-3 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="bg-blue-50 font-bold text-blue-800">
            <td className="px-3 py-4 whitespace-nowrap text-center text-sm sm:text-base md:text-lg">
              {getText('total')}
            </td>
            {totalScores.map((total, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-center text-sm sm:text-base md:text-lg">
                {total}
              </td>
            ))}
            <td className="px-3 py-4 whitespace-nowrap text-center font-medium"></td>
          </tr>
          {games.map(game => (
            <tr key={game.id}>
              <td className="px-3 py-4 whitespace-nowrap text-center text-sm sm:text-base md:text-lg font-medium text-gray-900">
                {game.id} {getText('game')}
              </td>
              {playerNames.map((_, playerIndex) => (
                <td key={playerIndex} className="px-6 py-2 whitespace-nowrap text-center text-sm sm:text-base md:text-lg text-gray-900">
                  {game.isEditable ? (
                    <input
                      type="text" /* Consider type="number" if only numbers are allowed, but current logic handles parsing */
                      value={game.scores[playerIndex]}
                      onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-sm sm:text-base md:text-lg"
                      aria-label={`${game.id} ${getText('game')} ${playerNames[playerIndex] || (getText('player') + (playerIndex + 1))} ${getText('score')}`}
                    />
                  ) : (
                    <span className="block w-full p-2 text-center text-sm sm:text-base md:text-lg">
                      {game.scores[playerIndex]}
                    </span>
                  )}
                </td>
              ))}
              <td className="px-3 py-4 whitespace-nowrap text-center font-medium">
                {!game.isEditable && games.length > 1 && ( /* Show delete only if not editable and more than one game */
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900 text-sm sm:text-base md:text-lg font-semibold py-1 px-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      aria-label={`${game.id} ${getText('game')} ${getText('delete')}`}
                      title={`${game.id} ${getText('game')} ${getText('delete')}`}
                    >
                      {getText('delete')}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;