import React from 'react';

function Table({ playerNames, games, totalScores, getText, handlePlayerNameChange, handleScoreChange, handleDeleteGame, handleScoreInputKeyDown }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full max-w-6xl"> 
      <table className="divide-y divide-gray-200"> {/* min-w-full 제거 고려 */}
        <thead className="bg-gray-50">
          <tr>
            <th className="xs:p-px xs:text-2xs px-0.5 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center justify-center"></span>
            </th>
            {playerNames.map((name, index) => (
              <th
                key={index}
                className="xs:p-px xs:text-2xs px-1 py-2 text-center text-xs sm:px-4 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider sm:w-auto"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center xs:text-2xs xs:min-w-[50px] xs:p-0 text-xs min-w-[70px] sm:text-sm sm:min-w-[80px] md:text-base md:min-w-[100px] font-medium text-gray-700"
                  aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                  placeholder={`${getText('player')} ${index + 1}`}
                />
              </th>
            ))}
            <th className="xs:p-px xs:text-2xs px-1 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="bg-blue-50 font-bold text-blue-800">
            <td className="xs:p-px xs:text-2xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base">
              {getText('total')}
            </td>
            {totalScores.map((total, index) => (
              <td key={index} className="xs:p-px xs:text-2xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-4 sm:py-3 sm:text-sm md:text-base">
                {total}
              </td>
            ))}
            <td className="xs:p-px xs:text-2xs px-1 py-3 whitespace-nowrap text-center font-medium"></td>
          </tr>
          {games.map(game => (
            <tr key={game.id}>
              <td className="xs:p-px xs:text-2xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-900">
                {game.id} {getText('game')}
              </td>
              {playerNames.map((_, playerIndex) => (
                <td key={playerIndex} className="xs:p-px xs:text-2xs px-1 py-1 whitespace-nowrap text-center text-xs sm:px-4 sm:py-1.5 sm:text-sm md:text-base text-gray-900">
                  {game.isEditable ? (
                    <input
                      type="number"
                      inputMode="numeric"
                      value={game.scores[playerIndex]}
                      onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                      onKeyDown={handleScoreInputKeyDown}
                      className="w-full xs:px-px xs:py-px xs:text-2xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:p-2 sm:text-sm md:text-base score-input-js"
                      aria-label={`${game.id} ${getText('game')} ${playerNames[playerIndex] || (getText('player') + (playerIndex + 1))} ${getText('score')}`}
                    />
                  ) : (
                    <span className="block w-full xs:px-px xs:py-px xs:text-2xs p-1 text-center text-xs sm:p-2 sm:text-sm md:text-base">
                      {game.scores[playerIndex]}
                    </span>
                  )}
                </td>
              ))}
              <td className="xs:p-px xs:text-2xs px-1 py-3 whitespace-nowrap text-center font-medium">
                {!game.isEditable && games.length > 1 && ( /* Show delete only if not editable and more than one game */
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900 xs:text-2xs p-1 xs:py-0 xs:px-px text-xs sm:text-sm md:text-base font-semibold py-0.5 px-1 sm:py-1 sm:px-1 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      aria-label={`${game.id} ${getText('game')} ${getText('delete')}`}
                      title={`${game.id} ${getText('game')} ${getText('delete')}`}
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

export default Table;