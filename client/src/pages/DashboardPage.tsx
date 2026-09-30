import React, { useEffect, useState } from 'react';
import { FileItem, DomainLens } from '../types/index.js';
import { fetchUserFilesApi, deleteUserFileApi } from '../lib/api.js';
import { Navbar } from '../components/Navbar.js';
import { 
  FileText, Music, Video, Image as ImageIcon, UploadCloud, Cpu, Trash2, 
  ExternalLink, Layers, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (route: string) => void;
  activeLens: DomainLens;
  setActiveLens: (lens: DomainLens) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
  activeLens,
  setActiveLens
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserFilesApi();
      setFiles(data);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      setError(err.message || 'Failed to fetch uploaded files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${fileName}" and all its vector embeddings?`)) {
      return;
    }

    try {
      await deleteUserFileApi(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      alert(`Could not delete file: ${err.message}`);
    }
  };

  // Modality stats breakdown
  const stats = {
    total: files.length,
    audio: files.filter(f => f.file_type.startsWith('audio/') || f.file_name.endsWith('.mp3') || f.file_name.endsWith('.wav')).length,
    video: files.filter(f => f.file_type.startsWith('video/') || f.file_name.endsWith('.mp4')).length,
    images: files.filter(f => f.file_type.startsWith('image/') || f.file_name.endsWith('.jpg') || f.file_name.endsWith('.png')).length,
    docs: files.filter(f => f.file_type === 'application/pdf' || f.file_name.endsWith('.pdf') || f.file_name.endsWith('.txt')).length,
    chunks: files.reduce((acc, f) => acc + (f.chunks_count || 2), 0)
  };

  const getFileIcon = (file: FileItem) => {
    const lower = (file.file_name + ' ' + file.file_type).toLowerCase();
    if (lower.includes('audio') || lower.endsWith('.mp3') || lower.endsWith('.wav')) {
      return <Music className="w-5 h-5 text-amber-400" />;
    }
    if (lower.includes('video') || lower.endsWith('.mp4')) {
      return <Video className="w-5 h-5 text-purple-400" />;
    }
    if (lower.includes('image') || lower.endsWith('.jpg') || lower.endsWith('.png')) {
      return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    }
    return <FileText className="w-5 h-5 text-sky-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar currentRoute="/dashboard" navigate={navigate} activeLens={activeLens} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Workspace Hero Banner */}
        <div className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-900/40 shadow-xl overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Cross-Modal Knowledge Store</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Outfit']">
              Cross-Modal Workspace
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              All ingested files across audio transcripts, documents, images, and video frames share a unified 768-dimensional vector index for multi-modal reasoning.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                id="btn-goto-ingest"
                onClick={() => navigate('/ingest')}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Ingest New Media</span>
              </button>

              <button
                id="btn-goto-lens"
                onClick={() => navigate(`/lens/${activeLens}`)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-brand-400" />
                <span>Open Reasoning Studio ({activeLens})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Files</span>
              <Layers className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Vector Chunks</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-300 mt-2">{stats.chunks}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>PDF Docs</span>
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-sky-300 mt-2">{stats.docs}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Audio Memos</span>
              <Music className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300 mt-2">{stats.audio}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Video Streams</span>
              <Video className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-300 mt-2">{stats.video}</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Imagery / OCR</span>
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-300 mt-2">{stats.images}</p>
          </div>
        </div>

        {/* Files Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">Ingested Multimodal Datasets</h2>
              <p className="text-xs text-slate-400">Indexed in Supabase pgvector with timestamp and page metadata</p>
            </div>

            <button
              onClick={loadFiles}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh files"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-xs text-slate-400">Fetching unified index records...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
                <UploadCloud className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">No multimodal files uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                Ingest audio recordings, drone images, or PDF reports to start reasoning across them simultaneously.
              </p>
              <button
                onClick={() => navigate('/ingest')}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-600/25 transition-all"
              >
                Upload First File
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Document / Media</th>
                      <th className="py-3.5 px-4">Format</th>
                      <th className="py-3.5 px-4">Indexed Chunks</th>
                      <th className="py-3.5 px-4">Ingested At</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                              {getFileIcon(file)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-100 truncate max-w-xs sm:max-w-md">
                                {file.file_name}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
                                {file.storage_path}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                            {file.file_type || 'binary'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                            <Sparkles className="w-3 h-3" />
                            {file.chunks_count || 2} chunks
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Recent'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Open raw media"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              onClick={() => handleDelete(file.id, file.file_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                              title="Delete file & vectors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
