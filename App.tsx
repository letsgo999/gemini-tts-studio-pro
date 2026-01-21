
import React, { useState, useMemo } from 'react';
import { VoiceName, SpeakerConfig, ScriptItem, GeneratedAudio, VoicePersona, VoiceGender } from './types';
import { generateSpeech, previewVoice } from './services/geminiService';

const VOICE_PERSONAS: VoicePersona[] = [
  { id: 'p1', label: '신뢰감 있는 아나운서', category: '뉴스/정보', gender: '남성', baseVoice: VoiceName.Zephyr, description: '정확하고 차분한 발음', styleInstruction: '정확하고 신뢰감 있는 뉴스 앵커 톤으로 읽어주세요.' },
  { id: 'p2', label: '밝고 활기찬 아이', category: '동화/키즈', gender: '중성', baseVoice: VoiceName.Puck, description: '에너지 넘치고 높은 톤', styleInstruction: '아주 신나고 들뜬 어린 아이의 목소리로 말해주세요.' },
  { id: 'p3', label: '차분한 명상 가이드', category: '나레이션', gender: '여성', baseVoice: VoiceName.Kore, description: '부드럽고 따뜻한 속삭임', styleInstruction: '숨소리가 섞인 차분하고 평온한 명상 가이드 톤입니다.' },
  { id: 'p4', label: '냉소적인 악당', category: '연기/드라마', gender: '남성', baseVoice: VoiceName.Fenrir, description: '거칠고 낮은 위협적인 톤', styleInstruction: '낮고 거칠며 비웃는 듯한 악역 캐릭터의 목소리입니다.' },
  { id: 'p5', label: '친절한 AI 비서', category: '고객지원', gender: '남성', baseVoice: VoiceName.Zephyr, description: '정중하고 기계적인 깔끔함', styleInstruction: '매우 친절하고 상냥하며 명료한 디지털 비서 스타일입니다.' },
  { id: 'p6', label: '열정적인 스포츠 캐스터', category: '뉴스/정보', gender: '남성', baseVoice: VoiceName.Fenrir, description: '빠르고 박진감 넘치는 톤', styleInstruction: '흥분된 어조로 매우 빠르고 박진감 있게 중계하듯 말해주세요.' },
  { id: 'p7', label: '우아한 중년 여성', category: '나레이션', gender: '여성', baseVoice: VoiceName.Kore, description: '품격 있고 깊이 있는 목소리', styleInstruction: '지적이고 우아한 중년 여성의 차분한 목소리입니다.' },
  { id: 'p8', label: '익살스러운 만화 캐릭터', category: '연기/드라마', gender: '중성', baseVoice: VoiceName.Puck, description: '과장되고 재미있는 억양', styleInstruction: '톤의 변화가 심하고 과장된 익살스러운 캐릭터 톤입니다.' },
  { id: 'p9', label: '신비로운 이야기꾼', category: '동화/키즈', gender: '여성', baseVoice: VoiceName.Charon, description: '울림이 있고 웅장한 느낌', styleInstruction: '깊고 울림이 있으며 비밀스러운 이야기를 들려주는 듯한 톤입니다.' },
  { id: 'p10', label: '지친 직장인', category: '연기/드라마', gender: '중성', baseVoice: VoiceName.Charon, description: '힘없고 축 처진 목소리', styleInstruction: '매우 피곤하고 의욕이 없는 낮은 목소리로 말해주세요.' },
  { id: 'p11', label: '부드러운 라디오 DJ', category: '나레이션', gender: '남성', baseVoice: VoiceName.Zephyr, description: '감미롭고 편안한 톤', styleInstruction: '늦은 밤 라디오 DJ처럼 감미롭고 부드럽게 속삭이듯 말해주세요.' },
  { id: 'p12', label: '엄격한 교수님', category: '뉴스/정보', gender: '남성', baseVoice: VoiceName.Fenrir, description: '권위 있고 단호한 목소리', styleInstruction: '매우 권위 있고 단호하며 가르침을 주는 듯한 톤으로 읽어주세요.' },
  { id: 'p13', label: '수줍은 소녀', category: '동화/키즈', gender: '여성', baseVoice: VoiceName.Kore, description: '여리고 조심스러운 톤', styleInstruction: '수줍음이 많고 조심스러운 소녀의 목소리로 말해주세요.' },
];

const CATEGORIES = ['전체', ...Array.from(new Set(VOICE_PERSONAS.map(p => p.category)))];
const GENDERS: (VoiceGender | '전체')[] = ['전체', '남성', '여성', '중성'];

