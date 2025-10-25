export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  audioUrl?: string;
  photoUrls: string;
  voiceModelId?: string;
  personalityData?: string;
  chromaCollectionId?: string;
  fetchAgentId?: string;
  name?: string;
  email?: string;
}

export interface PersonalityData {
  traits: string[];
  quirks: string[];
  conversationStyle: string;
  interests: string[];
  background: string;
}

export interface Memory {
  id: string;
  createdAt: Date;
  userId: string;
  content: string;
  embedding: string;
  category?: string;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
}

export interface VoiceCloneResponse {
  modelId: string;
  status: 'processing' | 'ready' | 'failed';
  message?: string;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
}

export interface FaceData {
  landmarks: number[][];
  outline: number[][];
}

export interface ContextInput {
  category: 'story' | 'habit' | 'reaction' | 'other';
  content: string;
}

