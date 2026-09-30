import React from 'react';
import { DomainLens } from '../types/index.js';
import { GraduationCap, Stethoscope, Sprout, CheckCircle2 } from 'lucide-react';

interface LensSelectorProps {
  selectedLens: DomainLens;
  onSelectLens: (lens: DomainLens) => void;
  compact?: boolean;
}

interface LensConfig {
  type: DomainLens;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  activeBorder: string;
  activeBg: string;
  glow: string;
  accentColor: string;
  suggestedQueries: string[];
}

export const LENS_CONFIGS: Record<DomainLens, LensConfig> = {
  Education: {
    type: 'Education',
    title: 'Education & Academics',
    subtitle: 'Lectures, Whiteboard Notes & Handouts',
    description: 'Specializes in audio lecture recordings, textbook chapters, and whiteboard scans. Citations highlight video/audio timestamps and document page numbers.',
    icon: <GraduationCap className="w-5 h-5 text-indigo-400" />,
    activeBorder: 'border-indigo-500',
    activeBg: 'bg-indigo-950/40',
    glow: 'shadow-indigo-500/10',
    accentColor: 'text-indigo-400',
    suggestedQueries: [
      'What were the core lecture conclusions on algorithmic complexity?',
      'Summarize the derivation presented on page 14 of the handout.'
    ]
  },
  Healthcare: {
    type: 'Healthcare',
    title: 'Healthcare & Clinical',
    subtitle: 'Doctor Voice Memos & Lab Reports',
    description: 'Cross-correlates physician audio dictations with scanned blood and pathology reports. Synthesizes clinical metrics and flagged variances.',
    icon: <Stethoscope className="w-5 h-5 text-rose-400" />,
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-950/40',
    glow: 'shadow-rose-500/10',
    accentColor: 'text-rose-400',
    suggestedQueries: [
      'Correlate the doctor audio memo with the CBC blood panel results.',
      'What symptoms explain the microcytic hypochromic red blood cell findings?'
    ]
  },
  Agriculture: {
    type: 'Agriculture',
    title: 'Precision Agriculture',
    subtitle: 'Voice Notes, Soil Sensors & Drone Photos',
    description: 'Diagnoses crop pathologies by cross-referencing farmer audio memos with laboratory soil sensor reports and drone multispectral imagery.',
    icon: <Sprout className="w-5 h-5 text-emerald-400" />,
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-950/40',
    glow: 'shadow-emerald-500/10',
    accentColor: 'text-emerald-400',
    suggestedQueries: [
      'What is causing the leaf yellowing in Sector 4?',
      'How do the soil nitrate readings correlate with the drone canopy chlorosis?'
    ]
  }
};

export const LensSelector: React.FC<LensSelectorProps> = ({
  selectedLens,
  onSelectLens,
  compact = false
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>Active Domain Reasoning Lens</span>
        </label>
        <span className="text-xs text-slate-500">Adapts AI reasoning prompt & context</span>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
        {(Object.keys(LENS_CONFIGS) as DomainLens[]).map((lensKey) => {
          const config = LENS_CONFIGS[lensKey];
          const isSelected = selectedLens === lensKey;

          return (
            <button
              key={lensKey}
              type="button"
              id={`lens-select-${lensKey.toLowerCase()}`}
              onClick={() => onSelectLens(lensKey)}
              className={`relative text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `${config.activeBorder} ${config.activeBg} shadow-lg ${config.glow} ring-1 ring-${config.activeBorder}`
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-900 border border-slate-700' : 'bg-slate-800/80'}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                      {config.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{config.subtitle}</p>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className={`w-4 h-4 ${config.accentColor} shrink-0 mt-1`} />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-1" />
                )}
              </div>

              {!compact && (
                <p className="mt-3 text-xs text-slate-300/80 leading-relaxed border-t border-slate-800/60 pt-2.5">
                  {config.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
