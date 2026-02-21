
import React, { useState, useEffect } from 'react';
import { Unit } from '../types.ts';

interface EditUnitModalProps {
  unit: Unit;
  onClose: () => void;
  onSave: (unit: Unit) => void;
}

const EditUnitModal: React.FC<EditUnitModalProps> = ({ unit, onClose, onSave }) => {
  const [ownerName, setOwnerName] = useState(unit.ownerName);

  useEffect(() => {
    setOwnerName(unit.ownerName);
  }, [unit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...unit,
      ownerName: ownerName
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upravit jednotku</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit.unitNumber} • Vchod {unit.block}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Vlastník / Uživatel</label>
              <input
                type="text"
                autoFocus
                value={ownerName}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Zadejte jméno vlastníka"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-800"
                required
              />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
              >
                Uložit změny
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUnitModal;
