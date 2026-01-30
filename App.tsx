
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserData, Gender, Language, LANGUAGES, STAGES, MatrixData, RasterData, ARCANA_NAMES, InterpretationResult, DEFAULT_ADMIN_PROMPT } from './types';
import { calculateMatrix, calculateRaster } from './utils/numerology';
import GlassCard from './components/GlassCard';
import { generateInterpretation, generatePodcastAudio, decodeBase64, decodeAudioData } from './services/geminiService';

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeStage, setActiveStage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [results, setResults] = useState<Record<number, InterpretationResult>>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPrompt, setAdminPrompt] = useState(() => localStorage.getItem('admin_prompt') || DEFAULT_ADMIN_PROMPT);

  const matrix = useMemo(() => userData ? calculateMatrix(userData.birthdate) : null, [userData]);
  const raster = useMemo(() => userData ? calculateRaster(userData.birthdate) : null, [userData]);

  useEffect(() => {
    localStorage.setItem('admin_prompt', adminPrompt);
  }, [adminPrompt]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UserData = {
      name: formData.get('name') as string,
      birthdate: formData.get('birthdate') as string,
      gender: formData.get('gender') as Gender,
      language: formData.get('language') as Language,
    };
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(data.birthdate)) return alert("Format: DD.MM.YYYY");
    setUserData(data);
    setActiveStage(1);
  };

  const handleGeneratePodcast = async () => {
    if (!userData || !matrix || !raster) return;
    setIsLoading(true);
    try {
      const stageInfo = STAGES.find(s => s.id === activeStage);
      const result = await generateInterpretation(
        `${userData.name} (Thema: ${stageInfo?.title})`, 
        matrix, 
        raster, 
        userData.language,
        adminPrompt
      );
      
      setResults(prev => ({ ...prev, [activeStage]: result }));
      
      const base64Audio = await generatePodcastAudio(result.fullText);
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) setAudioContext(ctx);
        
        const buffer = await decodeAudioData(audioData, ctx, 24000, 1);
        setAudioBuffer(buffer);
        
        // Create download URL
        const blob = new Blob([audioData], { type: 'audio/pcm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        playBuffer(buffer, ctx);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer, ctx: AudioContext) => {
    if (sourceNode) {
      sourceNode.stop();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    setSourceNode(source);
    setIsPlaying(true);
    source.start(0);
  };

  const handlePlay = () => {
    if (audioBuffer && audioContext) {
      playBuffer(audioBuffer, audioContext);
    }
  };

  const handlePause = () => {
    if (sourceNode) {
      sourceNode.stop();
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `podcast_${activeStage}.raw`;
      a.click();
    }
  };

  const handleShare = async () => {
    const res = results[activeStage];
    if (!res) return;
    const text = `Schicksalskompass Analyse (${STAGES.find(s=>s.id===activeStage)?.title}):\n\n${res.summary}\n\nBerechnet von Kristall.Kompass`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Meine Analyse', text });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Zusammenfassung in Zwischenablage kopiert!");
    }
  };

  const renderModuleContent = () => {
    if (!matrix) return null;
    switch (activeStage) {
      case 1: return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between border-b border-white/10 pb-2 text-[10px]">
            <span className="text-white/40 uppercase">Version</span>
            <span className="font-mono text-violet-400">{matrix.meta.version}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2 text-[10px]">
            <span className="text-white/40 uppercase">Berechnet am</span>
            <span className="font-mono text-violet-400">{matrix.meta.date}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2 text-[10px]">
            <span className="text-white/40 uppercase">Regel</span>
            <span className="font-mono text-violet-400">{matrix.meta.reduce_rule}</span>
          </div>
        </div>
      );
      case 2: return (
        <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
          <div className="absolute inset-4 border-2 border-violet-500/20 rotate-45"></div>
          {[
            { pos: 'top-0', label: 'Spiritualität', val: matrix.base.top },
            { pos: 'bottom-0', label: 'Karma', val: matrix.base.bottom },
            { pos: 'left-0', label: 'Persönlichkeit', val: matrix.base.left },
            { pos: 'right-0', label: 'Talent', val: matrix.base.right },
          ].map(p => (
            <div key={p.label} className={`absolute flex flex-col items-center justify-center ${p.pos.includes('top') ? 'top-0' : p.pos.includes('bottom') ? 'bottom-0' : 'top-1/2 -translate-y-1/2'} ${p.pos.includes('left') ? 'left-0' : p.pos.includes('right') ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
               <div className="bg-violet-600 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-violet-500/40 mb-1">
                  {p.val}
               </div>
               <div className="text-[8px] uppercase font-bold text-white/40 whitespace-nowrap">{p.label}</div>
            </div>
          ))}
        </div>
      );
      case 3: return (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold shadow-2xl mb-4 animate-pulse">
            {matrix.center}
          </div>
          <h4 className="text-lg font-bold text-white">{ARCANA_NAMES[matrix.center]}</h4>
          <p className="text-white/40 text-[10px] uppercase">Zentraler Steuerungsmodus</p>
        </div>
      );
      case 4: return (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Start', val: matrix.corners.topLeft },
            { label: 'Wachstum', val: matrix.corners.topRight },
            { label: 'Erhalt', val: matrix.corners.bottomLeft },
            { label: 'Ergebnis', val: matrix.corners.bottomRight },
          ].map(c => (
            <div key={c.label} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
               <div className="text-xl font-bold text-violet-400">{c.val}</div>
               <div className="text-[9px] uppercase text-white/40">{c.label}</div>
            </div>
          ))}
        </div>
      );
      case 5: return (
        <div className="space-y-3">
          {[
             { l: 'Impuls', v: matrix.inner.vertical.v20 },
             { l: 'Fokus', v: matrix.inner.vertical.v15 },
             { l: 'Brücke', v: matrix.inner.vertical.v7 },
             { l: 'Form', v: matrix.inner.vertical.v15b },
             { l: 'Materie', v: matrix.inner.vertical.v20b },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-0.5 h-8 bg-violet-500/30"></div>
              <div>
                 <div className="text-xs font-bold">{n.v} - {ARCANA_NAMES[n.v]}</div>
                 <div className="text-[8px] text-white/30 uppercase">{n.l}</div>
              </div>
            </div>
          ))}
        </div>
      );
      case 6: return (
        <div className="flex flex-col gap-3 py-4">
           <div className="flex items-center gap-4 bg-violet-600/10 p-3 rounded-xl border border-violet-500/20">
              <div className="text-xl font-bold text-violet-400">{matrix.inner.horizontal.h19}</div>
              <div>
                 <div className="text-[10px] font-bold uppercase">Austausch</div>
                 <div className="text-[8px] text-white/40 italic">Input-Filter</div>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-xl font-bold text-white/40">{matrix.inner.horizontal.h11}</div>
              <div>
                 <div className="text-[10px] font-bold uppercase">Balance</div>
                 <div className="text-[8px] text-white/40 italic">Soziale Grenzen</div>
              </div>
           </div>
        </div>
      );
      case 7: return (
        <div className="space-y-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
             <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-orange-400 uppercase">Aktivierung</span>
                <span className="text-xl font-bold">{matrix.inner.extra.right_10_orange}</span>
             </div>
          </div>
          <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
             <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-white/40 uppercase">Manifestation</span>
                <span className="text-xl font-bold">{matrix.inner.extra.right_10_black}</span>
             </div>
          </div>
        </div>
      );
      case 8: return (
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <h5 className="text-[10px] uppercase font-bold text-blue-400 mb-2">Väterlich</h5>
              {matrix.lineage.poleA.map((v, i) => (
                 <div key={i} className="p-1.5 bg-white/5 rounded-lg text-center font-bold text-blue-200/60 text-sm">{v}</div>
              ))}
           </div>
           <div className="space-y-2">
              <h5 className="text-[10px] uppercase font-bold text-pink-400 mb-2">Mütterlich</h5>
              {matrix.lineage.poleB.map((v, i) => (
                 <div key={i} className="p-1.5 bg-white/5 rounded-lg text-center font-bold text-pink-200/60 text-sm">{v}</div>
              ))}
           </div>
        </div>
      );
      case 9: return (
        <div className="flex flex-col items-center justify-center py-4">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-sm font-bold">{matrix.socialization.poleA}</div>
              <div className="text-lg text-violet-500">+</div>
              <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-sm font-bold">{matrix.socialization.poleB}</div>
           </div>
           <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl">
              {matrix.socialization.total}
           </div>
           <p className="mt-4 text-[10px] text-violet-400 font-bold uppercase tracking-widest">Rolle</p>
        </div>
      );
      case 10: return (
        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
           <table className="w-full text-left text-[9px] uppercase font-bold">
              <thead>
                 <tr className="border-b border-white/10 text-white/30">
                    <th className="pb-1">Chakra</th>
                    <th className="pb-1">Ph</th>
                    <th className="pb-1">En</th>
                    <th className="pb-1">Em</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {matrix.healthCard.rows.map(r => (
                    <tr key={r.chakra} className="hover:bg-white/5">
                       <td className="py-1 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                          {r.chakra.substring(0, 5)}
                       </td>
                       <td className="py-1 text-violet-400">{r.physics}</td>
                       <td className="py-1 text-violet-400">{r.energy}</td>
                       <td className="py-1 text-violet-500">{r.emotions}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      );
      default: return null;
    }
  };

  const currentStage = STAGES.find(s => s.id === activeStage);
  const currentResult = results[activeStage];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 selection:bg-violet-500/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_rgba(139,92,246,0.1),_transparent_50%)]" />

      {/* Admin Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={() => setShowAdmin(!showAdmin)}
          className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Admin Panel"
        >
          ⚙️
        </button>
      </div>

      {showAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg purple-glow" title="Admin Panel: Podcast Prompt">
             <div className="space-y-4">
                <p className="text-[10px] text-white/40 uppercase font-bold">Definiere wie die KI deine Matrix deutet:</p>
                <textarea 
                  className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-xs focus:border-violet-500 focus:outline-none custom-scrollbar"
                  value={adminPrompt}
                  onChange={(e) => setAdminPrompt(e.target.value)}
                  placeholder="Gib hier den System-Prompt ein..."
                />
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setAdminPrompt(DEFAULT_ADMIN_PROMPT)}
                    className="text-[10px] font-bold text-white/20 hover:text-white transition-colors uppercase"
                  >
                    Reset auf Standard
                  </button>
                  <button 
                    onClick={() => setShowAdmin(false)}
                    className="px-6 py-2 bg-violet-600 rounded-lg text-xs font-bold uppercase"
                  >
                    Schließen
                  </button>
                </div>
             </div>
          </GlassCard>
        </div>
      )}

      {!userData ? (
        <div className="max-w-md mx-auto mt-20">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-black mb-2 tracking-tighter">
              KRISTALL<span className="text-violet-500">.</span>
            </h1>
            <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Schicksalskompass Analyse</p>
          </header>
          <GlassCard className="purple-glow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-violet-400 uppercase mb-2">Sprache / Language</label>
                <select name="language" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 appearance-none focus:border-violet-500">
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-violet-400 uppercase mb-2">Vorname</label>
                <input name="name" required placeholder="Dein Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-violet-400 uppercase mb-2">Geburtstag</label>
                  <input name="birthdate" required placeholder="DD.MM.YYYY" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-violet-400 uppercase mb-2">Geschlecht</label>
                  <select name="gender" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 appearance-none">
                    <option value={Gender.MALE}>Männlich</option>
                    <option value={Gender.FEMALE}>Weiblich</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95">Berechnung Starten</button>
            </form>
          </GlassCard>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center font-bold text-violet-400">
                {userData.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase">{userData.name}</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{userData.birthdate} • {LANGUAGES[userData.language]}</p>
              </div>
            </div>
            <button onClick={() => { setUserData(null); setResults({}); }} className="text-[10px] font-black text-white/20 hover:text-red-400 transition-colors uppercase">Abbrechen</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-2">
              <h3 className="text-[10px] font-black text-violet-400 uppercase mb-4 tracking-widest px-2">Phasen</h3>
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                {STAGES.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setActiveStage(s.id)}
                    className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                      activeStage === s.id ? 'bg-violet-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{s.id}. {s.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visualizer */}
            <div className="lg:col-span-4">
              <div className="h-full flex flex-col gap-4">
                <GlassCard title={currentStage?.title} className="flex-1 flex flex-col justify-center min-h-[350px]">
                  {renderModuleContent()}
                </GlassCard>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[9px] leading-relaxed text-white/40 uppercase font-bold">
                  {currentStage?.description}
                </div>
              </div>
            </div>

            {/* Podcast & Summary */}
            <div className="lg:col-span-5 space-y-6">
               <GlassCard className="h-full flex flex-col min-h-[450px]">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Podcast Player</h4>
                     <button 
                       onClick={handleGeneratePodcast}
                       disabled={isLoading}
                       className="px-4 py-2 bg-violet-600 text-white rounded-lg text-[9px] font-black uppercase transition-all shadow-lg hover:bg-violet-500 disabled:opacity-50"
                     >
                       {isLoading ? 'Generiere...' : 'Neu Laden'}
                     </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col overflow-hidden">
                     {currentResult ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-500">
                           {/* Controls */}
                           <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
                              <button 
                                onClick={isPlaying ? handlePause : handlePlay}
                                className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                              >
                                {isPlaying ? '⏸' : '▶️'}
                              </button>
                              <div className="flex-1">
                                 <div className="text-[10px] font-black text-white/60 uppercase mb-1">Status</div>
                                 <div className="text-[9px] text-violet-400 font-bold uppercase">{isPlaying ? 'Wird abgespielt...' : 'Bereit'}</div>
                              </div>
                              <button 
                                onClick={handleDownload}
                                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                                title="Download"
                              >
                                📥
                              </button>
                           </div>

                           {/* Full Text */}
                           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-xs text-white/70 leading-relaxed italic mb-6">
                              {currentResult.fullText}
                           </div>

                           {/* Summary & Sharing */}
                           <div className="mt-auto pt-6 border-t border-white/10">
                              <div className="bg-violet-900/20 border border-violet-500/30 rounded-2xl p-4 relative group">
                                 <h5 className="text-[9px] font-black text-violet-400 uppercase mb-2">Zusammenfassung</h5>
                                 <p className="text-[11px] font-medium leading-relaxed mb-4">{currentResult.summary}</p>
                                 <button 
                                   onClick={handleShare}
                                   className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2"
                                 >
                                   <span>🔗</span> Teilen / Kopieren
                                 </button>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                              <span className="text-3xl">🎙️</span>
                           </div>
                           <p className="text-[10px] font-black uppercase max-w-[200px] leading-relaxed">
                              Podcast für Phase {activeStage} erstellen.
                           </p>
                        </div>
                     )}
                  </div>
               </GlassCard>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 text-[9px] text-white/10 uppercase tracking-[0.5em] font-black text-center w-full">
        Kristall.Kompass // System Promptable Dashboard v1.1.0
      </footer>
    </div>
  );
};

export default App;
