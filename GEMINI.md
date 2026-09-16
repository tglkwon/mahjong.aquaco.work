# Gemini Project Notes: mahjong.aquaco.work

This file contains notes to help track project structure and modifications.

## Project Structure

- The application is a React-based web app for tracking Mahjong scores.
- The main application logic is within `/src/`.
- Components are located in `/src/components/`.
- The main page component is `ScorePage.js`.
- Internationalization (i18n) is handled in `/src/i18n/translations.js`.

## Recent Modifications

- **Score Calculation Refactor:** Refactored the score calculation logic from using a "Target Total Score" to a "Standard Score per Player".
    - Changed the label in `src/i18n/translations.js` from "목표 점수 합계" to "시작 점수".
    - Renamed `targetSum` to `startingScore` in `ScorePage.js` and `ControlPanel.js`.
    - The total score is now calculated as `startingScore * 4`.
    - Changing the `startingScore` now automatically recalculates the `totalScores`.

- **URL Compression:** Implemented URL shortening by compressing game state data using the `pako` library before Base64 encoding.
    - Modified `ScorePage.js` to import `pako`.
    - Updated `generateShareableUrl` to compress data with `pako.deflate`.
    - Updated `parseStateFromUrl` to decompress data with `pako.inflate`.

- **Button Disablement Logic:**
    - Added logic to `ScorePage.js` to show a popup message when the disabled "Add Record & Share" button is clicked.
    - The button's disabled state is determined by `addRecordButtonStatus`.
    - The click handler `handleRecordButtonPress` shows a popup with the reason for disablement.
    - The `disabled` attribute was removed from the button in `ControlPanel.js` to allow the `onClick` event to fire. Styling is used to make it appear disabled.

**Note to Self:** 

- Be extremely careful when using the `replace` tool. I have repeatedly made copy-paste errors, inserting the content of one file into another. Before applying a `replace` operation, I must double-check the `old_string` and `new_string` parameters to ensure they are correct and do not contain extraneous code from other files. For complex changes, using `write_file` with the full, correct content might be safer.

- **RegExp Syntax Error:** I introduced a syntax error in `ScorePage.js` by having an unclosed parenthesis in a `RegExp` constructor. This was a result of a copy-paste error during a `replace` operation. I must be extra careful with special characters and ensure the syntax is correct when modifying code, especially when dealing with regular expressions. Double-checking the code for syntax errors after a replacement is crucial.

## Testing & Execution Guidelines (Hang & Yield Prevention)

- **Do NOT Yield Turn on Test Commands:**
  - 단위/통합 테스트나 빌드 등 30초 이내에 끝나는 검증 작업은 백그라운드 태스크로 전환되었다고 해서 "실행 중입니다, 기다려주세요"라는 메시지와 함께 사용자에게 턴을 넘기지 마십시오. 이는 대화를 중단시키고 무한 대기를 유발합니다.
  - 백그라운드로 전환된 경우 즉시 `manage_task`의 `status`를 주기적으로 점검하거나 완료될 때까지 확인한 후, 결과가 도출되었을 때 턴을 반환하십시오.

- **Jest Open Handle & Hang Prevention:**
  - `react-scripts test`는 비동기 타이머(`setTimeout` 등)나 Jest 워커 스레드로 인해 테스트 완료 후에도 프로세스가 종료되지 않는 오픈 핸들 현상이 있습니다.
  - 단위 테스트 실행 시 항상 `--watchAll=false --forceExit` 플래그를 사용하십시오 (`package.json`의 `"test"` 스크립트에 기본 설정됨).
  - 대화형 감시 모드가 필요한 경우에만 `"test:watch"`를 사용하십시오.