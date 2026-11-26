import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, RotateCcw, Upload, Sliders, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackName: string;
  trackId: number;
}

const PEQX_CATEGORIES = [
  "01. Lead Vocals & Pop Clarity",
  "02. Rap, Hip-Hop & Spoken Word",
  "03. Podcast, Broadcast & Voiceover",
  "04. Background Vocals & Choir",
  "05. Dynamic De-Essing & Sibilance",
  "06. Kick Drum & Sub Punch",
  "07. Snare, Toms & Claps",
  "08. Cymbals, Hi-Hats & Overheads",
  "09. Drum Bus & Parallel Crush",
  "10. 808 & Synth Bass",
  "11. Electric & Acoustic Bass Guitar",
  "12. Kick-Bass Dynamic Unmasking",
  "13. Acoustic & Electric Guitars",
  "14. Piano, E-Piano & Organ",
  "15. Synth Leads, Plucks & Pads",
  "16. Orchestral Strings, Brass & Woodwinds",
  "17. Mastering Tonal Balance & Tilt EQ",
  "18. Mid/Side Width & Focus",
  "19. Dynamic Resonance & Harshness Control",
  "20. Vintage Console & Analog Curves",
  "21. DJ Isolators, Sweeps & Lo-Fi",
  "22. Cinema, Gaming & Foley SFX"
];

const PRESET_DESCRIPTORS = [
  "Clean & Punch", "Warm Presence", "Air & Shimmer", "Surgical Mud Cut", "Dynamic Tamer",
  "Analog Console Bite", "Sub Tightener", "Silky Top-End", "Wide Stereo Sculpt", "Transient Snap",
  "Studio Reference", "Deep Low Shelf", "Crisp Articulation", "Boxiness Remover", "Harmonic Clarity",
  "Radio Ready", "Club Isolator", "Smooth Compression Curve", "Upward Expander Lift", "De-Harsh 3kHz",
  "Silk Ribbon Highs", "Pultec Low Trick", "SSL Punch Curve", "Neve Vintage Warmth", "Modern Pop Polish",
  "Arena Live Cut", "Intimate Close-Mic", "Cinematic Boom", "Lo-Fi Bandpass", "Sub-Bass Control",
  "Acoustic Body", "Pick Attack Boost", "String Lushness", "Brass Tamer", "Synth Lead Focus",
  "Pad Space Maker", "Overhead Shimmer", "Snare Crack 200Hz", "Kick Beater Click", "808 Sub Glide",
  "Sidechain Dynamic Dip", "Mid-Channel Lock", "Side-Channel Air", "Broadcast Voice", "ASMR Binaural Crisp",
  "Gaming Footstep Boost", "Dialog Intelligibility", "Tape Saturation EQ", "Mastering Glue", "Final Limiter Prep"
];

const FILTER_TYPES = ["Low Shelf", "Peaking Band", "High Shelf", "High Pass", "Low Pass"];

function seededVal(seed: number) {
  const x = Math.sin(seed * 9999.91) * 10000;
  return x - Math.floor(x);
}

function getLogFrequencies(bandCount: number) {
  const minF = 32;
  const maxF = 16500;
  const freqs = [];
  for (let i = 0; i < bandCount; i++) {
    const ratio = i / (bandCount - 1);
    const f = minF * Math.pow(maxF / minF, ratio);
    freqs.push(Math.round(f));
  }
  return freqs;
}

function formatFreq(hz: number) {
  return hz >= 1000 ? (hz / 1000).toFixed(hz >= 10000 ? 0 : 1) + "kHz" : hz + "Hz";
}

interface BandData {
  index: number;
  headerLabel: string;
  filterType: string;
  placement: string;
  gainDb: number;
  dynActive: boolean;
  eqIn: boolean;
  bypassed: boolean;
  dynMode: 'EXP' | 'COMP';
  dynThresh: number;
  q: number;
  freqHz: number;
}

