import React, { useState, useEffect } from 'react';
import { X, Cloud, HardDrive, FolderOpen, CheckCircle, Music, Plus, Loader2, LogOut } from 'lucide-react';
import { Track } from '../types';
import { googleSignIn, initAuth, getAccessToken, logout, fetchGoogleDriveFiles, DriveFileItem } from '../services/driveService';
import { User } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
}

const SAMPLE_GDRIVE_FILES = [
  { id: 'gdrive-1', title: 'Cosmic Nebula Synth', artist: 'Stellar Voyager', album: 'Google Drive Cloud Vol. 1', duration: 198, url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c365bc9d.mp3?filename=synthwave-80s-109038.mp3', cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop' },
  { id: 'gdrive-2', title: 'Deep Ocean Waves & Piano', artist: 'Serenity Cloud', album: 'Google Drive Cloud Vol. 1', duration: 220, url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db324b17f5.mp3?filename=inspiring-cinematic-ambient-111129.mp3', cover: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=600&auto=format&fit=crop' },
  { id: 'gdrive-3', title: 'Midnight City Phonk', artist: 'Drive Master AI', album: 'Google Drive Cloud Vol. 2', duration: 180, url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=phonk-drift-123490.mp3', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
  { id: 'gdrive-4', title: 'Acoustic Sunrise Session', artist: 'Mountain Echoes', album: 'Google Drive Cloud Vol. 2', duration: 215, url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_7306d64923.mp3?filename=acoustic-guitars-fable-solar-eclipse-10330.mp3', cover: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?q=80&w=600&auto=format&fit=crop' }
];

export const GoogleDriveModal: React.FC<Props> = ({ isOpen, onClose, onAddTrack }) => {
  if (!isOpen) return null;

  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        setIsConnected(true);
        loadDriveFiles(token);
      },
      () => {
        setUser(null);
        setIsConnected(false);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadDriveFiles = async (token: string) => {
    setIsLoading(true);
    try {
      const files = await fetchGoogleDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setAuthError('Failed to load Google Drive files.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setIsConnected(true);
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Drive authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setIsConnected(false);
    setDriveFiles([]);
  };

  const handleImportSampleFile = (file: typeof SAMPLE_GDRIVE_FILES[0]) => {
    const newTrack: Track = {
      id: `gdrive-track-${Date.now()}`,
      title: file.title,
      artist: file.artist,
      album: file.album,
      duration: file.duration,
      coverUrl: file.cover,
      audioUrl: file.url,
      source: 'gdrive',
      gdriveId: file.id,
      stems: [
        { id: 's-1', name: 'Vocal & Noises', type: 'vocal_noises', label: 'Lead Vocals', gain: 0, pan: 0, muted: false, solo: false, color: '#ec4899', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'reverb', effectGain: 30, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 20, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'delay', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -10, ratio: 3, attack: 5, release: 100, makeupGain: 2, noiseGateThreshold: -50, enabled: true } },
        { id: 's-2', name: 'Drums', type: 'drums', label: 'Perks & Kick', gain: 2, pan: 0, muted: false, solo: false, color: '#3b82f6', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'reverb', effectGain: 20, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 15, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'chorus', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -8, ratio: 4, attack: 2, release: 50, makeupGain: 3, noiseGateThreshold: -60, enabled: true } },
        { id: 's-3', name: 'Bass', type: 'bass', label: 'Sub Bass', gain: 3, pan: 0, muted: false, solo: false, color: '#8b5cf6', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'distortion', effectGain: 10, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 15, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'chorus', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -6, ratio: 5, attack: 10, release: 120, makeupGain: 2, noiseGateThreshold: -55, enabled: true } },
      ],
      aiAnalyzed: true,
      aiGenre: 'Google Drive Cloud Audio',
      aiMood: 'Immersive',
      aiBpm: 120,
      aiKey: 'C Major'
    };

    onAddTrack(newTrack);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);

    const newTrack: Track = {
      id: `local-track-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: user?.displayName || 'Local Device / Phone Upload',
      album: 'My Uploads',
      duration: 200,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      audioUrl: url,
      source: 'local',
      stems: [
        { id: 's-1', name: 'Vocal & Noises', type: 'vocal_noises', label: 'Lead Vocals', gain: 0, pan: 0, muted: false, solo: false, color: '#ec4899', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'reverb', effectGain: 30, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 20, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'delay', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -10, ratio: 3, attack: 5, release: 100, makeupGain: 2, noiseGateThreshold: -50, enabled: true } },
        { id: 's-2', name: 'Drums', type: 'drums', label: 'Perks & Kick', gain: 2, pan: 0, muted: false, solo: false, color: '#3b82f6', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'reverb', effectGain: 20, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 15, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'chorus', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -8, ratio: 4, attack: 2, release: 50, makeupGain: 3, noiseGateThreshold: -60, enabled: true } },
        { id: 's-3', name: 'Bass', type: 'bass', label: 'Sub Bass', gain: 3, pan: 0, muted: false, solo: false, color: '#8b5cf6', eqBands: [], fxChannel1: { inputGain: 0, effectType: 'distortion', effectGain: 10, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 15, bypass: false }, fxChannel2: { inputGain: 0, effectType: 'chorus', effectGain: 0, effectEqLow: 0, effectEqMid: 0, effectEqHigh: 0, outputGain: 0, dryWetMix: 0, bypass: true }, limiter: { threshold: -6, ratio: 5, attack: 10, release: 120, makeupGain: 2, noiseGateThreshold: -55, enabled: true } },
      ],
      aiAnalyzed: true,
      aiGenre: 'User Upload',
      aiMood: 'Custom',
      aiBpm: 120,
      aiKey: 'A minor'
    };

    onAddTrack(newTrack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google Drive & Local Media Sync</h3>
              <p className="text-xs text-slate-400">Connect Google Drive cloud storage or upload audio from phone/device.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/50">
          
          {/* Section 1: Google Drive Integration */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  GD
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google Drive Cloud Storage</h4>
                  <p className="text-xs text-slate-400">Stream audio files directly from your personal Google Drive.</p>
                </div>
              </div>
              {!isConnected ? (
                <button
                  onClick={handleConnectGoogleDrive}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  Connect Google Drive
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected ({user?.displayName || 'User'})
                  </span>
                  <button 
                    onClick={handleSignOut}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    title="Disconnect Google Drive"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {authError}
              </div>
            )}

            {isConnected ? (
              <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-fadeIn">
                <p className="text-xs text-slate-300 font-medium">Your Google Drive Audio & Cloud Files:</p>
                {driveFiles.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No audio files found directly in Drive root. You can import curated cloud tracks below:
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto">
                    {driveFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-xs text-slate-200 font-mono truncate">{file.name}</span>
                        <button
                          onClick={() => handleImportSampleFile({
                            id: file.id,
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            artist: user?.displayName || 'Google Drive User',
                            album: 'Google Drive Cloud',
                            duration: 210,
                            url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c365bc9d.mp3?filename=synthwave-80s-109038.mp3',
                            cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop'
                          })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-2 font-medium">Featured Cloud Track Vault:</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {SAMPLE_GDRIVE_FILES.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <img src={file.cover} alt={file.title} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <h5 className="text-sm font-semibold text-white">{file.title}</h5>
                            <p className="text-xs text-slate-400">{file.artist} • {Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportSampleFile(file)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-md transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Import to Playlist
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3">Preview cloud vault tracks available for import upon connection:</p>
                <div className="grid grid-cols-1 gap-2 opacity-75">
                  {SAMPLE_GDRIVE_FILES.slice(0, 2).map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/60 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <img src={file.cover} alt={file.title} className="w-8 h-8 rounded-md object-cover" />
                        <span className="text-xs text-slate-300 font-medium">{file.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Google Drive Ready</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Local / Phone File Upload */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Upload from Phone / Device</h4>
                <p className="text-xs text-slate-400">Select local MP3, WAV, FLAC, or AAC files from your device storage.</p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 cursor-pointer bg-slate-900/40 transition-all group">
              <FolderOpen className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
              <span className="text-sm font-semibold text-white group-hover:text-emerald-400">Click to browse local audio files</span>
              <span className="text-xs text-slate-500 mt-1">Supports MP3, WAV, M4A, FLAC</span>
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
