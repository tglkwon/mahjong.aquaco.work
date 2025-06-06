import React from 'react';

function ControlPanel({ targetSum, setTargetSum, currentTotal, handleAddGame, isAddRecordButtonDisabled, copyToClipboard, getText }) {
  return (
    <div className="mt-6 sm:mt-8 w-full max-w-6xl flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-3 sm:gap-4 p-2 sm:p-0 ">
      <label className="text-xs sm:text-sm md:text-base font-semibold flex items-center xs:space-x-1 space-x-2 w-full sm:w-auto justify-between sm:justify-start">
        <span>{getText('targetScoreSum')}:</span>
        <input
          type="number"
          value={targetSum}
          onChange={(e) => setTargetSum(parseInt(e.target.value) || 0)}
          className="xs:w-16 xs:p-0.5 xs:text-2xs w-20 p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-xs sm:w-24 sm:p-2 sm:text-sm"
          aria-label={getText('targetScoreSum')}
        />
      </label>

      <span className="text-xs sm:text-sm md:text-base font-semibold w-full sm:w-auto text-center sm:text-left">
        {getText('currentGameTotal')}: {currentTotal}
      </span>
      <button
        onClick={handleAddGame}
        disabled={isAddRecordButtonDisabled}
        className={`font-semibold py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm md:text-base rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto
          ${isAddRecordButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
        `}
        aria-label={getText('addRecord')}
      >
        {getText('addRecord')}
      </button>
      <button
        onClick={copyToClipboard}
        className="font-semibold py-1.5 px-3 text-xs sm:py-2 sm:px-4 sm:text-sm md:text-base rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
        aria-label={getText('share')}
      >
        {getText('share')}
      </button>
    </div>
  );
}

export default ControlPanel;