import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const VALID_GAME_TOTAL_DEFAULT = 1000;
const VALID_GAME_TOTAL_HIGH = 100000;

function ScoreTrackerPage({ currentLanguage, setCurrentLanguage }) {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate('/');
  };

  const initialPlayerNames = Array(4).fill('');
  const initialGames = [{ id: 1, scores: Array(4).fill('') }];

  const [playerNames, setPlayerNames] = useState(initialPlayerNames);
  const [games, setGames] = useState(initialGames);

  const { getText } = useTranslation(currentLanguage);

  const handleAddGame = () => {
    const newGameId = games.length > 0 ? Math.max(...games.map(g => g.id)) + 1 : 1;
    setGames([...games, { id: newGameId, scores: Array(playerNames.length).fill('') }]);
  };

  const handleScoreChange = (gameId, playerIndex, newScore) => {
    setGames(games.map(game =>
      game.id === gameId
        ? {
            ...game,
            scores: game.scores.map((score, idx) =>
              idx === playerIndex ? (newScore === '' ? '' : parseInt(newScore, 10) || 0) : score
            ),
          }
        : game
    ));
  };

  const handlePlayerNameChange = (index, newName) => {
    setPlayerNames(playerNames.map((name, idx) => (idx === index ? newName : name)));
  };

  const totalScores = useMemo(() => {
    return playerNames.map((_, playerIndex) =>
      games.reduce((sum, game) => sum + (game.scores[playerIndex] === '' ? 0 : game.scores[playerIndex] || 0), 0)
    );
  }, [games, playerNames]);

  const handleDeleteGame = (gameIdToDelete) => {
    setGames(games.filter(game => game.id !== gameIdToDelete));
  };

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col items-center font-sans text-gray-800">
      <div className="fixed top-0 left-0 w-full bg-purple-400 h-14 flex items-center justify-between px-4 shadow-md z-50">
        <button
          className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={getText('menu')}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white mx-auto">{getText('scoreTrackerTitle')}</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
              aria-label={getText('language')}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <button
            onClick={goToHome}
            className="p-2 rounded-md text-white hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={getText('home')}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="pt-[78.4px] w-full max-w-6xl flex flex-col items-center p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-6xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider"></th>
                {playerNames.map((name, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      placeholder={`${getText('player')} ${index + 1}`}
                      className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center text-gray-700 font-medium text-xl"
                      aria-label={`${getText('player')} ${index + 1} ${getText('name')}`}
                    />
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider">O</th>
                <th className="px-6 py-3 text-center text-xl font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-blue-50 font-bold text-blue-800">
                <td className="px-6 py-4 whitespace-nowrap text-center text-xl">
                  {getText('total')}
                </td>
                {totalScores.map((total, index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-center text-xl">
                    {total}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-center text-xl"></td>
              </tr>
              {games.map(game => {
                const gameTotal = game.scores.reduce((sum, score) => sum + (score === '' ? 0 : score), 0);
                const isValid = gameTotal === 0 || gameTotal === VALID_GAME_TOTAL_DEFAULT || gameTotal === VALID_GAME_TOTAL_HIGH;

                return (
                  <tr key={game.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-medium text-gray-900">
                      {game.id} {getText('game')}
                    </td>
                    {playerNames.map((_, playerIndex) => (
                      <td key={playerIndex} className="px-6 py-2 whitespace-nowrap text-center text-xl text-gray-900">
                        <input
                          type="number"
                          value={game.scores[playerIndex]}
                          onChange={(e) => handleScoreChange(game.id, playerIndex, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xl"
                          aria-label={`${game.id} ${getText('game')} ${playerNames[playerIndex]} ${getText('score')}`}
                        />
                      </td>
                    ))}
                    {/* 점수 합이 조건을 만족했을 때 O를 별도 칸에 표시 */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-medium">
                      <span className={`text-xl font-bold ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                        {isValid ? 'O' : ''}
                      </span>
                    </td>
                    {/* 삭제 버튼을 별도 칸에 분리 */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-medium">
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="text-red-600 hover:text-red-900 text-xl font-semibold p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
                        aria-label={`${game.id} ${getText('game')} ${getText('delete')}`}
                        title={`${game.id} ${getText('game')} ${getText('delete')}`}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleAddGame}
          className="mt-8 ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xl"
          aria-label={getText('addRecord')}
        >
          {getText('addRecord')}
        </button>
        <div className="mt-8 text-gray-600 text-xl">
          <p>{getText('totalGames', { count: games.length })}</p>
        </div>
      </div>
    </div>
  );
}

export default ScoreTrackerPage;