import React from 'react';

function Table({ playerNames, games, totalScores, getText, handlePlayerNameChange, handleScoreChange, handleDeleteGame, handleScoreInputKeyDown, handlePositionChange, isUmaOkaPage, handleUmaOkaScoreChange, handlePlayerForPositionChange }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full max-w-6xl"> 
      <table className="divide-y divide-gray-200"> {/* min-w-full 제거 고려 */}
        <thead className="bg-gray-50">
          <tr>
            <th className="bmb:p-px bmb:text-xs px-0.5 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center justify-center"></span>
            </th>
            {isUmaOkaPage
              ? ['east', 'south', 'west', 'north'].map(position => (
                  <th key={position} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
                    {getText(position)}
                  </th>
                ))
              : playerNames.map((name, index) => (
                  <th key={index} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center bmb:text-xs bmb:p-0 text-xs min-w-[60px] sm:text-sm sm:min-w-[80px] md:text-base md:min-w-[100px] font-medium text-gray-700"
                      aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                      placeholder={`${getText('player')} ${index + 1}`}
                    />
                  </th>
                ))}
            <th className="bmb:p-px bmb:text-xs px-0.5 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {!isUmaOkaPage && (
            <tr className="bg-blue-50 font-bold text-blue-800">
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base">
                {getText('total')}
              </td>
              {totalScores.map((total, index) => (
                <td key={index} className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-4 sm:py-3 sm:text-sm md:text-base">
                  {total}
                </td>
              ))}
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center font-medium"></td>
            </tr>
          )}
          {games.map((game, gameIndex) => ( // gameIndex 추가
            <tr key={game.id}> {/* key는 고유한 game.id 사용 */}
              <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-900">
                {gameIndex + 1} {/* 표시되는 경기 번호는 gameIndex + 1 사용 */}
              </td>
              {isUmaOkaPage ? (
                game.isEditable ? (
                  <td colSpan={4} className="p-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                      {['east', 'south', 'west', 'north'].map(position => (
                        <div key={position} className="flex flex-col gap-2">
                          <select
                            value={game.participants[position] ?? ''}
                            onChange={(e) => handlePlayerForPositionChange(game.id, position, e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 text-center bmb:text-xs"
                          >
                            <option value=""></option>
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
                )
              ) : (
                playerNames.map((_, playerIndex) => (
                  <td key={playerIndex} className="bmb:p-px bmb:text-xs px-1 py-1 whitespace-nowrap text-xs sm:px-2 sm:py-1.5 sm:text-sm md:text-base text-gray-900">
                    <div className="flex flex-col items-center">
                      {game.isEditable ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          value={game.scores[playerIndex]}
                          onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                          onKeyDown={handleScoreInputKeyDown}
                          className="w-full bmb:px-px bmb:py-px bmb:text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:p-2 sm:text-sm md:text-base score-input-js"
                          aria-label={`${getText('game')} ${gameIndex + 1} ${playerNames[playerIndex] || (getText('player') + (playerIndex + 1))} ${getText('score')}`}
                        />
                      ) : (
                        <span className="block w-full bmb:px-px bmb:py-px bmb:text-xs p-1 text-center text-xs sm:p-2 sm:text-sm md:text-base">
                          {game.scores[playerIndex]}
                        </span>
                      )}
                    </div>
                  </td>
                ))
              )}
              <td className="bmb:p-px bmb:text-xs px-0.5 py-3 whitespace-nowrap text-center font-medium">
                {!game.isEditable && games.length > 1 && ( /* Show delete only if not editable and more than one game */
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="text-red-600 hover:text-red-900 bmb:text-xs bmb:p-1 text-xs sm:text-sm md:text-base font-semibold sm:py-1 sm:px-1 rounded-lg hover:bg-red-100 transition-colors duration-200"
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