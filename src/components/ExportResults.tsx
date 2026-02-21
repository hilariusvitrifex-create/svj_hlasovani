
import React from 'react';
import { Unit } from '../types';

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

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('cs-CZ');
    const quorumText = stats.totalShare > 50 ? 'ANO' : 'NE';
    const quorumColor = stats.totalShare > 50 ? '#059669' : '#dc2626';

    const formatShare = (val: number) => new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="UTF-8">
        <title>Protokol o účasti a hlasování - SVJ</title>
        <style>
          @page {
            size: A4;
            margin: 13.5mm 10mm; 
          }
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #1e293b; 
            line-height: 1.3;
            font-size: 10pt;
          }
          
          .page-break {
            page-break-before: always;
          }

          .report-container {
            display: flex;
            flex-direction: column;
            min-height: calc(297mm - 27mm);
            margin-bottom: 20px;
          }
          
          .report-header {
            border-bottom: 2px solid #1e293b;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header-title h1 { 
            font-size: 15pt; 
            font-weight: 800; 
            margin: 0; 
            text-transform: uppercase; 
            letter-spacing: -0.02em;
          }
          .header-date { 
            font-size: 9pt; 
            font-weight: 600; 
            color: #64748b; 
          }

          .summary-info { 
            background: #f8fafc; 
            padding: 10px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0; 
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
          }
          .summary-item { flex: 1; }
          .summary-label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
          .summary-value { font-size: 10.5pt; font-weight: 800; }
          
          .content-table {
            flex: 1;
            width: 100%;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          thead { display: table-header-group; }
          th { 
            text-align: left; 
            background: #f1f5f9; 
            padding: 6px 8px; 
            border-bottom: 2px solid #94a3b8;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
          }
          td { 
            padding: 5px 8px; 
            border-bottom: 1px solid #f1f5f9; 
            font-size: 9pt;
          }
          tr:nth-child(even) { background: #fafafa; }
          
          .status-tag { font-weight: 700; font-size: 8pt; }
          .present { color: #059669; }
          .absent { color: #cbd5e1; }
          .pm-active { color: #4f46e5; font-weight: 800; }
          .pm-none { color: #cbd5e1; }

          .vote-pro { color: #059669; font-weight: 800; }
          .vote-against { color: #dc2626; font-weight: 800; }
          .vote-abstain { color: #d97706; font-weight: 800; }
          
          .footer-signatures { 
            margin-top: auto; 
            padding-top: 50px;
            padding-bottom: 5mm;
            display: flex; 
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .signature-box { 
            width: 40%; 
            border-top: 1px solid #1e293b; 
            padding-top: 6px; 
            text-align: center; 
            font-size: 8pt; 
            color: #64748b;
            font-weight: 500;
          }

          .voting-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .vote-card {
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .vote-card.pro { border-left: 4px solid #059669; background: #f0fdf4; }
          .vote-card.against { border-left: 4px solid #dc2626; background: #fef2f2; }
          .vote-card.abstain { border-left: 4px solid #d97706; background: #fffbeb; }

          @media print {
            body { -webkit-print-color-adjust: exact; }
            table { page-break-before: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <!-- STRANA 1: PROTOKOL O ÚČASTI -->
        <div class="report-container">
          <div class="report-header">
            <div class="header-title">
              <h1>Protokol o účasti</h1>
              <div style="font-size: 7.5pt; color: #64748b; font-weight: 500;">Společenství vlastníků jednotek</div>
            </div>
            <div class="header-date">
              Datum: ${dateStr}
            </div>
          </div>

          <div class="summary-info">
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

          <div class="content-table">
            <table>
              <thead>
                <tr>
                  <th>Vchod</th>
                  <th>Prostor</th>
                  <th>Vlastník / Uživatel</th>
                  <th style="text-align: right;">Podíl</th>
                  <th style="text-align: center;">Účast</th>
                  <th style="text-align: center;">PM</th>
                </tr>
              </thead>
              <tbody>
                ${units.map(u => `
                  <tr>
                    <td>${u.block}</td>
                    <td>${u.unitNumber}</td>
                    <td style="font-weight: 500;">${u.ownerName}</td>
                    <td style="text-align: right;"></td>
                    <td style="text-align: center;">
                      <span class="status-tag ${u.isPresent ? 'present' : 'absent'}">
                        ${u.isPresent ? 'ANO' : 'NE'}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <span class="status-tag ${u.hasPowerOfAttorney ? 'pm-active' : 'pm-none'}">
                        ${u.hasPowerOfAttorney ? 'ANO' : 'NE'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer-signatures">
            <div class="signature-box">Podpis zapisovatele</div>
            <div class="signature-box">Podpis předsedy shromáždění</div>
          </div>
        </div>

        <!-- STRANA 2: VÝSLEDKY HLASOVÁNÍ -->
        <div class="report-container page-break">
          <div class="report-header">
            <div class="header-title">
              <h1>Výsledky hlasování</h1>
              <div style="font-size: 7.5pt; color: #64748b; font-weight: 500;">Společenství vlastníků jednotek</div>
            </div>
            <div class="header-date">
              Datum: ${dateStr}
            </div>
          </div>

          <div class="voting-summary">
            <div class="vote-card pro">
              <div class="summary-label">PRO</div>
              <div class="summary-value" style="color: #059669">
                ${stats.totalShare > 0 ? formatShare((stats.votePro / stats.totalShare) * 100) : '0,00'} %
                <span style="font-size: 7pt; font-weight: 600; text-transform: uppercase; margin-left: 2px;">z přítomných</span>
              </div>
              <div style="font-size: 7pt; color: #64748b; margin-top: 2px; font-weight: 500;">
                ${formatShare(stats.votePro)} % ze všech vlastníků
              </div>
            </div>
            <div class="vote-card against">
              <div class="summary-label">PROTI</div>
              <div class="summary-value" style="color: #dc2626">
                ${stats.totalShare > 0 ? formatShare((stats.voteAgainst / stats.totalShare) * 100) : '0,00'} %
                <span style="font-size: 7pt; font-weight: 600; text-transform: uppercase; margin-left: 2px;">z přítomných</span>
              </div>
              <div style="font-size: 7pt; color: #64748b; margin-top: 2px; font-weight: 500;">
                ${formatShare(stats.voteAgainst)} % ze všech vlastníků
              </div>
            </div>
            <div class="vote-card abstain">
              <div class="summary-label">ZDRŽEL SE</div>
              <div class="summary-value" style="color: #d97706">
                ${stats.totalShare > 0 ? formatShare((stats.voteAbstain / stats.totalShare) * 100) : '0,00'} %
                <span style="font-size: 7pt; font-weight: 600; text-transform: uppercase; margin-left: 2px;">z přítomných</span>
              </div>
              <div style="font-size: 7pt; color: #64748b; margin-top: 2px; font-weight: 500;">
                ${formatShare(stats.voteAbstain)} % ze všech vlastníků
              </div>
            </div>
          </div>

          <div class="content-table">
            <table>
              <thead>
                <tr>
                  <th>Vchod</th>
                  <th>Prostor</th>
                  <th>Vlastník / Uživatel</th>
                  <th style="text-align: right;">Podíl</th>
                  <th style="text-align: center;">Hlasoval</th>
                </tr>
              </thead>
              <tbody>
                ${units.filter(u => u.isPresent).map(u => `
                  <tr>
                    <td>${u.block}</td>
                    <td>${u.unitNumber}</td>
                    <td style="font-weight: 500;">${u.ownerName}</td>
                    <td style="text-align: right;"></td>
                    <td style="text-align: center;">
                      <span class="status-tag ${u.vote === 'PRO' ? 'vote-pro' : u.vote === 'PROTI' ? 'vote-against' : 'vote-abstain'}">
                        ${u.vote || '---'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer-signatures">
            <div class="signature-box">Podpis zapisovatele</div>
            <div class="signature-box">Podpis předsedy shromáždění</div>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
          onClick={exportPDF}
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
    </div>
  );
};

export default ExportResults;
