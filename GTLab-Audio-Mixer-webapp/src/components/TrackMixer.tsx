import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { Sliders, Save, FolderOpen, Download, Activity, X, Sparkles, Disc, Music, FileAudio, Radio } from 'lucide-react';
import { ModularChannelRackModal } from './ModularChannelRackModal';
import { EqStudioModal } from './EqStudioModal';

interface Props {
  track: Track;
  onUpdateTrack: (updatedTrack: Track) => void;
}

interface ModuleStates {
  eq: 'active' | 'inactive' | 'bypass';
  mb_comp: 'active' | 'inactive' | 'bypass';
  dsp_a: 'active' | 'inactive' | 'bypass';
  dsp_b: 'active' | 'inactive' | 'bypass';
  dsp_c: 'active' | 'inactive' | 'bypass';
  saturation: 'active' | 'inactive' | 'bypass';
  fx_chain: 'active' | 'inactive' | 'bypass';
}

interface ChannelData {
  id: number;
  name: string;
  bpm: string;
  color: string;
  muted: boolean;
  solo: boolean;
  gain: number;
  modules: ModuleStates;
  seed: number;
}

export const TrackMixer: React.FC<Props> = ({ track, onUpdateTrack }) => {
  const [activeBus, setActiveBus] = useState<string>('MASTER BUS (6 CH SUM)');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timecode, setTimecode] = useState<string>('01:24:18:04');
  const [focusedChannel, setFocusedChannel] = useState<string>('CH 01: Kick Sub-Punch');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preset modal & Module inspector modal
  const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [modularRackOpen, setModularRackOpen] = useState<boolean>(false);
  const [modularRackOpenB, setModularRackOpenB] = useState<boolean>(false);
  const [modularRackOpenC, setModularRackOpenC] = useState<boolean>(false);
  const [eqStudioOpen, setEqStudioOpen] = useState<boolean>(false);
  const [inspectTrackId, setInspectTrackId] = useState<number>(1);
  const [inspectModuleId, setInspectModuleId] = useState<keyof ModuleStates>('eq');

  // Master Gain state
  const [masterGain, setMasterGain] = useState<number>(0.0);
  const [editingMasterGain, setEditingMasterGain] = useState<boolean>(false);

  // Channels state (6 primary channels matching the design)
  const [channels, setChannels] = useState<ChannelData[]>([
    { 
      id: 1, name: 'Kick Sub-Punch', bpm: '128 BPM', color: '#ff4a8d', muted: false, solo: false,
      gain: -1.5,
      modules: { eq: 'active', mb_comp: 'active', dsp_a: 'active', dsp_b: 'active', dsp_c: 'active', saturation: 'active', fx_chain: 'inactive' },
      seed: 0.7
    },
    { 
      id: 2, name: 'Snare 808 Crisp', bpm: '128 BPM', color: '#00f0ff', muted: false, solo: false,
      gain: -2.0,
      modules: { eq: 'active', mb_comp: 'active', dsp_a: 'inactive', dsp_b: 'active', dsp_c: 'active', saturation: 'active', fx_chain: 'active' },
      seed: 1.9
    },
    { 
      id: 3, name: 'Bass Reese Heavy', bpm: '128 BPM', color: '#d0bcff', muted: false, solo: false,
      gain: -0.8,
      modules: { eq: 'active', mb_comp: 'active', dsp_a: 'bypass', dsp_b: 'active', dsp_c: 'active', saturation: 'active', fx_chain: 'active' },
      seed: 3.1
    },
    { 
      id: 4, name: 'Synth Lead Arp', bpm: '128 BPM', color: '#4ade80', muted: true, solo: false,
      gain: -4.2,
      modules: { eq: 'active', mb_comp: 'inactive', dsp_a: 'inactive', dsp_b: 'active', dsp_c: 'active', saturation: 'inactive', fx_chain: 'active' },
      seed: 4.4
    },
    { 
      id: 5, name: 'Vox Chop Glitch', bpm: '128 BPM', color: '#facc15', muted: false, solo: false,
      gain: -3.0,
      modules: { eq: 'active', mb_comp: 'active', dsp_a: 'active', dsp_b: 'active', dsp_c: 'active', saturation: 'active', fx_chain: 'bypass' },
      seed: 5.6
    },
    { 
      id: 6, name: 'Atmos Pad Void', bpm: '128 BPM', color: '#38bdf8', muted: false, solo: false,
      gain: -5.5,
      modules: { eq: 'active', mb_comp: 'inactive', dsp_a: 'inactive', dsp_b: 'active', dsp_c: 'active', saturation: 'bypass', fx_chain: 'active' },
      seed: 6.8
    }
  ]);

  // Editing gain state per channel
  const [editingGainCh, setEditingGainCh] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const formatGain = (val: number) => {
    const v = Math.round(val * 10) / 10;
    return `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`;
  };

  const parseGain = (str: string, fallback: number) => {
    const clean = str.trim().toUpperCase().replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return fallback;
    return Math.max(-36, Math.min(12, num));
  };

  // Canvas refs for PEQ spectrum animation
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const timeSec = (now - startTime) * 0.001;
      channels.forEach((ch) => {
        const canvas = canvasRefs.current[ch.id];
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(59, 73, 75, 0.35)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const y = (h / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let i = 1; i < 9; i++) {
          const x = (w / 9) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        const active = !ch.muted && isPlaying;
        const gainMultiplier = ch.muted ? 0.05 : Math.max(0.12, Math.pow(10, ch.gain / 20));
        const amp = active ? gainMultiplier : 0.05;

        // FFT live spectrum bars
        const bars = 54;
        const barW = w / bars;
        const fftGrad = ctx.createLinearGradient(0, h, 0, 0);
        fftGrad.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
        fftGrad.addColorStop(0.55, 'rgba(0, 219, 233, 0.25)');
        fftGrad.addColorStop(1, 'rgba(255, 74, 141, 0.42)');
        ctx.fillStyle = fftGrad;

        for (let i = 0; i < bars; i++) {
          const norm = i / bars;
          const wave =
            Math.sin(timeSec * 4.2 + i * 0.42 + ch.seed) * 0.35 +
            Math.cos(timeSec * 6.8 - i * 0.75 + ch.seed * 1.3) * 0.25 +
            0.45;
          const barH = Math.max(2, wave * (1 - norm * 0.25) * h * 0.78 * amp);
          ctx.fillRect(i * barW + 1, h - barH, Math.max(1, barW - 2), barH);
        }

        // 8-Band PEQ curves
        const bands = [
          { color: '#ff5722', center: 0.10, width: 0.08, gain: -0.32, speed: 2.3, phase: 0.0 },
          { color: '#fb923c', center: 0.22, width: 0.09, gain: 0.28, speed: 2.8, phase: 0.8 },
          { color: '#39ff14', center: 0.36, width: 0.10, gain: -0.25, speed: 3.1, phase: 1.4 },
          { color: '#22d3ee', center: 0.49, width: 0.08, gain: 0.30, speed: 2.5, phase: 2.1 },
          { color: '#00f0ff', center: 0.62, width: 0.08, gain: 0.26, speed: 2.7, phase: 2.9 },
          { color: '#e040fb', center: 0.74, width: 0.09, gain: 0.22, speed: 3.5, phase: 3.7 },
          { color: '#ec4899', center: 0.85, width: 0.09, gain: -0.22, speed: 2.2, phase: 4.4 },
          { color: '#fef08a', center: 0.94, width: 0.10, gain: 0.19, speed: 1.9, phase: 5.1 }
        ];

        const midY = h * 0.52;
        bands.forEach((b) => {
          ctx.beginPath();
          ctx.strokeStyle = b.color;
          ctx.lineWidth = Math.max(1.5, w * 0.0028);
          ctx.shadowColor = b.color;
          ctx.shadowBlur = active ? 7 : 0;
          const dynamicGain = b.gain * (0.75 + 0.35 * Math.sin(timeSec * b.speed + b.phase + ch.seed)) * (active ? gainMultiplier : 0.08);
          
          const peakX = b.center * w;
          const peakY = midY + dynamicGain * h;

          for (let px = 0; px <= w; px += 3) {
            const xNorm = px / w;
            const dist = (xNorm - b.center) / b.width;
            const bell = Math.exp(-dist * dist * 2.2);
            const y = midY + bell * dynamicGain * h;
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(peakX, peakY, Math.max(2.5, w * 0.005), 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [channels, isPlaying]);

  // Resize canvas dimensions to match container width
  useEffect(() => {
    channels.forEach(ch => {
      const canvas = canvasRefs.current[ch.id];
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * 2));
        canvas.height = Math.max(1, Math.floor(rect.height * 2));
      }
    });
  }, [channels]);

  // Timecode counter
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      let frames = 150000;
      timer = setInterval(() => {
        frames++;
        const hrs = Math.floor(frames / (3600 * 30));
        const remH = frames % (3600 * 30);
        const mins = Math.floor(remH / (60 * 30));
        const remM = remH % (60 * 30);
        const secs = Math.floor(remM / 30);
        const f = remM % 30;
        setTimecode(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(f).padStart(2, '0')}`);
      }, 33);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const MODULE_DEFS = [
    { id: 'eq' as keyof ModuleStates, label: 'EQ / PEQ', title: 'EQ / Parametric Equalizer Rack' },
    { id: 'mb_comp' as keyof ModuleStates, label: 'Band Comp', title: 'Multiband Dynamics Compressor' },
    { id: 'dsp_a' as keyof ModuleStates, label: 'DSP - A', title: 'Modular Channel Rack DSP - A' },
    { id: 'dsp_b' as keyof ModuleStates, label: 'DSP - B', title: 'Modular Channel Rack DSP - B' },
    { id: 'dsp_c' as keyof ModuleStates, label: 'DSP - C', title: 'Modular Channel Rack DSP - C' },
    { id: 'saturation' as keyof ModuleStates, label: 'Saturation', title: 'Harmonic Saturation & Tube Drive' },
    { id: 'fx_chain' as keyof ModuleStates, label: 'FX Chain', title: 'Auxiliary FX Processing Chain' }
  ];

  const handleModuleStateChange = (trackId: number, modId: keyof ModuleStates, newState: 'active' | 'inactive' | 'bypass') => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === trackId) {
        return {
          ...ch,
          modules: { ...ch.modules, [modId]: newState }
        };
      }
      return ch;
    }));
  };

  const handleGainChange = (trackId: number, val: number) => {
    setChannels(prev => prev.map(ch => ch.id === trackId ? { ...ch, gain: val } : ch));
  };

  const handleMuteToggle = (trackId: number) => {
    setChannels(prev => prev.map(ch => ch.id === trackId ? { ...ch, muted: !ch.muted } : ch));
  };

  const handleSoloToggle = (trackId: number) => {
    setChannels(prev => prev.map(ch => ch.id === trackId ? { ...ch, solo: !ch.solo } : ch));
  };

  const activeTrackForInspector = channels.find(c => c.id === inspectTrackId) || channels[0];
  const activeModuleDef = MODULE_DEFS.find(m => m.id === inspectModuleId) || MODULE_DEFS[0];

  return (
    <div className="flex flex-col gap-4 animate-fadeIn text-slate-100 font-sans pb-28">
      
      {/* Project Panel (Marked as 2 in reference image) */}
      <section className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Left: File Extension Icon + 3 Lines of Audio Analysis Info */}
        <div className="flex items-center gap-4 relative z-10">
          {/* File Extension Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300">
            FLAC
          </div>
          <div className="flex flex-col">
            {/* 1st Line: Music File Title */}
            <h2 className="h1-title text-white tracking-tight font-bold">Cyber Odyssey - Neural Master Mix.flac</h2>
            {/* 2nd Line: Analysis info (Sample Rate, Bit Rate + CBR badge, Track Count, Engine Info, Output Channels) */}
            <p className="plain-text font-mono text-[11px] text-slate-300 flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-cyan-300 font-bold">48 kHz</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/30">320 kbps CBR</span>
              <span>•</span>
              <span className="text-pink-400 font-bold">11 Stems Detected</span>
              <span>•</span>
              <span className="text-purple-300">Demucs v4 Neural</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">7.1.4 Atmos Out</span>
            </p>
          </div>
        </div>

        {/* Right: Digital Time Code display + Analog VU Meters (with Red peak indicators) for L, C, R */}
        <div className="flex items-center gap-4 relative z-10 font-mono">
          
          {/* Digital Time Code Display */}
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center shadow-inner">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest">TIMECODE</div>
            <div className="text-sm font-semibold text-cyan-300 tracking-wider">{timecode}</div>
          </div>

          {/* Analog VU Meters with Red Peak Indicators for L, C, R */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-400 font-bold uppercase">L C R VU</span>
            <div className="flex items-center gap-1.5">
              {['L', 'C', 'R'].map((ch, idx) => (
                <div key={ch} className="flex flex-col items-center gap-0.5">
                  <span className="text-[7px] text-slate-400 font-bold">{ch}</span>
                  <div className="h-6 w-2.5 bg-slate-900 rounded-xs flex flex-col justify-end p-0.5 border border-slate-800">
                    <div className="w-full bg-gradient-to-t from-emerald-400 via-cyan-400 to-pink-500 rounded-xs" style={{ height: `${65 + idx * 10}%` }}></div>
                  </div>
                  {/* Red Peak Indicator */}
                  <span className={`w-1.5 h-1.5 rounded-full ${idx === 1 ? 'bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse' : 'bg-slate-700'}`} title="Red Peak Indicator"></span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Bottom portion of Project Panel: Action Buttons (Presets, Save Mix, Save Preset, Export as, AI Auto Mix) */}
      <section className="glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <button 
            onClick={() => setPresetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition border border-slate-700 cursor-pointer shadow-md font-bold"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>Presets</span>
          </button>
          
          <button 
            onClick={() => showToast('Master mix session saved successfully.')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition border border-slate-700 cursor-pointer shadow-md font-bold"
          >
            <Save className="w-4 h-4 text-pink-400" />
            <span>Save Mix</span>
          </button>

          <button 
            onClick={() => showToast('Current DSP preset snapshot saved to vault.')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition border border-slate-700 cursor-pointer shadow-md font-bold"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Save Preset</span>
          </button>

          <button 
            onClick={() => showToast('Exporting multitrack bundle (WAV + JSON)...')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition border border-slate-700 cursor-pointer shadow-md font-bold"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export as</span>
          </button>
        </div>

        <div>
          <button 
            onClick={() => showToast('AI Auto Mix analyzed frequency spectrum and optimized multi-stem balance.')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 font-bold flex items-center gap-2 hover:brightness-110 shadow-glow-cyan transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Auto Mix</span>
          </button>
        </div>
      </section>

      {/* Main Workspace Layout: 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Rack: Multitrack Strips & Bottom DSP Modules */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
          
          {/* Track Strips Rack Container */}
          <section className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col gap-3 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="h2-title text-white">MULTITRACK PEQ CONSOLE STRIPS</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono text-[10px] border border-slate-800">48kHz / 32-Bit Float</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Inactive</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Bypass</span>
              </div>
            </div>

            {/* Track Strips List */}
            <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 custom-scroll">
              {channels.map((ch, index) => {
                const isMuted = ch.muted;
                const isSolo = ch.solo;
                const chNum = String(index + 1).padStart(2, '0');

                return (
                  <article 
                    key={ch.id}
                    onClick={() => setFocusedChannel(`CH ${chNum}: ${ch.name}`)}
                    className={`glass-strip rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center gap-3.5 border transition cursor-pointer ${
                      isMuted ? 'border-pink-500/40 bg-slate-950/60 opacity-60' : 'border-slate-800/80 bg-slate-900/60 hover:border-cyan-500/40'
                    }`}
                  >
                    {/* Left: Track ID & Info */}
                    <div className="flex lg:flex-col justify-between items-center lg:items-start w-full lg:w-32 shrink-0 gap-1 border-b lg:border-b-0 lg:border-r border-slate-800 pb-2 lg:pb-0 lg:pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color, boxShadow: `0 0 8px ${ch.color}` }}></span>
                        <span className="font-mono text-xs font-bold tracking-wide text-cyan-300">CH {chNum}</span>
                      </div>
                      <div className="font-headline text-xs font-semibold text-white truncate max-w-[150px] lg:max-w-full" title={ch.name}>{ch.name}</div>
                      <span className="font-mono text-[10px] text-slate-400">{ch.bpm}</span>
                      {/* Solo & Mute Buttons */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSoloToggle(ch.id); }}
                          className={`w-6 h-6 rounded font-mono text-[11px] font-bold border transition flex items-center justify-center cursor-pointer ${
                            isSolo ? 'bg-amber-400/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMuteToggle(ch.id); }}
                          className={`w-6 h-6 rounded font-mono text-[11px] font-bold border transition flex items-center justify-center cursor-pointer ${
                            isMuted ? 'bg-pink-500/25 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,74,141,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          M
                        </button>
                      </div>
                    </div>

                    {/* Center: Widened Horizontal PEQ Audio Canvas + Horizontal Row of 5 Module Buttons */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      {/* Widened PEQ Canvas */}
                      <div className={`eq-canvas-wrap rounded-xl h-24 w-full relative ${isMuted ? 'is-muted' : ''}`}>
                        <canvas 
                          ref={el => { canvasRefs.current[ch.id] = el; }}
                          aria-label={`${ch.name} EQ/PEQ Visualizer`} 
                          className="w-full h-full block"
                        />
                        <div className="absolute top-1.5 left-2.5 font-mono text-[9px] text-cyan-300/80 pointer-events-none tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          <span>PEQ-8 // FFT LIVE SPECTRUM</span>
                        </div>
                        <div className="absolute top-1.5 right-2.5 font-mono text-[8px] text-slate-400 pointer-events-none">48kHz • 32-BIT FLOAT</div>
                        {isMuted && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3 py-1 rounded bg-pink-500/20 text-pink-300 font-mono text-xs font-bold border border-pink-500/40 tracking-widest">MUTED</span>
                          </div>
                        )}
                      </div>

                      {/* Module Buttons Row: Directly below PEQ display, horizontally distributed across 5 equal slots */}
                      <div className="grid grid-cols-5 gap-1.5 w-full">
                        {MODULE_DEFS.map(mod => {
                          const state = ch.modules[mod.id];
                          const stateColorClass = 
                            state === 'active' ? 'border-emerald-500/40 text-emerald-300 hover:border-emerald-400' :
                            state === 'inactive' ? 'border-slate-800 text-slate-500 hover:border-slate-700' :
                            'border-amber-500/40 text-amber-300 hover:border-amber-400';

                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectTrackId(ch.id);
                                setInspectModuleId(mod.id);
                                if (mod.id === 'eq') {
                                  setEqStudioOpen(true);
                                } else if (mod.id === 'dsp_a') {
                                  setModularRackOpen(true);
                                } else if (mod.id === 'dsp_b') {
                                  setModularRackOpenB(true);
                                } else if (mod.id === 'dsp_c') {
                                  setModularRackOpenC(true);
                                } else {
                                  setInspectorOpen(true);
                                }
                              }}
                              className={`px-2 py-1.5 rounded-lg bg-slate-950/90 border flex items-center justify-center gap-1.5 transition text-[10px] font-mono flex-1 text-center cursor-pointer ${stateColorClass}`}
                              title={`Click to open interactive ${mod.title} inspector`}
                            >
                              <span className={`module-led state-${state}`}></span>
                              <span className="truncate">{mod.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Vertical Master Gain Fader + Triple LED VU Meters (L, C, R) + dB Readout */}
                    <div className="flex flex-col items-center justify-center shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-3 min-w-[90px]">
                      <span className="text-[8px] font-mono text-slate-400 font-semibold uppercase tracking-wider mb-1">GAIN</span>
                      <div className="flex items-center gap-2">
                        {/* Vertical Slider */}
                        <div className="vertical-fader-container">
                          <div className="vertical-fader-track"></div>
                          <input 
                            type="range" min="-36" max="12" step="0.1" value={ch.gain}
                            onChange={(e) => handleGainChange(ch.id, Number(e.target.value))}
                            className="vertical-fader-input"
                            title="Track Gain Fader"
                          />
                        </div>

                        {/* Triple LED VU Ladders: L, C, R */}
                        <div className="flex items-center gap-1">
                          {['L', 'C', 'R'].map((channelName, cIdx) => (
                            <div key={channelName} className="flex flex-col items-center">
                              <span className="text-[7px] font-mono text-slate-400 font-bold leading-none mb-0.5">{channelName}</span>
                              <div className="vu-meter-col">
                                {Array.from({ length: 10 }).map((_, segIdx) => {
                                  const ledType = segIdx >= 8 ? 'vu-led-magenta' : segIdx >= 5 ? 'vu-led-cyan' : 'vu-led-green';
                                  const active = !ch.muted && (segIdx < Math.round((Math.sin(Date.now() * 0.005 + cIdx + ch.seed + segIdx) * 0.5 + 0.5) * 8));
                                  return (
                                    <div key={segIdx} className={`vu-led-seg ${ledType} ${active ? 'active' : ''}`}></div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gain dB Numerical Value with Click-To-Type Input */}
                      {editingGainCh === ch.id ? (
                        <input 
                          type="text"
                          className="gain-val-input mt-1"
                          defaultValue={formatGain(ch.gain)}
                          autoFocus
                          onBlur={(e) => {
                            const parsed = parseGain(e.target.value, ch.gain);
                            handleGainChange(ch.id, parsed);
                            setEditingGainCh(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const parsed = parseGain(e.currentTarget.value, ch.gain);
                              handleGainChange(ch.id, parsed);
                              setEditingGainCh(null);
                            } else if (e.key === 'Escape') {
                              setEditingGainCh(null);
                            }
                          }}
                        />
                      ) : (
                        <div 
                          className="gain-val-pill mt-1"
                          onClick={(e) => { e.stopPropagation(); setEditingGainCh(ch.id); }}
                          title="Click to enter exact dB value"
                        >
                          {formatGain(ch.gain)}
                        </div>
                      )}
                    </div>

                  </article>
                );
              })}
            </div>
          </section>

          {/* Bottom DSP Hardware Modules */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MODULE 01: COMP / GATE DYNAMICS RACK */}
            <div className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ff007f]"></span>
                  <div>
                    <h3 className="h2-title text-white leading-tight">DYNAMICS RACK // VCA NEURAL</h3>
                    <span className="font-mono text-[10px] text-pink-400 uppercase tracking-wider">{focusedChannel}</span>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('Dynamics compressor toggled active.')}
                  className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-pink-500/50 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition uppercase cursor-pointer"
                >
                  Active
                </button>
              </div>

              {/* Transfer I/O Curve */}
              <div className="relative bg-slate-950 rounded-lg p-2.5 h-28 flex flex-col justify-between border border-slate-800 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between items-center">
                  <span>TRANSFER I/O CURVE</span>
                  <span className="text-pink-400 font-bold">-3.4 dB GR</span>
                </div>
                <div className="relative h-12 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-slate-800"></div></div>
                  <div className="absolute inset-0 flex justify-center"><div className="h-full w-px bg-slate-800"></div></div>
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 60">
                    <path d="M 0 60 L 60 60 L 160 30 Q 210 18, 320 12" fill="none" stroke="#ff007f" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 4px #ff007f)' }}></path>
                    <circle cx="215" cy="18" fill="#00f0ff" r="4" style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}></circle>
                  </svg>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>-60 dB (Floor)</span>
                  <span>-18 dB Thresh</span>
                  <span>0 dB Peak</span>
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-2 font-mono text-xs border-t border-slate-800">
                <div className="bg-slate-950/80 rounded-lg p-2.5 flex flex-col gap-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-pink-400 font-bold">COMPRESSOR</span>
                    <span className="text-cyan-300">4.0:1</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">THRESH</span><strong className="text-white">-18 dB</strong></div>
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">ATTACK</span><strong className="text-white">12 ms</strong></div>
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">RELEASE</span><strong className="text-white">85 ms</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-lg p-2.5 flex flex-col gap-2 border border-slate-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyan-400 font-bold">NOISE GATE</span>
                    <span className="text-emerald-400 font-bold">OPEN</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">THRESH</span><strong className="text-white">-42 dB</strong></div>
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">HOLD</span><strong className="text-white">45 ms</strong></div>
                    <div className="bg-slate-900 p-1 rounded"><span className="text-slate-500 text-[8px] block">RELEASE</span><strong className="text-white">140 ms</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODULE 02: QUAD FX PROCESSOR RACK */}
            <div className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]"></span>
                  <div>
                    <h3 className="h2-title text-white leading-tight">QUAD FX PROCESSOR RACK</h3>
                    <span className="font-mono text-[10px] text-cyan-300 uppercase tracking-wider">Parallel Neural Stacks</span>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('FX processor online.')}
                  className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition uppercase cursor-pointer"
                >
                  FX Online
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-mono text-[10px]">
                <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-cyan-300 font-bold"><span>A: CONVOLUTION REV</span><span>35%</span></div>
                  <div className="flex justify-between text-slate-400 text-[9px]"><span>Decay: 2.8s</span><span className="text-white">HALL XL</span></div>
                </div>
                <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-cyan-300 font-bold"><span>B: STEREO DELAY</span><span>22%</span></div>
                  <div className="flex justify-between text-slate-400 text-[9px]"><span>Sync: 1/8D</span><span className="text-white">48% Fdbk</span></div>
                </div>
                <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-pink-400 font-bold"><span>C: ANALOG FLANGER</span><span>40%</span></div>
                  <div className="flex justify-between text-slate-400 text-[9px]"><span>Rate: 1.25Hz</span><span className="text-white">Depth: 68%</span></div>
                </div>
                <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-pink-400 font-bold"><span>D: TUBE SATURATOR</span><span>45%</span></div>
                  <div className="flex justify-between text-slate-400 text-[9px]"><span>Drive: +7.8dB</span><span className="text-white">12AX7</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 font-mono text-[10px] text-slate-400 border-t border-slate-800">
                <span>ROUTING: DUAL-BUS STEREO SEND</span>
                <button onClick={() => showToast('Quad FX stack saved.')} className="text-cyan-300 hover:text-white cursor-pointer">SAVE STACK</button>
              </div>
            </div>

          </section>

        </div>

        {/* Right Sidebar: AI Filter XY Pad + Stems VU Meters + Preset Vault */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          
          {/* AI FILTER XY PAD */}
          <section className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col gap-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="h2-title text-white">AI FILTER // XY PAD</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">MORPH 2.0</span>
            </div>
            <p className="plain-text text-slate-400 leading-tight">Drag puck across the 2D neural filter grid to morph frequency cutoff and spectral resonance.</p>
            
            <div 
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                showToast(`Filter Morph: Cutoff ${Math.round(80 * Math.pow(250, x))}Hz`);
              }}
              className="relative w-full h-44 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden cursor-crosshair select-none shadow-inner flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(0,240,255,0.15),transparent_70%)]"></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-full h-px bg-slate-800"></div></div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="h-full w-px bg-slate-800"></div></div>
              <div 
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_18px_#00f2fe] flex items-center justify-center pointer-events-none"
                style={{ left: '64%', top: '38%' }}
              >
                <div className="w-2 h-2 rounded-full bg-slate-950"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block">CUTOFF</span>
                <strong className="text-cyan-300">2.4 kHz</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block">RESONANCE</span>
                <strong className="text-pink-400">62%</strong>
              </div>
            </div>
          </section>

          {/* STEM BUS METERS */}
          <section className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col gap-3 font-mono border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                <h3 className="h2-title text-white">STEM BUS METERS</h3>
              </div>
              <span className="text-[10px] text-slate-400">PEAK dBFS</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              {['DRUMS', 'BASS', 'LEAD', 'SPACE'].map((stemName, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className="h-28 w-4 bg-slate-950 rounded-full p-0.5 flex flex-col justify-end overflow-hidden shadow-inner border border-slate-800">
                    <div className="w-full bg-gradient-to-t from-emerald-400 via-cyan-400 to-pink-500 rounded-full" style={{ height: `${75 - idx * 7}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400">{stemName}</span>
                  <span className="text-[10px] text-cyan-300 font-bold">-{idx * 1.5 + 0.8}</span>
                </div>
              ))}
            </div>
          </section>

          {/* PRESET VAULT */}
          <section className="glass-panel rounded-xl p-3 md:p-4 shadow-xl flex flex-col gap-2.5 font-mono border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <h3 className="h2-title text-white">PRESET VAULT</h3>
              </div>
              <span className="text-xs text-cyan-300 font-semibold">12 READY</span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="bg-slate-950 rounded-lg p-2.5 flex items-center justify-between border border-slate-800">
                <div>
                  <div className="font-bold text-white">Cyber 80s Reverb &amp; Gate</div>
                  <div className="text-[10px] text-slate-400">Snare / Percussive</div>
                </div>
                <button onClick={() => showToast('Loaded Cyber 80s Reverb')} className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer font-bold">Load</button>
              </div>
              <div className="bg-slate-950 rounded-lg p-2.5 flex items-center justify-between border border-slate-800">
                <div>
                  <div className="font-bold text-white">Punchy VCA Kick Shaper</div>
                  <div className="text-[10px] text-slate-400">Low-End Transient</div>
                </div>
                <button onClick={() => showToast('Loaded Punchy VCA Kick')} className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer font-bold">Load</button>
              </div>
            </div>
          </section>

        </div>

      </div>

      {/* Modal: Interactive Module Inspector */}
      {inspectorOpen && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 w-full max-w-lg rounded-2xl glass-panel border border-cyan-500/40 text-slate-100">
          <div className="flex flex-col w-full gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]"></span>
                <div>
                  <h3 className="h1-title text-white">{activeModuleDef.title}</h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">CH 0{activeTrackForInspector.id} // {activeTrackForInspector.name.toUpperCase()}</span>
                </div>
              </div>
              <button 
                onClick={() => setInspectorOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Three-State Capsule Mode Toggles */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400">ENGINE OPERATING STATE</span>
                <span className={`text-xs font-bold uppercase ${
                  activeTrackForInspector.modules[inspectModuleId] === 'active' ? 'text-emerald-400' :
                  activeTrackForInspector.modules[inspectModuleId] === 'inactive' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {activeTrackForInspector.modules[inspectModuleId]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['active', 'inactive', 'bypass'] as const).map(mode => {
                  const isCurrent = activeTrackForInspector.modules[inspectModuleId] === mode;
                  const modeColor = mode === 'active' ? 'emerald' : mode === 'inactive' ? 'red' : 'amber';
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleModuleStateChange(activeTrackForInspector.id, inspectModuleId, mode)}
                      className={`px-3 py-2 rounded-lg border font-bold flex items-center justify-center gap-2 transition text-xs cursor-pointer ${
                        isCurrent 
                          ? `border-${modeColor}-500 bg-${modeColor}-500/20 text-${modeColor}-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]` 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${mode === 'active' ? 'bg-emerald-400 animate-pulse' : mode === 'inactive' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`}></span>
                      <span className="uppercase">{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Parameter Settings */}
            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">PROCESSING</div>
                  <div className="font-bold text-cyan-300 mt-1">32-BIT FLOAT</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">LATENCY</div>
                  <div className="font-bold text-pink-400 mt-1">0.45 ms</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">OVERSAMPLE</div>
                  <div className="font-bold text-emerald-400 mt-1">4X HQ</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">STATUS</div>
                  <div className="font-bold text-purple-300 mt-1 uppercase">{activeTrackForInspector.modules[inspectModuleId]}</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Neural DSP Engine • Real-time Sync</span>
              <button 
                onClick={() => {
                  setInspectorOpen(false);
                  showToast(`Applied ${inspectModuleId.toUpperCase()} settings on CH 0${inspectTrackId}.`);
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold hover:brightness-110 shadow-glow-cyan transition cursor-pointer"
              >
                APPLY & SAVE
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Preset Browser Dialog */}
      {presetModalOpen && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 w-full max-w-lg rounded-2xl glass-panel border border-cyan-500/40 text-slate-100">
          <div className="flex flex-col w-full gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="h1-title text-white">PRESET BROWSER & NEURAL SNAPSHOTS</h3>
              </div>
              <button onClick={() => setPresetModalOpen(false)} className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-cyan-300">Cyberpunk Neon Matrix (Full Console)</div>
                  <div className="text-[10px] text-slate-400">Created: Today • 6 Tracks • Peak -0.1 dBFS</div>
                </div>
                <button onClick={() => { setPresetModalOpen(false); showToast('Recalled Cyberpunk Neon Matrix snapshot.'); }} className="px-3 py-1.5 rounded bg-cyan-400 text-slate-950 font-bold hover:brightness-110 cursor-pointer">RECALL ALL</button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white">Deep DNB Heavy Sub Split</div>
                  <div className="text-[10px] text-slate-400">Sidechain Ducking + 40Hz Monofied</div>
                </div>
                <button onClick={() => { setPresetModalOpen(false); showToast('Recalled Deep DNB Heavy Sub Split snapshot.'); }} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold cursor-pointer">RECALL ALL</button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {/* Toast */}
      {toastMessage && (
        <aside className="fixed bottom-20 right-6 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-400 text-cyan-300 font-mono text-xs shadow-glow-cyan flex items-center gap-2.5 z-50 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* Modular Channel Rack (DSP - A, B, C) Modals */}
      <ModularChannelRackModal 
        isOpen={modularRackOpen} 
        onClose={() => setModularRackOpen(false)} 
        trackName={activeTrackForInspector.name} 
        trackId={activeTrackForInspector.id} 
        rackTitle="DSP - A"
      />

      <ModularChannelRackModal 
        isOpen={modularRackOpenB} 
        onClose={() => setModularRackOpenB(false)} 
        trackName={activeTrackForInspector.name} 
        trackId={activeTrackForInspector.id} 
        rackTitle="DSP - B"
      />

      <ModularChannelRackModal 
        isOpen={modularRackOpenC} 
        onClose={() => setModularRackOpenC(false)} 
        trackName={activeTrackForInspector.name} 
        trackId={activeTrackForInspector.id} 
        rackTitle="DSP - C"
      />

      {/* PEQ-X Parametric & Dynamic EQ Studio Modal */}
      <EqStudioModal 
        isOpen={eqStudioOpen} 
        onClose={() => setEqStudioOpen(false)} 
        trackName={activeTrackForInspector.name} 
        trackId={activeTrackForInspector.id} 
      />

    </div>
  );
};
