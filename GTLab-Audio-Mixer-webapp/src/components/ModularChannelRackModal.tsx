import React, { useState, useEffect } from 'react';
import { X, Search, Star, Play, Pause, RefreshCw, Sliders, ChevronRight, Plus, Trash2, Shield, Cpu, Activity, Radio } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackName: string;
  trackId: number;
  rackTitle?: string;
}

interface ModuleInstance {
  uid: string;
  name: string;
  category: string;
  color: 'cyan' | 'amber' | 'purple';
  bypass: boolean;
  solo: boolean;
  mix: number;
  trim: number;
  phase: boolean;
  delta: boolean;
  params: { [key: string]: number };
}

const CATEGORIES = [
  {
    id: "preamp",
    name: "PREAMP & UTILITY",
    filterTag: "All",
    color: "cyan" as const,
    open: false,
    modules: [
      "Console Preamp", "Tube Mic Preamp", "Trim / Gain Stage", "Auto-Gain Leveler",
      "Sub-Bass Enhancer", "Signal Generator", "Phase & Polarity", "DC Offset Filter",
      "Channel Strip Gain", "Analog Line Driver", "Solid State Preamp", "Vintage Desk Input",
      "Impedance Matcher", "Micro-Pitch Shift", "Gain Rider", "Input Pad / Boost",
      "Channel Mute / Solo", "Mono Sum Utility", "Channel Delay / Align", "Output Trim Stage"
    ]
  },
  {
    id: "eq",
    name: "EQUALIZERS",
    filterTag: "EQ",
    color: "cyan" as const,
    open: true,
    modules: [
      "4-Band Parametric EQ", "8-Band Precision EQ", "British Console EQ", "Vintage Neve EQ",
      "Pultec Passive EQ", "Dynamic EQ", "Tilt EQ", "High/Low Pass Filter",
      "Linear Phase EQ", "Graphic 31-Band EQ", "Baxandall Shelving EQ", "API-Style Proportional EQ",
      "Mid/Side Mastering EQ", "Dynamic Resonance EQ", "Notch / Surgical EQ", "Air Band Enhancer",
      "Sub-Harmonic EQ", "Analog Curve EQ", "Vocal Presence EQ", "Match EQ"
    ]
  },
  {
    id: "dynamics",
    name: "DYNAMICS",
    filterTag: "Comp",
    color: "cyan" as const,
    open: false,
    modules: [
      "VCA Compressor", "FET Compressor", "Optical Compressor", "Vari-Mu Compressor",
      "Multiband Compressor", "Upward Compressor", "Noise Gate / Expander", "Brickwall Limiter",
      "Parallel Drum Comp", "Bus Glue Compressor", "Diode-Bridge Comp", "Tube Leveling Amp",
      "Transient Limiter", "Console Crosstalk", "Triode / Pentode Tube", "Wavefolder Distortion",
      "Bass Amp Sim", "Vinyl Crackle & Warmth", "Analog Console Bus", "Soft Clipper"
    ]
  },
  {
    id: "saturation",
    name: "SATURATION & COLOR",
    filterTag: "Sat",
    color: "amber" as const,
    open: true,
    modules: [
      "Tube Saturation", "Analog Tape Machine", "Solid State Drive", "Transformer Saturator",
      "Multiband Saturator", "Bitcrusher / Lo-Fi", "Harmonic Exciter", "Vintage Cassette",
      "Triode Warmth", "Pentode Crunch", "Tape Hysteresis", "Console Overdrive",
      "Sub Harmonic Drive", "Rectifier Fuzz", "Valve Preamp Color", "Magnetic Tape Saturation",
      "Hard / Soft Clipper", "Harmonic Shaper", "Analog Desk Heat", "Retro Lo-Fi Crush"
    ]
  },
  {
    id: "vocal",
    name: "VOCAL & RESTORATION",
    filterTag: "All",
    color: "cyan" as const,
    open: false,
    modules: [
      "De-Esser", "Dynamic De-Harsher", "Breath Control", "Transient Shaper",
      "Pitch Corrector", "De-Noiser / Hum", "Plosive / Pop Remover", "De-Click & De-Crackle",
      "De-Reverb / Room", "Vocal Air Exciter", "Formant Shifter", "Voice Isolator",
      "Dialogue Leveler", "Mouth De-Clicker", "Spectral Repair", "De-Bleed Drum/Vocal",
      "Vocal Thickener", "Sibilance Tamer", "Boot Clipper", "Telephone / Radio FX"
    ]
  },
  {
    id: "spatial",
    name: "SPATIAL: REVERB & DELAY",
    filterTag: "FX",
    color: "purple" as const,
    open: false,
    modules: [
      "Plate Reverb", "Room / Hall Reverb", "Spring Reverb", "Shimmer Reverb",
      "Stereo / Ping-Pong Delay", "Analog Tape Delay", "Convolution Reverb", "Chamber Reverb",
      "Cathedral / Arena", "Non-Linear / Gated Verb", "Reverse Reverb", "Slapback Delay",
      "Multi-Tap Delay", "Dub Echo Delay", "BBD Analog Delay", "Granular Space",
      "Ambience Micro-Verb", "Diffused Echo", "Ducking Delay", "Early Reflections"
    ]
  },
  {
    id: "modulation",
    name: "MODULATION & PITCH",
    filterTag: "FX",
    color: "purple" as const,
    open: false,
    modules: [
      "Stereo Chorus", "Analog Flanger", "Vintage Phaser", "Tremolo / Auto-Panner",
      "Vocal Doubler", "Ring Modulator", "Rotary Speaker", "Vibrato Pitch Mod",
      "Octave Generator", "Pitch Shifter", "Ensemble Strings", "Dimension Expander",
      "Auto-Filter / Wah", "Step Filter Mod", "Frequency Shifter", "Barberpole Phaser",
      "Stereo Detune", "Choir / Harmonizer", "Tape Wobble / Flutter", "Comb Filter Mod"
    ]
  },
  {
    id: "stereo",
    name: "STEREO, ROUTING & ANALYSIS",
    filterTag: "All",
    color: "cyan" as const,
    open: false,
    modules: [
      "Stereo Imager / Width", "Mid/Side Matrix", "Parallel Split / Mix", "Spectrum & LUFS Meter",
      "Haas Stereo Widener", "Bass Mono Maker", "Phase Correlation Meter", "Goniometer / Vectorscope",
      "Multiband Crossover", "Dry/Wet Blend Rack", "A/B Compare Switch", "Sidechain Router",
      "Surround / Atmos Panner", "Binaural 3D Spatializer", "Oscilloscope View", "Loudness History Graph",
      "True Peak Meter", "Macro Control Hub", "FX Send / Return", "Master Bus Router"
    ]
  }
];

