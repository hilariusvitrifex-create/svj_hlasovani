
import React from 'react';

interface HeaderProps {
  presentCount: number;
  totalCount: number;
  totalShare: number;
  onReset: () => void;
  isSyncing?: boolean;
  isVotingMode?: boolean;
  onToggleVoting?: () => void;
  voteStats?: {
    pro: number;
    against: number;
    abstain: number;
  };
}

const Header: React.FC<HeaderProps> = ({ 
  presentCount, 
  totalCount, 
  totalShare, 
  onReset, 
  isSyncing,
  isVotingMode,
  onToggleVoting,
  voteStats
}) => {
  const isQuorumMet = totalShare > 50;
  const progressPercent = Math.min(totalShare, 100);

  const formatShare = (val: number) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);

  const formattedTotalShare = formatShare(totalShare);

  return (
    <header className="sticky top-0 z-[60] bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg relative">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {isSyncing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-ping"></div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
              SVJ Prezence <span className="text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-sm">v2.8</span>
              {isSyncing && (
                <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full animate-pulse border border-indigo-100">
                  Ukládám...
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shromáždění vlastníků</p>
          </div>
          
          <button 
            onClick={onReset}
            className="lg:hidden p-2 text-red-600 bg-red-50 rounded-lg active:scale-95"
            title="Resetovat vše"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 md:gap-6 w-full lg:w-auto">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Účastníci</p>
            <p className="text-lg font-bold text-slate-800">{presentCount} <span className="text-slate-300">/</span> {totalCount}</p>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[120px]">
            <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-tighter">
              <span className={isQuorumMet ? 'text-emerald-600' : 'text-slate-400'}>{formattedTotalShare}%</span>
              <span className="text-slate-300">Cíl: 50%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 ease-out ${isQuorumMet ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex flex-col justify-center min-w-[100px] ${
            isQuorumMet ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
          }`}>
            <p className={`text-[10px] font-black uppercase text-center ${isQuorumMet ? 'text-emerald-600' : 'text-red-600'}`}>
              Usnášeníschopnost
            </p>
            <p className={`text-xs font-black text-center uppercase ${isQuorumMet ? 'text-emerald-700' : 'text-red-700'}`}>
              {isQuorumMet ? 'ANO' : 'NE'}
            </p>
          </div>

          {onToggleVoting && (
            <button
              onClick={onToggleVoting}
              className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl border-2 transition-all min-w-[240px] relative overflow-hidden ${
                isVotingMode 
                  ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-100 shadow-2xl scale-105' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${isVotingMode ? 'bg-indigo-600' : 'bg-transparent'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${isVotingMode ? 'text-indigo-700' : 'text-slate-400'}`}>
                {isVotingMode ? '● Probíhá hlasování' : 'Režim hlasování'}
              </span>
              <div className="flex gap-4 text-[9px] font-bold">
                <div className="flex flex-col items-center">
                  <span className="text-emerald-600">PRO</span>
                  <span className="text-slate-500 whitespace-nowrap">
                    {totalShare > 0 ? formatShare((voteStats?.pro || 0) / totalShare * 100) : '0'}% / {formatShare(voteStats?.pro || 0)}%
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-red-600">PROTI</span>
                  <span className="text-slate-500 whitespace-nowrap">
                    {totalShare > 0 ? formatShare((voteStats?.against || 0) / totalShare * 100) : '0'}% / {formatShare(voteStats?.against || 0)}%
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-amber-600">ZDRŽEL</span>
                  <span className="text-slate-500 whitespace-nowrap">
                    {totalShare > 0 ? formatShare((voteStats?.abstain || 0) / totalShare * 100) : '0'}% / {formatShare(voteStats?.abstain || 0)}%
                  </span>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={onReset}
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-sm shadow-md shadow-red-100 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Resetovat
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