function generatePresetBands(catIdx: number, presetIdx: number, bandCount: number): BandData[] {
  const freqs = getLogFrequencies(bandCount);
  const baseSeed = (catIdx + 1) * 1000 + (presetIdx + 1) * 17 + bandCount;

  return freqs.map((hz, i) => {
    const s1 = seededVal(baseSeed + i * 3.1);
    const s2 = seededVal(baseSeed + i * 7.3);
    const s3 = seededVal(baseSeed + i * 11.7);

    let filterType = "Peaking Band";
    let headerLabel = "MID / PEAKING BAND";
    if (i === 0) {
      filterType = s1 > 0.5 ? "High Pass" : "Low Shelf";
      headerLabel = "LOW / " + filterType.toUpperCase();
    } else if (i === 1 && bandCount >= 8) {
      filterType = "Low Shelf";
      headerLabel = "LOW / LOW SHELF";
    } else if (i === bandCount - 1) {
      filterType = s1 > 0.65 ? "Low Pass" : "High Shelf";
      headerLabel = "HIGH / " + filterType.toUpperCase();
    } else if (i >= bandCount - 2) {
      filterType = "High Shelf";
      headerLabel = "HIGH / HIGH SHELF";
    } else if (hz > 2500) {
      headerLabel = "HIGH / PEAKING BAND";
    }

    const gainDb = Number(((s1 - 0.48) * 9.0).toFixed(2));
    const dynGain = Math.round((s2 - 0.5) * 8);
    const qVal = Number((0.5 + s3 * 6.5).toFixed(1));
    const dynMode = i < bandCount / 2 ? "EXP" : "COMP";
    const lcrOptions = ["L", "C", "R"];
    const placement = lcrOptions[Math.floor(s2 * 3) % 3] || "L";

    return {
      index: i,
      headerLabel,
      filterType,
      placement,
      gainDb,
      dynActive: true,
      eqIn: true,
      bypassed: false,
      dynMode,
      dynThresh: dynGain,
      q: qVal,
      freqHz: hz
    };
  });
}

