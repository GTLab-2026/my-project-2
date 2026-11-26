import React, { useState, useEffect } from 'react';
import { Track, MasterSettings } from './types';
import { defaultTracks } from './data/defaultTracks';
import { audioEngine } from './services/audioEngine';
import { TrackMixer } from './components/TrackMixer';
import { DolbyAtmosPanel } from './components/DolbyAtmosPanel';
import { MasterMixPanel } from './components/MasterMixPanel';
import { SpectralPeakChart } from './components/SpectralPeakChart';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { 
  SlidersHorizontal, 
  Volume2, 
  MoreHorizontal, 
  Plus, 
  Save, 
  Download, 
  ArrowRight, 
  Repeat, 
  SkipBack, 
  RotateCcw, 
  Play, 
  Pause,
  RotateCw, 
  SkipForward, 
  Disc3, 
  LayoutGrid, 
  Sparkles, 
  Sliders,
  Edit3,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [currentTrackId, setCurrentTrackId] = useState<string>(defaultTracks[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'nowplaying' | 'mixer' | 'atmos' | 'mastermix'>('mixer');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(225); // 03:45 default
  const [visualizerZoom, setVisualizerZoom] = useState<number>(1);

  // Sorting state for library preparation
  const [sortBy, setSortBy] = useState<'default' | 'bpm' | 'key'>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Inline editing state for track name and artist
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editArtist, setEditArtist] = useState<string>('');

  const handleSort = (type: 'bpm' | 'key') => {
    if (sortBy === type) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortDirection('asc');
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'bpm') {
      const bpmA = a.aiBpm || 128;
      const bpmB = b.aiBpm || 128;
      return sortDirection === 'asc' ? bpmA - bpmB : bpmB - bpmA;
    }
    if (sortBy === 'key') {
      const keyA = a.aiKey || 'C Major';
      const keyB = b.aiKey || 'C Major';
      return sortDirection === 'asc' ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    }
    return 0;
  });

  // Historical spectrogram trail (past 5 seconds)
  const [spectrogramHistory, setSpectrogramHistory] = useState<number[][]>([
    [20, 30, 40, 50, 35, 45, 55, 40, 25, 45, 50, 35, 40, 55, 30, 40, 45, 20, 35, 50, 40, 25, 35, 45, 30, 20, 40, 45, 30, 50, 40, 20, 30, 40, 50, 30, 40, 20, 35, 30, 45, 25, 40, 20, 30, 40, 20, 35],
    [15, 25, 35, 45, 25, 35, 50, 30, 15, 40, 45, 25, 35, 50, 25, 35, 40, 15, 30, 45, 35, 20, 30, 40, 25, 15, 35, 40, 25, 45, 35, 15, 25, 35, 45, 25, 35, 15, 30, 25, 40, 20, 35, 15, 25, 35, 15, 30],
    [10, 20, 30, 40, 20, 30, 45, 25, 10, 35, 40, 20, 30, 45, 20, 30, 35, 10, 25, 40, 30, 15, 25, 35, 20, 10, 30, 35, 20, 40, 30, 10, 20, 30, 40, 20, 30, 10, 25, 20, 35, 15, 30, 10, 20, 30, 10, 25]
  ]);

  useEffect(() => {
    let histTimer: any;
    if (isPlaying) {
      histTimer = setInterval(() => {
        const newRow = Array.from({ length: 48 }, () => Math.floor(Math.random() * 50) + 15);
        setSpectrogramHistory(prev => [newRow, ...prev.slice(0, 3)]);
      }, 1000);
    }
    return () => clearInterval(histTimer);
  }, [isPlaying]);

  const [masterSettings, setMasterSettings] = useState<MasterSettings>({
    volume: 80,
    pan: 0,
    limiter: {
      threshold: -2,
      ratio: 10,
      attack: 1,
      release: 50,
      makeupGain: 1,
      noiseGateThreshold: -60,
      enabled: true
    },
    dolbyAtmos: {
      spatialWidth: 85,
      heightVirtualizer: 70,
      bassEnhancer: 65,
      dialogClarity: 75,
      surroundMode: 'music',
      enabled: true
    },
    globalHardLimiterOverride: true
  });

  const currentTrack = tracks.find(t => t.id === currentTrackId) || tracks[0];

  useEffect(() => {
    audioEngine.loadTrack(currentTrack, () => {
      handleNextTrack();
    });
    audioEngine.setMasterVolume(masterSettings.volume);
  }, [currentTrackId]);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrackId(track.id);
    setCurrentTime(0);
    audioEngine.loadTrack(track, () => {
      handleNextTrack();
    });
    audioEngine.play();
    setIsPlaying(true);
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handleSelectTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIndex]);
  };

  const handleSkipTime = (seconds: number) => {
    setCurrentTime(prev => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const handleUpdateTrack = (updatedTrack: Track) => {
    setTracks(tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t));
  };

  const handleAddTrack = (newTrack: Track) => {
    setTracks([newTrack, ...tracks]);
    handleSelectTrack(newTrack);
  };

  const handleAddMultipleTracks = (newTracks: Track[]) => {
    setTracks([...newTracks, ...tracks]);
    if (newTracks.length > 0) {
      handleSelectTrack(newTracks[0]);
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    const filtered = tracks.filter(t => t.id !== trackId);
    setTracks(filtered);
    if (currentTrackId === trackId && filtered.length > 0) {
      handleSelectTrack(filtered[0]);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const beatDuration = 60 / (currentTrack.aiBpm || 128);
  const beatSyncStyle = isPlaying ? { animation: `beatGlow ${beatDuration}s infinite ease-in-out` } : {};

  return (
    <div className="bg-[#07090e] text-slate-100 font-sans min-h-screen overflow-x-hidden selection:bg-[#00f2fe] selection:text-black relative">
      {/* Deep space hypertech ambient background lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[150px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] bg-pink-600/10 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1a2236_1px,transparent_1px)] [background-size:32px_32px] opacity-25"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-5 flex flex-col min-h-screen justify-between gap-5">
        
        {/* MainHeader */}
        <header style={beatSyncStyle} className="glass-panel cyber-border-gradient rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-pink-500 p-0.5 shadow-glow-cyan">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-display font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00f2fe] to-pink-500">GT</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f2fe]"></span>
              </span>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-extrabold tracking-wider text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  GTLab <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00f2fe] via-purple-400 to-pink-500">AI POWERED</span> AUDIO MIX
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v4.2 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight flex items-center gap-2">
                <span>Neural Stem Separation</span>
                <span className="text-white/20">•</span>
                <span>Dolby 7.1.4 Matrix</span>
                <span className="text-white/20">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Engine Live (32-bit / 96kHz)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 gap-3">
              <div className="text-right">
                <span className="block text-[9px] uppercase font-mono text-slate-400">Master Out</span>
                <span className="text-xs font-mono font-bold text-[#00f2fe]">-0.4 dB</span>
              </div>
              <div className="flex items-end gap-0.5 h-6">
                <span className="w-1 bg-emerald-400 h-2 rounded-t-sm"></span>
                <span className="w-1 bg-emerald-400 h-3.5 rounded-t-sm"></span>
                <span className="w-1 bg-emerald-400 h-5 rounded-t-sm"></span>
                <span className="w-1 bg-[#00f2fe] h-4 rounded-t-sm"></span>
                <span className="w-1 bg-amber-400 h-2.5 rounded-t-sm"></span>
                <span className="w-1 bg-rose-500 h-1 rounded-t-sm"></span>
              </div>
            </div>
            <button 
              onClick={() => setIsDriveModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all flex items-center gap-2 cursor-pointer" 
              title="Audio Device Preferences / Import"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#00f2fe]" />
              <span className="hidden sm:inline">Settings / Import</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="space-y-4 flex-1 flex flex-col justify-center">
          {activeTab === 'nowplaying' && (
            <div style={beatSyncStyle} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
              {/* Visualizer & Spectrogram with Historical Playback Trail & Beat-Grid Overlay */}
              <div className="relative bg-slate-950/70 border border-white/5 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">Live AI Stem Visualizer &amp; Beat-Grid (4/4 Bar Sync)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
                    <span className="text-[#00f2fe] font-medium">BPM: {currentTrack.aiBpm || 128}</span>
                    <span>KEY: {currentTrack.aiKey || 'F Minor'}</span>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg">
                      <span className="text-[10px]">Zoom:</span>
                      <button onClick={() => setVisualizerZoom(z => Math.max(1, z - 0.5))} className="text-slate-300 hover:text-white font-bold px-1 cursor-pointer">-</button>
                      <span className="text-[#00f2fe] font-bold w-7 text-center">{visualizerZoom.toFixed(1)}x</span>
                      <button onClick={() => setVisualizerZoom(z => Math.min(4, z + 0.5))} className="text-slate-300 hover:text-white font-bold px-1 cursor-pointer">+</button>
                      <button onClick={() => setVisualizerZoom(1)} className="text-slate-400 hover:text-white font-bold px-1 cursor-pointer">1x</button>
                    </div>
                  </div>
                </div>

                {/* Visual Beat-Grid Overlay (Highlights every 4th beat for synchronization) */}
                <div className="absolute inset-x-4 top-12 bottom-4 flex justify-between pointer-events-none z-15 opacity-45">
                  {Array.from({ length: 16 }).map((_, bIdx) => {
                    const isFourth = (bIdx + 1) % 4 === 0;
                    return (
                      <div 
                        key={bIdx} 
                        className={`h-full border-r ${isFourth ? 'border-cyan-400 border-opacity-90 bg-cyan-500/10 shadow-[0_0_6px_rgba(0,242,254,0.35)]' : 'border-white/10'} flex flex-col justify-between items-center`}
                        style={{ width: `${100 / 16}%` }}
                      >
                        {isFourth && <span className="text-[8px] font-mono text-cyan-300 font-bold -mt-3">{(bIdx / 4) + 1}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Historical Trail Rows (Fading spectrogram history for past 5 seconds) */}
                <div className="absolute inset-x-4 top-12 bottom-4 flex flex-col justify-between pointer-events-none opacity-25">
                  {spectrogramHistory.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center justify-between gap-[2px] w-full px-1" style={{ opacity: 1 - rowIndex * 0.25 }}>
                      {row.map((h, i) => (
                        <span 
                          key={i} 
                          className="wave-bar bg-gradient-to-r from-purple-500 to-pink-500" 
                          style={{ height: `${Math.max(10, h * 0.7)}px`, width: '3px' }}
                        ></span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Live Active Waveform Spectrogram */}
                <div className="relative z-10 h-20 overflow-x-auto custom-scroll">
                  <div 
                    className="h-full flex items-center justify-between gap-[2px] w-full px-1 py-1"
                    style={{ transform: `scaleX(${visualizerZoom})`, transformOrigin: 'left center', transition: 'transform 0.25s ease' }}
                  >
                    {[15, 24, 36, 48, 30, 42, 60, 36, 18, 48, 54, 33, 42, 57, 30, 45, 51, 21, 39, 57, 48, 27, 42, 54, 36, 18, 45, 51, 30, 54, 42, 21, 39, 48, 57, 33, 45, 24, 42, 36, 51, 30, 45, 27, 39, 48, 24, 42].map((h, i) => (
                      <span 
                        key={i} 
                        className="wave-bar" 
                        style={{ height: `${Math.max(15, (h * (isPlaying ? (Math.random() * 0.5 + 0.7) : 0.4)))}%` }}
                      ></span>
                    ))}
                  </div>
                </div>
                <div 
                  className="absolute top-0 bottom-0 z-20 w-[2px] bg-gradient-to-b from-white via-[#00f2fe] to-transparent shadow-[0_0_8px_#00f2fe] pointer-events-none transition-all duration-300"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>

              {/* Dedicated Spectral Peak Panel with D3.js line chart */}
              <SpectralPeakChart isPlaying={isPlaying} />

              {/* Track Table */}
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4 w-16 text-center">SL</th>
                      <th className="py-3 px-4">Track Name</th>
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('bpm')}
                        title="Click to sort by BPM"
                      >
                        <div className="flex items-center gap-1">
                          <span>BPM</span>
                          <span className="text-[10px] text-[#00f2fe]">
                            {sortBy === 'bpm' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort('key')}
                        title="Click to sort by Key"
                      >
                        <div className="flex items-center gap-1">
                          <span>Key</span>
                          <span className="text-[10px] text-[#00f2fe]">
                            {sortBy === 'key' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th className="py-3 px-4">AI Status</th>
                      <th className="py-3 px-4 text-right">Duration</th>
                      <th className="py-3 px-4 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-sm">
                    {sortedTracks.map((track, index) => {
                      const isCurrent = track.id === currentTrackId;
                      return (
                        <tr 
                          key={track.id}
                          onClick={() => handleSelectTrack(track)}
                          className={`transition-all duration-200 group cursor-pointer ${isCurrent ? 'bg-cyan-500/10 hover:bg-cyan-500/15 border-l-2 border-[#00f2fe]' : 'hover:bg-cyan-500/5'}`}
                        >
                          <td className={`py-3.5 px-4 font-mono text-center ${isCurrent ? 'text-[#00f2fe] font-bold' : 'text-slate-400'}`}>
                            <div className="flex items-center justify-center gap-1">
                              {isCurrent && isPlaying ? (
                                <Volume2 className="w-3.5 h-3.5 text-[#00f2fe] animate-pulse" />
                              ) : null}
                              <span>{String(index + 1).padStart(2, '0')}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-700 flex items-center justify-center font-bold text-xs shadow-md text-white shrink-0">
                                {track.title.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                {editingTrackId === track.id ? (
                                  <div className="space-y-1.5 py-1">
                                    <input 
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full bg-slate-900 border border-cyan-500/50 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                      placeholder="Track Title"
                                      autoFocus
                                    />
                                    <input 
                                      type="text"
                                      value={editArtist}
                                      onChange={(e) => setEditArtist(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                      placeholder="Artist Name"
                                    />
                                    <div className="flex items-center gap-2 pt-1">
                                      <button 
                                        onClick={() => {
                                          if (editTitle.trim()) {
                                            handleUpdateTrack({ ...track, title: editTitle.trim(), artist: editArtist.trim() || track.artist });
                                          }
                                          setEditingTrackId(null);
                                        }}
                                        className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded hover:bg-cyan-400 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" /> Save
                                      </button>
                                      <button 
                                        onClick={() => setEditingTrackId(null)}
                                        className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                                      >
                                        <X className="w-3 h-3" /> Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group/edit flex items-center justify-between">
                                    <div>
                                      <div className={`font-semibold transition-colors flex items-center gap-2 ${isCurrent ? 'text-[#00f2fe]' : 'text-white group-hover:text-[#00f2fe]'}`}>
                                        <span>{track.title}</span>
                                        {isCurrent && <span className="text-[9px] bg-cyan-500/20 text-[#00f2fe] px-1.5 py-0.5 rounded font-mono uppercase">Playing</span>}
                                      </div>
                                      <span className="text-xs text-slate-400">{track.artist}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTrackId(track.id);
                                        setEditTitle(track.title);
                                        setEditArtist(track.artist);
                                      }}
                                      className="opacity-0 group-hover/edit:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                                      title="Edit Track Name & Artist"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#00f2fe]">
                            {track.aiBpm || 128}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-purple-300 font-medium">
                            {track.aiKey || 'F Minor'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                              {track.aiAnalyzed ? 'AI Processed & Denoised' : 'Dolby Atmos Ready'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-semibold">{formatTime(track.duration || 225)}</td>
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleDeleteTrack(track.id)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" 
                              title="Remove Track"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsDriveModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00f2fe] border border-cyan-500/40 hover:border-[#00f2fe] transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add</span>
                  </button>
                  <button 
                    onClick={() => alert("Playlist saved successfully!")}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-400" />
                    <span>Save</span>
                  </button>
                  <button 
                    onClick={() => alert(`Exporting master track: ${currentTrack.title} (FLAC 32-bit)`)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-pink-300 border border-pink-500/30 hover:border-pink-500/50 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm shadow-pink-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-pink-300" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/25 transition-all flex items-center gap-1.5 active:scale-95" title="Sequential Flow">
                    <ArrowRight className="w-4 h-4 text-[#00f2fe]" />
                    <span className="font-mono">--&gt;</span>
                  </button>
                  <button className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-cyan-500/10 text-[#00f2fe] border border-cyan-500/30 hover:border-[#00f2fe] transition-all flex items-center gap-1.5 active:scale-95" title="Loop All">
                    <Repeat className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all active:scale-95">
                    ALL
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mixer' && (
            <TrackMixer track={currentTrack} onUpdateTrack={handleUpdateTrack} />
          )}

          {activeTab === 'atmos' && (
            <DolbyAtmosPanel masterSettings={masterSettings} onUpdateMaster={setMasterSettings} />
          )}

          {activeTab === 'mastermix' && (
            <MasterMixPanel 
              masterSettings={masterSettings} 
              onUpdateMaster={setMasterSettings} 
              currentTrack={currentTrack} 
              onExportRenderedTrack={handleAddTrack} 
              onUpdateTrackStems={handleUpdateTrack} 
            />
          )}
        </main>

        {/* AudioPlaybackControlDock */}
        <div style={beatSyncStyle} className="glass-panel cyber-border-gradient rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#00f2fe] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse"></span>
                {formatTime(currentTime)}
              </span>
              <span className="text-slate-400">{formatTime(currentTrack.duration || 225)}</span>
            </div>
            
            <div 
              className="relative w-full h-2.5 bg-slate-900/90 rounded-full cursor-pointer overflow-hidden border border-white/10 group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                setCurrentTime(Math.floor(percentage * duration));
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-[#00f2fe] via-indigo-500 to-pink-500 rounded-full relative transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-glow-cyan"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 py-2">
            <div className="flex flex-col items-center">
              <button 
                onClick={handlePrevTrack}
                className="w-13 h-13 p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-slate-300 hover:text-white border border-white/10 hover:border-[#00f2fe]/50 transition-all shadow-md group cursor-pointer" 
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-400 mt-1 uppercase tracking-tight">Prev Track</span>
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={() => handleSkipTime(-20)}
                className="w-12 h-12 p-3 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-slate-300 hover:text-[#00f2fe] border border-white/10 transition-all group cursor-pointer" 
                title="Rewind 20 Seconds"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
                  <span className="absolute text-[8px] font-mono font-bold">20</span>
                </div>
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-400 mt-1 uppercase tracking-tight">20s Back</span>
            </div>

            <div className="flex flex-col items-center -mt-2">
              <button 
                onClick={handleTogglePlay}
                className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#00f2fe] via-indigo-500 to-pink-500 p-[3px] shadow-glow-play active:scale-95 transition-all group cursor-pointer" 
                title="Play / Pause Audio Mix"
              >
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center border border-white/20 group-hover:bg-slate-900/80 transition-colors">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current text-white group-hover:text-[#00f2fe] transition-colors" />
                  ) : (
                    <Play className="w-8 h-8 fill-current text-white translate-x-0.5 group-hover:text-[#00f2fe] transition-colors" />
                  )}
                </div>
              </button>
              <span className="text-xs font-mono font-extrabold text-[#00f2fe] mt-1 uppercase tracking-wider">{isPlaying ? 'Pause' : 'Play'}</span>
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={() => handleSkipTime(20)}
                className="w-12 h-12 p-3 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-slate-300 hover:text-[#00f2fe] border border-white/10 transition-all group cursor-pointer" 
                title="Fast Forward 20 Seconds"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCw className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                  <span className="absolute text-[8px] font-mono font-bold">20</span>
                </div>
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-400 mt-1 uppercase tracking-tight">20s Fwd</span>
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={handleNextTrack}
                className="w-13 h-13 p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-slate-300 hover:text-white border border-white/10 hover:border-[#00f2fe]/50 transition-all shadow-md group cursor-pointer" 
                title="Next Track"
              >
                <SkipForward className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-[10px] font-mono font-medium text-slate-400 mt-1 uppercase tracking-tight">Next Track</span>
            </div>
          </div>
        </div>

        {/* BottomNavigationTabs */}
        <nav className="glass-panel cyber-border-gradient rounded-2xl p-2 shadow-2xl mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button 
              onClick={() => setActiveTab('nowplaying')}
              className={`relative flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all group cursor-pointer ${activeTab === 'nowplaying' ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 text-white shadow-glow-cyan' : 'bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 text-slate-300 hover:text-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Disc3 className={`w-5 h-5 text-[#00f2fe] ${activeTab === 'nowplaying' ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <span className="font-display font-bold text-sm tracking-wide">NOW PLAYING</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300/80">Deck A • {currentTrack.title.slice(0, 14)}</span>
              {activeTab === 'nowplaying' && <div className="absolute bottom-1 w-12 h-1 bg-[#00f2fe] rounded-full shadow-[0_0_8px_#00f2fe]"></div>}
            </button>

            <button 
              onClick={() => setActiveTab('mixer')}
              className={`relative flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all group cursor-pointer ${activeTab === 'mixer' ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/50 text-white shadow-glow-magenta' : 'bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 text-slate-300 hover:text-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-display font-bold text-sm tracking-wide">MIX PAD</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">16 FX Triggers • Loops</span>
              {activeTab === 'mixer' && <div className="absolute bottom-1 w-12 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_#8a2be2]"></div>}
            </button>

            <button 
              onClick={() => setActiveTab('atmos')}
              className={`relative flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all group cursor-pointer ${activeTab === 'atmos' ? 'bg-gradient-to-r from-pink-500/20 to-[#00f2fe]/20 border border-pink-500/50 text-white shadow-glow-cyan' : 'bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 text-slate-300 hover:text-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className={`w-5 h-5 text-pink-400 ${activeTab === 'atmos' ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <span className="font-display font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-[#00f2fe]">DOLBY ATMOS</span>
              </div>
              <span className="text-[10px] font-mono text-pink-300/90">3D Spatial Matrix (Active)</span>
              {activeTab === 'atmos' && <div className="absolute bottom-1 w-12 h-1 bg-pink-400 rounded-full shadow-[0_0_8px_#f72585]"></div>}
            </button>

            <button 
              onClick={() => setActiveTab('mastermix')}
              className={`relative flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all group cursor-pointer ${activeTab === 'mastermix' ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-[#00f2fe]/20 border border-amber-500/50 text-white shadow-glow-cyan' : 'bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 text-slate-300 hover:text-white'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-display font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-[#00f2fe]">MASTER MIX &amp; CONFIG</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/90">EQ • Limiter • AI DSP</span>
              {activeTab === 'mastermix' && <div className="absolute bottom-1 w-14 h-1 bg-gradient-to-r from-amber-400 to-[#00f2fe] rounded-full shadow-[0_0_10px_#00f2fe]"></div>}
            </button>
          </div>
        </nav>

      </div>

      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onAddTrack={handleAddTrack}
      />
    </div>
  );
}
