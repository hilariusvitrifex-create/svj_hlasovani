
import React, { useState } from 'react';
import { Unit } from '../app-types';

interface ExportResultsProps {
  units: Unit[];
  stats: {
    presentCount: number;
    totalCount: number;
    totalShare: number;
    votePro: number;
    voteAgainst: number;
    voteAbstain: number;
  };
}

const ExportResults: React.FC<ExportResultsProps> = ({ units, stats }) => {
  const [showPreview, setShowPreview] = useState(false);

  const exportCSV = () => {
    const headers = ['Vchod', 'Jednotka', 'Vlastnik', 'Podil (%)', 'Pritomen', 'PM'];
    const rows = units.map(u => [
      u.block,
      u.unitNumber,
      u.ownerName,
      u.share.toFixed(2).replace('.', ','),
      u.isPresent ? 'ANO' : 'NE',
      u.hasPowerOfAttorney ? 'ANO' : 'NE'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prezence_svj_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const dateStr = new Date().toLocaleDateString('cs-CZ');
  const quorumText = stats.totalShare > 50 ? 'ANO' : 'NE';
  const quorumColor = stats.totalShare > 50 ? '#059669' : '#dc2626';

  const formatShare = (val: number) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);

  const handlePrint = () => {
    // Create a hidden iframe for printing to isolate styles and avoid layout issues
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const quorumText = stats.totalShare > 50 ? 'ANO' : 'NE';
    const quorumColor = stats.totalShare > 50 ? '#059669' : '#dc2626';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Protokol SVJ</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
          @page { size: A4; margin: 15mm 10mm; }
          body { 
            font-family: 'Inter', sans-serif; 
            color: #1e293b; 
            line-height: 1.4; 
            font-size: 10pt; 
            margin: 0;
            padding: 0;
            background: white;
          }
          .report-header {
            border-bottom: 2px solid #1e293b;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .report-title h1 {
            font-size: 18pt;
            font-weight: 800;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }
          .summary-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
          }
          .summary-item { flex: 1; }
          .summary-label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .summary-value { font-size: 11pt; font-weight: 800; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #94a3b8; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
          td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; }
          
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box { width: 45%; border-top: 1px solid #1e293b; padding-top: 8px; text-align: center; font-size: 8pt; color: #64748b; }
          
          .page-break { page-break-before: always; }
          
          .voting-grid {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
          }
          .vote-res { flex: 1; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; }
          .vote-res.pro { border-left: 5px solid #059669; background: #f0fdf4; }
          .vote-res.against { border-left: 5px solid #dc2626; background: #fef2f2; }
          .vote-res.abstain { border-left: 5px solid #d97706; background: #fffbeb; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">
            <h1>Protokol o účasti</h1>
            <div style="font-size: 8pt; color: #64748b;">Společenství vlastníků jednotek</div>
          </div>
          <div style="font-weight: bold; color: #94a3b8;">Datum: ${dateStr}</div>
        </div>

        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Přítomno jednotek</div>
            <div class="summary-value">${stats.presentCount} / ${stats.totalCount}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Podíl přítomných</div>
            <div class="summary-value">${formatShare(stats.totalShare)} %</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Usnášeníschopnost</div>
            <div class="summary-value" style="color: ${quorumColor}">${quorumText}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Vchod</th>
              <th>Prostor</th>
              <th>Vlastník / Uživatel</th>
              <th style="text-align: right;">Podíl %</th>
              <th style="text-align: center;">Účast</th>
              <th style="text-align: center;">PM</th>
            </tr>
          </thead>
          <tbody>
            ${units.map(u => `
              <tr>
                <td>${u.block}</td>
                <td>${u.unitNumber}</td>
                <td style="font-weight: bold;">${u.ownerName}</td>
                <td style="text-align: right;">${formatShare(u.share)}</td>
                <td style="text-align: center; color: ${u.isPresent ? '#059669' : '#cbd5e1'}; font-weight: ${u.isPresent ? 'bold' : 'normal'}">
                  ${u.isPresent ? 'ANO' : 'NE'}
                </td>
                <td style="text-align: center; color: ${u.hasPowerOfAttorney ? '#4f46e5' : '#cbd5e1'}; font-weight: ${u.hasPowerOfAttorney ? 'bold' : 'normal'}">
                  ${u.hasPowerOfAttorney ? 'ANO' : 'NE'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">Podpis zapisovatele</div>
          <div class="sig-box">Podpis předsedy shromáždění</div>
        </div>

        <div class="page-break"></div>

        <div class="report-header" style="margin-top: 20px;">
          <div class="report-title">
            <h1>Výsledky hlasování</h1>
            <div style="font-size: 8pt; color: #64748b;">Společenství vlastníků jednotek</div>
          </div>
          <div style="font-weight: bold; color: #94a3b8;">Datum: ${dateStr}</div>
        </div>

        <div class="voting-grid">
          <div class="vote-res pro">
            <div class="summary-label">PRO</div>
            <div class="summary-value" style="color: #059669">
              ${stats.totalShare > 0 ? formatShare((stats.votePro / stats.totalShare) * 100) : '0,00'} %
            </div>
            <div style="font-size: 7pt; color: #64748b; margin-top: 4px;">${formatShare(stats.votePro)} % ze všech</div>
          </div>
          <div class="vote-res against">
            <div class="summary-label">PROTI</div>
            <div class="summary-value" style="color: #dc2626">
              ${stats.totalShare > 0 ? formatShare((stats.voteAgainst / stats.totalShare) * 100) : '0,00'} %
            </div>
            <div style="font-size: 7pt; color: #64748b; margin-top: 4px;">${formatShare(stats.voteAgainst)} % ze všech</div>
          </div>
          <div class="vote-res abstain">
            <div class="summary-label">ZDRŽEL SE</div>
            <div class="summary-value" style="color: #d97706">
              ${stats.totalShare > 0 ? formatShare((stats.voteAbstain / stats.totalShare) * 100) : '0,00'} %
            </div>
            <div style="font-size: 7pt; color: #64748b; margin-top: 4px;">${formatShare(stats.voteAbstain)} % ze všech</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Vchod</th>
              <th>Prostor</th>
              <th>Vlastník / Uživatel</th>
              <th style="text-align: right;">Podíl %</th>
              <th style="text-align: center;">Hlasoval</th>
            </tr>
          </thead>
          <tbody>
            ${units.filter(u => u.isPresent).map(u => `
              <tr>
                <td>${u.block}</td>
                <td>${u.unitNumber}</td>
                <td style="font-weight: bold;">${u.ownerName}</td>
                <td style="text-align: right;">${formatShare(u.share)}</td>
                <td style="text-align: center; font-weight: bold; color: ${
                  u.vote === 'PRO' ? '#059669' : u.vote === 'PROTI' ? '#dc2626' : '#d97706'
                }">
                  ${u.vote || '---'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">Podpis zapisovatele</div>
          <div class="sig-box">Podpis předsedy shromáždění</div>
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Wait for resources to load before printing
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove iframe after printing dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-800">Exportovat výsledky</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowPreview(true)}
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md active:scale-95"
        >
          <span className="text-xs font-black uppercase tracking-widest mb-1">Dokument</span>
          <span className="text-[10px] text-indigo-100 font-bold uppercase">Protokol v PDF</span>
        </button>

        <button
          onClick={exportCSV}
          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700 active:scale-95"
        >
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Tabulka</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Seznam v CSV</span>
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-black text-slate-800 uppercase tracking-tight">Náhled protokolu</h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Vytisknout / PDF
              </button>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 p-2 transition-colors"
                title="Zavřít náhled"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Report Content Preview (React Rendered) */}
          <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-100">
            <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[15mm] md:p-[20mm] report-body">
              <style>{`
                .report-body {
                  font-family: 'Inter', -apple-system, sans-serif;
                  color: #1e293b;
                  line-height: 1.4;
                  font-size: 10pt;
                }
                .report-header {
                  border-bottom: 2px solid #1e293b;
                  padding-bottom: 10px;
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                }
                .report-title h1 {
                  font-size: 18pt;
                  font-weight: 800;
                  margin: 0;
                  text-transform: uppercase;
                  letter-spacing: -0.02em;
                }
                .summary-box {
                  background: #f8fafc;
                  padding: 15px;
                  border-radius: 8px;
                  border: 1px solid #e2e8f0;
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                  margin-bottom: 25px;
                }
                .summary-label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                .summary-value { font-size: 11pt; font-weight: 800; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #94a3b8; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
                td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; }
                
                .signature-section {
                  margin-top: 50px;
                  display: flex;
                  justify-content: space-between;
                }
                .sig-box { width: 45%; border-top: 1px solid #1e293b; padding-top: 8px; text-align: center; font-size: 8pt; color: #64748b; }
                
                .page-break-preview { border-top: 2px dashed #e2e8f0; margin: 40px 0; position: relative; }
                .page-break-preview::after { content: 'KONEC STRÁNKY'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 8px; color: #cbd5e1; font-weight: bold; }
                
                .voting-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 15px;
                  margin-bottom: 25px;
                }
                .vote-res { padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; }
                .vote-res.pro { border-left: 5px solid #059669; background: #f0fdf4; }
                .vote-res.against { border-left: 5px solid #dc2626; background: #fef2f2; }
                .vote-res.abstain { border-left: 5px solid #d97706; background: #fffbeb; }
              `}</style>
              
              <div className="report-header">
                <div className="report-title">
                  <h1>Protokol o účasti</h1>
                  <div className="text-[8pt] text-slate-500 font-medium">Společenství vlastníků jednotek</div>
                </div>
                <div className="text-[10pt] font-bold text-slate-400">Datum: {dateStr}</div>
              </div>

              <div className="summary-box">
                <div>
                  <div className="summary-label">Přítomno jednotek</div>
                  <div className="summary-value">{stats.presentCount} / {stats.totalCount}</div>
                </div>
                <div>
                  <div className="summary-label">Podíl přítomných</div>
                  <div className="summary-value">{formatShare(stats.totalShare)} %</div>
                </div>
                <div>
                  <div className="summary-label">Usnášeníschopnost</div>
                  <div className="summary-value" style={{ color: quorumColor }}>{quorumText}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Vchod</th>
                    <th>Prostor</th>
                    <th>Vlastník / Uživatel</th>
                    <th style={{ textAlign: 'right' }}>Podíl %</th>
                    <th style={{ textAlign: 'center' }}>Účast</th>
                    <th style={{ textAlign: 'center' }}>PM</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map(u => (
                    <tr key={u.id}>
                      <td>{u.block}</td>
                      <td>{u.unitNumber}</td>
                      <td className="font-semibold">{u.ownerName}</td>
                      <td style={{ textAlign: 'right' }}>{formatShare(u.share)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={u.isPresent ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {u.isPresent ? 'ANO' : 'NE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={u.hasPowerOfAttorney ? 'text-indigo-600 font-bold' : 'text-slate-300'}>
                          {u.hasPowerOfAttorney ? 'ANO' : 'NE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="signature-section">
                <div className="sig-box">Podpis zapisovatele</div>
                <div className="sig-box">Podpis předsedy shromáždění</div>
              </div>

              <div className="page-break-preview"></div>

              <div className="report-header">
                <div className="report-title">
                  <h1>Výsledky hlasování</h1>
                  <div className="text-[8pt] text-slate-500 font-medium">Společenství vlastníků jednotek</div>
                </div>
                <div className="text-[10pt] font-bold text-slate-400">Datum: {dateStr}</div>
              </div>

              <div className="voting-grid">
                <div className="vote-res pro">
                  <div className="summary-label">PRO</div>
                  <div className="summary-value text-emerald-600">
                    {stats.totalShare > 0 ? formatShare((stats.votePro / stats.totalShare) * 100) : '0,00'} %
                  </div>
                  <div className="text-[7pt] text-slate-400 mt-1">{formatShare(stats.votePro)} % ze všech</div>
                </div>
                <div className="vote-res against">
                  <div className="summary-label">PROTI</div>
                  <div className="summary-value text-red-600">
                    {stats.totalShare > 0 ? formatShare((stats.voteAgainst / stats.totalShare) * 100) : '0,00'} %
                  </div>
                  <div className="text-[7pt] text-slate-400 mt-1">{formatShare(stats.voteAgainst)} % ze všech</div>
                </div>
                <div className="vote-res abstain">
                  <div className="summary-label">ZDRŽEL SE</div>
                  <div className="summary-value text-amber-600">
                    {stats.totalShare > 0 ? formatShare((stats.voteAbstain / stats.totalShare) * 100) : '0,00'} %
                  </div>
                  <div className="text-[7pt] text-slate-400 mt-1">{formatShare(stats.voteAbstain)} % ze všech</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Vchod</th>
                    <th>Prostor</th>
                    <th>Vlastník / Uživatel</th>
                    <th style={{ textAlign: 'right' }}>Podíl %</th>
                    <th style={{ textAlign: 'center' }}>Hlasoval</th>
                  </tr>
                </thead>
                <tbody>
                  {units.filter(u => u.isPresent).map(u => (
                    <tr key={u.id}>
                      <td>{u.block}</td>
                      <td>{u.unitNumber}</td>
                      <td className="font-semibold">{u.ownerName}</td>
                      <td style={{ textAlign: 'right' }}>{formatShare(u.share)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`font-bold ${
                          u.vote === 'PRO' ? 'text-emerald-600' : 
                          u.vote === 'PROTI' ? 'text-red-600' : 
                          'text-amber-600'
                        }`}>
                          {u.vote || '---'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="signature-section">
                <div className="sig-box">Podpis zapisovatele</div>
                <div className="sig-box">Podpis předsedy shromáždění</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportResults;
