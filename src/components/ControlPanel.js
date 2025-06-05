import React from 'react';

function ControlPanel({ targetSum, setTargetSum, currentTotal, handleAddGame, isAddRecordButtonDisabled, copyToClipboard, getText }) {
  return (
    <div className="mt-8 w-full max-w-6xl flex flex-wrap justify-end items-center space-x-2 sm:space-x-4">
      <label className="text-sm sm:text-base md:text-lg font-semibold flex items-center space-x-2 mb-2 sm:mb-0">
        <span>{getText('targetScoreSum')}:</span>
        <input
          type="number"
          value={targetSum}
          onChange={(e) => setTargetSum(parseInt(e.target.value) || 0)}
          className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-sm sm:text-base"
          aria-label={getText('targetScoreSum')}
        />
      </label>

      <span className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-0">
        {getText('currentGameTotal')}: {currentTotal}
      </span>
      <button
        onClick={handleAddGame}
        disabled={isAddRecordButtonDisabled}
        className={`font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base md:text-lg mb-2 sm:mb-0
          ${isAddRecordButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
        `}
        aria-label={getText('addRecord')}
      >
        {getText('addRecord')}
      </button>
      <button
        onClick={copyToClipboard}
        className="font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base md:text-lg bg-green-500 hover:bg-green-600 text-white mb-2 sm:mb-0"
        aria-label={getText('share')}
      >
        {getText('share')}
      </button>
    </div>
  );
}

export default ControlPanel;