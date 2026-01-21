
export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export type VoiceGender = '남성' | '여성' | '중성';

export interface VoicePersona {
  id: string;
  label: string;
  category: string;
  gender: VoiceGender;
  baseVoice: VoiceName;
  description: string;
  styleInstruction: string;
}

export interface SpeakerConfig {
  id: string;
  name: string;
  voice: VoiceName;
  styleInstruction: string;
}

export interface ScriptItem {
  id: string;
  speakerId: string;
  text: string;
}

export interface GeneratedAudio {
  id: string;
  url: string;
  blob: Blob;
  timestamp: number;
  script: string;
}
