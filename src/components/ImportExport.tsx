
import React, { useRef, useState } from 'react';
import { Unit } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface ImportExportProps {
  onImport: (units: Unit[]) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  onFetchFromMake: () => Promise<void>;
  onSyncAll: () => Promise<void>;
  onReset: () => void;
  isFetching: boolean;
  isSyncing: boolean;
  fetchError: {message: string, raw?: string} | null;
}

const ImportExport: React.FC<ImportExportProps> = ({ 
  onImport, 
  webhookUrl,
  onWebhookUrlChange,
  onFetchFromMake,
  onSyncAll,
  onReset,
  isFetching,
  isSyncing,
  fetchError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAiAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    setLocalError(null);
    try {
      const base64Data = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Extrahuj data SVJ do JSON pole objektů (unitNumber, ownerName, share, block)." },
            { inlineData: { mimeType: file.type, data: base64Data } },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unitNumber: { type: Type.STRING },
                ownerName: { type: Type.STRING },
                share: { type: Type.NUMBER },
                block: { type: Type.STRING },
              },
              required: ["unitNumber", "ownerName", "share", "block"],
            },
          },
        },
      });
      const parsed = JSON.parse(response.text || "[]");
      if (parsed.length > 0) {
        onImport(parsed.map((u: any, i: number) => ({
          ...u, 
          id: Date.now() + i, 
          originalOwnerName: u.ownerName, // Baseline for AI import
          isPresent: false, 
          hasPowerOfAttorney: false
        })));
      } else {
        setLocalError('Z dokumentu se nepodařilo vyčíst žádná data.');
      }
    } catch (err) {
      setLocalError('AI analýza selhala.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800">Synchronizace tabulky</h3>
          </div>
          <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065z" />
            </svg>
          </button>
        </div>

        {showConfig && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Webhook URL</label>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => onWebhookUrlChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-mono"
              placeholder="https://hook.eu1.make.com/..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onFetchFromMake}
            disabled={isFetching}
            className={`py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2
              ${isFetching ? 'bg-indigo-50 text-indigo-300 border-indigo-100' : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'}
            `}
          >
            {isFetching ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
            Načíst z tabulky
          </button>

          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className={`py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg
              ${isSyncing ? 'bg-emerald-200 text-emerald-400 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}
            `}
          >
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            Uložit do tabulky
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Resetovat celou prezenci
        </button>

        {fetchError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600">
             <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tight">Chyba synchronizace</span>
              <span className="text-[10px] leading-tight">{fetchError.message}</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button onClick={() => aiFileInputRef.current?.click()} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              {isAnalyzing ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            </div>
            <span className="text-[9px] font-black uppercase text-slate-700 leading-tight">AI Analýza dokumentu</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left">
            <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase text-slate-700 leading-tight">Import z lokálního CSV</span>
          </button>
        </div>

        <input type="file" ref={aiFileInputRef} onChange={handleAiAnalysis} accept="image/*,.pdf" className="hidden" />
        <input type="file" ref={fileInputRef} onChange={(e) => {}} accept=".csv" className="hidden" />
      </div>
    </div>
  );
};

export default ImportExport;
