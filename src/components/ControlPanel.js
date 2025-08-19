import React from 'react';

function ControlPanel({
  startingScore,
  setStartingScore,
  returnScore,
  setReturnScore,
  isOkaEnabled,
  onOkaToggle,
  totalTargetScore,
  currentTotal,
  onRecordButtonPress,
  isAddRecordButtonDisabled,
  getText,
  showUmaOkaControls,
  handleUmaOkaToggle,
  activeUmaOka,
  isUmaOkaGlobalDisabled
}) {

  return (
    <div className="mt-6 sm:mt-8 w-full max-w-6xl flex flex-col items-center bmb:items-end gap-3 sm:gap-4 p-2 sm:p-0">
      {/* Group 1: Score Settings, Sum Diff, Uma/Oka buttons */}
      <div className="w-full flex flex-col lg:flex-row items-stretch gap-3">
        {/* Sub-Group A: Score Settings & Sum Difference */}
        <div className="flex flex-col sm:flex-row lg:flex-1 items-stretch gap-2">
          {/* Item 1: Starting Score Input */}
          <div className="flex-1 p-1.5 rounded-lg shadow-md border border-gray-300 bg-white flex flex-row items-center justify-center gap-2 text-center text-sm sm:text-base md:text-lg">
            <label htmlFor="startingScoreInputCtrl" className="font-semibold text-sm md:text-base lg:text-lg whitespace-nowrap">
              {getText('startingScore')}:
            </label>
            <input
              id="startingScoreInputCtrl"
              type="number"
              value={startingScore}
              onChange={(e) => setStartingScore(parseInt(e.target.value) || 0)}
              className="w-full max-w-[120px] p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-base sm:text-lg md:text-xl"
              aria-label={getText('startingScore')}
            />
          </div>

          {/* Item 2: Sum Difference */}
          <div className="flex-1 p-2 rounded-lg shadow-md border border-gray-300 bg-white flex items-center justify-center text-center text-sm sm:text-base md:text-lg lg:text-xl">
            <span className="font-semibold whitespace-nowrap">
              {getText('sumDifference')}: {totalTargetScore - currentTotal}
            </span>
          </div>
        </div>

        {/* Sub-Group B: Uma/Oka Buttons */}
        {showUmaOkaControls && (
          <div className="flex flex-col sm:flex-row lg:flex-1 items-stretch gap-2">
            {/* Common Button Classes */}
            {(() => {
              const commonButtonClasses = "font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-8 sm:text-base md:px-14 md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none flex-1 text-center";
              const disabledClasses = "bg-gray-400 cursor-not-allowed text-gray-700";
              const activeButtonClasses = (isActive) => isActive ? "bg-orange-500 hover:bg-orange-600 text-white focus:ring-2 focus:ring-orange-400" : "bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-400";

              return (
                <>
                  {/* Uma 1-2 Button */}
                  <button
                    type="button"
                    onClick={() => handleUmaOkaToggle('1-2')}
                    disabled={isUmaOkaGlobalDisabled}
                    className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(activeUmaOka.uma === '1-2')}`}
                  >
                    {getText('uma1_2')}
                  </button>

                  {/* Uma 1-3 Button */}
                  <button
                    type="button"
                    onClick={() => handleUmaOkaToggle('1-3')}
                    disabled={isUmaOkaGlobalDisabled}
                    className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(activeUmaOka.uma === '1-3')}`}
                  >
                    {getText('uma1_3')}
                  </button>

                  {/* Oka Control Group */}
                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onOkaToggle}
                      disabled={isUmaOkaGlobalDisabled}
                      className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(isOkaEnabled)}`}
                    >
                      {getText('oka')}
                    </button>
                    {isOkaEnabled && (
                      <div className="p-1.5 rounded-lg shadow-md border border-gray-300 bg-white flex flex-row items-center justify-center gap-2 text-center text-sm sm:text-base md:text-lg">
                        <label htmlFor="returnScoreInputCtrl" className="font-semibold text-sm md:text-base lg:text-lg whitespace-nowrap">
                          {getText('returnScore')}:
                        </label>
                        <input
                          id="returnScoreInputCtrl"
                          type="number"
                          value={returnScore}
                          onChange={(e) => setReturnScore(parseInt(e.target.value) || 0)}
                          className="w-full max-w-[120px] p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-base sm:text-lg md:text-xl"
                          aria-label={getText('returnScore')}
                        />
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Group 2: Add Record Button */}
      <div className="w-full flex flex-col bmb:flex-row bmb:justify-end items-center gap-3 sm:gap-4">
        <button
          onClick={onRecordButtonPress}
          className={`font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-5 sm:text-base md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full bmb:w-auto
            ${isAddRecordButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
          `}
          aria-label={getText('addRecord')}
        >
          {getText('addRecord')}
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
