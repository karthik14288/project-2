import React, { useEffect, useRef } from 'react';
import { Citation } from '../types/index.js';
import { X, ExternalLink, Music, Video, Image as ImageIcon, FileText, Clock, FileCheck } from 'lucide-react';

interface SourceViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ citation, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!citation) return null;

  // Convert MM:SS timestamp to seconds
  const parseSecondsFromTimestamp = (loc: string): number => {
    const match = loc.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      return minutes * 60 + seconds;
    }
    return 0;
  };

  const timestampSeconds = parseSecondsFromTimestamp(citation.location);

  useEffect(() => {
    if (timestampSeconds > 0) {
      if (videoRef.current) {
        videoRef.current.currentTime = timestampSeconds;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = timestampSeconds;
      }
    }
  }, [citation, timestampSeconds]);

  const lowerName = (citation.file_name + ' ' + (citation.file_type || '')).toLowerCase();
  const isAudio = lowerName.includes('audio') || lowerName.endsWith('.mp3') || lowerName.endsWith('.wav');
  const isVideo = lowerName.includes('video') || lowerName.endsWith('.mp4');
  const isImage = lowerName.includes('image') || lowerName.endsWith('.jpg') || lowerName.endsWith('.png') || lowerName.endsWith('.jpeg');
  const isPdf = lowerName.endsWith('.pdf') || lowerName.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              {isAudio && <Music className="w-5 h-5 text-amber-400" />}
              {isVideo && <Video className="w-5 h-5 text-purple-400" />}
              {isImage && <ImageIcon className="w-5 h-5 text-emerald-400" />}
              {isPdf && <FileText className="w-5 h-5 text-sky-400" />}
              {!isAudio && !isVideo && !isImage && !isPdf && <FileCheck className="w-5 h-5 text-brand-400" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white truncate max-w-md">
                  {citation.file_name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-brand-950 text-brand-300 border border-brand-800">
                  {citation.location}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Verifiable Multimodal Citation Evidence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Relevant Quote Snippet Callout */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-brand-500/30 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-brand-400" />
              <span>Extracted Source Passage</span>
            </div>
            <p className="text-sm text-slate-200 italic font-mono leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              "{citation.relevant_quote || 'Exact context verified during cross-modal reasoning.'}"
            </p>
          </div>

          {/* Native Media Viewers */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
            {isVideo && (
              <div className="space-y-3">
                <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                  {citation.url ? (
                    <video
                      ref={videoRef}
                      src={citation.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <Video className="w-12 h-12 text-purple-400 mx-auto mb-2 opacity-80" />
                      <p className="text-sm text-slate-300">Video Media Stream</p>
                      <p className="text-xs text-slate-500 mt-1">Jumped to citation timestamp: {citation.location}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Target Time: {citation.location} ({timestampSeconds}s)
                  </span>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:underline flex items-center gap-1"
                    >
                      Open Raw Stream <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {isAudio && (
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                    <Music className="w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">{citation.file_name}</p>
                  <p className="text-xs text-amber-400 font-mono mt-1">
                    Synchronized to timestamp: {citation.location}
                  </p>

                  <audio
                    ref={audioRef}
                    src={citation.url || undefined}
                    controls
                    className="w-full max-w-md mt-4"
                  />
                </div>
              </div>
            )}

            {isImage && (
              <div className="space-y-3">
                <div className="max-h-[420px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-800">
                  {citation.url ? (
                    <img
                      src={citation.url}
                      alt={citation.file_name}
                      className="max-h-[400px] w-auto object-contain rounded"
                    />
                  ) : (
                    <div className="p-12 text-center">
                      <ImageIcon className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="text-sm text-slate-300 font-medium">Multimodal Image Evidence</p>
                      <p className="text-xs text-slate-400 mt-1">Spatial Region / Sector: {citation.location}</p>
                    </div>
                  )}

                  {/* Visual Sector Box Overlay */}
                  <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-3 py-1 rounded text-xs font-mono font-semibold shadow-lg">
                    Focus: {citation.location}
                  </div>
                </div>
              </div>
            )}

            {isPdf && (
              <div className="space-y-3">
                <div className="h-80 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                  {citation.url ? (
                    <iframe
                      src={`${citation.url}#page=${citation.location.replace(/[^0-9]/g, '') || 1}`}
                      title={citation.file_name}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileText className="w-12 h-12 text-sky-400 mx-auto mb-2 opacity-80" />
                      <p className="text-sm text-slate-300 font-medium">Document Evidence Page</p>
                      <p className="text-xs text-sky-400 font-mono mt-1">Referencing: {citation.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span>File ID: <span className="font-mono text-slate-500">{citation.file_id || 'Embedded Chunk'}</span></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