const App: React.FC = () => {
  const [styleInstructions, setStyleInstructions] = useState('따뜻하고 환영하는 자연스러운 톤으로 읽어주세요.');
  const [speakers, setSpeakers] = useState<SpeakerConfig[]>([
    { id: '1', name: '화자 1', voice: VoiceName.Zephyr, styleInstruction: '자연스러운 대화체' },
  ]);
  const [script, setScript] = useState<ScriptItem[]>([
    { id: 's1', speakerId: '1', text: '안녕하세요! 제미나이 TTS 스튜디오에 오신 것을 환영합니다.' }
  ]);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceBrowser, setShowVoiceBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeGender, setActiveGender] = useState<VoiceGender | '전체'>('전체');

  const filteredPersonas = useMemo(() => {
    return VOICE_PERSONAS.filter(p => {
      const matchesSearch = p.label.includes(searchQuery) || p.description.includes(searchQuery);
      const matchesCategory = activeCategory === '전체' || p.category === activeCategory;
      const matchesGender = activeGender === '전체' || p.gender === activeGender;
      return matchesSearch && matchesCategory && matchesGender;
    });
  }, [searchQuery, activeCategory, activeGender]);

  const addSpeakerFromPersona = (persona: VoicePersona) => {
    const id = (Date.now()).toString();
    setSpeakers([...speakers, { 
      id, 
      name: `${persona.label} ${speakers.length + 1}`, 
      voice: persona.baseVoice,
      styleInstruction: persona.styleInstruction
    }]);
    setShowVoiceBrowser(false);
  };

  const removeSpeaker = (id: string) => {
    if (speakers.length <= 1) return;
    setSpeakers(speakers.filter(s => s.id !== id));
    setScript(script.filter(item => item.speakerId !== id));
  };

  const updateSpeaker = (id: string, updates: Partial<SpeakerConfig>) => {
    setSpeakers(speakers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addScriptLine = () => {
    setScript([...script, { id: Date.now().toString(), speakerId: speakers[0].id, text: '' }]);
  };

  const updateScriptLine = (id: string, text: string) => {
    setScript(script.map(line => line.id === id ? { ...line, text } : line));
  };

  const changeScriptSpeaker = (id: string, speakerId: string) => {
    setScript(script.map(line => line.id === id ? { ...line, speakerId } : line));
  };

  const removeScriptLine = (id: string) => {
    if (script.length <= 1) return;
    setScript(script.filter(line => line.id !== id));
  };

  const handleGenerate = async () => {
    if (script.some(s => !s.text.trim())) {
      setError("모든 대본 내용을 입력해주세요.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const audioBlob = await generateSpeech(styleInstructions, speakers, script);
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url: audioUrl,
        blob: audioBlob,
        timestamp: Date.now(),
        script: script.map(s => s.text).join(' ').substring(0, 50) + '...'
      };
      setHistory([newAudio, ...history]);
    } catch (err: any) {
      setError(err.message || "음성 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (persona: VoicePersona) => {
    if (isPreviewing === persona.id) return;
    setIsPreviewing(persona.id);
    try {
      const url = await previewVoice(persona.baseVoice, persona.styleInstruction);
      const audio = new Audio(url);
      audio.onended = () => setIsPreviewing(null);
      audio.play();
    } catch (err) {
      console.error(err);
      setIsPreviewing(null);
    }
  };

  const getGenderColor = (gender: VoiceGender) => {
    switch(gender) {
      case '남성': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case '여성': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case '중성': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-200">
      {/* Sidebar: History */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fas fa-microphone-alt text-xl text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Gemini TTS Studio</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Pro Edition (Korean)</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase px-2">생성 기록</h2>
          {history.length === 0 ? (
            <div className="px-2 py-8 text-center text-slate-600 italic text-sm">
              생성된 음성이 여기에 표시됩니다.
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-indigo-500/50 transition-all group">
                <p className="text-sm line-clamp-2 mb-3 text-slate-300">"{item.script}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <audio src={item.url} controls className="h-8 w-full max-w-[120px]" />
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col bg-slate-950 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-8 py-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">대본 작성 도구</h2>
            <p className="text-sm text-slate-400">대화 내용과 전체 스타일을 설정하세요</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-xl ${
              isGenerating 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            {isGenerating ? (
              <><i className="fas fa-circle-notch fa-spin"></i> 생성 중...</>
            ) : (
              <><i className="fas fa-play text-xs"></i> 음성 생성하기</>
            )}
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Style Instructions */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <i className="fas fa-wand-magic-sparkles text-sm"></i>
              <label className="text-sm font-bold uppercase tracking-wider">전체 음성 스타일 지침</label>
            </div>
            <textarea
              value={styleInstructions}
              onChange={(e) => setStyleInstructions(e.target.value)}
              placeholder="예: 따뜻하고 부드러운 목소리로, 중요한 부분은 천천히 강조해서 읽어주세요."
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            />
          </section>

          {/* Script Editor */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <i className="fas fa-quote-left text-sm"></i>
                  <label className="text-sm font-bold uppercase tracking-wider">대화 내용</label>
                </div>
                <button 
                  onClick={addScriptLine}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 transition-all"
                >
                  <i className="fas fa-plus"></i> 줄 추가
                </button>
             </div>

             <div className="space-y-4">
               {script.map((line, idx) => (
                 <div key={line.id} className="group flex gap-4 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex flex-col items-center pt-2">
                       <select
                         value={line.speakerId}
                         onChange={(e) => changeScriptSpeaker(line.id, e.target.value)}
                         className="bg-slate-800 border border-slate-700 text-[10px] font-bold p-1 rounded cursor-pointer hover:bg-slate-700 outline-none"
                       >
                         {speakers.map(s => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                         ))}
                       </select>
                       <div className="w-px h-full bg-slate-800 mt-2"></div>
                    </div>
                    <div className="flex-1 relative">
                       <textarea
                         value={line.text}
                         onChange={(e) => updateScriptLine(line.id, e.target.value)}
                         placeholder="대화 내용을 입력하세요..."
                         className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px]"
                       />
                       <button
                         onClick={() => removeScriptLine(line.id)}
                         className="absolute -right-2 -top-2 w-6 h-6 bg-slate-800 text-slate-500 hover:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-lg"
                       >
                         <i className="fas fa-times text-[10px]"></i>
                       </button>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        </div>
      </main>

      {/* Right Panel: Voice Settings */}
      <aside className="w-96 bg-slate-900 border-l border-slate-800 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-bold flex items-center gap-2 text-slate-100">
            <i className="fas fa-sliders-h text-indigo-400"></i>
            목소리 설정
          </h2>
        </div>

        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">현재 화자</span>
            <button 
              onClick={() => setShowVoiceBrowser(true)}
              className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded border border-indigo-600/30 hover:bg-indigo-600 hover:text-white transition-all font-bold"
            >
              <i className="fas fa-plus mr-1"></i> 화자 추가하기
            </button>
          </div>

          <div className="space-y-6">
            {speakers.map((speaker, idx) => (
              <div key={speaker.id} className="bg-slate-800/30 rounded-2xl p-5 border border-slate-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: `hsl(${(idx * 137) % 360}, 70%, 50%)` }}
                    />
                    <input
                      type="text"
                      value={speaker.name}
                      onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                      className="bg-transparent border-none text-sm font-bold focus:outline-none text-slate-100 w-24"
                    />
                  </div>
                  <button 
                    onClick={() => removeSpeaker(speaker.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">화자 개별 스타일</label>
                  <textarea
                    value={speaker.styleInstruction}
                    onChange={(e) => updateSpeaker(speaker.id, { styleInstruction: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                   <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 uppercase font-mono">{speaker.voice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Voice Browser Modal */}
      {showVoiceBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold">목소리 브라우저</h3>
                    <p className="text-sm text-slate-400">성별과 카테고리에 맞는 최적의 목소리를 선택하세요</p>
                 </div>
                 <button onClick={() => setShowVoiceBrowser(false)} className="text-slate-500 hover:text-white">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <div className="p-4 bg-slate-800/50 flex flex-col gap-4 border-b border-slate-800">
                 <div className="flex flex-wrap items-center gap-6">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">성별</span>
                      <div className="flex gap-1">
                        {GENDERS.map(g => (
                          <button
                            key={g}
                            onClick={() => setActiveGender(g)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                              activeGender === g ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">카테고리</span>
                      <div className="flex gap-1 overflow-x-auto pb-1 max-w-[400px]">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                              activeCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                   </div>
                 </div>
                 
                 <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input 
                      type="text" 
                      placeholder="목소리 이름이나 설명으로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {filteredPersonas.map(persona => (
                   <div key={persona.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500 transition-all flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/5 to-transparent pointer-events-none"></div>
                      
                      <div>
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex flex-col gap-1.5">
                             <span className="text-[9px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/50 font-bold uppercase w-fit">{persona.category}</span>
                             <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase w-fit ${getGenderColor(persona.gender)}`}>
                               {persona.gender}톤
                             </span>
                           </div>
                           <button 
                             onClick={() => handlePreview(persona)}
                             className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
                               isPreviewing === persona.id ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-indigo-500 hover:text-white hover:scale-110'
                             }`}
                           >
                             <i className={`fas ${isPreviewing === persona.id ? 'fa-spinner fa-spin' : 'fa-play text-[11px] ml-0.5'}`}></i>
                           </button>
                        </div>
                        <h4 className="font-bold text-slate-100 mb-1.5">{persona.label}</h4>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">{persona.description}</p>
                      </div>
                      <button 
                        onClick={() => addSpeakerFromPersona(persona)}
                        className="w-full py-2.5 bg-slate-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all mt-auto active:scale-95"
                      >
                        이 목소리 선택
                      </button>
                   </div>
                 ))}
                 {filteredPersonas.length === 0 && (
                   <div className="col-span-full py-20 text-center text-slate-500">
                      <i className="fas fa-search-minus text-4xl mb-4 block opacity-20"></i>
                      검색 조건에 맞는 목소리가 없습니다.
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
