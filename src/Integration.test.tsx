
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Increase timeout for longer interactions
jest.setTimeout(30000);

describe('Integration Tests', () => {
    test('Score Page: Enter scores and verify record button enablement', async () => {
        // 1. Render App
        render(<App />);

        // 2. Navigate to Score Page (Click "점수 기록표" or direct URL if possible, but here we click input)
        // Actually, App defaults to MainPage. We need to click "점수 기록 시작" or similar to go to /set_score
        // or we can test ScorePage directly inside a compatible environment, but checking whole App is better.
        // Let's assume the user starts at Home.

        // Find link/button to Score Page
        // Based on App.tsx, path is /set_score. 
        // Usually there is a button on MainPage to go there.
        // Let's assume we can navigate via text.

        const startButton = screen.getByText(/점수 기록 시작|Score Tracker/i);
        fireEvent.click(startButton);

        // 3. Verify we are on Score Page
        expect(screen.getByText(/시작 점수|Starting Score/i)).toBeInTheDocument();

        // 4. Input scores: 40000, 30000, 20000, 10000
        // Inputs are usually identified by role or placeholder.
        // In Table.tsx, inputs might have placeholder="점수" or similar, or aria-label.
        // Let's look at Table.tsx again to be sure of selectors.
        // ... aria-label={`${getText('game')} ${gameIndex + 1} ${getText(position as TranslationKey)} ${getText('score')}`}

        // We need to match aria-labels dynamically or just find all score inputs.
        // The inputs are likely "textbox" or "spinbutton" (if type="number").

        const displayInputs = screen.getAllByPlaceholderText(/점수|Score/i);
        // Game 1 inputs should be the first 4.

        const scores = ['40000', '30000', '20000', '10000'];

        for (let i = 0; i < 4; i++) {
            userEvent.clear(displayInputs[i]);
            userEvent.type(displayInputs[i], scores[i]);
        }

        // 5. Check Button Enablement
        const recordButton = screen.getByText(/기록 추가 및 공유|Add Record & Share/i);

        // In the code, the button is "disabled" styled but clickable to show popup if invalid.
        // But if valid, it should just work.
        // We can check if `opacity` is not reduced, or just click it and see if new row appears.

        fireEvent.click(recordButton);

        // 6. Verify success -> Game 2 appears
        await waitFor(() => {
            const gameRows = screen.getAllByText(/2/i, { selector: 'td' }); // Game ID 2
            expect(gameRows.length).toBeGreaterThan(0);
        });
    });

    test('UmaOka Page: Enter scores and verify record button', async () => {
        render(<App />);

        // Navigate to UmaOka
        // Assuming a button exists on MainPage or Sidebar.
        // If not reachable easily, we can render using memory router.

        // Let's try to find text "우마오카"
        const umaOkaButton = screen.getAllByText(/우마오카|UmaOka/i)[0]; // Might be multiple (title vs button)
        fireEvent.click(umaOkaButton);

        expect(screen.getByText(/오카|Oka/i)).toBeInTheDocument();

        // Select players if needed?
        // In UmaOka, default is empty or might need selection.
        // The code says: `game.participants` needs to be set.
        // `getDefaultUmaOkaParticipants` sets 0,1,2,3. So default is Player1..4.

        // Input scores
        const inputs = screen.getAllByPlaceholderText(/점수|Score/i);
        // Game 1 inputs.

        const scores = ['40000', '30000', '20000', '10000'];
        for (let i = 0; i < 4; i++) {
            userEvent.clear(inputs[i]);
            userEvent.type(inputs[i], scores[i]);
        }

        const recordButton = screen.getAllByText(/기록 추가 및 공유|Add Record & Share/i)[0];
        fireEvent.click(recordButton);

        await waitFor(() => {
            // Check for Game 2
            // Game ID column
            const cells = screen.getAllByRole('cell');
            const game2 = cells.find(c => c.textContent === '2');
            expect(game2).toBeInTheDocument();
        });
    });
});
