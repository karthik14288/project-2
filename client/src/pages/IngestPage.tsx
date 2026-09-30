import React from 'react';
import { DomainLens } from '../types/index.js';
import { Navbar } from '../components/Navbar.js';
import { FileUploader } from '../components/FileUploader.js';
import { ArrowRight, Database, FileText, Cpu, CheckCircle2 } from 'lucide-react';

interface IngestPageProps {
  navigate: (route: string) => void;
  activeLens: DomainLens;
}

export const IngestPage: React.FC<IngestPageProps> = ({ navigate, activeLens }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar currentRoute="/ingest" navigate={navigate} activeLens={activeLens} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Outfit']">
              Multimodal Ingestion Pipeline
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Transform unstructured PDFs, audio notes, video recordings, and drone/pathology images into an embedded vector index.
            </p>
          </div>

          <button
            onClick={() => navigate(`/lens/${activeLens}`)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
          >
            <span>Reasoning Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Technical Pipeline Infographic Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0 font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-slate-200">Native Ingestion</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF, Audio, Video, & Scans uploaded to Supabase Storage</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-slate-200">Gemini Parsing</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Multimodal AI extracts text, OCR, and audio timestamps</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center shrink-0 font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-slate-200">768-D Vectors</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Gemini text-embedding-004 embeds into unified vector space</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              4
            </div>
            <div>
              <p className="font-semibold text-slate-200">pgvector Index</p>
              <p className="text-[11px] text-slate-400 mt-0.5">HNSW index enables instant cross-modal similarity search</p>
            </div>
          </div>
        </div>

        {/* Multi-file uploader component */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
          <FileUploader onIngestionComplete={() => {}} />
        </div>

        {/* Database & Security Specs Callout */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Database: Supabase PostgreSQL with <code className="text-brand-300">pgvector (768)</code> & HNSW cosine index</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Isolated per authenticated user via PostgreSQL RLS</span>
          </div>
        </div>
      </main>
    </div>
  );
};
