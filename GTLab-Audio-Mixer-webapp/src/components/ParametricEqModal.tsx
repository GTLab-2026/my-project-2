import React, { useState, useEffect, useRef } from 'react';
import { AudioStem, ParametricEqBand } from '../types';
import { X, Sliders, CheckCircle2, Headphones, Sparkles, Plus, Trash2, Copy, Lock, Unlock, Power } from 'lucide-react';

interface Props {
  stem: AudioStem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedBands: ParametricEqBand[]) => void;
}

export const ParametricEqModal: React.FC<Props> = ({ stem, isOpen, onClose, onUpdate }) => {
  if (!isOpen) return null;

  // Map stem eqBands to local state with enhanced properties
  const [bands, setBands] = useState(
    (stem.eqBands && stem.eqBands.length > 0 ? stem.eqBands : [
      { frequency: 62, gain: 3.5, q: 1.2, enabled: true },
      { frequency: 240, gain: -2.0, q: 1.8, enabled: true },
      { frequency: 1200, gain: -4.5, q: 3.5, enabled: true },
      { frequency: 4800, gain: 2.8, q: 1.4, enabled: true },
      { frequency: 12500, gain: 4.2, q: 0.8, enabled: true }
    ]).map((b, idx) => ({
      id: idx + 1,
      name: `Band 0${idx + 1}`,
      color: idx === 0 ? '#ff2a85' : idx === 1 ? '#39ff14' : idx === 2 ? '#00f0ff' : idx === 3 ? '#b55fe6' : '#ffb300',
      bypassed: !b.enabled,
      locked: false,
      isSolo: false,
      lcr: 'Stereo',
      filter: 'Peaking Band',
      gain: b.gain,
      freq: b.frequency,
      q: b.q
    }))
  );

  const [masterGainDb, setMasterGainDb] = useState<number>(0.0);
  const [globalBypass, setGlobalBypass] = useState<boolean>(false);
  const [soloAuditionActive, setSoloAuditionActive] = useState<boolean>(false);
  const [soloAuditionFreq, setSoloAuditionFreq] = useState<number>(1200);
  const [soloAuditionQ, setSoloAuditionQ] = useState<number>(3.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [aiPreset, setAiPreset] = useState<string>('vocal');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync back to parent
  const handleApply = () => {
    const updated: ParametricEqBand[] = bands.map(b => ({
      frequency: b.freq,
      gain: b.gain,
      q: b.q,
      enabled: !b.bypassed
    }));
    onUpdate(updated);
    onClose();
  };

  const formatFreq = (f: number) => {
    if (f >= 1000) {
      const val = (f / 1000).toFixed(1);
      return val.endsWith('.0') ? `${Math.round(f / 1000)} kHz` : `${val} kHz`;
    }
    return `${Math.round(f)} Hz`;
  };

  const freqToAngle = (f: number) => {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const norm = (Math.log10(Math.max(20, Math.min(20000, f))) - minLog) / (maxLog - minLog);
    return -135 + norm * 270;
  };

  const qToAngle = (q: number) => {
    const norm = (Math.log10(Math.max(0.2, Math.min(18, q))) - Math.log10(0.2)) / (Math.log10(18) - Math.log10(0.2));
    return -135 + Math.max(0, Math.min(1, norm)) * 270;
  };

  // Canvas visualizer render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const calcGainAtFreq = (band: typeof bands[0], freqHz: number) => {
      if (band.bypassed || globalBypass) return 0;
      const f0 = band.freq;
      const g = band.gain;
      const q = Math.max(0.2, band.q);
      const ratio = freqHz / f0;
      const diff = Math.log2(ratio);
      const bw = 1 / q;
      return g * Math.exp(-(diff * diff) / (2 * bw * bw * 0.5));
    };

    const render = (now: number) => {
      const timeSec = now * 0.001;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const midY = h * 0.5;
      const dbScale = (h * 0.4) / 15;

      // Grid lines
      ctx.strokeStyle = 'rgba(59, 73, 75, 0.35)';
      ctx.lineWidth = 1;
      [-12, -6, 0, 6, 12].forEach(db => {
        const y = midY - db * dbScale;
        ctx.beginPath();
        if (db === 0) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(59, 73, 75, 0.3)';
          ctx.setLineDash([]);
        }
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Composite EQ Curve
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;

      for (let px = 0; px <= w; px += 3) {
        const normX = px / w;
        const fHz = Math.pow(10, Math.log10(20) + normX * (Math.log10(20000) - Math.log10(20)));
        let totalDb = masterGainDb;
        if (!globalBypass) {
          bands.forEach(b => { totalDb += calcGainAtFreq(b, fHz); });
        }
        const y = midY - totalDb * dbScale;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill below curve
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Band node circles
      bands.forEach(band => {
        if (band.bypassed || globalBypass) return;
        const normX = (Math.log10(band.freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20));
        const cx = normX * w;
        let nodeDb = masterGainDb;
        bands.forEach(b => { nodeDb += calcGainAtFreq(b, band.freq); });
        const cy = midY - nodeDb * dbScale;

        ctx.beginPath();
        ctx.arc(cx, cy, band.isSolo ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = band.color;
        ctx.fill();
        ctx.lineWidth = band.isSolo ? 3 : 2;
        ctx.strokeStyle = band.isSolo ? '#00f0ff' : '#ffffff';
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bands, masterGainDb, globalBypass]);

  const handleAddBand = () => {
    const newId = bands.length + 1;
    setBands([
      ...bands,
      {
        id: newId,
        name: `Band 0${newId}`,
        color: '#38bdf8',
        bypassed: false,
        locked: false,
        isSolo: false,
        lcr: 'Stereo',
        filter: 'Peaking Band',
        gain: 2.0,
        freq: 8000,
        q: 1.4
      }
    ]);
  };

  const handleRemoveBand = (id: number) => {
    if (bands.length <= 1) return;
    setBands(bands.filter(b => b.id !== id));
  };

  const handleToggleBypass = (id: number) => {
    setBands(bands.map(b => b.id === id ? { ...b, bypassed: !b.bypassed } : b));
  };

  const handleToggleLock = (id: number) => {
    setBands(bands.map(b => b.id === id ? { ...b, locked: !b.locked } : b));
  };

  const handleToggleSolo = (id: number) => {
    setBands(bands.map(b => b.id === id ? { ...b, isSolo: !b.isSolo } : b));
  };

  const handleGainChange = (id: number, gain: number) => {
    setBands(bands.map(b => b.id === id && !b.locked ? { ...b, gain } : b));
  };

  const handleFreqChange = (id: number, freq: number) => {
    setBands(bands.map(b => b.id === id && !b.locked ? { ...b, freq: Math.max(20, Math.min(20000, freq)) } : b));
  };

  const handleQChange = (id: number, q: number) => {
    setBands(bands.map(b => b.id === id && !b.locked ? { ...b, q: Math.max(0.2, Math.min(18, q)) } : b));
  };

  const applyAiPreset = (profile: string) => {
    setAiPreset(profile);
    if (profile === 'vocal') {
      setBands(bands.map((b, i) => {
        if (i === 0) return { ...b, freq: 90, gain: -4.5, filter: 'High Pass' };
        if (i === 1) return { ...b, freq: 320, gain: -2.8, q: 2.0 };
        if (i === 2) return { ...b, freq: 2800, gain: 3.2, q: 1.4 };
        if (i === 3) return { ...b, freq: 7500, gain: -1.5, q: 3.8 };
        if (i === 4) return { ...b, freq: 14000, gain: 3.8, filter: 'High Shelf' };
        return b;
      }));
    } else if (profile === 'sub') {
      setBands(bands.map((b, i) => {
        if (i === 0) return { ...b, freq: 45, gain: 4.2, q: 1.3 };
        if (i === 1) return { ...b, freq: 180, gain: -3.5, q: 2.2 };
        return b;
      }));
    } else if (profile === 'demud') {
      setBands(bands.map((b, i) => {
        if (i === 1) return { ...b, freq: 260, gain: -5.0, q: 2.8 };
        if (i === 2) return { ...b, freq: 600, gain: -2.2, q: 1.8 };
        return b;
      }));
    } else if (profile === 'air') {
      setBands(bands.map((b, i) => {
        if (i === 3) return { ...b, freq: 6000, gain: 3.0, q: 1.2 };
        if (i === 4) return { ...b, freq: 15000, gain: 5.2, filter: 'High Shelf' };
        return b;
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-2 sm:p-6 animate-fadeIn text-slate-100 font-sans">
      <div className="bg-[#11131a] border border-[#3b494b] rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Top Header & Quick Action Toolbar */}
        <div className="px-5 py-3 border-b border-[#3b494b]/60 bg-[#191b22] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.35)]">
              <span className="material-symbols-outlined text-xl">equalizer</span>
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-wider text-cyan-200">GTLab <span className="text-[#00f0ff] text-xs font-mono">PEQ-8 PRO</span></div>
              <div className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">Track Inspector • {stem.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <button
              onClick={() => setGlobalBypass(!globalBypass)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                globalBypass ? 'bg-rose-950/40 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 hover:border-cyan-400 text-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{globalBypass ? 'BYPASSED' : 'ACTIVE'}</span>
            </button>

            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => applyAiPreset(aiPreset)}
                className="px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 bg-cyan-500/10 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI MATCH</span>
              </button>
              <select
                value={aiPreset}
                onChange={(e) => applyAiPreset(e.target.value)}
                className="bg-slate-950 text-cyan-300 text-xs font-mono px-2 py-1.5 border-l border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="vocal">Vocal Clarity</option>
                <option value="sub">Sub Tighten</option>
                <option value="demud">De-Mud Clean</option>
                <option value="air">Air Sparkle</option>
              </select>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scroll">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Master Gain Panel (Cols 1-3) */}
            <section className="lg:col-span-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-display text-xs font-bold tracking-wider text-cyan-300">MASTER GAIN</span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">EQ OUT</span>
              </div>

              <div className="flex items-center justify-center gap-4 my-4 flex-1">
                {/* dB Scale */}
                <div className="flex flex-col justify-between h-56 text-[9px] font-mono text-slate-400 text-right pr-2">
                  <span>+18 dB</span>
                  <span>+12</span>
                  <span>+6</span>
                  <span className="text-cyan-400 font-bold">0 dB</span>
                  <span>-6</span>
                  <span>-12</span>
                  <span>-18 dB</span>
                </div>

                {/* Vertical Slider */}
                <div className="relative h-56 flex items-center justify-center">
                  <div className="absolute w-5 h-px bg-cyan-400/40 top-1/2 -translate-y-1/2 pointer-events-none"></div>
                  <input
                    type="range"
                    min="-18"
                    max="18"
                    step="0.5"
                    value={masterGainDb}
                    onChange={(e) => setMasterGainDb(Number(e.target.value))}
                    className="h-56 w-2 accent-cyan-400 bg-slate-900 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                {/* Dual LED VU */}
                <div className="h-56 w-4 bg-slate-900 rounded-lg p-0.5 flex gap-0.5 border border-slate-800">
                  <div className="flex-1 bg-black rounded overflow-hidden flex flex-col-reverse">
                    <div className="w-full bg-gradient-to-t from-emerald-400 via-cyan-400 to-pink-500 h-[75%] transition-all"></div>
                  </div>
                  <div className="flex-1 bg-black rounded overflow-hidden flex flex-col-reverse">
                    <div className="w-full bg-gradient-to-t from-emerald-400 via-cyan-400 to-pink-500 h-[70%] transition-all"></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col items-center gap-1 font-mono">
                <span className="text-[10px] uppercase text-slate-400">Trim Level</span>
                <input
                  type="text"
                  value={`${masterGainDb >= 0 ? '+' : ''}${masterGainDb.toFixed(1)} dB`}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) setMasterGainDb(Math.max(-18, Math.min(18, parsed)));
                  }}
                  className="w-24 text-center text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg py-1 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </section>

            {/* Horizontal Bands Scroll Strip (Cols 4-12) */}
            <section className="lg:col-span-9 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-white">Parametric Frequency Bands</span>
                  <span className="font-mono text-[10px] text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{bands.length} BANDS ACTIVE</span>
                </div>
                <button
                  onClick={handleAddBand}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD BAND
                </button>
              </div>

              {/* Scrollable Band Cards */}
              <div 
                ref={scrollContainerRef}
                className="horizontal-scroll-container flex items-stretch gap-3.5 overflow-x-auto pb-2 pt-1 custom-scroll"
              >
                {bands.map((band) => (
                  <div
                    key={band.id}
                    className={`band-card w-[220px] shrink-0 rounded-xl p-3.5 flex flex-col justify-between gap-3 border bg-slate-900/90 ${
                      band.bypassed ? 'opacity-40 border-slate-800' : band.isSolo ? 'border-cyan-400 shadow-glow-cyan' : 'border-slate-800 hover:border-cyan-500/50'
                    }`}
                  >
                    {/* Band Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ backgroundColor: band.color }}></span>
                        <span className="font-display font-bold text-xs text-white">BAND 0{band.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleSolo(band.id)} className={`p-1 rounded ${band.isSolo ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-400 hover:text-white'}`} title="Solo Audition">
                          <Headphones className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleLock(band.id)} className={`p-1 rounded ${band.locked ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`} title="Lock Band">
                          {band.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleRemoveBand(band.id)} className="p-1 rounded text-slate-400 hover:text-rose-400" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleToggleBypass(band.id)} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${band.bypassed ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}
                        >
                          {band.bypassed ? 'OFF' : 'ON'}
                        </button>
                      </div>
                    </div>

                    {/* LCR & Filter Selectors */}
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <select 
                        value={band.lcr}
                        onChange={(e) => setBands(bands.map(b => b.id === band.id ? { ...b, lcr: e.target.value } : b))}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-cyan-300 focus:outline-none cursor-pointer"
                      >
                        <option value="Stereo">Stereo</option>
                        <option value="Left (L)">Left (L)</option>
                        <option value="Center/Mid (C)">Mid / C</option>
                        <option value="Right (R)">Right (R)</option>
                        <option value="Side (S)">Side (S)</option>
                      </select>

                      <select
                        value={band.filter}
                        onChange={(e) => setBands(bands.map(b => b.id === band.id ? { ...b, filter: e.target.value } : b))}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="Peaking Band">Peak</option>
                        <option value="Low Shelf">LoShelf</option>
                        <option value="High Shelf">HiShelf</option>
                        <option value="High Pass">HighPass</option>
                        <option value="Low Pass">LowPass</option>
                      </select>
                    </div>

                    {/* Band Gain Slider & Knobs */}
                    <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      {/* Vertical Gain Slider */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[9px] text-slate-400">GAIN</span>
                        <input
                          type="range" min="-15" max="15" step="0.5"
                          value={band.gain}
                          disabled={band.locked}
                          onChange={(e) => handleGainChange(band.id, Number(e.target.value))}
                          className="h-28 w-2 accent-cyan-400 bg-slate-900 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                        />
                        <span className="font-mono text-[10px] font-bold text-cyan-300">{band.gain >= 0 ? `+${band.gain}` : band.gain}</span>
                      </div>

                      {/* Frequency & Q */}
                      <div className="flex flex-col gap-3 flex-1 pl-2">
                        <div className="flex flex-col">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                            <span>FREQ</span>
                            <span className="text-cyan-300">{formatFreq(band.freq)}</span>
                          </div>
                          <input
                            type="range" min="20" max="20000" step="10"
                            value={band.freq}
                            disabled={band.locked}
                            onChange={(e) => handleFreqChange(band.id, Number(e.target.value))}
                            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-col">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                            <span>Q (RESO)</span>
                            <span className="text-pink-400">Q {band.q.toFixed(2)}</span>
                          </div>
                          <input
                            type="range" min="0.2" max="18" step="0.1"
                            value={band.q}
                            disabled={band.locked}
                            onChange={(e) => handleQChange(band.id, Number(e.target.value))}
                            className="w-full accent-pink-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Live Composite Canvas Visualizer */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-cyan-300 font-bold">PEQ-8 NEURAL CURVE &amp; RTA SPECTRUM</span>
              </div>
              <span className="text-emerald-400 font-semibold">LIVE FFT + AUDITION ACTIVE</span>
            </div>

            <div className="relative w-full h-56 cursor-crosshair">
              <canvas ref={canvasRef} className="w-full h-full block" width={900} height={224}></canvas>
              <div className="absolute bottom-1 inset-x-4 pointer-events-none flex justify-between font-mono text-[9px] text-slate-400">
                <span>20Hz</span>
                <span>100Hz</span>
                <span>500Hz</span>
                <span>1kHz</span>
                <span>5kHz</span>
                <span>10kHz</span>
                <span>20kHz</span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            <span>Channel: <strong className="text-white">{stem.name}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-glow-cyan transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Apply &amp; Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
