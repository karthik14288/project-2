import React from 'react';
import { Citation } from '../types/index.js';
import { FileText, Music, Video, Image, ExternalLink, MapPin } from 'lucide-react';

interface CitationBadgeProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
  index?: number;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation, onClick, index }) => {
  const getModalityIcon = (name: string, type?: string) => {
    const lower = (name + ' ' + (type || '')).toLowerCase();
    if (lower.includes('audio') || lower.endsWith('.mp3') || lower.endsWith('.wav')) {
      return <Music className="w-3 h-3 text-amber-400" />;
    }
    if (lower.includes('video') || lower.endsWith('.mp4')) {
      return <Video className="w-3 h-3 text-purple-400" />;
    }
    if (lower.includes('image') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) {
      return <Image className="w-3 h-3 text-emerald-400" />;
    }
    return <FileText className="w-3 h-3 text-sky-400" />;
  };

  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-700/80 hover:border-brand-500 hover:bg-brand-950/40 text-slate-200 hover:text-white transition-all shadow-sm group cursor-pointer"
      title={`Click to view citation source: ${citation.file_name} @ ${citation.location}`}
    >
      {index !== undefined && (
        <span className="text-[10px] font-mono text-brand-400 font-bold bg-brand-500/10 px-1 rounded">
          [{index + 1}]
        </span>
      )}
      <span className="shrink-0">{getModalityIcon(citation.file_name, citation.file_type)}</span>
      <span className="truncate max-w-[140px] font-mono text-[11px] text-slate-300 group-hover:text-brand-300">
        {citation.file_name}
      </span>
      <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-400 font-semibold bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
        <MapPin className="w-2.5 h-2.5" />
        {citation.location}
      </span>
      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
    </button>
  );
};
