import { deflate, inflate } from 'pako';
import { Game, UmaOkaParticipants, UmaOkaScores } from '../types';

export type ShareTieHandlingMode = 'split' | 'seatOrder';

export interface ShareState {
  startingScore: number;
  games: Game[];
  language?: string;
  activeUmaOka: { uma: string | null; oka: boolean };
  returnScore?: number;
  isOkaEnabled?: boolean;
  tieHandlingMode?: ShareTieHandlingMode;
  playerPool?: string[];
  playerNames?: string[];
  chomboCounts?: number[];
}

const FORMAT_VERSION = 1;
const MAGIC = 0x4d; // M
const UMA_MODE = 1;
const NORMAL_MODE = 0;
const FLAG_ACTIVE_UMA = 1;
const FLAG_OKA = 2;
const FLAG_RETURN_SCORE = 4;
const FLAG_SEAT_ORDER_TIE = 8;
const FLAG_CHOMBO_COUNTS = 16;
const FLAG_ACTIVE_OKA = 32;

const LANGUAGE_CODES: Record<string, number> = { ko: 0, en: 1, ja: 2 };
const LANGUAGE_NAMES = ['ko', 'en', 'ja'];
const UMA_CODES: Record<string, number> = { '1-2': 1, '1-3': 2 };
const UMA_NAMES = ['', '1-2', '1-3'];
const SEAT_CODES: Record<string, number> = { east: 0, south: 1, west: 2, north: 3 };
const SEAT_NAMES = ['east', 'south', 'west', 'north'];

class ByteWriter {
  private bytes: number[] = [];

  writeByte(value: number) { this.bytes.push(value & 0xff); }

