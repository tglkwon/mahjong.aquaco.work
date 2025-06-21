import React from 'react';

function UmaOkaTable({ playerNames, games, getText, handleDeleteGame, handleScoreInputKeyDown, handleUmaOkaScoreChange, handlePlayerForPositionChange }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full max-w-6xl">
      <table className="divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="bmb:p-px bmb:text-xs px-0.5 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center justify-center"></span>
            </th>
            {['east', 'south', 'west', 'north'].map(position => (
              <th key={position} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
                {getText(position)}
              </th>
            ))}
            <th className="bmb:p-px bmb:text-xs px-0.5 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {games.map((game, gameIndex) => (
            <tr key={game.id}>
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-900">
                {gameIndex + 1}
              </td>
              {game.isEditable ? (
                <td colSpan={4} className="p-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                    {['east', 'south', 'west', 'north'].map(position => (
                      <div key={position} className="flex flex-col gap-2">
                        <select
                          value={game.participants[position] ?? ''}
                          onChange={(e) => handlePlayerForPositionChange(game.id, position, e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 text-center bmb:text-xs"
                          aria-label={`${getText('game')} ${gameIndex + 1} ${getText(position)} ${getText('player')}`}
                        >
                          <option value="" disabled>{getText('player')}</option>
                          {playerNames.map((pName, pIdx) => (
                            <option key={pIdx} value={pIdx}>{pName}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={game.scores[position] ?? ''}
                          onChange={(e) => handleUmaOkaScoreChange(game.id, position, e.target.value)}
                          onKeyDown={handleScoreInputKeyDown}
                          className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:text-sm score-input-js"
                          placeholder={getText('score')}
                          aria-label={`${getText('game')} ${gameIndex + 1} ${getText(position)} ${getText('score')}`}
                        />
                      </div>
                    ))}
                  </div>
                </td>
              ) : (
                ['east', 'south', 'west', 'north'].map(position => {
                  const playerIndex = game.participants ? game.participants[position] : undefined;
                  const score = game.scores ? game.scores[position] : undefined;
                  const playerName = (playerIndex !== undefined && playerNames[playerIndex]) ? playerNames[playerIndex] : '';

                  return (
                    <td key={position} className="bmb:p-px bmb:text-xs px-1 py-1 whitespace-nowrap text-center text-xs sm:px-2 sm:py-1.5 sm:text-sm md:text-base text-gray-900">
                      {(playerIndex !== undefined && score !== undefined) ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="block w-full text-xs sm:text-sm font-medium text-gray-600 bmb:text-xs truncate" title={playerName}>
                            {playerName}
                          </span>
                          <span className="block w-full bmb:px-px bmb:py-px bmb:text-xs p-1 text-xs sm:p-2 sm:text-sm md:text-base">
                            {score}
                          </span>
                        </div>
                      ) : (<span className="text-gray-400">-</span>)}
                    </td>
                  );
                })
              )}
              <td className="bmb:p-px bmb:text-xs px-0.5 py-3 whitespace-nowrap text-center font-medium">
                {!game.isEditable && games.length > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900 bmb:text-xs bmb:p-1 text-xs sm:text-sm md:text-base font-semibold sm:py-1 sm:px-1 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      aria-label={`${getText('game')} ${gameIndex + 1} ${getText('delete')}`}
                      title={`${getText('game')} ${gameIndex + 1} ${getText('delete')}`}
                    >
                      X
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

export default UmaOkaTable;