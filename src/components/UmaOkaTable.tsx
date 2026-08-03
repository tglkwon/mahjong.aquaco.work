import React from 'react';
import { Translation } from '../i18n/translations';
import { Game, UmaOkaScores } from '../types';

type TranslationKey = keyof Translation;

interface UmaOkaTableProps {
  playerNames: string[];
  games: Game[];
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
  handleDeleteGame: (gameId: number) => void;
  handleScoreInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleUmaOkaScoreChange: (gameId: number, position: string, newScore: string) => void;
  handlePlayerForPositionChange: (gameId: number, position: string, playerIndex: string) => void;
  handleUmaOkaScoreButtonClick: (gameId: number, position: string, operation: 'increment' | 'decrement') => void;
}

const positions = ['east', 'south', 'west', 'north'] as const;

function TableHeader({ getText }: { getText: UmaOkaTableProps['getText'] }) {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="bmb:p-px bmb:text-xs px-0.5 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base font-medium text-gray-500 uppercase tracking-wider" />
        {positions.map((position) => (
          <th key={position} className="bmb:p-px bmb:text-xs px-1 py-2 text-center sm:px-4 sm:py-3 sm:text-sm md:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider sm:w-auto">
            {getText(position)}
          </th>
        ))}
        <th className="bmb:p-px bmb:text-xs px-0.5 py-3 text-center text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider" />
      </tr>
    </thead>
  );
}

function RecordedGameRow({ game, gameNumber, playerNames, getText, handleDeleteGame }: {
  game: Game;
  gameNumber: number;
  playerNames: string[];
  getText: UmaOkaTableProps['getText'];
  handleDeleteGame: UmaOkaTableProps['handleDeleteGame'];
}) {
  return (
    <tr>
      <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base xl:text-lg font-medium text-gray-900">{gameNumber}</td>
      {positions.map((position) => {
        const playerIndex = game.participants ? game.participants[position] : undefined;
        const score = game.scores ? (game.scores as UmaOkaScores)[position] : undefined;
        const playerName = playerIndex !== undefined && playerNames[playerIndex] ? playerNames[playerIndex] : '';
        return (
          <td key={position} className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-2 sm:py-3 sm:text-sm md:text-base text-gray-900">
            {playerIndex !== undefined && score !== undefined ? (
              <div className="flex flex-col items-center justify-center h-full">
                <span className="block w-full text-xs sm:text-sm xl:text-base font-medium text-gray-600 bmb:text-xs truncate" title={playerName}>{playerName}</span>
                <span className="block w-full bmb:px-px bmb:py-px bmb:text-xs p-1 text-xs sm:p-2 sm:text-sm md:text-base xl:text-lg">{score}</span>
              </div>
            ) : <span className="text-gray-400">-</span>}
          </td>
        );
      })}
      <td className="bmb:p-px bmb:text-xs px-0.5 py-3 sm:py-3 whitespace-nowrap text-center font-medium">
        <button
          onClick={() => handleDeleteGame(game.id)}
          className="text-red-600 hover:text-red-900 bmb:text-xs bmb:p-1 text-xs sm:text-sm md:text-base xl:text-lg font-semibold sm:py-1 sm:px-1 rounded-lg hover:bg-red-100 transition-colors duration-200"
          aria-label={`${getText('game')} ${gameNumber} ${getText('delete')}`}
          title={`${getText('game')} ${gameNumber} ${getText('delete')}`}
        >
          X
        </button>
      </td>
    </tr>
  );
}

