export interface UmaOkaParticipants {
    east: number;
    south: number;
    west: number;
    north: number;
}

export interface UmaOkaScores {
    east: string;
    south: string;
    west: string;
    north: string;
    [key: string]: string; // Index signature for dynamic access
}

export interface Game {
    id: number;
    isEditable: boolean;
    scores: string[] | UmaOkaScores;
    participants?: UmaOkaParticipants;
    playerPositions?: string[]; // For normal mode, potentially reordering players?
    umaType?: string | null;
}
