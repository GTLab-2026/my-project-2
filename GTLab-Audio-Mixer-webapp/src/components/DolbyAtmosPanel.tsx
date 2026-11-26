import React, { useState } from 'react';
import { 
  Sparkles, 
  SlidersHorizontal, 
  Speaker, 
  Radar, 
  Headphones, 
  Sliders, 
  Box, 
  Activity, 
  MoveVertical, 
  FileCode 
} from 'lucide-react';
import { MasterSettings } from '../types';

interface Props {
  masterSettings: MasterSettings;
  onUpdateMaster: (settings: MasterSettings) => void;
}

export const DolbyAtmosPanel: React.FC<Props> = ({ masterSettings, onUpdateMaster }) => {
  const atmos = masterSettings.dolbyAtmos;
  const [selectedPreset, setSelectedPreset] = useState<string>('Studio Binaural');
  const [xAxis, setXAxis] = useState<number>(-35);
  const [yAxis, setYAxis] = useState<number>(62);
  const [zAxis, setZAxis] = useState<number>(42);
  const [spread, setSpread] = useState<number>(35);

  return (
    <div className="space-y-4">
      {/* Dolby Atmos Suite Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/30 border border-pink-500/40 flex items-center justify-center shadow-sm shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white tracking-wide flex items-center gap-2">
                DOLBY ATMOS® <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-[#00f2fe]">7.1.4 3D SPATIAL MATRIX</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30 uppercase tracking-wider">Object Panner Live</span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span className="text-[#00f2fe]">Binaural Mode: ON</span>
              <span className="text-white/20">•</span>
              <span>Bed: 7.1.2 Matrix</span>
              <span className="text-white/20">•</span>
              <span className="text-emerald-400">Active Objects: 14/128</span>
              <span className="text-white/20">•</span>
              <span>Room: Large Spatial Convolver</span>
            </p>
          </div>
        </div>

        {/* Quick Mode Presets Bar */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {['Studio Binaural', 'Cinema Matrix', 'Concert Hall 3D', 'Headphone Spatializer', 'Ambisonics B-Format'].map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                selectedPreset === preset 
                  ? 'bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/40 shadow-sm shadow-cyan-500/20 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {selectedPreset === preset && <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span>}
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column 3D Mixing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Panel: 7.1.4 Speaker Bed Meters & Output Channels */}
        <div className="lg:col-span-3 bg-slate-950/60 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Speaker className="w-4 h-4 text-[#00f2fe]" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">Bed & 7.1.4 Speakers</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">12 Ch Active</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            {/* L / R Front */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-slate-300">L / R</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[82%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[78%]"></div></div>
              </div>
              <span className="text-[10px] text-[#00f2fe] w-10 text-right">-4.2 dB</span>
            </div>
            {/* Center / LFE Sub */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-slate-300">C / LFE</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[88%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full w-[94%]"></div></div>
              </div>
              <span className="text-[10px] text-amber-300 w-10 text-right">-1.1 dB</span>
            </div>
            {/* Surrounds Ls / Rs */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-slate-300">Ls / Rs</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[65%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[69%]"></div></div>
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">-8.4 dB</span>
            </div>
            {/* Rear Back Lb / Rb */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-slate-300">Lb / Rb</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[54%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-emerald-400 to-[#00f2fe] h-full w-[58%]"></div></div>
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">-12.0 dB</span>
            </div>
            {/* Top Front Heights Ltf / Rtf */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-pink-300">T.Front</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full w-[72%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full w-[70%]"></div></div>
              </div>
              <span className="text-[10px] text-pink-400 w-10 text-right">-6.5 dB</span>
            </div>
            {/* Top Rear Heights Ltr / Rtr */}
            <div className="flex items-center justify-between bg-white/[0.02] p-1.5 rounded border border-white/5">
              <span className="w-8 font-semibold text-pink-300">T.Rear</span>
              <div className="flex-1 mx-2 flex gap-1 h-2">
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full w-[60%]"></div></div>
                <div className="w-1/2 bg-slate-800 rounded-sm overflow-hidden flex items-center"><div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full w-[62%]"></div></div>
              </div>
              <span className="text-[10px] text-pink-400 w-10 text-right">-9.8 dB</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            <button className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-center transition-colors cursor-pointer">
              SOLO BED
            </button>
            <button className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 text-center transition-colors cursor-pointer">
              MUTE TOPS
            </button>
            <button 
              onClick={() => alert("Dolby Atmos 7.1.4 calibration completed successfully!")}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 text-center cursor-pointer"
            >
              CALIBRATE
            </button>
          </div>
        </div>

        {/* Center Panel: Interactive 3D Spatial Dome / Radar Visualizer */}
        <div className="lg:col-span-6 bg-slate-950/80 border border-[#00f2fe]/30 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden shadow-glow-cyan">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 z-10">
            <div className="flex items-center gap-1.5 text-[#00f2fe] font-bold">
              <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
              <span>SPATIAL DOME [TOP-DOWN AZIMUTH & ELEVATION]</span>
            </div>
            <span className="text-[11px] bg-pink-500/15 text-pink-300 px-2 py-0.5 rounded border border-pink-500/30">Grid: ±100 Unit Iso</span>
          </div>

          <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#00f2fe]/20 animate-pulse"></div>
            <div className="absolute inset-6 rounded-full border border-[#00f2fe]/30"></div>
            <div className="absolute inset-14 rounded-full border border-dashed border-white/20"></div>
            <div className="absolute inset-24 rounded-full border border-pink-500/30 bg-pink-500/5"></div>
            
            <div className="absolute inset-x-0 h-[1px] bg-white/10"></div>
            <div className="absolute inset-y-0 w-[1px] bg-white/10"></div>
            <div className="absolute inset-0 rotate-45 border-t border-dashed border-white/5 pointer-events-none"></div>
            <div className="absolute inset-0 -rotate-45 border-t border-dashed border-white/5 pointer-events-none"></div>

            <span className="absolute top-1 text-[9px] font-mono font-bold text-[#00f2fe] bg-slate-950/80 px-1 rounded border border-[#00f2fe]/30">C (0°)</span>
            <span className="absolute top-4 left-6 text-[9px] font-mono font-bold text-slate-400">L (-30°)</span>
            <span className="absolute top-4 right-6 text-[9px] font-mono font-bold text-slate-400">R (+30°)</span>
            <span className="absolute top-12 left-1 text-[8px] font-mono text-pink-400 border border-pink-500/20 px-0.5 rounded">LTF</span>
            <span className="absolute top-12 right-1 text-[8px] font-mono text-pink-400 border border-pink-500/20 px-0.5 rounded">RTF</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400">Ls (-90°)</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400">Rs (+90°)</span>
            <span className="absolute bottom-8 left-4 text-[8px] font-mono text-pink-400 border border-pink-500/20 px-0.5 rounded">LTR</span>
            <span className="absolute bottom-8 right-4 text-[8px] font-mono text-pink-400 border border-pink-500/20 px-0.5 rounded">RTR</span>
            <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-400">Lb/Rb (180°)</span>

            {/* Center Listener */}
            <div className="relative z-20 flex flex-col items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-[#00f2fe] shadow-glow-cyan">
              <Headphones className="w-5 h-5 text-[#00f2fe]" />
              <div className="absolute -top-1 w-2 h-2 bg-[#00f2fe] rotate-45"></div>
            </div>

            {/* Audio Objects */}
            <div className="absolute top-14 left-24 z-20 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50 flex items-center justify-center animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
              <div className="absolute -top-5 -left-4 px-1.5 py-0.5 rounded bg-slate-900/90 border border-pink-500/40 text-[9px] font-mono text-pink-300 font-bold whitespace-nowrap shadow">
                Vocals [Z:+42]
              </div>
            </div>

            <div className="absolute top-20 right-16 z-20 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-[#00f2fe] shadow-lg shadow-cyan-500/50 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
              <div className="absolute -top-5 -left-6 px-1.5 py-0.5 rounded bg-slate-900/90 border border-[#00f2fe]/40 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow">
                Lead Synth [Z:+18]
              </div>
            </div>

            <div className="absolute bottom-16 left-32 z-20 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
              </div>
              <div className="absolute -bottom-5 -left-6 px-1.5 py-0.5 rounded bg-slate-900/90 border border-amber-500/40 text-[9px] font-mono text-amber-300 font-bold whitespace-nowrap shadow">
                Sub-Bass [Z:-10]
              </div>
            </div>

            <div className="absolute top-28 left-8 z-20 group cursor-pointer">
              <div className="w-3.5 h-3.5 rounded-full bg-purple-400 shadow-md shadow-purple-500/50 flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full"></span>
              </div>
              <div className="absolute -bottom-5 -left-4 px-1.5 py-0.5 rounded bg-slate-900/90 border border-purple-500/40 text-[9px] font-mono text-purple-300 font-bold whitespace-nowrap shadow">
                Pad Reverb
              </div>
            </div>
          </div>

          <div className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] font-mono z-10">
            <div><span className="text-slate-400">SEL OBJ:</span> <span className="text-pink-400 font-bold">01 Vocals</span></div>
            <div><span className="text-slate-400">AZ:</span> <span className="text-[#00f2fe]">{xAxis}°</span></div>
            <div><span className="text-slate-400">EL:</span> <span className="text-pink-300">+{zAxis}°</span></div>
            <div><span className="text-slate-400">DIST:</span> <span className="text-emerald-400">1.84m</span></div>
            <div><span className="text-slate-400">SPREAD:</span> <span className="text-amber-300">{spread}%</span></div>
          </div>
        </div>

        {/* Right Panel: Object Panning & Binaural Acoustics Engine */}
        <div className="lg:col-span-3 bg-slate-950/60 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">Object Panning DSP</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">Binaural HRTF</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>X-Axis (Left / Right)</span>
                <span className="text-[#00f2fe]">{xAxis / 100}</span>
              </div>
              <input 
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                max="100" min="-100" type="range" 
                value={xAxis}
                onChange={(e) => setXAxis(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Y-Axis (Front / Back)</span>
                <span className="text-[#00f2fe]">{yAxis / 100}</span>
              </div>
              <input 
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                max="100" min="-100" type="range" 
                value={yAxis}
                onChange={(e) => setYAxis(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Z-Axis (Ceiling Elevation)</span>
                <span className="text-pink-400">+{zAxis / 100}</span>
              </div>
              <input 
                className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                max="100" min="-100" type="range" 
                value={zAxis}
                onChange={(e) => setZAxis(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>3D Size / Divergence Spread</span>
                <span className="text-amber-400">{spread}%</span>
              </div>
              <input 
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                max="100" min="0" type="range" 
                value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-[#00f2fe]" /> Room Acoustic Decay</span>
              <span className="text-emerald-400 font-bold">1.45 s</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-pink-400" /> Wall Absorption</span>
              <span className="text-slate-300">48% Air Damp</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5"><MoveVertical className="w-3.5 h-3.5 text-purple-400" /> Ceiling Height</span>
              <span className="text-slate-300">4.8 Meters</span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button 
              onClick={() => alert("Rendering Dolby Atmos 3D spatial mix to ADM BWF format...")}
              className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shadow-pink-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render 3D</span>
            </button>
            <button 
              onClick={() => alert("Exporting ADM BWF XML metadata snapshot...")}
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95 cursor-pointer" 
              title="Export ADM BWF XML"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
