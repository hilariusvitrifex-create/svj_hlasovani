
import React from 'react';
import { Unit } from '../app-types';

interface UnitButtonProps {
  unit: Unit;
  onToggle: () => void;
  onTogglePM: () => void;
  onEdit: () => void;
  isVotingMode?: boolean;
  onVoteCycle?: () => void;
}

const UnitButton: React.FC<UnitButtonProps> = ({ 
  unit, 
  onToggle, 
  onTogglePM, 
  onEdit, 
  isVotingMode,
  onVoteCycle 
}) => {
  // Striktní kontrola přítomnosti
  const isPresent = unit.isPresent === true;
  const hasPM = unit.hasPowerOfAttorney === true;
  
  // Kontrola, zda byl vlastník upraven
  const isEdited = unit.originalOwnerName !== undefined && unit.ownerName !== unit.originalOwnerName;
  
  const formattedShare = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(unit.share);
  
  const getVoteColor = () => {
    if (unit.vote === 'PRO') return 'bg-emerald-500 text-white border-emerald-400';
    if (unit.vote === 'PROTI') return 'bg-red-500 text-white border-red-400';
    if (unit.vote === 'ZDRŽEL') return 'bg-amber-500 text-white border-amber-400';
    return 'bg-white/20 text-white/60 border-white/20';
  };

  return (
    <div className="relative group">
      <div
        className={`
          w-full px-3 py-2.5 rounded-xl border-2 transition-all duration-100 text-left relative overflow-hidden flex items-center gap-3 cursor-pointer
          ${isPresent 
            ? 'bg-emerald-600 border-emerald-700 shadow-md scale-[1.01] z-10' 
            : 'bg-slate-200 border-slate-300 hover:border-slate-400 hover:bg-slate-300 shadow-sm'
          }
          ${isVotingMode && isPresent ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}
        `}
        onClick={onToggle}
      >
        <div className={`
          flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${isPresent 
            ? 'bg-white border-white text-emerald-600' 
            : 'bg-white border-slate-400 text-transparent'
          }
        `}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isPresent ? 'text-emerald-200' : 'text-slate-500'}`}>
              {unit.unitNumber}
            </span>
            <span className={`text-[9px] font-bold ${isPresent ? 'text-emerald-200' : 'text-slate-400'}`}>
              {formattedShare}%
            </span>
          </div>
          <h3 className={`text-xs font-bold truncate ${isPresent ? 'text-white' : 'text-slate-800'}`}>
            {unit.ownerName}
          </h3>
        </div>

        {isVotingMode && isPresent && (
          <div 
            className={`absolute bottom-2 right-14 px-2 py-1 rounded-lg border-2 font-black text-[10px] transition-all shadow-sm z-30 ${getVoteColor()}`}
            onClick={(e) => {
              e.stopPropagation();
              onVoteCycle?.();
            }}
          >
            {unit.vote || '---'}
          </div>
        )}

        <div 
          className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); onTogglePM(); }}
        >
          <span className={`text-[8px] font-black uppercase ${isPresent ? 'text-white' : 'text-slate-500'}`}>
            PM
          </span>
          <div className={`
            w-3.5 h-3.5 rounded border transition-all flex items-center justify-center
            ${hasPM 
              ? (isPresent ? 'bg-white border-white text-emerald-600' : 'bg-indigo-600 border-indigo-600 text-white')
              : (isPresent ? 'border-emerald-400 bg-emerald-700/30' : 'border-slate-300 bg-white')
            }
          `}>
            {hasPM && (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {!isVotingMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className={`absolute top-1 right-1 p-1 rounded-full border shadow-sm transition-all z-20 scale-0 group-hover:scale-100
            ${isEdited 
              ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 scale-100' // Always visible if edited
              : isPresent 
                ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400' 
                : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'
            }`}
          title={isEdited ? `Původně: ${unit.originalOwnerName}` : "Editovat"}
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UnitButton;