export const EqStudioModal: React.FC<Props> = ({ isOpen, onClose, trackName, trackId }) => {
  if (!isOpen) return null;

  const [categoryIdx, setCategoryIdx] = useState<number>(5); // Default 06. Kick Drum & Sub Punch
  const [presetIdx, setPresetIdx] = useState<number>(0);
  const [bandCount, setBandCount] = useState<number>(8);
  const [globalBypass, setGlobalBypass] = useState<boolean>(false);
  const [masterGain, setMasterGain] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bands, setBands] = useState<BandData[]>(() => generatePresetBands(5, 0, 8));
  const [outputDb, setOutputDb] = useState<string>('-4.4 dB');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setBands(generatePresetBands(categoryIdx, presetIdx, bandCount));
  }, [categoryIdx, presetIdx, bandCount]);

  const handleBandChange = (idx: number, updated: Partial<BandData>) => {
    setBands(prev => prev.map((b, i) => i === idx ? { ...b, ...updated } : b));
  };

  const handleSavePreset = () => {
    const payload = {
      preset: `${PEQX_CATEGORIES[categoryIdx]} - Preset ${presetIdx + 1}`,
      bandMode: `${bandCount} Band`,
      bands
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `PEQX_Preset_${bandCount}Band.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (audioRef.current) {
      audioRef.current.src = URL.createObjectURL(file);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn font-sans text-slate-100">
      <div className="peqx-window w-full max-w-[1460px] bg-[#14191f] border border-[#3c4a59] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar */}
        <div className="top-bar bg-gradient-to-b from-[#27313c] to-[#1c232b] p-3 border-b border-[#34414f] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="ctrl-box bg-[#141a21] border border-[#394858] px-3 py-1.5 rounded flex items-center gap-2 text-xs">
              <label className="text-slate-400 font-bold">CHANNEL:</label>
              <span className="text-cyan-300 font-bold">CH 0{trackId}: {trackName}</span>
            </div>

            <div className="ctrl-box bg-[#141a21] border border-[#394858] px-3 py-1.5 rounded flex items-center gap-2 text-xs">
              <label className="text-slate-400 font-bold">PRESET:</label>
              <select 
                value={`${categoryIdx}:${presetIdx}`}
                onChange={(e) => {
                  const [c, p] = e.target.value.split(':').map(Number);
                  setCategoryIdx(c);
                  setPresetIdx(p);
                }}
                className="bg-transparent border-none text-[#29e3d8] font-bold text-xs outline-none cursor-pointer max-w-[220px]"
              >
                {PEQX_CATEGORIES.map((cat, cIdx) => (
                  <optgroup key={cat} label={cat} className="bg-[#182028] text-slate-300">
                    {PRESET_DESCRIPTORS.map((desc, pIdx) => (
                      <option key={pIdx} value={`${cIdx}:${pIdx}`} className="bg-[#182028] text-white">
                        {desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="bg-[#334354] text-[#29e3d8] text-[10px] px-2 py-0.5 rounded-full font-bold">3,300</span>
            </div>

            <button onClick={handleSavePreset} className="btn-action bg-gradient-to-b from-[#254b57] to-[#19353e] border border-[#357688] text-[#9beeff] px-3 py-1.5 rounded text-xs font-bold cursor-pointer">
              SAVE
            </button>

            <div className="ctrl-box bg-[#141a21] border border-[#29e3d8]/60 px-3 py-1.5 rounded flex items-center gap-2 text-xs">
              <label className="text-[#29e3d8] font-bold">EQ BANDS:</label>
              <select 
                value={bandCount}
                onChange={(e) => setBandCount(Number(e.target.value))}
                className="bg-transparent border-none text-white font-bold text-xs outline-none cursor-pointer"
              >
                <option value={8} className="bg-[#182028]">8 Band</option>
                <option value={16} className="bg-[#182028]">16 Band</option>
                <option value={32} className="bg-[#182028]">32 Band</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="btn-action btn-upload bg-gradient-to-b from-[#24687d] to-[#194c5c] border border-[#3ca1c0] text-[#e3faff] px-3 py-1.5 rounded text-xs font-bold cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> UPLOAD AUDIO / STEM
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DSP Status Bar */}
        <div className="status-bar bg-[#171e25] px-4 py-1.5 border-b border-[#34414f] flex justify-between items-center text-xs text-[#29e3d8] shrink-0 font-mono">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setGlobalBypass(!globalBypass)}
              className={`bypass-btn px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 cursor-pointer ${globalBypass ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-[#232b35] border-[#455466] text-white'}`}
            >
              <span className={`bypass-dot w-2 h-2 rounded-full ${globalBypass ? 'bg-slate-500' : 'bg-[#f5a623] shadow-[0_0_6px_#f5a623]'}`}></span> Bypass
            </button>
            <span>♦ DSP ENGINE: <strong>14.8% / 96kHz / 32-bit Float</strong> &nbsp;|&nbsp; ZERO LATENCY FIR</span>
          </div>
          <div>Loaded: {PEQX_CATEGORIES[categoryIdx].split('.')[1]} [{bandCount} Band]</div>
        </div>

        {/* Workspace: Master Gain + Frequency Bands Rack */}
        <div className="workspace flex flex-1 overflow-hidden bg-[#1e252d]">
          
          {/* Master Gain Strip */}
          <div className="master-strip w-[175px] bg-[#1a2129] border-r-2 border-[#11161b] p-3 flex flex-col items-center justify-between shrink-0">
            <div className="master-header w-full flex justify-between items-center text-xs font-bold text-slate-400 border-b border-[#34414f] pb-2">
              <span>MASTER GAIN</span>
              <span>⚙</span>
            </div>

            <div className="master-fader-area flex items-center gap-3 h-[320px] my-3">
              <div className="db-scale flex flex-col justify-between h-[270px] text-[10px] text-slate-400 text-right font-mono">
                <span>+12</span>
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-18</span>
                <span>-24</span>
              </div>
              <div className="fader-track-wrap relative h-[270px] w-8 flex justify-center items-center">
                <input 
                  type="range" 
                  min="-24" max="12" step="0.1" 
                  value={masterGain}
                  onChange={(e) => setMasterGain(Number(e.target.value))}
                  className="tall-fader w-[235px] h-1.5 bg-[#10151b] border border-[#32404e] rounded -rotate-90 cursor-ns-resize accent-cyan-400"
                />
              </div>
              <div className="vu-meter w-4 h-[270px] bg-[#0e1318] border border-[#2d3845] rounded p-0.5 flex gap-0.5 items-end">
                <div className="vu-bar flex-1 h-[72%] bg-gradient-to-t from-[#19e66b] via-[#f5c723] to-[#ff3b4e] rounded-xs"></div>
                <div className="vu-bar flex-1 h-[68%] bg-gradient-to-t from-[#19e66b] via-[#f5c723] to-[#ff3b4e] rounded-xs"></div>
              </div>
            </div>

            <div className="trim-section flex flex-col items-center gap-1.5 w-full pt-2 border-t border-[#34414f]">
              <span className="text-[10px] text-slate-400 font-bold font-mono">MASTER TRIM</span>
              <div className="w-10 h-10 rounded-full bg-radial from-[#384654] to-[#1b222a] border-2 border-[#29e3d8] shadow-md flex items-center justify-center relative cursor-ns-resize">
                <div className="w-0.5 h-3.5 bg-white rounded-full absolute top-1" style={{ transform: `rotate(${(masterGain / 12) * 120}deg)`, transformOrigin: '50% 17px' }}></div>
              </div>
              <div className="trim-val text-[#29e3d8] text-xs font-bold font-mono">
                {masterGain >= 0 ? '+' : ''}{masterGain.toFixed(1)} dB
              </div>
            </div>
          </div>

          {/* Bands Rack Container */}
          <div className="rack-section flex-1 flex flex-col overflow-hidden bg-[#1e252d]">
            <div className="rack-header bg-[#182028] px-4 py-2 border-b border-[#34414f] flex justify-between items-center text-xs font-bold">
              <span>♪ PARAMETRIC &amp; DYNAMIC FREQUENCY BANDS RACK</span>
              <span className="text-slate-400 font-normal text-[11px]">
                Showing {bandCount} Active Bands (Fully Surgical Mode)
              </span>
            </div>

            <div className="bands-scroll-container flex overflow-x-auto flex-1 p-2 gap-2">
              {bands.map((band, idx) => (
                <div key={idx} className="band-strip min-w-[150px] flex-1 bg-[#252e38] border-r border-[#161c22] p-2.5 rounded-xl flex flex-col items-center gap-2">
                  <div className="band-title text-[11px] font-bold text-center text-slate-200 h-7 flex items-center justify-center uppercase">
                    B{idx + 1}: {band.headerLabel.split('/')[1]?.trim() || band.filterType}
                  </div>

                  <select 
                    value={band.filterType}
                    onChange={(e) => handleBandChange(idx, { filterType: e.target.value })}
                    className="w-full bg-[#f2f6fa] text-[#111820] border border-[#9ab0c7] rounded py-1 px-1 text-[11px] font-bold text-center cursor-pointer"
                  >
                    {FILTER_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>

                  <div className="lcr-group flex w-full gap-1 justify-center">
                    {['L', 'C', 'R'].map(ch => (
                      <button 
                        key={ch}
                        onClick={() => handleBandChange(idx, { placement: ch })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${band.placement === ch ? 'bg-[#1ee668] text-[#072312] border-[#5eff98] shadow-[0_0_6px_rgba(30,230,104,0.4)]' : 'bg-[#1b222a] border-[#34414f] text-slate-400'}`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>

                  {/* Vertical Gain Fader */}
                  <div className="fader-box relative h-[220px] w-full flex justify-center items-center my-1 bg-[#0e1318]/50 rounded border border-white/5">
                    <div className="fader-track-wrap relative h-[200px] w-8 flex justify-center items-center">
                      <input 
                        type="range" 
                        min="-24" max="12" step="0.05"
                        value={band.gainDb}
                        onChange={(e) => handleBandChange(idx, { gainDb: Number(e.target.value) })}
                        className="tall-fader w-[200px] h-1.5 bg-[#10151b] border border-[#32404e] rounded -rotate-90 cursor-ns-resize accent-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="gain-readout text-xs font-bold text-white bg-[#151c23] px-2 py-0.5 rounded border border-[#2e3b48] text-center font-mono">
                    {band.gainDb >= 0 ? '+' : ''}{band.gainDb.toFixed(2)} dB
                  </div>

                  <div className="dyn-grid grid grid-cols-2 gap-1 w-full font-mono text-[10px]">
                    <button 
                      onClick={() => handleBandChange(idx, { dynActive: !band.dynActive })}
                      className={`py-1 rounded font-bold border cursor-pointer ${band.dynActive ? 'bg-[#f5a623]/20 border-[#f5a623] text-[#f5a623]' : 'bg-[#181f26] border-[#33404f] text-slate-500'}`}
                    >
                      DYN
                    </button>
                    <button 
                      onClick={() => handleBandChange(idx, { eqIn: !band.eqIn })}
                      className={`py-1 rounded font-bold border cursor-pointer ${band.eqIn ? 'bg-[#29e3d8] text-[#062524] border-[#7ef7ef]' : 'bg-[#181f26] border-[#33404f] text-slate-500'}`}
                    >
                      EQ in
                    </button>
                    <button 
                      onClick={() => handleBandChange(idx, { bypassed: !band.bypassed })}
                      className={`py-1 rounded font-bold border cursor-pointer ${band.bypassed ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-[#181f26] border-[#33404f] text-slate-500'}`}
                    >
                      BYP
                    </button>
                    <button 
                      onClick={() => handleBandChange(idx, { dynMode: band.dynMode === 'EXP' ? 'COMP' : 'EXP' })}
                      className={`py-1 rounded font-bold border cursor-pointer ${band.dynMode === 'EXP' ? 'text-[#3fe87f] border-[#246b40]' : 'text-[#ff6b78] border-[#782a33]'}`}
                    >
                      {band.dynMode === 'EXP' ? '▲EXP' : '▼COMP'}
                    </button>
                  </div>

                  {/* Rotary Knobs */}
                  <div className="knobs-col flex flex-col items-center gap-1.5 w-full mt-1">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-radial from-[#384654] to-[#1b222a] border-2 border-[#f5a623] shadow flex items-center justify-center relative cursor-ns-resize">
                        <div className="w-0.5 h-3 bg-white rounded-full absolute top-1" style={{ transform: `rotate(${(band.dynThresh / 12) * 120}deg)`, transformOrigin: '50% 15px' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 mt-0.5">{band.dynThresh > 0 ? `+${band.dynThresh}` : band.dynThresh}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-radial from-[#384654] to-[#1b222a] border-2 border-[#29e3d8] shadow flex items-center justify-center relative cursor-ns-resize">
                        <div className="w-0.5 h-3 bg-white rounded-full absolute top-1" style={{ transform: `rotate(${((band.q - 0.5) / 12) * 240 - 120}deg)`, transformOrigin: '50% 15px' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 mt-0.5">{band.q}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-radial from-[#384654] to-[#1b222a] border-2 border-[#ff4757] shadow flex items-center justify-center relative cursor-ns-resize">
                        <div className="w-0.5 h-3 bg-white rounded-full absolute top-1" style={{ transform: `rotate(${(Math.log10(band.freqHz / 20) / Math.log10(20000 / 20)) * 260 - 130}deg)`, transformOrigin: '50% 15px' }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 mt-0.5">{formatFreq(band.freqHz)}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Bottom Transport Bar */}
        <div className="transport-bar bg-[#141a21] border-t border-[#34414f] px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
          <div className="transport-btns flex items-center gap-1.5">
            <button onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setIsPlaying(false); }}} className="t-btn bg-[#212a34] border border-[#384656] text-slate-300 w-8 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-slate-700">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }}} className="t-btn bg-[#212a34] border border-[#384656] text-slate-300 w-8 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-slate-700">
              <Square className="w-3.5 h-3.5" />
            </button>
            <button onClick={togglePlay} className={`t-btn w-8 h-7 rounded flex items-center justify-center cursor-pointer transition ${isPlaying ? 'bg-[#29e3d8] text-[#062321] border-[#82fff7] shadow-[0_0_10px_rgba(41,227,216,0.5)] font-bold' : 'bg-[#212a34] border-[#384656] text-slate-300 hover:bg-slate-700'}`}>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="track-progress flex-1 max-w-[640px] flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="text-[#29e3d8] font-bold">● {trackName.toUpperCase()}</span>
            <span>00:00</span>
            <div className="seek-bar flex-1 h-1.5 bg-[#25303b] rounded-full overflow-hidden cursor-pointer">
              <div className="seek-fill w-1/3 h-full bg-[#29e3d8]"></div>
            </div>
            <span>02:20</span>
          </div>

          <div className="output-readout text-xs text-slate-400 font-mono font-bold">
            OUTPUT: <span className="text-[#29e3d8]">{outputDb}</span>
          </div>
        </div>

      </div>

      <audio ref={audioRef} crossOrigin="anonymous" loop src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c365bc9d.mp3?filename=synthwave-80s-109038.mp3" />
    </div>
  );
};
