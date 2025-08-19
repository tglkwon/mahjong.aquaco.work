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