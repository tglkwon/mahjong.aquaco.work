import React from 'react';

function ControlPanel({
  targetSum,
  setTargetSum,
  currentTotal,
  onRecordButtonPress, // Changed from handleAddGame
  isAddRecordButtonDisabled,
  getText,
  showUmaOkaControls,
  handleUmaOkaToggle,
  activeUmaOka,
  isUmaOkaGlobalDisabled
}) {
  const isOkaButtonSpecificDisabled = isUmaOkaGlobalDisabled || (targetSum !== 1000 && targetSum !== 100000);

  return (
    <div className="mt-6 sm:mt-8 w-full max-w-6xl flex flex-col items-center bmb:items-end gap-3 sm:gap-4 p-2 sm:p-0">
      {/* Group 1: Target Sum, Sum Diff, Uma/Oka buttons */}
      <div className="w-full flex flex-col lg:flex-row items-stretch gap-3"> {/* Increased gap for clarity between main groups */}
        {/* Sub-Group A: Target Sum & Sum Difference (takes 50% on lg) */}
        <div className="flex flex-col sm:flex-row lg:flex-1 items-stretch gap-2">
          {/* Item 1: Target Sum (takes 50% of Sub-Group A) - Label and input now in a row */}
          <div className="flex-1 p-1.5 rounded-lg shadow-md border border-gray-300 bg-white flex flex-row items-center justify-center gap-2 text-center text-sm sm:text-base md:text-lg">
            <label htmlFor="targetSumInputCtrl" className="font-semibold text-sm md:text-base lg:text-lg whitespace-nowrap">
              {getText('targetScoreSum')}:
            </label>
            <input
              id="targetSumInputCtrl"
              type="number"
              value={targetSum}
              onChange={(e) => setTargetSum(parseInt(e.target.value) || 0)}
              className="w-full max-w-[120px] p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-base sm:text-lg md:text-xl"
              aria-label={getText('targetScoreSum')}
            />
          </div>

          {/* Item 2: Sum Difference (takes 50% of Sub-Group A) */}
          <div className="flex-1 p-2 rounded-lg shadow-md border border-gray-300 bg-white flex items-center justify-center text-center text-sm sm:text-base md:text-lg lg:text-xl">
            <span className="font-semibold whitespace-nowrap">
              {getText('sumDifference')}: {targetSum - currentTotal}
            </span>
          </div>
        </div>

        {/* Sub-Group B: Uma/Oka Buttons (takes 50% on lg) */}
        {showUmaOkaControls && (
          <div className="flex flex-col sm:flex-row lg:flex-1 items-stretch gap-2">
            {/* Item 3: 1-2 Uma Button (takes 1/3 of Sub-Group B) */}
            <button
              type="button"
              onClick={() => handleUmaOkaToggle('1-2')}
              disabled={isUmaOkaGlobalDisabled}
              className={`font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-8 sm:text-base md:px-14 md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none flex-1 text-center 
                ${isUmaOkaGlobalDisabled ? 'bg-gray-400 cursor-not-allowed text-gray-700' :
                  activeUmaOka.uma === '1-2' ? 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-2 focus:ring-orange-400' :
                  'bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-400'
                }`}
            >
              {getText('uma1_2')}
            </button>
            {/* Item 4: 1-3 Uma Button (takes 1/3 of Sub-Group B) */}
            <button
              type="button"
              onClick={() => handleUmaOkaToggle('1-3')}
              disabled={isUmaOkaGlobalDisabled}
              className={`font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-8 sm:text-base md:px-14 md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none flex-1 text-center 
                ${isUmaOkaGlobalDisabled ? 'bg-gray-400 cursor-not-allowed text-gray-700' :
                  activeUmaOka.uma === '1-3' ? 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-2 focus:ring-orange-400' :
                  'bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-400'
                }`}
            >
              {getText('uma1_3')}
            </button>
            {/* Item 5: Oka Button (takes 1/3 of Sub-Group B) */}
            <button
              type="button"
              onClick={() => handleUmaOkaToggle('oka')}
              disabled={isOkaButtonSpecificDisabled}
              className={`font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-8 sm:text-base md:px-14 md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none flex-1 text-center 
                ${isOkaButtonSpecificDisabled ? 'bg-gray-400 cursor-not-allowed text-gray-700' :
                  activeUmaOka.oka ? 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-2 focus:ring-orange-400' :
                  'bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-400'
                }`}
            >
              {getText('oka')}
            </button>
          </div>
        )}
      </div>

      {/* Group 2: Add Record, Share buttons */}
      <div className="w-full flex flex-col bmb:flex-row bmb:justify-end items-center gap-3 sm:gap-4">
        <button
          onClick={onRecordButtonPress} // Changed from handleAddGame
          className={`font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-5 sm:text-base md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bmb:w-auto
            ${isAddRecordButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
          `}
          aria-label={getText('addRecord')}
        >
          {getText('addRecord')}
        </button>
        {/* Share button removed */}
      </div>
    </div>
  );
}

export default ControlPanel;