export const ModularChannelRackModal: React.FC<Props> = ({ isOpen, onClose, trackName, trackId, rackTitle = 'DSP - A' }) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('All');
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set([
    "4-Band Parametric EQ", "8-Band Precision EQ", "Plate Reverb", "Tube Saturation"
  ]));
  
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
    eq: true,
    saturation: true
  });

  const [slots, setSlots] = useState<(ModuleInstance | null)[]>([
    { uid: 'm-1', name: 'Console Preamp', category: 'PREAMP & UTILITY', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 60, p2: 50, p3: 70, p4: 50 } },
    { uid: 'm-2', name: '4-Band Parametric EQ', category: 'EQUALIZERS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 55, p2: 45, p3: 65, p4: 50 } },
    { uid: 'm-3', name: 'VCA Compressor', category: 'DYNAMICS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 40, p2: 70, p3: 30, p4: 80 } },
    { uid: 'm-4', name: 'Tube Saturation', category: 'SATURATION & COLOR', color: 'amber', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 65, p2: 45, p3: 60, p4: 50 } },
    ...Array(12).fill(null)
  ]);

  const [macros, setMacros] = useState<number[]>([42, 68, 55, 74]);
  const [hqActive, setHqActive] = useState<boolean>(true);
  const [abMode, setAbMode] = useState<'A' | 'B'>('A');

  // Master Meter simulated LED levels
  const [meterLevels, setMeterLevels] = useState<{ in: number; out: number }>({ in: 14, out: 16 });

  useEffect(() => {
    const timer = setInterval(() => {
      setMeterLevels({
        in: 12 + Math.floor(Math.random() * 6),
        out: 14 + Math.floor(Math.random() * 6)
      });
    }, 140);
    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (modName: string) => {
    const next = new Set(favorites);
    if (next.has(modName)) next.delete(modName);
    else next.add(modName);
    setFavorites(next);
  };

  const addModule = (name: string, category: string, color: 'cyan' | 'amber' | 'purple', targetIdx?: number) => {
    const idx = targetIdx !== undefined ? targetIdx : slots.findIndex(s => s === null);
    if (idx === -1) {
      alert("All 16 Rack Slots are full!");
      return;
    }
    const newMod: ModuleInstance = {
      uid: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      category,
      color,
      bypass: false,
      solo: false,
      mix: 100,
      trim: 50,
      phase: false,
      delta: false,
      params: { p1: 50, p2: 50, p3: 50, p4: 50 }
    };
    const updated = [...slots];
    updated[idx] = newMod;
    setSlots(updated);
  };

  const removeModule = (idx: number) => {
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
  };

  const loadPreset = (presetKey: string) => {
    const newSlots = Array(16).fill(null);
    if (presetKey === 'default') {
      newSlots[0] = { uid: 'm-1', name: 'Console Preamp', category: 'PREAMP & UTILITY', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 60, p2: 50, p3: 70, p4: 50 } };
      newSlots[1] = { uid: 'm-2', name: '4-Band Parametric EQ', category: 'EQUALIZERS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 55, p2: 45, p3: 65, p4: 50 } };
      newSlots[2] = { uid: 'm-3', name: 'VCA Compressor', category: 'DYNAMICS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 40, p2: 70, p3: 30, p4: 80 } };
      newSlots[3] = { uid: 'm-4', name: 'Tube Saturation', category: 'SATURATION & COLOR', color: 'amber', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 65, p2: 45, p3: 60, p4: 50 } };
    } else if (presetKey === 'vocal') {
      newSlots[0] = { uid: 'v-1', name: 'Tube Mic Preamp', category: 'PREAMP & UTILITY', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 70, p2: 60, p3: 50, p4: 50 } };
      newSlots[1] = { uid: 'v-2', name: 'De-Esser', category: 'VOCAL & RESTORATION', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 50, p2: 40, p3: 60, p4: 50 } };
      newSlots[2] = { uid: 'v-3', name: 'Optical Compressor', category: 'DYNAMICS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 45, p2: 65, p3: 35, p4: 75 } };
      newSlots[3] = { uid: 'v-4', name: 'Air Band Enhancer', category: 'EQUALIZERS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 80, p2: 70, p3: 60, p4: 50 } };
      newSlots[4] = { uid: 'v-5', name: 'Plate Reverb', category: 'SPATIAL: REVERB & DELAY', color: 'purple', bypass: false, solo: false, mix: 35, trim: 50, phase: false, delta: false, params: { p1: 50, p2: 60, p3: 40, p4: 50 } };
    } else if (presetKey === 'master') {
      newSlots[0] = { uid: 'ms-1', name: 'Linear Phase EQ', category: 'EQUALIZERS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 50, p2: 50, p3: 50, p4: 50 } };
      newSlots[1] = { uid: 'ms-2', name: 'Vari-Mu Compressor', category: 'DYNAMICS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 30, p2: 50, p3: 20, p4: 90 } };
      newSlots[2] = { uid: 'ms-3', name: 'Analog Tape Machine', category: 'SATURATION & COLOR', color: 'amber', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 60, p2: 50, p3: 70, p4: 50 } };
      newSlots[3] = { uid: 'ms-4', name: 'Brickwall Limiter', category: 'DYNAMICS', color: 'cyan', bypass: false, solo: false, mix: 100, trim: 50, phase: false, delta: false, params: { p1: 85, p2: 95, p3: 10, p4: 50 } };
    } else if (presetKey === 'spatial') {
      newSlots[0] = { uid: 'sp-1', name: 'Stereo Chorus', category: 'MODULATION & PITCH', color: 'purple', bypass: false, solo: false, mix: 50, trim: 50, phase: false, delta: false, params: { p1: 50, p2: 50, p3: 50, p4: 50 } };
      newSlots[1] = { uid: 'sp-2', name: 'Analog Tape Delay', category: 'SPATIAL: REVERB & DELAY', color: 'purple', bypass: false, solo: false, mix: 40, trim: 50, phase: false, delta: false, params: { p1: 60, p2: 40, p3: 50, p4: 50 } };
      newSlots[2] = { uid: 'sp-3', name: 'Shimmer Reverb', category: 'SPATIAL: REVERB & DELAY', color: 'purple', bypass: false, solo: false, mix: 45, trim: 50, phase: false, delta: false, params: { p1: 70, p2: 60, p3: 50, p4: 50 } };
    }
    setSlots(newSlots);
  };

  const activeCount = slots.filter(Boolean).length;
  const cpuUsage = 4 + activeCount * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn font-sans">
      <div className="rack-window w-full max-w-[1420px] bg-[#161a20] border border-[#2c333f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="top-header h-12 bg-[#1b2028] border-b border-[#2c333f] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-xs tracking-wider">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]"></div>
            <span className="text-white">{rackTitle} // MODULAR CHANNEL RACK</span>
            <span className="text-[#22d3ee] font-mono text-[10px] ml-1">CH 0{trackId} ({trackName})</span>
          </div>

          <div className="flex items-center gap-2 bg-[#111419] border border-[#2c333f] rounded-lg px-3 py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Dream Strips:</span>
            <select 
              onChange={(e) => loadPreset(e.target.value)}
              className="bg-transparent border-none text-[#22d3ee] font-bold text-xs outline-none cursor-pointer"
            >
              <option value="default" className="bg-[#161a20]">VOCAL / DRUMS / BASS (DEFAULT)</option>
              <option value="vocal" className="bg-[#161a20]">MODERN LEAD VOCAL CHAIN</option>
              <option value="master" className="bg-[#161a20]">WARM ANALOG MASTERING</option>
              <option value="spatial" className="bg-[#161a20]">AMBIENT SPATIAL & FX</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setAbMode(abMode === 'A' ? 'B' : 'A')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                abMode === 'B' 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                  : 'bg-[#232933] border-[#3b4454] text-slate-300'
              }`}
            >
              A / B : {abMode}
            </button>
            <button 
              onClick={() => setHqActive(!hqActive)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                hqActive 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                  : 'bg-[#232933] border-[#3b4454] text-slate-300'
              }`}
            >
              HQ {hqActive ? 'ON' : 'OFF'}
            </button>
            <div className="bg-[#111419] border border-[#2c333f] px-3 py-1 rounded-lg text-xs font-mono text-slate-200">
              CPU <span className="text-[#22d3ee] font-bold">{cpuUsage}%</span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 16-Slot Mini-Map Bar */}
        <div className="bg-[#12161c] border-b border-[#2c333f] px-4 py-2 flex items-center gap-4 shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 whitespace-nowrap">16-SLOT RACK MINI-MAP</span>
          <div className="flex-1 grid grid-cols-16 gap-1.5">
            {slots.map((slot, sIdx) => (
              <div 
                key={sIdx}
                className={`h-6 rounded border text-[10px] font-mono font-bold flex items-center justify-center cursor-pointer transition ${
                  slot 
                    ? slot.color === 'amber' 
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_5px_rgba(245,158,11,0.3)]' 
                      : 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.3)]'
                    : 'bg-[#1a1f27] border-[#29313d] text-slate-600 hover:border-slate-500 hover:text-slate-300'
                }`}
                title={slot ? `Slot ${sIdx + 1}: ${slot.name}` : `Slot ${sIdx + 1}: Empty`}
              >
                {sIdx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar: Module Library & Macros */}
          <div className="w-72 bg-[#13171d] border-r border-[#2c333f] flex flex-col shrink-0">
            <div className="p-3 flex-1 flex flex-col overflow-hidden">
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider text-white">MODULE LIBRARY</span>
                <span className="text-[10px] text-[#22d3ee] font-mono font-bold">160 MODULES</span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 160 modules..."
                  className="w-full bg-[#0c0f13] border border-[#2a313c] rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div className="flex gap-1 mb-2.5">
                {['All', 'EQ', 'Comp', 'Sat', 'FX'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setCurrentFilter(tag)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      currentFilter === tag 
                        ? 'bg-[#22d3ee]/20 border border-[#22d3ee]/50 text-[#22d3ee]' 
                        : 'bg-[#1b212a] text-slate-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                <button
                  onClick={() => setFavOnly(!favOnly)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    favOnly ? 'bg-amber-500/20 border border-amber-500 text-amber-400' : 'bg-[#1b212a] text-slate-400 hover:text-amber-400'
                  }`}
                  title="Starred Favorites"
                >
                  ★
                </button>
              </div>

              {/* Category Tree */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                {CATEGORIES.map(cat => {
                  if (currentFilter !== 'All' && cat.filterTag !== currentFilter) return null;
                  const mods = cat.modules.filter(m => {
                    const matchQ = m.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchF = !favOnly || favorites.has(m);
                    return matchQ && matchF;
                  });
                  if (mods.length === 0) return null;

                  const isOpen = searchQuery.length > 0 || favOnly || openCategories[cat.id];

                  return (
                    <div key={cat.id} className="bg-[#171c24] border border-[#222832] rounded-lg overflow-hidden">
                      <div 
                        onClick={() => setOpenCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                        className="px-2.5 py-2 bg-[#1b2029] flex items-center justify-between cursor-pointer hover:bg-[#222935] transition"
                      >
                        <div className="flex items-center gap-2 font-bold text-[11px] text-slate-200">
                          <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-90 text-[#22d3ee]' : ''}`} />
                          <span>{cat.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold">({mods.length})</span>
                      </div>

                      {isOpen && (
                        <div className="p-1 bg-[#13171e] border-t border-[#222832] space-y-0.5">
                          {mods.map((modName, mIdx) => {
                            const isFav = favorites.has(modName);
                            return (
                              <div
                                key={modName}
                                onClick={() => addModule(modName, cat.name, cat.color)}
                                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#212834] hover:text-[#22d3ee] cursor-pointer transition text-[11px]"
                                title="Click to add to rack"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-slate-600 text-[10px]">{mIdx + 1}.</span>
                                  <span className="truncate">{modName}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(modName); }}
                                  className={`text-xs hover:text-amber-400 ${isFav ? 'text-amber-400' : 'text-slate-600'}`}
                                >
                                  ★
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Macro Controls Footer in Sidebar */}
            <div className="p-3 bg-[#101419] border-t border-[#2c333f] shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 block mb-2">MACRO CONTROLS</span>
              <div className="grid grid-cols-4 gap-2">
                {macros.map((mVal, mIdx) => (
                  <div key={mIdx} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-[11px] text-[#22d3ee] font-bold shadow-inner">
                      {mVal}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">M{mIdx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Rack Viewport */}
          <div className="flex-1 bg-[#0f1217] p-4 overflow-x-auto flex gap-3 items-stretch">
            {slots.map((slot, idx) => {
              if (!slot) {
                return (
                  <div 
                    key={idx}
                    onClick={() => addModule('4-Band Parametric EQ', 'EQUALIZERS', 'cyan', idx)}
                    className="w-[200px] shrink-0 border-2 border-dashed border-[#252c37] rounded-xl bg-[#161a22]/50 hover:border-[#22d3ee]/60 hover:bg-[#22d3ee]/5 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
                  >
                    <span className="text-[10px] font-mono text-slate-600 font-bold">SLOT {idx + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-[#1b212a] group-hover:bg-[#22d3ee]/20 group-hover:text-[#22d3ee] text-slate-400 flex items-center justify-center text-xl transition">
                      +
                    </div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 group-hover:text-[#22d3ee]">+ DROP MODULE</span>
                  </div>
                );
              }

              const accentColor = slot.color === 'amber' ? 'text-amber-400 border-amber-500/40' : slot.color === 'purple' ? 'text-purple-400 border-purple-500/40' : 'text-[#22d3ee] border-[#22d3ee]/40';

              return (
                <div 
                  key={slot.uid}
                  className={`w-[215px] shrink-0 bg-gradient-to-b from-[#1f252f] to-[#161a21] border rounded-xl flex flex-col justify-between shadow-xl overflow-hidden transition ${
                    slot.bypass ? 'opacity-50 border-slate-800' : 'border-[#313a48]'
                  }`}
                >
                  {/* Module Card Header */}
                  <div className="p-3 border-b border-[#282f3b]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <button 
                        onClick={() => {
                          const updated = [...slots];
                          updated[idx] = { ...slot, bypass: !slot.bypass };
                          setSlots(updated);
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                          slot.bypass ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-[#252c37] border-[#374150] text-slate-300'
                        }`}
                      >
                        BYPASS
                      </button>
                      <button 
                        onClick={() => {
                          const updated = [...slots];
                          updated[idx] = { ...slot, solo: !slot.solo };
                          setSlots(updated);
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                          slot.solo ? 'bg-[#22d3ee] border-[#22d3ee] text-slate-950 font-black' : 'bg-[#252c37] border-[#374150] text-slate-300'
                        }`}
                      >
                        SOLO
                      </button>
                      <button 
                        onClick={() => removeModule(idx)}
                        className="w-7 py-1 rounded bg-[#252c37] border border-[#374150] text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition text-xs flex items-center justify-center cursor-pointer"
                        title="Remove Module"
                      >
                        ✕
                      </button>
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-white text-center truncate">{slot.name}</h4>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest text-center block mt-0.5">{slot.category}</span>
                  </div>

                  {/* Module Center Body */}
                  <div className="p-3 flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-full h-16 bg-[#0f1217] border border-[#282f3b] rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <path d="M 0 25 Q 25 10, 50 20 T 100 15" fill="none" stroke="#22d3ee" strokeWidth="2" />
                      </svg>
                      <span className="absolute bottom-1 right-2 text-[8px] font-mono text-cyan-400">DSP ACTIVE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full justify-items-center font-mono">
                      {Object.entries(slot.params).map(([pKey, pVal], pIdx) => (
                        <div key={pKey} className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-[#171b22] border border-[#3f4856] flex items-center justify-center text-xs font-bold text-slate-200 shadow-inner">
                            {pVal}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 uppercase">P{pIdx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Module Footer Strip */}
                  <div className="bg-[#13171d] border-t border-[#282f3b] p-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center block mb-2">FOOTER STRIP</span>
                    <div className="flex items-center justify-around">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[#171b22] border border-[#3f4856] flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
                          {slot.mix}%
                        </div>
                        <span className="text-[8px] text-slate-500 mt-0.5">MIX</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[#171b22] border border-[#3f4856] flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
                          {slot.trim}
                        </div>
                        <span className="text-[8px] text-slate-500 mt-0.5">TRIM</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            const updated = [...slots];
                            updated[idx] = { ...slot, phase: !slot.phase };
                            setSlots(updated);
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold border ${slot.phase ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-[#1c222b] border-[#2e3643] text-slate-400'}`}
                          title="Phase Invert"
                        >
                          Ø
                        </button>
                        <button 
                          onClick={() => {
                            const updated = [...slots];
                            updated[idx] = { ...slot, delta: !slot.delta };
                            setSlots(updated);
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold border ${slot.delta ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-[#1c222b] border-[#2e3643] text-slate-400'}`}
                          title="Delta Listen"
                        >
                          Δ
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Right Stereo Master Meter Bar */}
          <div className="w-16 bg-[#13171d] border-l border-[#2c333f] p-3 flex justify-center gap-2 shrink-0">
            <div className="flex flex-col items-center h-full">
              <div className="flex-1 w-3 bg-[#0a0d11] border border-[#262d38] rounded p-0.5 flex flex-col justify-end gap-0.5">
                {Array.from({ length: 20 }).map((_, lIdx) => {
                  const active = (20 - lIdx) <= meterLevels.in;
                  const color = (20 - lIdx) > 16 ? 'bg-rose-500' : (20 - lIdx) > 12 ? 'bg-amber-500' : 'bg-emerald-500';
                  return <div key={lIdx} className={`w-full flex-1 rounded-[1px] ${active ? color : 'bg-[#1b212b]'}`} />;
                })}
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">IN</span>
            </div>

            <div className="flex flex-col items-center h-full">
              <div className="flex-1 w-3 bg-[#0a0d11] border border-[#262d38] rounded p-0.5 flex flex-col justify-end gap-0.5">
                {Array.from({ length: 20 }).map((_, lIdx) => {
                  const active = (20 - lIdx) <= meterLevels.out;
                  const color = (20 - lIdx) > 16 ? 'bg-rose-500' : (20 - lIdx) > 12 ? 'bg-amber-500' : 'bg-emerald-500';
                  return <div key={lIdx} className={`w-full flex-1 rounded-[1px] ${active ? color : 'bg-[#1b212b]'}`} />;
                })}
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">OUT</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