function EditableGameRow({ game, gameNumber, playerNames, getText, handleScoreInputKeyDown, handleUmaOkaScoreChange, handlePlayerForPositionChange, handleUmaOkaScoreButtonClick }: {
  game: Game;
  gameNumber: number;
  playerNames: string[];
  getText: UmaOkaTableProps['getText'];
  handleScoreInputKeyDown: UmaOkaTableProps['handleScoreInputKeyDown'];
  handleUmaOkaScoreChange: UmaOkaTableProps['handleUmaOkaScoreChange'];
  handlePlayerForPositionChange: UmaOkaTableProps['handlePlayerForPositionChange'];
  handleUmaOkaScoreButtonClick: UmaOkaTableProps['handleUmaOkaScoreButtonClick'];
}) {
  return (
    <tr>
      <td className="bmb:p-px bmb:text-xs px-1 py-3 whitespace-nowrap text-center text-xs sm:px-3 sm:py-3 sm:text-sm md:text-base xl:text-lg font-medium text-gray-900">{gameNumber}</td>
      <td colSpan={5} className="p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
          {positions.map((position) => (
            <div key={position} className="flex flex-col gap-2">
              <select
                value={game.participants ? game.participants[position] ?? '' : ''}
                onChange={(e) => handlePlayerForPositionChange(game.id, position, e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-md text-xs sm:text-sm xl:text-base focus:outline-none focus:ring-1 focus:ring-blue-400 text-center bmb:text-xs"
                aria-label={`${getText('game')} ${gameNumber} ${getText(position)} ${getText('player')}`}
              >
                <option value="" disabled>{getText('player')}</option>
                {playerNames.map((playerName, playerIndex) => <option key={playerIndex} value={playerIndex}>{playerName}</option>)}
              </select>
              <div className="relative">
                <input
                  type="number"
                  value={(game.scores as UmaOkaScores)[position] ?? ''}
                  onChange={(e) => handleUmaOkaScoreChange(game.id, position, e.target.value)}
                  onKeyDown={handleScoreInputKeyDown}
                  className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:text-sm xl:text-lg score-input-js"
                  placeholder={getText('score')}
                  aria-label={`${getText('game')} ${gameNumber} ${getText(position)} ${getText('score')}`}
                />
                <button onClick={() => handleUmaOkaScoreButtonClick(game.id, position, 'decrement')} className="absolute left-0 top-0 h-full px-2 text-lg text-gray-600 hover:text-red-500" aria-label="Decrement score">-</button>
                <button onClick={() => handleUmaOkaScoreButtonClick(game.id, position, 'increment')} className="absolute right-0 top-0 h-full px-2 text-lg text-gray-600 hover:text-green-500" aria-label="Increment score">+</button>
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function UmaOkaTable({ playerNames, games, getText, handleDeleteGame, handleScoreInputKeyDown, handleUmaOkaScoreChange, handlePlayerForPositionChange, handleUmaOkaScoreButtonClick }: UmaOkaTableProps) {
  const recordedGames = games.filter((game) => !game.isEditable);
  const editableGame = games.find((game) => game.isEditable);

  return (
    <>
      <section className="w-full max-w-6xl mb-4">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">{getText('recordedScoresTitle')}</h3>
        {recordedGames.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full">
            <table className="divide-y divide-gray-200 w-full">
              <TableHeader getText={getText} />
              <tbody className="bg-white divide-y divide-gray-200">
                {recordedGames.map((game) => (
                  <RecordedGameRow key={game.id} game={game} gameNumber={games.indexOf(game) + 1} playerNames={playerNames} getText={getText} handleDeleteGame={handleDeleteGame} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editableGame && (
        <section className="w-full max-w-6xl mb-4">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">{getText('scoreInputTitle')}</h3>
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full">
            <table className="divide-y divide-gray-200 w-full">
              <TableHeader getText={getText} />
              <tbody className="bg-white divide-y divide-gray-200">
                <EditableGameRow
                  game={editableGame}
                  gameNumber={games.indexOf(editableGame) + 1}
                  playerNames={playerNames}
                  getText={getText}
                  handleScoreInputKeyDown={handleScoreInputKeyDown}
                  handleUmaOkaScoreChange={handleUmaOkaScoreChange}
                  handlePlayerForPositionChange={handlePlayerForPositionChange}
                  handleUmaOkaScoreButtonClick={handleUmaOkaScoreButtonClick}
                />
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export default UmaOkaTable;
