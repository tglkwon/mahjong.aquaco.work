import React from 'react';

function Table({ playerNames, games, totalScores, getText, handlePlayerNameChange, handleScoreChange, handleDeleteGame, handleScoreInputKeyDown, handlePositionChange, isUmaOkaPage, handleUmaOkaScoreChange, handlePlayerForPositionChange, handleScoreButtonClick }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full max-w-6xl"> 
      <table className="divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="bmb:p-px bmb:text-xs px-0.5 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center justify-center"></span>
            </th>
            {isUmaOkaPage
              ? ['east', 'south', 'west', 'north'].map(position => (
                  <th key={position} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
                    {getText(position)}
                  </th>
                ))
              : playerNames.map((name, index) => (
                  <th key={index} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center bmb:text-xs bmb:p-0 text-xs min-w-[60px] sm:text-sm sm:min-w-[80px] md:text-base md:min-w-[100px] lg:text-lg lg:min-w-[120px] xl:text-xl xl:min-w-[140px] font-medium text-gray-700"
                      aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                      placeholder={`${getText('player')} ${index + 1}`}
                    />
                  </th>
                ))}
            <th className="bmb:p-px bmb:text-xs px-0.5 py-3 text-center text-sm sm:text-base md:text-lg xl:text-xl font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {!isUmaOkaPage && (
            <tr className="bg-blue-50 font-bold text-blue-800">
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base lg:text-lg xl:text-xl">
                {getText('total')}
              </td>
              {totalScores.map((total, index) => (
                <td key={index} className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-4 sm:py-3 sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  {total}
                </td>
              ))}
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center font-medium"></td>
            </tr>
          )}
          {games.map((game, gameIndex) => (
            <tr key={game.id}>
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-gray-900">
                {gameIndex + 1}
              </td>
              {isUmaOkaPage ? (
                // UmaOkaTable.js로 분리되었으므로 이 부분은 비워둡니다.
                <></>
              ) : (
                playerNames.map((_, playerIndex) => (
                  <td key={playerIndex} className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-xs sm:px-2 sm:py-3 sm:text-sm md:text-base text-gray-900">
                    <div className="flex flex-col items-center">
                      {game.isEditable ? (
                        <div className="relative w-full">
                          <input
                            type="number"
                            value={game.scores[playerIndex]}
                            onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                            onKeyDown={handleScoreInputKeyDown}
                            className="w-full bmb:px-px bmb:py-px bmb:text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:p-2 sm:text-sm md:text-base lg:text-lg xl:text-xl score-input-js"
                            aria-label={`${getText('game')} ${gameIndex + 1} ${playerNames[playerIndex] || (getText('player') + (playerIndex + 1))} ${getText('score')}`}
                          />
                          <button
                            onClick={() => handleScoreButtonClick(game.id, playerIndex, 'decrement')}
                            className="absolute left-0 top-0 h-full px-2 text-lg text-gray-600 hover:text-red-500"
                            aria-label="Decrement score"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleScoreButtonClick(game.id, playerIndex, 'increment')}
                            className="absolute right-0 top-0 h-full px-2 text-lg text-gray-600 hover:text-green-500"
                            aria-label="Increment score"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="block w-full bmb:px-px bmb:py-px bmb:text-xs p-1 text-center text-xs sm:p-2 sm:text-sm md:text-base lg:text-lg xl:text-xl">
                          {game.scores[playerIndex]}
                        </span>
                      )}
                    </div>
                  </td>
                ))
              )}
              <td className="bmb:p-px bmb:text-xs px-0.5 py-3 sm:py-3 whitespace-nowrap text-center font-medium">
                {!game.isEditable && games.length > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900 bmb:text-xs bmb:p-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold sm:py-1 sm:px-1 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      aria-label={`${gameIndex + 1} ${getText('delete')}`}
                      title={`${gameIndex + 1} ${getText('delete')}`}
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