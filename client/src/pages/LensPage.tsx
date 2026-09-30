import React, { useState } from 'react';
import { DomainLens, Citation } from '../types/index.js';
import { Navbar } from '../components/Navbar.js';
import { LensSelector, LENS_CONFIGS } from '../components/LensSelector.js';
import { ChatInterface } from '../components/ChatInterface.js';
import { SourceViewerModal } from '../components/SourceViewerModal.js';
import { Sparkles, Shield, Cpu, HelpCircle, FileCheck } from 'lucide-react';

interface LensPageProps {
  lensType: DomainLens;
  onSelectLens: (lens: DomainLens) => void;
  navigate: (route: string) => void;
}

export const LensPage: React.FC<LensPageProps> = ({ lensType, onSelectLens, navigate }) => {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [showDomainDetails, setShowDomainDetails] = useState(false);

  const currentConfig = LENS_CONFIGS[lensType];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar currentRoute={`/lens/${lensType}`} navigate={navigate} activeLens={lensType} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Domain Lens Selection Bar */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <LensSelector
            selectedLens={lensType}
            onSelectLens={(lens) => onSelectLens(lens)}
            compact={false}
          />
        </div>

        {/* Workspace Layout: Chat Interface & Domain Intel Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Reasoning Chat Interface (lg:col-span-8 or 9) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Live Reasoning Engine Active
                </span>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Model: Gemini 1.5 Pro &bull; Embeddings: 768-D pgvector
              </div>
            </div>

            <ChatInterface
              activeLens={lensType}
              onCitationClick={(citation) => setActiveCitation(citation)}
            />
          </div>

          {/* Sidebar Domain Context Intel (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Active Lens Architecture Card */}
            <div className={`p-5 rounded-2xl border ${currentConfig.activeBorder} ${currentConfig.activeBg} glass-panel shadow-xl`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  {currentConfig.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{currentConfig.title}</h3>
                  <p className="text-[11px] text-slate-400">{currentConfig.subtitle}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {currentConfig.description}
              </p>

              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Citation Formats</span>
                  <span className="font-semibold text-slate-200">
                    {lensType === 'Education' ? 'Page #, MM:SS' : lensType === 'Healthcare' ? 'Lab Ref, MM:SS' : 'Sector #, Page #, MM:SS'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Modality Synthesis</span>
                  <span className="font-semibold text-emerald-400">Cross-Referenced</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Hallucination Guard</span>
                  <span className="font-semibold text-brand-400">Ground-Truth Only</span>
                </div>
              </div>
            </div>

            {/* Citations & Source Evidence Guide */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <FileCheck className="w-4 h-4 text-brand-400" />
                <span>How Citation Trails Work</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Every claim synthesized by Unify is backed by an embedded chunk from the unified vector space. Click any inline citation pill to inspect:
              </p>
              <ul className="space-y-1.5 text-slate-300 list-disc ml-4">
                <li><strong className="text-white">Audio & Video</strong>: Auto-seeks to exact timestamp.</li>
                <li><strong className="text-white">Documents & PDFs</strong>: Jumps directly to cited page.</li>
                <li><strong className="text-white">Images & Drone Scans</strong>: Highlights spatial sector.</li>
              </ul>
            </div>

            {/* Quick Ingest Navigation Helper */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-200">Need more multimodal files?</p>
                <p className="text-slate-500 text-[11px]">Upload audio, drone photos, or PDFs</p>
              </div>
              <button
                onClick={() => navigate('/ingest')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 font-medium text-xs transition-colors"
              >
                Upload Files
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Source Evidence Modal */}
      <SourceViewerModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};
