import React, { useState } from 'react';
import { MasterSettings, Track } from '../types';
import { RotaryKnob } from './RotaryKnob';
import { 
  Sparkles, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Sliders, 
  Disc, 
  ShieldAlert, 
  Activity, 
  Volume2,
  RefreshCw,
  Power,
  Cpu,
  Radio,
  Lock,
  Unlock
} from 'lucide-react';

interface Props {
  masterSettings: MasterSettings;
  onUpdateMaster: (settings: MasterSettings) => void;
  currentTrack: Track;
  onExportRenderedTrack: (newTrack: Track) => void;
  onUpdateTrackStems: (updatedTrack: Track) => void;
}

export const MasterMixPanel: React.FC<Props> = ({ 
  masterSettings, 
  onUpdateMaster, 
  currentTrack, 
  onExportRenderedTrack,
  onUpdateTrackStems 
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('AI Mastering Pro');
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [abCompare, setAbCompare] = useState<boolean>(false);
  const [truePeakSafety, setTruePeakSafety] = useState<boolean>(true);
  const [oversample8x, setOversample8x] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderComplete, setRenderComplete] = useState<boolean>(false);

  // Global BPM Sync Toggle & BPM value
  const [globalBpmSync, setGlobalBpmSync] = useState<boolean>(true);
  const [bpm, setBpm] = useState<number>(currentTrack.aiBpm || 128);

  // Interactive EQ Rotary Knob values
  const [subGain, setSubGain] = useState<number>(3.5);
  const [midGain, setMidGain] = useState<number>(0.0);
  const [presenceGain, setPresenceGain] = useState<number>(4.5);
  const [airGain, setAirGain] = useState<number>(2.2);

  // Multiband Limiter sliders
  const [limiterThreshold, setLimiterThreshold] = useState<number>(-3.0);
  const [limiterCeiling, setLimiterCeiling] = useState<number>(-0.1);
  const [limiterRelease, setLimiterRelease] = useState<number>(45);

  // Neural AI DSP sliders
  const [tapeWarmth, setTapeWarmth] = useState<number>(4.2);
  const [transientPunch, setTransientPunch] = useState<number>(24);
  const [stereoWidth, setStereoWidth] = useState<number>(132);

  // Tap Tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleTapTempo = () => {
    const now = Date.now();
    let newTaps = [...tapTimes, now];
    if (newTaps.length > 1 && now - newTaps[newTaps.length - 2] > 2000) {
      newTaps = [now];
    }
    if (newTaps.length > 6) {
      newTaps = newTaps.slice(newTaps.length - 6);
    }
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      let intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
        onUpdateTrackStems({ ...currentTrack, aiBpm: calculatedBpm });
      }
    }
  };

  const presets = [
    { name: 'AI Mastering Pro' },
    { name: 'Hyper-Bass EDM' },
    { name: 'Vocal Air & Warmth' },
    { name: 'Loudness War -14 LUFS' },
    { name: 'Custom Studio Rig' }
  ];

  const handleStartExportRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsRendering(false);
        setRenderComplete(true);

        const exportedTrack: Track = {
          id: `master-mix-${Date.now()}`,
          title: `${currentTrack.title} (Mastered 32-bit FLAC)`,
          artist: `${currentTrack.artist} [AI Master Suite]`,
          album: 'GTLab Mastered Studio Export',
          duration: currentTrack.duration,
          coverUrl: currentTrack.coverUrl,
          audioUrl: currentTrack.audioUrl,
          source: 'local',
          stems: currentTrack.stems,
          aiAnalyzed: true,
          aiGenre: 'AI Master Suite Export',
          aiMood: 'Broadcast Ready (-14 LUFS)',
          aiBpm: bpm,
          aiKey: currentTrack.aiKey,
          aiInsights: 'Mastered successfully with AI Smart EQ curve, Multiband Limiter, and Neural AI DSP harmonics.'
        };

        onExportRenderedTrack(exportedTrack);
      }
      setRenderProgress(progress);
    }, 200);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-fadeIn">
      
      {/* Master Telemetry & Preset Quick Bar */}
      <section className="glass-panel cyber-border-gradient rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          
          {/* Preset Selector Strip */}
          <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 pl-1 shrink-0 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00f2fe]" />
              AI Profile:
            </span>
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => setSelectedPreset(p.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedPreset === p.name 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/30 text-white shadow-glow-cyan font-medium' 
                    : 'text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                }`}
              >
                {selectedPreset === p.name && <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span>}
                {p.name}
              </button>
            ))}
          </div>

          {/* Global BPM Sync Toggle & Tap Tempo */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
            
            {/* Global BPM Sync Toggle */}
            <button
              onClick={() => setGlobalBpmSync(!globalBpmSync)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                globalBpmSync ? 'bg-cyan-500/20 text-[#00f2fe] border-cyan-500/50 shadow-glow-cyan' : 'bg-white/5 text-slate-400 border-white/10'
              }`}
              title="Global BPM sync across all stem tracks"
            >
              {globalBpmSync ? <Lock className="w-3.5 h-3.5 text-[#00f2fe]" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Grid BPM: {bpm} {globalBpmSync ? '(Synced)' : '(Free)'}</span>
            </button>

            {/* Tap Tempo Button */}
            <button
              onClick={handleTapTempo}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-pink-500/20 to-purple-600/30 text-pink-300 border border-pink-500/40 hover:border-pink-500 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title="Click repeatedly to tap tempo"
            >
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
              <span>TAP TEMPO</span>
            </button>

            <div className="flex items-center gap-2 bg-obsidian/70 px-3 py-1.5 rounded-xl shadow-inner-glow">
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider font-mono text-slate-400">Integrated LUFS</span>
                <span className="text-xs font-mono font-bold text-[#00f2fe]">-14.1 <span className="text-[9px] text-slate-400">LUFS</span></span>
              </div>
              <div className="h-6 w-px bg-white/10 mx-1"></div>
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider font-mono text-slate-400">True Peak</span>
                <span className="text-xs font-mono font-bold text-emerald-400">-0.1 <span className="text-[9px] text-slate-400">dBTP</span></span>
              </div>
            </div>

            {/* Master Toggles */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsBypassed(!isBypassed)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  isBypassed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-300 bg-white/[0.04] hover:bg-white/[0.08]'
                }`} 
                title="Bypass DSP Processing"
              >
                <Power className="w-3.5 h-3.5 text-slate-400" />
                <span>{isBypassed ? 'DSP Bypassed' : 'Bypass DSP'}</span>
              </button>

              <button 
                onClick={() => setAbCompare(!abCompare)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  abCompare ? 'bg-cyan-500/20 text-[#00f2fe] border border-cyan-500/40' : 'text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20'
                }`} 
                title="A/B Quick Reference"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{abCompare ? 'A/B: Reference' : 'A/B Compare'}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {renderComplete && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Master mix successfully exported and saved as a new file in your playlist!</span>
          </div>
          <button onClick={() => setRenderComplete(false)} className="text-emerald-400 hover:text-white font-semibold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 3-Column Studio Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Dynamic Parametric EQ (8-Band AI Smart Filter with Interactive Rotary Knobs) */}
        <section className="lg:col-span-5 glass-panel rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00f2fe]" />
              <div>
                <h2 className="font-display font-bold text-sm tracking-wide text-white">DYNAMIC PARAMETRIC EQ</h2>
                <p className="text-[10px] font-mono text-slate-400">8-Band AI Smart Filter • Interactive Rotary Knobs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 flex items-center gap-1 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]"></span> Neural Match
              </span>
              <button 
                onClick={() => { setSubGain(0); setMidGain(0); setPresenceGain(0); setAirGain(0); }}
                className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-colors cursor-pointer" 
                title="Reset Curve"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Spectrum Graph */}
          <div className="relative w-full h-44 bg-obsidian/90 rounded-xl overflow-hidden shadow-inner-glow mb-4 p-3 flex flex-col justify-between">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="eq-fill-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.35"></stop>
                  <stop offset="70%" stopColor="#8a2be2" stopOpacity="0.1"></stop>
                  <stop offset="100%" stopColor="#07090e" stopOpacity="0"></stop>
                </linearGradient>
                <linearGradient id="eq-line-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#00f2fe"></stop>
                  <stop offset="45%" stopColor="#4facfe"></stop>
                  <stop offset="75%" stopColor="#8a2be2"></stop>
                  <stop offset="100%" stopColor="#f72585"></stop>
                </linearGradient>
              </defs>
              <path d="M 0,200 L 0,150 Q 50,140 80,105 T 160,85 T 240,110 T 320,70 T 400,95 T 500,120 L 500,200 Z" fill="url(#eq-fill-gradient)"></path>
              <path d="M 0,150 Q 50,140 80,105 T 160,85 T 240,110 T 320,70 T 400,95 T 500,120" fill="none" filter="drop-shadow(0px 0px 6px rgba(0, 242, 254, 0.8))" stroke="url(#eq-line-gradient)" strokeWidth="3"></path>
            </svg>
            <div className="relative z-10 flex justify-between text-[9px] font-mono text-slate-400 pt-20">
              <span>20 Hz</span>
              <span>100 Hz</span>
              <span>1 kHz</span>
              <span>5 kHz</span>
              <span>10 kHz</span>
              <span>20 kHz</span>
            </div>
          </div>

          {/* Interactive Rotary Knobs for EQ */}
          <div className="grid grid-cols-4 gap-2 mb-3 bg-obsidian/50 p-3 rounded-xl border border-white/5">
            <RotaryKnob label="Sub 45Hz" value={subGain} min={-24} max={24} color="#00f2fe" onChange={setSubGain} />
            <RotaryKnob label="Mid 800Hz" value={midGain} min={-24} max={24} color="#4facfe" onChange={setMidGain} />
            <RotaryKnob label="Pres 4kHz" value={presenceGain} min={-24} max={24} color="#8a2be2" onChange={setPresenceGain} />
            <RotaryKnob label="Air 16kHz" value={airGain} min={-24} max={24} color="#f72585" onChange={setAirGain} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button 
              onClick={() => alert("AI Smart Spectrum match computed successfully!")}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-glow-cyan cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#00f2fe] animate-spin" style={{ animationDuration: '8s' }} />
              <span>Auto-EQ Match Spectrum</span>
            </button>
          </div>
        </section>

        {/* MIDDLE COLUMN: Multiband Limiter with Custom Slider Faders */}
        <section className="lg:col-span-4 glass-panel rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-900/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="font-display font-bold text-sm tracking-wide text-white">MULTIBAND LIMITER</h2>
                <p className="text-[10px] font-mono text-slate-400">Custom Slider Faders • True Peak</p>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
            </span>
          </div>

          {/* Global Hard Limiter Override Switch */}
          <div className="flex items-center justify-between bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-cyan-500/20 border border-rose-500/40 rounded-xl p-3 mb-3 shadow-md relative z-10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
              <div>
                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider block">Global Hard Limiter</span>
                <span className="text-[9px] font-mono text-slate-300">Forces hardbrick ceiling on main output (overrides individual track settings)</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={masterSettings.globalHardLimiterOverride ?? true}
                onChange={(e) => {
                  onUpdateMaster({
                    ...masterSettings,
                    globalHardLimiterOverride: e.target.checked
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
            </label>
          </div>

          {/* Gain Reduction Meter */}
          <div className="bg-obsidian/80 rounded-xl p-3 mb-3 shadow-inner-glow">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
              <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Gain Reduction (GR)
              </span>
              <span className="text-rose-400 font-bold">-2.8 dB</span>
            </div>
            <div className="w-full bg-black/60 rounded-md p-1 flex items-center gap-0.5">
              <div className="h-3 flex-1 rounded-sm bg-slate-800"></div>
              <div className="h-3 flex-1 rounded-sm bg-cyan-400"></div>
              <div className="h-3 flex-1 rounded-sm bg-purple-500"></div>
              <div className="h-3 flex-1 rounded-sm bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div>
            </div>
          </div>

          {/* Precision Limiter Slider Faders */}
          <div className="space-y-3.5 mb-4 bg-obsidian/50 p-3 rounded-xl border border-white/5">
            {/* Threshold */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-300">Threshold</span>
                <span className="text-[#00f2fe] font-bold">{limiterThreshold.toFixed(1)} dB</span>
              </div>
              <input
                type="range" min="-30" max="0" step="0.5"
                value={limiterThreshold}
                onChange={(e) => setLimiterThreshold(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Ceiling */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-300">Ceiling</span>
                <span className="text-emerald-400 font-bold">{limiterCeiling.toFixed(1)} dBTP</span>
              </div>
              <input
                type="range" min="-12" max="0" step="0.1"
                value={limiterCeiling}
                onChange={(e) => setLimiterCeiling(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Release */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-300">Release (ms)</span>
                <span className="text-purple-300 font-bold">{limiterRelease} ms</span>
              </div>
              <input
                type="range" min="10" max="1000" step="5"
                value={limiterRelease}
                onChange={(e) => setLimiterRelease(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center justify-between p-2 rounded-xl bg-obsidian/40 cursor-pointer hover:bg-obsidian/60 transition-colors">
              <span className="text-[10px] font-mono text-slate-300">True Peak Safety</span>
              <input 
                type="checkbox" 
                checked={truePeakSafety} 
                onChange={() => setTruePeakSafety(!truePeakSafety)} 
                className="rounded text-cyan-500 focus:ring-0 bg-slate-900 border-white/10 cursor-pointer" 
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-xl bg-obsidian/40 cursor-pointer hover:bg-obsidian/60 transition-colors">
              <span className="text-[10px] font-mono text-slate-300">Oversample 8x</span>
              <input 
                type="checkbox" 
                checked={oversample8x} 
                onChange={() => setOversample8x(!oversample8x)} 
                className="rounded text-pink-500 focus:ring-0 bg-slate-900 border-white/10 cursor-pointer" 
              />
            </label>
          </div>
        </section>

        {/* RIGHT COLUMN: Neural AI DSP & Vectorscope with Custom Sliders & Rotary Knobs */}
        <section className="lg:col-span-3 glass-panel rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-pink-600/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-pink-500" />
              <div>
                <h2 className="font-display font-bold text-sm tracking-wide text-white">NEURAL AI DSP</h2>
                <p className="text-[10px] font-mono text-slate-400">Vectorscope &amp; Punch Controls</p>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
              96kHz Matrix
            </span>
          </div>

          {/* Vectorscope Visualizer */}
          <div className="bg-obsidian/80 rounded-xl p-2 mb-3 shadow-inner-glow flex flex-col items-center justify-center relative overflow-hidden h-28">
            <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-400">VECTORSCOPE L/R</span>
            <span className="absolute top-1 right-2 text-[8px] font-mono text-[#00f2fe]">WIDTH: {stereoWidth}%</span>
            
            <svg className="w-20 h-20 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="1"></circle>
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="50" x2="50" y1="8" y2="92"></line>
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="8" x2="92" y1="50" y2="50"></line>
              <ellipse className="opacity-80 animate-pulse" cx="50" cy="50" fill="none" rx={34 * (stereoWidth / 100)} ry="18" stroke="#00f2fe" strokeWidth="1.8" transform="rotate(-35 50 50)"></ellipse>
              <circle className="shadow-glow-cyan" cx="50" cy="50" fill="#8a2be2" r="3"></circle>
            </svg>
          </div>

          {/* Interactive Knobs & Sliders for Tape Warmth, Transient Punch, Stereo Width */}
          <div className="space-y-3 mb-3 bg-obsidian/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">Tape Warmth</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">+{tapeWarmth} dB</span>
            </div>
            <input
              type="range" min="0" max="12" step="0.5"
              value={tapeWarmth}
              onChange={(e) => setTapeWarmth(Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">Transient Punch</span>
              <span className="text-[11px] font-mono font-bold text-pink-400">+{transientPunch}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="1"
              value={transientPunch}
              onChange={(e) => setTransientPunch(Number(e.target.value))}
              className="w-full accent-pink-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-300">Stereo Field Width</span>
              <span className="text-[11px] font-mono font-bold text-[#00f2fe]">{stereoWidth}%</span>
            </div>
            <input
              type="range" min="50" max="200" step="5"
              value={stereoWidth}
              onChange={(e) => setStereoWidth(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Final Master Export Button */}
          <button 
            onClick={handleStartExportRender}
            disabled={isRendering}
            className="w-full py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#00f2fe] via-purple-600 to-pink-600 hover:brightness-110 text-white shadow-glow-play transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {isRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            <span>{isRendering ? `Mastering & Exporting (${renderProgress}%)...` : 'Export Mastered File'}</span>
          </button>
        </section>

      </div>
    </div>
  );
};
