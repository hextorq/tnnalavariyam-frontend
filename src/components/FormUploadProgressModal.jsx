import { CheckCircle2, FileText, ImageIcon, LoaderCircle, ShieldCheck, Upload } from 'lucide-react'

export default function FormUploadProgressModal({
  isOpen,
  title = 'Form Submission / விண்ணப்ப சமர்ப்பிப்பு',
  subtitle = 'Uploading attachments & processing government record',
  progress = 0,
  currentStageIndex = 0,
  stages = [
    { title: 'Validating & Compressing Files', tamil: 'கோப்புகள் சரிபார்க்கப்படுகிறது' },
    { title: 'Encrypting Document Payloads', tamil: 'ஆவணங்கள் தயார் செய்யப்படுகிறது' },
    { title: 'Transmitting Data & Images to Server', tamil: 'தரவு சேவையகத்திற்கு அனுப்பப்படுகிறது' },
    { title: 'Finalizing Application & Application No', tamil: 'விண்ணப்ப எண் உருவாக்கப்படுகிறது' },
  ],
  uploadedFiles = [],
}) {
  if (!isOpen) return null

  const currentStage = stages[currentStageIndex] || stages[0]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#007cba] ring-8 ring-[#eef8ff]/60">
              <Upload className="animate-bounce" size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Live Upload Progress</p>
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007cba] px-3.5 py-1.5 text-sm font-black text-white shadow-md">
            <LoaderCircle className="animate-spin" size={16} />
            <span>{Math.min(100, Math.round(progress))}%</span>
          </span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Overall Progress</span>
            <span className="text-[#007cba]">{Math.min(100, Math.round(progress))}% Completed</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#007cba] via-blue-500 to-emerald-500 transition-all duration-300 shadow-sm"
              style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        {/* Current Background Action Message Box */}
        <div className="mt-5 rounded-2xl border border-blue-200 bg-[#eef8ff] p-4 text-slate-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-3 shrink-0 rounded-full bg-[#007cba] animate-ping" />
            <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Current Background Activity</p>
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-950">
            {currentStage.title}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-600">
            {currentStage.tamil}
          </p>
        </div>

        {/* Step-by-Step Stages Checklist */}
        <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Processing Stages</p>
          {stages.map((stage, idx) => {
            const isDone = idx < currentStageIndex || progress >= 100
            const isCurrent = idx === currentStageIndex && progress < 100

            return (
              <div
                key={stage.title}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                  isDone
                    ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200'
                    : isCurrent
                    ? 'bg-white text-[#007cba] font-bold shadow-xs border border-blue-200'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isDone ? (
                    <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                  ) : isCurrent ? (
                    <LoaderCircle className="shrink-0 animate-spin text-[#007cba]" size={16} />
                  ) : (
                    <span className="size-4 shrink-0 rounded-full border border-slate-300" />
                  )}
                  <span className="truncate">{stage.title}</span>
                </div>
                <span className="text-[11px] font-normal text-slate-500 shrink-0 ml-2">{stage.tamil}</span>
              </div>
            )
          })}
        </div>

        {/* Individual File Status Cards Grid (if file items provided) */}
        {uploadedFiles.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Processing Queue ({uploadedFiles.length} attachments)</p>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 max-h-36 overflow-y-auto pr-1">
              {uploadedFiles.map((file) => (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs" key={file.label}>
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="text-[#007cba] shrink-0" size={14} />
                    <span className="font-semibold text-slate-800 truncate">{file.label}</span>
                  </div>
                  {file.status === 'completed' || progress >= 60 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                      <LoaderCircle className="animate-spin" size={12} /> Processing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Warning */}
        <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs font-semibold text-amber-900">
          <ShieldCheck className="shrink-0 text-amber-700" size={18} />
          <span>⚠️ Please do not close or refresh this tab while documents are being uploaded. / தயவுசெய்து இந்த பக்கத்தை மூட வேண்டாம்.</span>
        </div>
      </div>
    </div>
  )
}
