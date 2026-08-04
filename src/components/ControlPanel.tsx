import React, { useState } from 'react';
import { Translation } from '../i18n/translations';

type TranslationKey = keyof Translation;
type TieHandlingMode = 'split' | 'seatOrder';

interface ControlPanelProps {
  startingScore: number;
  setStartingScore: (score: number) => void;
  returnScore: number;
  setReturnScore: (score: number) => void;
  isOkaEnabled: boolean;
  onOkaToggle: () => void;
  totalTargetScore: number;
  currentTotal: number;
  onRecordButtonPress: () => void;
  isAddRecordButtonDisabled: boolean;
  getText: (key: TranslationKey, params?: Record<string, string | number>) => string;
  showUmaOkaControls?: boolean;
  handleUmaOkaToggle?: (type: string) => void;
  activeUmaOka?: { uma: string | null; oka: boolean };
  tieHandlingMode?: TieHandlingMode;
  setTieHandlingMode?: (mode: TieHandlingMode) => void;
  isUmaOkaGlobalDisabled?: boolean;
  showShareWarning?: boolean;
  copyToClipboard: () => void;
}

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
  tieHandlingMode = 'split',
  setTieHandlingMode,
  isUmaOkaGlobalDisabled,
  showShareWarning = false
}: ControlPanelProps) {
  const [isUmaOkaSettingsExpanded, setIsUmaOkaSettingsExpanded] = useState(false);

  const umaSummary = activeUmaOka?.uma === '1-2'
    ? getText('uma1_2')
    : activeUmaOka?.uma === '1-3'
      ? getText('uma1_3')
      : getText('umaNone');
  const okaSummary = isOkaEnabled ? getText('okaOn') : getText('okaOff');
  const tieSummary = getText(tieHandlingMode === 'seatOrder' ? 'tieSeatOrder' : 'tieSplit');
  const umaOkaSummary = `${umaSummary} · ${okaSummary} · ${tieSummary}`;
  return (
    <div className="mt-6 sm:mt-8 w-full max-w-6xl flex flex-col items-center bmb:items-end gap-3 sm:gap-4 p-2 sm:p-0">
      {/* Group 1: Score Settings, Sum Diff, Uma/Oka buttons */}
      <div className={`w-full items-stretch gap-3 ${isUmaOkaSettingsExpanded ? 'flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_52px]' : 'flex flex-col lg:flex-row'}`}>
        {/* Sub-Group A: Score Settings & Sum Difference */}
        <div className={`${isUmaOkaSettingsExpanded ? 'contents' : 'flex flex-col sm:flex-row lg:flex-1'} items-stretch gap-2`}>
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
          <div className={`flex-1 p-2 rounded-lg shadow-md border bg-white flex flex-col items-center justify-center text-center text-sm sm:text-base md:text-lg ${currentTotal === totalTargetScore ? 'border-green-300' : 'border-amber-300'}`}>
            <span className="font-semibold leading-tight">
              {getText('currentTargetTotal')}
            </span>
            <span className="font-semibold mt-1">
              {currentTotal.toLocaleString()} / {totalTargetScore.toLocaleString()}
            </span>
            <span className={`text-xs sm:text-sm font-medium mt-1 ${currentTotal === totalTargetScore ? 'text-green-600' : 'text-amber-600'}`}>
              {currentTotal === totalTargetScore ? getText('recordReady') : getText('recordNeeded')}
            </span>
          </div>
        </div>

        {/* Sub-Group B: Uma/Oka Buttons */}
        {showUmaOkaControls && (
          <div className={`${isUmaOkaSettingsExpanded ? 'contents' : 'flex flex-col lg:flex-1'} items-stretch gap-2`}>
            <button
              type="button"
              aria-expanded={isUmaOkaSettingsExpanded}
              aria-controls="uma-oka-settings-panel"
              aria-label={getText(isUmaOkaSettingsExpanded ? 'collapseUmaOkaSettings' : 'expandUmaOkaSettings')}
              onClick={() => setIsUmaOkaSettingsExpanded(prev => !prev)}
              className={isUmaOkaSettingsExpanded
                ? "w-full min-h-[96px] rounded-lg border border-gray-300 bg-gray-200 text-black text-2xl font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                : "w-full h-full p-2 rounded-lg shadow-md border border-gray-300 bg-white flex items-center justify-between gap-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"}
            >
              {isUmaOkaSettingsExpanded ? (
                <span aria-hidden="true">▲</span>
              ) : (
                <>
                  <span className="min-w-0">
                    <span className="block font-semibold text-sm sm:text-base md:text-lg">
                      {getText('umaOkaSettings')}
                    </span>
                    <span className="block truncate text-xs sm:text-sm text-gray-500" data-testid="uma-oka-settings-summary">
                      {umaOkaSummary}
                    </span>
                  </span>
                  <span className="text-lg text-gray-500" aria-hidden="true">▼</span>
                </>
              )}
            </button>
            {isUmaOkaSettingsExpanded && (
              <div id="uma-oka-settings-panel" className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2">
                {(() => {
                  const commonButtonClasses = "font-semibold py-2 px-4 text-sm sm:py-2.5 sm:px-8 sm:text-base md:px-14 md:text-lg lg:text-xl rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 active:scale-95 focus:outline-none flex-1 text-center";
                  const disabledClasses = "bg-gray-400 cursor-not-allowed text-gray-700";
                  const activeButtonClasses = (isActive: boolean) => isActive ? "bg-orange-500 hover:bg-orange-600 text-white focus:ring-2 focus:ring-orange-400" : "bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-400";

                  return (
                    <>
                      <button type="button" onClick={() => handleUmaOkaToggle && handleUmaOkaToggle('1-2')} disabled={isUmaOkaGlobalDisabled} className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(activeUmaOka?.uma === '1-2')}`}>
                        {getText('uma1_2')}
                      </button>
                      <button type="button" onClick={() => handleUmaOkaToggle && handleUmaOkaToggle('1-3')} disabled={isUmaOkaGlobalDisabled} className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(activeUmaOka?.uma === '1-3')}`}>
                        {getText('uma1_3')}
                      </button>
                      <button type="button" onClick={() => setTieHandlingMode && setTieHandlingMode(tieHandlingMode === 'seatOrder' ? 'split' : 'seatOrder')} className={commonButtonClasses + ' ' + activeButtonClasses(tieHandlingMode === 'seatOrder')}>
                        {getText(tieHandlingMode === 'seatOrder' ? 'tieSeatOrder' : 'tieHandling')}
                      </button>
                      <button type="button" onClick={onOkaToggle} disabled={isUmaOkaGlobalDisabled} className={`${commonButtonClasses} ${isUmaOkaGlobalDisabled ? disabledClasses : activeButtonClasses(isOkaEnabled)}`}>
                        {getText('oka')}
                      </button>
                      {isOkaEnabled && (
                        <div className="col-span-2 sm:col-span-4 p-1.5 rounded-lg shadow-md border border-gray-300 bg-white flex flex-row items-center justify-center gap-2 text-center text-sm sm:text-base md:text-lg">
                          <label htmlFor="returnScoreInputCtrl" className="font-semibold text-sm md:text-base lg:text-lg whitespace-nowrap">
                            {getText('returnScore')}:
                          </label>
                          <input id="returnScoreInputCtrl" type="number" value={returnScore} onChange={(e) => setReturnScore(parseInt(e.target.value) || 0)} className="w-full max-w-[120px] p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-center text-base sm:text-lg md:text-xl" aria-label={getText('returnScore')} />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>      {/* Group 2: Add Record Button */}
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
        {showShareWarning && (
          <p className="max-w-xl text-center bmb:text-right text-xs sm:text-sm text-gray-500">
            {getText('shareWarning')}
          </p>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
