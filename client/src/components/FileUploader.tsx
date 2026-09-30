import React, { useState, useRef } from 'react';
import { uploadFileApi, ingestFileApi } from '../lib/api.js';
import { UploadCloud, FileText, Music, Video, Image, CheckCircle, AlertCircle, Loader2, Sparkles, FolderUp } from 'lucide-react';

interface FileUploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'ingesting' | 'completed' | 'error';
  errorMessage?: string;
  fileId?: string;
  chunksCount?: number;
}

interface FileUploaderProps {
  onIngestionComplete?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onIngestionComplete }) => {
  const [tasks, setTasks] = useState<FileUploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getModalityIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.mp3') || lower.endsWith('.wav')) return <Music className="w-5 h-5 text-amber-400" />;
    if (lower.endsWith('.mp4')) return <Video className="w-5 h-5 text-purple-400" />;
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return <Image className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-sky-400" />;
  };

  const handleFilesSelected = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const newTasks: FileUploadTask[] = Array.from(filesList).map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'queued'
    }));

    setTasks(prev => [...prev, ...newTasks]);

    // Process tasks sequentially or in parallel
    newTasks.forEach(task => processTask(task));
  };

  const processTask = async (task: FileUploadTask) => {
    try {
      // 1. Upload stage
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t));

      const uploadResult = await uploadFileApi(task.file, (percent) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: percent } : t));
      });

      const fileId = uploadResult.file.id;

      // 2. Ingestion & Vectorization stage
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'ingesting', fileId } : t));

      const ingestResult = await ingestFileApi(fileId);

      // 3. Completed stage
      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        status: 'completed',
        chunksCount: ingestResult.chunksCount,
        progress: 100
      } : t));

      if (onIngestionComplete) {
        onIngestionComplete();
      }
    } catch (err: any) {
      console.error('Task error:', err);
      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        status: 'error',
        errorMessage: err.message || 'Processing failed'
      } : t));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  // Helper to load sample files for immediate testing
  const loadDemoCrossModalBundle = async (domain: 'Agriculture' | 'Healthcare' | 'Education') => {
    let sampleFiles: { name: string; type: string; content: string }[] = [];

    if (domain === 'Agriculture') {
      sampleFiles = [
        {
          name: 'farmer_voice_memo_sector4.mp3',
          type: 'audio/mp3',
          content: 'Farmer Voice Audio Stream: Observed distinct leaf yellowing and chlorosis along the leaf midribs in the north corn quadrant. Moisture sensor indicates poor drainage after excessive irrigation.'
        },
        {
          name: 'soil_laboratory_sensor_report.pdf',
          type: 'application/pdf',
          content: 'Agronomy Soil Lab Report: Nitrate-Nitrogen (NO3-N) measured at 8 ppm (Severely deficient, optimal 25-40 ppm). Soil pH 6.4. Electrical conductivity 1.2 dS/m.'
        },
        {
          name: 'drone_aerial_canopy_inspection.jpg',
          type: 'image/jpeg',
          content: 'Drone Multispectral Imagery: Sector 4 shows canopy NDVI index drop to 0.32 with visible yellow chlorotic banding across rows 12 through 18.'
        }
      ];
    } else if (domain === 'Healthcare') {
      sampleFiles = [
        {
          name: 'physician_dictation_notes.wav',
          type: 'audio/wav',
          content: 'Clinical Audio Memo: 45-year-old patient complaining of episodic fatigue and mild exertional dyspnea over the last month. Vital signs stable, heart sounds regular.'
        },
        {
          name: 'complete_blood_count_pathology.pdf',
          type: 'application/pdf',
          content: 'Pathology Blood Report: Hemoglobin 10.8 g/dL (Low). Serum Ferritin 14 ng/mL (Low). MCV 72 fL (Low). Diagnosis: Moderate microcytic hypochromic iron-deficiency anemia.'
        }
      ];
    } else {
      sampleFiles = [
        {
          name: 'cs_lecture_recording.mp4',
          type: 'video/mp4',
          content: 'Lecture Audio/Video: Analysis of asymptotic time complexities. Explaining why quicksort degrades to O(n^2) on already sorted partitions without randomized pivots.'
        },
        {
          name: 'algorithms_handout_notes.pdf',
          type: 'application/pdf',
          content: 'Course Handout Page 14: Formal proof and recurrence relation for divide-and-conquer partition schemes. T(n) = 2T(n/2) + O(n).'
        }
      ];
    }

    const files = sampleFiles.map(s => {
      const blob = new Blob([s.content], { type: s.type });
      return new File([blob], s.name, { type: s.type });
    });

    const newTasks: FileUploadTask[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'queued'
    }));

    setTasks(prev => [...prev, ...newTasks]);
    newTasks.forEach(task => processTask(task));
  };

  return (
    <div className="w-full space-y-6">
      {/* Drag & Drop Area */}
      <div
        id="drop-zone"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-brand-500 bg-brand-950/30 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.mp3,.mp4,.wav,.jpg,.jpeg,.png,.txt"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
          <FolderUp className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-100">
          Drop multimodal files here or <span className="text-brand-400 hover:underline">browse</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Upload PDF documents, MP3/WAV audio notes, MP4 videos, and JPG/PNG imagery simultaneously. Max payload 50MB per file.
        </p>

        {/* Formats badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
            <FileText className="w-3 h-3 text-sky-400" /> PDF / Docs
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
            <Music className="w-3 h-3 text-amber-400" /> MP3 / WAV
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
            <Video className="w-3 h-3 text-purple-400" /> MP4 Video
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
            <Image className="w-3 h-3 text-emerald-400" /> JPG / PNG
          </span>
        </div>
      </div>

      {/* Preset Demo Bundles */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Load Ready-to-Test Cross-Modal Bundles</span>
          </span>
          <span className="text-[11px] text-slate-500">Instant multi-file ingest for testing</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => loadDemoCrossModalBundle('Agriculture')}
            className="p-2.5 rounded-lg bg-slate-900 border border-emerald-900/40 hover:border-emerald-500/60 hover:bg-emerald-950/20 text-left transition-all group"
          >
            <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
              🌾 Agriculture Bundle
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Farmer Audio + Soil PDF + Drone Photo
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCrossModalBundle('Healthcare')}
            className="p-2.5 rounded-lg bg-slate-900 border border-rose-900/40 hover:border-rose-500/60 hover:bg-rose-950/20 text-left transition-all group"
          >
            <div className="text-xs font-semibold text-rose-300 group-hover:text-rose-200">
              🩺 Healthcare Bundle
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Doctor Memo WAV + Blood CBC Lab PDF
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoCrossModalBundle('Education')}
            className="p-2.5 rounded-lg bg-slate-900 border border-indigo-900/40 hover:border-indigo-500/60 hover:bg-indigo-950/20 text-left transition-all group"
          >
            <div className="text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
              🎓 Education Bundle
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Lecture MP4 + Course Handout PDF
            </div>
          </button>
        </div>
      </div>

      {/* Upload Tasks Status Queue */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ingestion Pipeline Status ({tasks.length} {tasks.length === 1 ? 'file' : 'files'})
          </h4>

          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            {tasks.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800">
                    {getModalityIcon(task.file.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
                      {task.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(task.file.size / 1024).toFixed(1)} KB &bull; {task.file.type || 'Binary Document'}
                    </p>
                  </div>
                </div>

                {/* Progress / Status */}
                <div className="flex items-center gap-3 shrink-0">
                  {task.status === 'uploading' && (
                    <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading {task.progress}%</span>
                    </div>
                  )}

                  {task.status === 'ingesting' && (
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing & Vectorizing...</span>
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                      <CheckCircle className="w-4 h-4" />
                      <span>Indexed ({task.chunksCount || 2} chunks)</span>
                    </div>
                  )}

                  {task.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800">
                      <AlertCircle className="w-4 h-4" />
                      <span>{task.errorMessage || 'Failed'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
