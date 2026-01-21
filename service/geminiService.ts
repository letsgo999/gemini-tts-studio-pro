
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, SpeakerConfig, ScriptItem } from "../types";
import { decodeBase64, decodeAudioData, audioBufferToWav } from "./audioUtils";

export const generateSpeech = async (
  globalStyleInstructions: string,
  speakers: SpeakerConfig[],
  script: ScriptItem[]
): Promise<Blob> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 개별 화자의 스타일 지침을 포함하여 프롬프트 구성
  let prompt = `전역 스타일 지침: ${globalStyleInstructions}\n\n`;
  
  if (speakers.length > 1) {
    prompt += "다음 화자별 스타일을 반영하여 대화를 생성해주세요:\n";
    speakers.forEach(s => {
      prompt += `- ${s.name}: ${s.styleInstruction}\n`;
    });
    prompt += "\n대화 내용:\n";
    script.forEach(item => {
      const speaker = speakers.find(s => s.id === item.speakerId);
      prompt += `${speaker?.name}: ${item.text}\n`;
    });
  } else {
    const s = speakers[0];
    prompt += `화자 스타일: ${s.styleInstruction}\n\n내용: `;
    prompt += script.map(i => i.text).join(" ");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: speakers.length > 1 ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map(s => ({
            speaker: s.name,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voice }
            }
          }))
        }
      } : {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: speakers[0].voice }
        }
      }
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("Gemini API로부터 오디오 데이터를 받지 못했습니다.");
  }

  const rawBytes = decodeBase64(base64Audio);
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(rawBytes, audioContext, 24000, 1);
  
  return audioBufferToWav(audioBuffer);
};

export const previewVoice = async (voice: VoiceName, style: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `스타일: ${style}\n내용: 안녕하세요, 제 목소리가 어떻게 들리나요? 샘플 음성입니다.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Preview failed");

  const rawBytes = decodeBase64(base64Audio);
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(rawBytes, audioContext, 24000, 1);
  const wavBlob = audioBufferToWav(audioBuffer);
  return URL.createObjectURL(wavBlob);
};