  writeVarint(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid unsigned integer: ${value}`);
    let remaining = value;
    do {
      let byte = remaining % 128;
      remaining = Math.floor(remaining / 128);
      if (remaining > 0) byte |= 128;
      this.writeByte(byte);
    } while (remaining > 0);
  }

  writeZigzag(value: number) {
    if (!Number.isSafeInteger(value)) throw new Error(`Invalid signed integer: ${value}`);
    this.writeVarint(value < 0 ? (-value * 2) - 1 : value * 2);
  }

  writeString(value: string) {
    const binary = unescape(encodeURIComponent(value));
    const encoded = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) encoded[index] = binary.charCodeAt(index);
    this.writeVarint(encoded.length);
    encoded.forEach(byte => this.writeByte(byte));
  }

  toBytes() { return new Uint8Array(this.bytes); }
}

class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  private ensure(length: number) {
    if (this.offset + length > this.bytes.length) throw new Error('Unexpected end of share data');
  }

  readByte() {
    this.ensure(1);
    return this.bytes[this.offset++];
  }

  readVarint() {
    let value = 0;
    let multiplier = 1;
    for (let index = 0; index < 8; index += 1) {
      const byte = this.readByte();
      value += (byte & 127) * multiplier;
      if ((byte & 128) === 0) return value;
      multiplier *= 128;
    }
    throw new Error('Invalid varint');
  }

  readZigzag() {
    const value = this.readVarint();
    return value % 2 === 1 ? -((value + 1) / 2) : value / 2;
  }

  readString() {
    const length = this.readVarint();
    if (length > 10000) throw new Error('Share string is too long');
    this.ensure(length);
    let binary = '';
    for (let index = 0; index < length; index += 1) binary += String.fromCharCode(this.bytes[this.offset + index]);
    this.offset += length;
    return decodeURIComponent(escape(binary));
  }

  hasRemaining() { return this.offset < this.bytes.length; }
}

const bytesToBinaryString = (bytes: Uint8Array) => {
  let result = '';
  for (let index = 0; index < bytes.length; index += 1) result += String.fromCharCode(bytes[index]);
  return result;
};

const binaryStringToBytes = (value: string) => {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index);
  return bytes;
};

const encodeBase64Url = (bytes: Uint8Array) => btoa(bytesToBinaryString(bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return binaryStringToBytes(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
};

const scoreToNumber = (score: string | number | null | undefined) => {
  const value = typeof score === 'number' ? score : parseInt(score || '0', 10);
  return Number.isFinite(value) ? value : 0;
};

const getPlayersForUmaGame = (game: Game) => {
  if (!game.participants) throw new Error('Uma game is missing participants');
  const scores = game.scores as UmaOkaScores;
  return Object.entries(game.participants)
    .map(([seat, playerId]) => ({ playerId, seat, score: scoreToNumber(scores[seat]) }))
    .sort((a, b) => a.playerId - b.playerId);
};

const getFlags = (state: ShareState, isUmaOka: boolean) => {
  let flags = 0;
  if (!isUmaOka) return flags;
  if (state.activeUmaOka?.uma) flags |= FLAG_ACTIVE_UMA;
  if (state.activeUmaOka?.oka) flags |= FLAG_ACTIVE_OKA;
  if (state.isOkaEnabled) flags |= FLAG_OKA;
  if (state.isOkaEnabled && typeof state.returnScore === 'number') flags |= FLAG_RETURN_SCORE;
  if (state.tieHandlingMode === 'seatOrder') flags |= FLAG_SEAT_ORDER_TIE;
  if (state.chomboCounts?.some(count => count > 0)) flags |= FLAG_CHOMBO_COUNTS;
  return flags;
};

export const encodeShareState = (state: ShareState, isUmaOka: boolean) => {
  const writer = new ByteWriter();
  const flags = getFlags(state, isUmaOka);
  writer.writeByte(MAGIC);
  writer.writeByte(FORMAT_VERSION);
  writer.writeByte(isUmaOka ? UMA_MODE : NORMAL_MODE);
  writer.writeByte(flags);
  writer.writeVarint(state.startingScore);
  writer.writeByte(LANGUAGE_CODES[state.language || ''] ?? 255);

  const players = isUmaOka ? (state.playerPool || []) : (state.playerNames || []);
  writer.writeVarint(players.length);
  players.forEach(player => writer.writeString(player));

  if (isUmaOka) {
    writer.writeByte(UMA_CODES[state.activeUmaOka?.uma || ''] || 0);
    if (flags & FLAG_ACTIVE_OKA) writer.writeByte(1);
    if (flags & FLAG_RETURN_SCORE) writer.writeVarint(state.returnScore || state.startingScore);
    if (flags & FLAG_CHOMBO_COUNTS) Array.from({ length: players.length }, (_, index) => state.chomboCounts?.[index] || 0).forEach(count => writer.writeVarint(Math.max(0, count)));
  }

  const completedGames = state.games.filter(game => !game.isEditable);
  writer.writeVarint(completedGames.length);
  const previousScores = new Map<number, number>();
  completedGames.forEach(game => {
    if (isUmaOka) {
      const gamePlayers = getPlayersForUmaGame(game);
      writer.writeVarint(gamePlayers.length);
      gamePlayers.forEach(({ playerId, seat, score }) => {
        writer.writeVarint(playerId);
        writer.writeByte(SEAT_CODES[seat]);
        const previous = previousScores.get(playerId);
        writer.writeByte(previous === undefined ? 0 : 1);
        writer.writeZigzag(previous === undefined ? score : score - previous);
        previousScores.set(playerId, score);
      });
    } else {
      const scores = game.scores as string[];
      writer.writeVarint(scores.length);
      scores.forEach(score => writer.writeZigzag(scoreToNumber(score)));
    }
  });

  const compressed = deflate(writer.toBytes());
  return encodeBase64Url(compressed);
};

export const decodeBinaryShareState = (encoded: string): ShareState => {
  const reader = new ByteReader(inflate(decodeBase64Url(encoded)));
  if (reader.readByte() !== MAGIC) throw new Error('Unknown share format');
  if (reader.readByte() !== FORMAT_VERSION) throw new Error('Unsupported share format');
  const mode = reader.readByte();
  const flags = reader.readByte();
  const isUmaOka = mode === UMA_MODE;
  if (!isUmaOka && mode !== NORMAL_MODE) throw new Error('Unknown share mode');
  const startingScore = reader.readVarint();
  const languageCode = reader.readByte();
  const players = Array.from({ length: reader.readVarint() }, () => reader.readString());
  const state: ShareState = {
    startingScore,
    games: [],
    language: LANGUAGE_NAMES[languageCode],
    activeUmaOka: { uma: null, oka: false },
    tieHandlingMode: flags & FLAG_SEAT_ORDER_TIE ? 'seatOrder' : 'split',
  };
  if (isUmaOka) {
    state.playerPool = players;
    state.activeUmaOka = { uma: UMA_NAMES[reader.readByte()] || null, oka: Boolean(flags & FLAG_ACTIVE_OKA) };
    if (flags & FLAG_ACTIVE_OKA) reader.readByte();
    if (flags & FLAG_RETURN_SCORE) state.returnScore = reader.readVarint();
    if (flags & FLAG_CHOMBO_COUNTS) state.chomboCounts = Array.from({ length: players.length }, () => reader.readVarint());
    state.isOkaEnabled = Boolean(flags & FLAG_OKA);
  } else {
    state.playerNames = players;
  }

  const gameCount = reader.readVarint();
  const previousScores = new Map<number, number>();
  for (let gameIndex = 0; gameIndex < gameCount; gameIndex += 1) {
    const entryCount = reader.readVarint();
    if (isUmaOka) {
      const participants: UmaOkaParticipants = { east: -1, south: -1, west: -1, north: -1 };
      const scores: UmaOkaScores = { east: '', south: '', west: '', north: '' };
      for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
        const playerId = reader.readVarint();
        const seatCode = reader.readByte();
        const isDelta = reader.readByte() === 1;
        const scoreValue = reader.readZigzag();
        const score = isDelta ? (previousScores.get(playerId) || 0) + scoreValue : scoreValue;
        const seat = SEAT_NAMES[seatCode] as keyof UmaOkaParticipants;
        if (!seat || playerId >= players.length) throw new Error('Invalid player or seat in share data');
        participants[seat] = playerId;
        scores[seat] = String(score);
        previousScores.set(playerId, score);
      }
      state.games.push({ id: gameIndex + 1, participants, scores, isEditable: false });
    } else {
      const scores = Array.from({ length: entryCount }, () => String(reader.readZigzag()));
      state.games.push({ id: gameIndex + 1, scores, isEditable: false, playerPositions: ['east', 'south', 'west', 'north'], umaType: null });
    }
  }
  if (reader.hasRemaining()) throw new Error('Unexpected trailing share data');
  return state;
};

const decodeLegacyState = (encodedData: string, isUmaOka: boolean): ShareState => {
  const binaryString = atob(encodedData);
  const compressedBytes = binaryStringToBytes(binaryString);
  let parsedData: any;
  try {
    parsedData = JSON.parse(inflate(compressedBytes, { to: 'string' }));
  } catch (error) {
    const decodedJsonString = decodeURIComponent(escape(binaryString));
    parsedData = JSON.parse(decodedJsonString);
  }
  if (Array.isArray(parsedData)) {
    const data = parsedData;
    const restoredGames = data[3].map((gameData: any, index: number) => isUmaOka
      ? ({ id: index + 1, participants: { east: gameData[0], south: gameData[1], west: gameData[2], north: gameData[3] }, scores: { east: gameData[4], south: gameData[5], west: gameData[6], north: gameData[7] }, isEditable: false } as Game)
      : ({ id: index + 1, scores: gameData, isEditable: false, playerPositions: ['east', 'south', 'west', 'north'], umaType: null } as Game));
    return {
      startingScore: data[1], games: restoredGames, language: data[4],
      activeUmaOka: isUmaOka && data[5] ? { uma: data[5][0], oka: data[5][1] } : { uma: null, oka: false },
      returnScore: data[6] ?? undefined, isOkaEnabled: data[7] ?? undefined,
      tieHandlingMode: data[8] === 'seatOrder' ? 'seatOrder' : 'split', chomboCounts: data[9],
      ...(isUmaOka ? { playerPool: data[2] } : { playerNames: data[2] }),
    };
  }
  return parsedData as ShareState;
};

export const parseShareStateFromHash = (hash: string, isUmaOka: boolean): ShareState | null => {
  try {
    if (hash.startsWith('#d=')) return decodeBinaryShareState(hash.substring(3));
    if (hash.startsWith('#data=')) return decodeLegacyState(hash.substring(6), isUmaOka);
  } catch (error) {
    console.error('URL 해시에서 상태를 파싱하는데 오류가 발생했습니다:', error);
  }
  return null;
};
