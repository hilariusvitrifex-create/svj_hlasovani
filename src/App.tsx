
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import UnitButton from './components/UnitButton';
import ImportExport from './components/ImportExport';
import ExportResults from './components/ExportResults';
import EditUnitModal from './components/EditUnitModal';
import { MOCK_UNITS } from './app-constants';
import { Unit } from './app-types';

const App: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('svj_webhook_url') || 'https://hook.eu1.make.com/irmxkqwf1uum9wh6cwwm2efbume8erwf';
  });

  const [stateVersion, setStateVersion] = useState(0);

  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const saved = localStorage.getItem('svj_attendance_v3');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: Unit) => ({
            ...u,
            originalOwnerName: u.originalOwnerName || u.ownerName,
            // Tyto hodnoty synchronizujeme s lokálním stavem
            lastSyncedIsPresent: u.lastSyncedIsPresent ?? u.isPresent,
            lastSyncedHasPowerOfAttorney: u.lastSyncedHasPowerOfAttorney ?? u.hasPowerOfAttorney
          }));
        }
      }
      return MOCK_UNITS;
    } catch (e) {
      return MOCK_UNITS;
    }
  });

  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVotingMode, setIsVotingMode] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [fetchError, setFetchError] = useState<{message: string, raw?: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('svj_attendance_v3', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('svj_webhook_url', webhookUrl);
  }, [webhookUrl]);

  const cleanStr = (str: string) => 
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

  const findValue = (item: any, possibleKeys: string[]) => {
    if (!item || typeof item !== 'object') return undefined;
    for (const key of possibleKeys) {
      if (item[key] !== undefined) return item[key];
    }
    const cleanedPossibles = possibleKeys.map(cleanStr);
    const itemKeys = Object.keys(item);
    for (const key of itemKeys) {
      if (cleanedPossibles.includes(cleanStr(key))) return item[key];
    }
    return undefined;
  };

  const syncAllToCloud = async () => {
    if (!webhookUrl) {
        alert("Není nastavena Webhook URL.");
        return;
    }

    // NOVĚ: Synchronizaci spouští pouze změna jména vlastníka.
    // Prezence a PM se do cloudu neukládají, tedy změna v nich nevyvolá potřebu syncu s tabulkou.
    const modifiedUnits = units.filter(u => 
      u.ownerName !== (u.originalOwnerName || u.ownerName)
    );

    if (modifiedUnits.length === 0) {
      alert("Žádné změny jmen k odeslání.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const payload = {
        action: 'export_all', 
        timestamp: new Date().toISOString(),
        units: modifiedUnits.map(u => {
          const numericId = typeof u.id === 'number' ? u.id : parseInt(String(u.id).replace(/\D/g, '')) || 0;
          return {
            ID: numericId,
            RowNumber: numericId + 1, 
            Vchod: u.block,
            Jednotka: u.unitNumber,
            Vlastník: u.ownerName,
            Vlastnik: u.ownerName
            // Pole Prezence a PM byla odstraněna z payloadu
          };
        })
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setUnits(prev => prev.map(u => {
          const matchedModified = modifiedUnits.find(m => m.id === u.id);
          if (matchedModified) {
            return {
              ...u,
              originalOwnerName: u.ownerName
              // lastSynced pro prezenci zde neaktualizujeme, protože se nesynchronizovala
            };
          }
          return u;
        }));
        alert(`Úspěšně uloženo změn jmen: ${modifiedUnits.length}`);
      } else {
        const errText = await response.text();
        throw new Error(`Server vrátil chybu ${response.status}: ${errText}`);
      }
    } catch (error: any) {
      alert('Chyba při ukládání: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetAttendance = useCallback(() => {
    setUnits(prev => prev.map(u => ({ 
      ...u, 
      isPresent: false, 
      hasPowerOfAttorney: false,
      vote: null
    })));
    setIsVotingMode(false);
    setStateVersion(v => v + 1);
  }, []);

  const toggleVotingMode = useCallback(() => {
    setIsVotingMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Set all present units to PRO by default
        setUnits(units => units.map(u => ({
          ...u,
          vote: u.isPresent ? 'PRO' : null
        })));
      } else {
        // Reset all votes
        setUnits(units => units.map(u => ({
          ...u,
          vote: null
        })));
      }
      return newMode;
    });
    setStateVersion(v => v + 1);
  }, []);

  const handleVoteCycle = useCallback((unitId: string | number) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId && u.isPresent) {
        let nextVote: Unit['vote'] = 'PRO';
        if (u.vote === 'PRO') nextVote = 'PROTI';
        else if (u.vote === 'PROTI') nextVote = 'ZDRŽEL';
        else if (u.vote === 'ZDRŽEL') nextVote = 'PRO';
        return { ...u, vote: nextVote };
      }
      return u;
    }));
    setStateVersion(v => v + 1);
  }, []);

  const fetchFromMake = async () => {
    if (!webhookUrl) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_all', _t: Date.now() })
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { 
        setFetchError({ message: 'Neplatná JSON odpověď z Make.com.', raw: text.substring(0, 100) }); 
        return; 
      }
      
      const findArray = (o: any, d=0): any[] | null => {
        if (d > 5) return null;
        if (Array.isArray(o)) return o;
        if (!o || typeof o !== 'object') return null;
        for (let k in o) {
          const res = findArray(o[k], d+1);
          if (res) return res;
        }
        return null;
      };

      const rawArray = findArray(data);
      if (!rawArray) { 
        setFetchError({ message: 'V datech nebyl nalezen žádný seznam řádků.', raw: '' }); 
        return; 
      }

      const formatted = rawArray.map((item: any, index: number) => {
        const isTrue = (v: any) => {
          if (v === undefined || v === null || v === 'empty') return false;
          const s = String(v).trim().toUpperCase();
          return ['TRUE', 'ANO', 'YES', '1', 'PŘÍTOMEN', 'PRITOMEN'].includes(s);
        };
        
        const parseNum = (v: any) => {
          if (typeof v === 'number') return v;
          if (!v || v === 'empty') return 0;
          return parseFloat(String(v).replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
        };

        const idVal = findValue(item, ['0', 'id', 'ID']);
        const rowId = (idVal !== undefined) ? parseNum(idVal) : (index + 1);
        const ownerName = String(findValue(item, ['3', 'vlastnik', 'Vlastník', 'D']) || 'Neznámý');
        
        // Pokud sloupce v tabulce nejsou, findValue vrátí undefined a isTrue vrátí false.
        // Tím je zajištěno, že import nepadá při chybějících datech prezence.
        const isPresent = isTrue(findValue(item, ['5', 'prezence', 'Prezence', 'F']));
        const hasPM = isTrue(findValue(item, ['6', 'pm', 'PM', 'G']));

        return {
          id: rowId,
          block: String(findValue(item, ['1', 'vchod', 'Vchod']) || '2262'),
          unitNumber: String(findValue(item, ['2', 'jednotka', 'Jednotka']) || `${index + 1}`),
          ownerName: ownerName,
          originalOwnerName: ownerName,
          share: parseNum(findValue(item, ['4', 'podil', 'Podíl', 'E'])),
          isPresent: isPresent,
          hasPowerOfAttorney: hasPM,
          lastSyncedIsPresent: isPresent,
          lastSyncedHasPowerOfAttorney: hasPM
        };
      });

      setUnits(formatted);
      setStateVersion(v => v + 1);
    } catch (err: any) {
      setFetchError({ message: 'Chyba připojení k Webhooku.', raw: err.message });
    } finally {
      setIsFetching(false);
    }
  };

  const stats = useMemo(() => {
    return units.reduce((acc, unit) => {
      if (unit.isPresent) {
        acc.presentCount += 1;
        acc.totalShare += unit.share;
        
        if (unit.vote === 'PRO') acc.votePro += unit.share;
        else if (unit.vote === 'PROTI') acc.voteAgainst += unit.share;
        else if (unit.vote === 'ZDRŽEL') acc.voteAbstain += unit.share;
      }
      acc.totalCount += 1;
      return acc;
    }, { 
      presentCount: 0, 
      totalCount: 0, 
      totalShare: 0,
      votePro: 0,
      voteAgainst: 0,
      voteAbstain: 0
    });
  }, [units]);

  const blocks = Array.from(new Set(units.map(u => u.block))).sort();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header 
        presentCount={stats.presentCount} 
        totalCount={stats.totalCount} 
        totalShare={stats.totalShare} 
        onReset={handleResetAttendance}
        isSyncing={isSyncing}
        isVotingMode={isVotingMode}
        onToggleVoting={toggleVotingMode}
        voteStats={{
          pro: stats.votePro,
          against: stats.voteAgainst,
          abstain: stats.voteAbstain
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {blocks.map(block => {
            const blockUnits = units.filter(u => u.block === block);
            return (
              <section key={block} className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                    Vchod {block}
                  </h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {blockUnits.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {blockUnits.map(unit => (
                    <UnitButton
                      key={`${unit.id}-v${stateVersion}`}
                      unit={unit}
                      isVotingMode={isVotingMode}
                      onToggle={() => {
                        if (isVotingMode) {
                          handleVoteCycle(unit.id);
                        } else {
                          setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, isPresent: !u.isPresent } : u));
                        }
                      }}
                      onTogglePM={() => {
                        setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, hasPowerOfAttorney: !u.hasPowerOfAttorney } : u));
                      }}
                      onEdit={() => setEditingUnit(unit)}
                      onVoteCycle={() => handleVoteCycle(unit.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-20 pt-12 border-t border-slate-200 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ImportExport 
              onImport={(u) => { setUnits(u); setStateVersion(v => v + 1); }} 
              webhookUrl={webhookUrl}
              onWebhookUrlChange={setWebhookUrl} 
              onFetchFromMake={fetchFromMake}
              onSyncAll={syncAllToCloud}
              onReset={handleResetAttendance}
              isFetching={isFetching}
              isSyncing={isSyncing}
              fetchError={fetchError}
            />
            <ExportResults units={units} stats={stats} />
          </div>
        </div>
      </main>

      {editingUnit && (
        <EditUnitModal 
          unit={editingUnit} 
          onClose={() => setEditingUnit(null)} 
          onSave={(updated) => {
            setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
            setEditingUnit(null);
          }}
        />
      )}
      
      <footer className="bg-slate-100 border-t border-slate-200 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} SVJ Prezence • SYNCHRONIZACE PŘES MAKE.COM</p>
      </footer>
    </div>
  );
};

export default App;
