export interface PetProfile {
  name: string;
  breed: string;
  personality: string;
  favoriteToy: string;
  quirks: string;
  avatarUrl: string | null;
}

export interface Memory {
  id: string;
  imageUrl: string;
  description: string;
  date: string;
}

export enum AppView {
  SETUP = 'SETUP',
  HOME = 'HOME',
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  GALLERY = 'GALLERY',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}