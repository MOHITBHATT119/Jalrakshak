import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  generateReport, getVillages, getGroundwater, getDroughtRisk,
  getWaterHealth, getWaterBudget,
  Village, GroundwaterResult, DroughtResult, WaterHealthResult, WaterBudgetResult,
} from '../../services/api';
import VillageSelect from '../../components/VillageSelect';
import { useReport } from '../../context/ReportContext';
import {
  FileText, Download, Printer, RefreshCw, Clock, AlertTriangle,
  Droplet, TrendingDown, TrendingUp, Minus, CheckCircle, XCircle, Globe,
  MapPin, Zap, BarChart3, CloudRain, Activity, Check, ArrowRight,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'gu';

const T = {
  en: {
    pageTitle:        'Village Water Report Center',
    pageSubtitle:     'AI-powered water intelligence report — IBM Granite · Deterministic analysis',
    generateBtn:      'Generate Report',
    pdfBtn:           'Download PDF',
    printBtn:         'Print',
    loading:          'Analysing data across all water intelligence agents…',
    emptyTitle:       'No report generated yet',
    emptyDesc:        'Select a village and click Generate Report to get a full water intelligence report.',
    loadSteps: [
      'Fetching water data…',
      'Running groundwater analysis…',
      'Assessing drought risk…',
      'Calculating water budget…',
      'Generating AI narrative…',
      'Composing report…',
    ],
    // Cover
    reportBrand:      'JalRakshak AI 2.0 · Water Intelligence Report',
    waterHealth:      'Water Health',
    safetyScore:      'Safety Score',
    droughtRisk:      'Drought Risk',
    groundwater:      'Groundwater',
    waterBalance:     'Water Balance',
    score:            'Score',
    demoNotice:       'Demo Mode — AI narrative from fallback. Add IBM watsonx API key for live Granite.',
    // Sections
    gwTrend:          'Groundwater Depth Trend (m bgl)',
    changePerYear:    'Change/yr',
    since2019:        'Since 2019',
    status:           'Status',
    droughtFactors:   'Drought Risk Factors (score contribution)',
    overall:          'Overall',
    level:            'Level',
    confidence:       'Confidence',
    healthBreakdown:  'Water Health Score Breakdown',
    demandPie:        'Water Demand Breakdown (MCM)',
    supply:           'Supply',
    demand:           'Demand',
    deficit:          'Deficit',
    gwEvidence:       'Groundwater Evidence',
    droughtEvidence:  'Drought Risk Factors',
    recommended:      'Recommended Actions',
    savings:          'Potential Water Savings',
    aiNarrative:      'AI Narrative — IBM Granite',
    limitations:      'Important Limitations',
    lim1:             'All data is synthetic demonstration data — not official government measurements.',
    lim2:             'Water Health Score uses estimated component weights, not a peer-reviewed methodology.',
    lim3:             'AI narrative (IBM Granite) is advisory and may not reflect current field conditions.',
    lim4:             'Consult local agricultural experts, hydrogeologists, and government water authorities before action.',
    reportFooter:     'JalRakshak AI 2.0 · IBM Hackathon · Saurashtra Water Intelligence',
    demoData:         'DEMONSTRATION DATA',
    recentReports:    'Recent Reports',
    viewBtn:          'View',
    // PDF strings
    pdfTitle:         'JALRAKSHAK AI 2.0',
    pdfSubtitle:      'Water Intelligence Report',
    pdfGenerated:     'Generated',
    pdfDistrict:      'District',
    pdfDemoNote:      'DEMONSTRATION DATA — Not official government measurements',
    pdfSection1:      '1. EXECUTIVE SUMMARY',
    pdfSection2:      '2. GROUNDWATER STATUS',
    pdfSection3:      '3. DROUGHT RISK ASSESSMENT',
    pdfSection4:      '4. WATER HEALTH SCORE',
    pdfSection5:      '5. WATER BUDGET',
    pdfSection6:      '6. DROUGHT EVIDENCE & FACTORS',
    pdfSection7:      '7. RECOMMENDED ACTIONS',
    pdfSection8:      '8. POTENTIAL WATER SAVINGS',
    pdfSection9:      '9. AI NARRATIVE (IBM GRANITE)',
    pdfSection10:     '10. LIMITATIONS & DISCLAIMER',
    pdfCurrentDepth:  'Current Depth',
    pdfHistorical:    'Historical Depth (2019)',
    pdfAnnualChange:  'Annual Change',
    pdfChangeSince:   'Change Since 2019',
    pdfTrend:         'Trend',
    pdfSeverity:      'Severity',
    pdfRiskScore:     'Risk Score',
    pdfRiskLevel:     'Risk Level',
    pdfRainfallScore: 'Rainfall Score',
    pdfGWScore:       'Groundwater Score',
    pdfDemandScore:   'Demand Score',
    pdfOverallScore:  'Overall Score',
    pdfCategory:      'Category',
    pdfGWComponent:   'Groundwater Component',
    pdfRainfallComp:  'Rainfall Component',
    pdfDroughtComp:   'Drought Component',
    pdfDemandComp:    'Demand Component',
    pdfRechargeComp:  'Recharge Component',
    pdfTotalSupply:   'Total Supply',
    pdfTotalDemand:   'Total Demand',
    pdfAgriDemand:    'Agricultural Demand',
    pdfDomDemand:     'Domestic Demand',
    pdfIndDemand:     'Industrial Demand',
    pdfBalance:       'Water Balance',
    pdfBalanceStatus: 'Balance Status',
    pdfMeasure:       'Measure',
    pdfSaving:        'Saving (MCM)',
    pdfFooter:        'JalRakshak AI 2.0 | IBM Hackathon | Saurashtra Water Intelligence | DEMONSTRATION DATA',
  },
  gu: {
    pageTitle:        'ગ્રામ જળ અહેવાલ કેન્દ્ર',
    pageSubtitle:     'AI-સંચાલિત જળ બુદ્ધિ અહેવાલ — IBM Granite · નિર્ધારક વિશ્લેષણ',
    generateBtn:      'અહેવાલ બનાવો',
    pdfBtn:           'PDF ડાઉનલોડ',
    printBtn:         'છાપો',
    loading:          'તમામ જળ ગુપ્તચર એજન્ટ્સ દ્વારા ડેટાનું વિશ્લેષણ…',
    emptyTitle:       'હજુ સુધી કોઈ અહેવાલ બનાવ્યો નથી',
    emptyDesc:        'ગ્રામ પસંદ કરો અને સંપૂર્ણ જળ બુદ્ધિ અહેવાલ માટે "અહેવાલ બનાવો" ક્લિક કરો.',
    loadSteps: [
      'જળ ડેટા મેળવી રહ્યા છીએ…',
      'ભૂગર્ભ જળ વિશ્લેષણ ચાલી રહ્યું છે…',
      'દુષ્કાળ જોખમ આકારણી…',
      'જળ બજેટ ગણતરી…',
      'AI વર્ણન બનાવી રહ્યા છીએ…',
      'અહેવાલ તૈયાર કરી રહ્યા છીએ…',
    ],
    reportBrand:      'JalRakshak AI 2.0 · જળ બુદ્ધિ અહેવાલ',
    waterHealth:      'જળ આરોગ્ય',
    safetyScore:      'સુરક્ષા સ્કોર',
    droughtRisk:      'દુષ્કાળ જોખમ',
    groundwater:      'ભૂગર્ભ જળ',
    waterBalance:     'જળ સંતુલન',
    score:            'સ્કોર',
    demoNotice:       'ડેમો મોડ — IBM watsonx API કી ઉમેરો.',
    gwTrend:          'ભૂગર્ભ જળ ઊંડાઈ ટ્રેન્ડ (m bgl)',
    changePerYear:    'પ્રતિ વર્ષ ફેરફાર',
    since2019:        '2019 થી',
    status:           'સ્થિતિ',
    droughtFactors:   'દુષ્કાળ જોખમ પરિબળો',
    overall:          'કુલ',
    level:            'સ્તર',
    confidence:       'વિશ્વાસ',
    healthBreakdown:  'જળ આરોગ્ય સ્કોર વિભાજન',
    demandPie:        'જળ માંગ વિભાજન (MCM)',
    supply:           'પૂરવઠો',
    demand:           'માંગ',
    deficit:          'ઘટ',
    gwEvidence:       'ભૂગર્ભ જળ પુરાવા',
    droughtEvidence:  'દુષ્કાળ જોખમ પરિબળો',
    recommended:      'ભલામણ કરેલ પગલાં',
    savings:          'સંભવિત જળ બચત',
    aiNarrative:      'AI વર્ણન — IBM Granite',
    limitations:      'મહત્વપૂર્ણ મર્યાદાઓ',
    lim1:             'તમામ ડેટા સૃષ્ટ્ટ નિદર્શન ડેટા છે — સત્તાવાર સરકારી માપ નથી.',
    lim2:             'જળ આરોગ્ય સ્કોર અંદાજ ઘટકો ઉપર આધારિત છે.',
    lim3:             'AI વર્ણન (IBM Granite) સલાહ સ્વરૂપ છે.',
    lim4:             'નોંધપાત્ર નિર્ણય પહેલા નિષ્ણાતોની સલાહ લો.',
    reportFooter:     'JalRakshak AI 2.0 · IBM Hackathon · સૌરાષ્ટ્ર જળ બુદ્ધિ',
    demoData:         'નિદર્શન ડેટા',
    recentReports:    'તાજેતરના અહેવાલ',
    viewBtn:          'જુઓ',
    pdfTitle:         'JALRAKSHAK AI 2.0',
    pdfSubtitle:      'Jal Buddhi Ahewal (Water Intelligence Report)',
    pdfGenerated:     'Banavel',
    pdfDistrict:      'Jilleo',
    pdfDemoNote:      'NIDARSHAM DATA — Sarakari mapan nathi',
    pdfSection1:      '1. MUKHY SAAR (Executive Summary)',
    pdfSection2:      '2. BHUGARBH JAL STHITI (Groundwater)',
    pdfSection3:      '3. DUSHKAL JOKHAM (Drought Risk)',
    pdfSection4:      '4. JAL AROGYA SCORE (Water Health)',
    pdfSection5:      '5. JAL BUDGET (Water Budget)',
    pdfSection6:      '6. DUSHKAL PURAVA & PARIBALO (Evidence)',
    pdfSection7:      '7. BHALAMANO KARELAM PAGLA (Recommendations)',
    pdfSection8:      '8. SAMBHAVIT JAL BACHAT (Water Savings)',
    pdfSection9:      '9. AI VARNAN — IBM Granite',
    pdfSection10:     '10. MADHYADO & ASVIKAR (Limitations)',
    pdfCurrentDepth:  'Haal Ni Undai',
    pdfHistorical:    'Etihasik Undai (2019)',
    pdfAnnualChange:  'Varsik Badlav',
    pdfChangeSince:   '2019 Thi Badlav',
    pdfTrend:         'Trendo',
    pdfSeverity:      'Gambheerta',
    pdfRiskScore:     'Jokham Score',
    pdfRiskLevel:     'Jokham Sthar',
    pdfRainfallScore: 'Varsad Score',
    pdfGWScore:       'Bhugarbh Jal Score',
    pdfDemandScore:   'Manag Score',
    pdfOverallScore:  'Kul Score',
    pdfCategory:      'Shrenee',
    pdfGWComponent:   'Bhugarbh Jal Ghtak',
    pdfRainfallComp:  'Varsad Ghtak',
    pdfDroughtComp:   'Dushkal Ghtak',
    pdfDemandComp:    'Manag Ghtak',
    pdfRechargeComp:  'Richarj Ghtak',
    pdfTotalSupply:   'Kul Purvatha',
    pdfTotalDemand:   'Kul Manag',
    pdfAgriDemand:    'Kheti Manag',
    pdfDomDemand:     'Gharelu Manag',
    pdfIndDemand:     'Udyog Manag',
    pdfBalance:       'Jal Santulan',
    pdfBalanceStatus: 'Santulan Sthiti',
    pdfMeasure:       'Upaay',
    pdfSaving:        'Bachat (MCM)',
    pdfFooter:        'JalRakshak AI 2.0 | IBM Hackathon | Saurashtra Jal Buddhi | NIDARSHAM DATA',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MODERATE: '#f59e0b',
  LOW: '#22c55e', IMPROVING: '#22c55e', DECLINING: '#ef4444',
  STABLE: '#f59e0b', STRESSED: '#f59e0b', GOOD: '#22c55e',
  DEFICIT: '#ef4444', SURPLUS: '#22c55e',
};

const badge = (label: string) => {
  const color = RISK_COLOR[label?.toUpperCase()] ?? '#94a3b8';
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
};

// scoreRing and TOOLTIP_STYLE are theme-aware — built inside the component using themeVars()
const RING_TRACK_LIGHT = '#e2e8f0';
const RING_TRACK_DARK  = '#1e293b';
const RING_TEXT_LIGHT  = '#0f172a';
const RING_TEXT_DARK   = '#f8fafc';

const makeScoreRing = (isDark: boolean) =>
  (score: number, max = 100, label: string) => {
    const pct = (score / max) * 100;
    const color = pct >= 70 ? '#22c55e' : pct >= 45 ? '#f59e0b' : '#ef4444';
    const r = 34, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width={86} height={86} viewBox="0 0 86 86">
          <circle cx={43} cy={43} r={r} fill="none" stroke={isDark ? RING_TRACK_DARK : RING_TRACK_LIGHT} strokeWidth={8} />
          <circle cx={43} cy={43} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 43 43)" />
          <text x={43} y={47} textAnchor="middle" fill={isDark ? RING_TEXT_DARK : RING_TEXT_LIGHT} fontSize={16} fontWeight={700}>{score}</text>
        </svg>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 80 }}>{label}</span>
      </div>
    );
  };

const makeTooltipStyle = (isDark: boolean) => ({
  background: isDark ? '#1e293b' : '#ffffff',
  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  color: isDark ? '#f8fafc' : '#0f172a',
  borderRadius: 6,
  fontSize: '0.8rem',
});
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

const useStagedLoading = (steps: string[], duration = 3800) => {
  const [stageIdx, setStageIdx] = useState(-1);
  const [loading, setLoading]   = useState(false);
  // timerDone: true once the visual step ticker has finished cycling
  const [timerDone, setTimerDone] = useState(false);

  const stop = () => { setLoading(false); setStageIdx(-1); setTimerDone(false); };

  const start = () => {
    setLoading(true);
    setTimerDone(false);
    setStageIdx(0);
    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        // keep last step highlighted; signal timer is done but DO NOT stop yet
        setTimerDone(true);
        return;
      }
      setStageIdx(i++);
      setTimeout(tick, duration / steps.length);
    };
    tick();
  };

  const stage = stageIdx >= 0 ? steps[Math.min(stageIdx, steps.length - 1)] : '';
  return { loading, stage, stageIdx, totalSteps: steps.length, timerDone, start, stop };
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF BUILDER  (pure jsPDF — no screenshots, no charts)
// ─────────────────────────────────────────────────────────────────────────────

function buildPdf(
  lang: Lang,
  villageName: string,
  district: string,
  gw: GroundwaterResult | null,
  drought: DroughtResult | null,
  health: WaterHealthResult | null,
  budget: WaterBudgetResult | null,
  reportText: string,
) {
  const t = T[lang];
  const pdf = new jsPDF('p', 'mm', 'a4');
  const PW = 210, PH = 297, ML = 18, MR = 18, CW = PW - ML - MR;
  let y = 0;

  // ── colours ──
  const C = {
    navy:    [15,  32,  68]  as [number,number,number],
    blue:    [37, 99,  235]  as [number,number,number],
    blueL:   [96, 165, 250]  as [number,number,number],
    white:   [248,250,252]   as [number,number,number],
    slate:   [100,116,139]   as [number,number,number],
    slateL:  [203,213,225]   as [number,number,number],
    green:   [34, 197,  94]  as [number,number,number],
    amber:   [245,158, 11]   as [number,number,number],
    red:     [239, 68,  68]  as [number,number,number],
    orange:  [249,115,  22]  as [number,number,number],
    dark:    [15,  23,  42]  as [number,number,number],
    surface: [30,  41,  59]  as [number,number,number],
    border:  [51,  65,  85]  as [number,number,number],
  };

  const setFill  = (c: [number,number,number]) => pdf.setFillColor(...c);
  const setDraw  = (c: [number,number,number]) => pdf.setDrawColor(...c);
  const setTxt   = (c: [number,number,number]) => pdf.setTextColor(...c);

  const newPage = () => {
    pdf.addPage();
    y = 18;
    // page background
    setFill(C.dark); pdf.rect(0, 0, PW, PH, 'F');
    // header stripe
    setFill(C.surface); pdf.rect(0, 0, PW, 10, 'F');
    setTxt(C.slate); pdf.setFontSize(7.5);
    pdf.text(t.pdfTitle, ML, 6.5);
    pdf.text(`${villageName} · ${new Date().toLocaleDateString('en-IN')}`, PW - MR, 6.5, { align: 'right' });
  };

  const checkY = (needed: number) => { if (y + needed > PH - 18) newPage(); };

  // section heading
  const sectionHeading = (title: string) => {
    checkY(14);
    setFill(C.blue); pdf.rect(ML, y, CW, 8, 'F');
    setTxt(C.white); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text(title, ML + 4, y + 5.5);
    y += 11;
  };

  // key–value row
  const kvRow = (key: string, value: string, valColor: [number,number,number] = C.white, altBg = false) => {
    checkY(8);
    if (altBg) { setFill(C.surface); pdf.rect(ML, y, CW, 7, 'F'); }
    setTxt(C.slate); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
    pdf.text(key, ML + 3, y + 5);
    setTxt(valColor); pdf.setFont('helvetica', 'bold');
    pdf.text(value, ML + CW - 3, y + 5, { align: 'right' });
    setDraw(C.border); pdf.setLineWidth(0.2);
    pdf.line(ML, y + 7, ML + CW, y + 7);
    y += 7;
  };

  // bullet item
  const bullet = (text: string, num?: number) => {
    checkY(7);
    setTxt(C.green); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold');
    pdf.text(num !== undefined ? `${num}.` : '•', ML + 3, y + 5);
    setTxt(C.slateL); pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, CW - 14);
    pdf.text(lines, ML + 10, y + 5);
    y += (lines.length * 5) + 2;
    checkY(0);
  };

  // wrapped paragraph
  const para = (text: string) => {
    if (!text) return;
    const lines = pdf.splitTextToSize(text, CW - 6);
    const needed = lines.length * 5 + 4;
    checkY(needed);
    setTxt(C.slateL); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
    pdf.text(lines, ML + 3, y + 5);
    y += needed;
  };

  // progress bar (horizontal)
  const progressBar = (label: string, score: number, max: number, color: [number,number,number]) => {
    checkY(11);
    setTxt(C.slateL); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(label, ML + 3, y + 5);
    // track
    setFill(C.surface); pdf.rect(ML + 60, y + 2, CW - 72, 5, 'F');
    // fill
    const fill = Math.max(0, Math.min((score / max) * (CW - 72), CW - 72));
    setFill(color); pdf.rect(ML + 60, y + 2, fill, 5, 'F');
    setTxt(color); pdf.setFont('helvetica', 'bold');
    pdf.text(`${score}/${max}`, ML + CW - 3, y + 5, { align: 'right' });
    y += 10;
  };

  // risk colour
  const riskColor = (level: string): [number,number,number] => {
    const k = level?.toUpperCase();
    if (k === 'CRITICAL' || k === 'DECLINING' || k === 'DEFICIT') return C.red;
    if (k === 'HIGH')     return C.orange;
    if (k === 'MODERATE' || k === 'STABLE' || k === 'STRESSED') return C.amber;
    return C.green;
  };

  // ── PAGE 1 COVER ──────────────────────────────────────────────────────────

  // Full dark background
  setFill(C.dark); pdf.rect(0, 0, PW, PH, 'F');

  // Top navy banner
  setFill(C.navy); pdf.rect(0, 0, PW, 55, 'F');

  // Brand watermark circle
  setFill(C.blue); pdf.circle(PW - 30, 27, 22, 'F');
  setTxt(C.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text('JAL', PW - 30, 22, { align: 'center' });
  pdf.text('AI', PW - 30, 30, { align: 'center' });
  pdf.text('2.0', PW - 30, 38, { align: 'center' });

  // Title block
  setTxt(C.blueL); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
  pdf.text(t.pdfTitle, ML, 16);
  setTxt(C.white); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text(t.pdfSubtitle, ML, 28);
  setTxt(C.blueL); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  pdf.text(villageName, ML, 38);
  setTxt(C.slate); pdf.setFontSize(8.5);
  pdf.text(`${t.pdfDistrict}: ${district}   |   ${t.pdfGenerated}: ${new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}`, ML, 47);

  y = 65;

  // ── KPI Summary cards (4 boxes) ──
  if (health || drought || gw || budget) {
    const kpis = [
      { label: t.waterHealth,  value: health  ? `${health.overall_score}/100`       : 'N/A', sub: health?.category      ?? '',              color: health   ? riskColor(health.category)      : C.slate },
      { label: t.droughtRisk,  value: drought ? `${drought.risk_score}/100`          : 'N/A', sub: drought?.risk_level   ?? '',              color: drought  ? riskColor(drought.risk_level)   : C.slate },
      { label: t.groundwater,  value: gw      ? `${gw.current_depth_m}m bgl`         : 'N/A', sub: gw?.trend             ?? '',              color: gw       ? riskColor(gw.trend)             : C.slate },
      { label: t.waterBalance, value: budget  ? `${budget.balance.deficit_mcm > 0 ? '−' : '+'}${Math.abs(budget.balance.deficit_mcm)} MCM` : 'N/A', sub: budget?.balance.status ?? '', color: budget ? riskColor(budget.balance.status) : C.slate },
    ];

    const bw = (CW - 9) / 4, bh = 32;
    kpis.forEach((k, i) => {
      const bx = ML + i * (bw + 3);
      setFill(C.surface); pdf.rect(bx, y, bw, bh, 'F');
      setDraw(k.color); pdf.setLineWidth(0.6); pdf.rect(bx, y, bw, bh, 'S');
      // label
      setTxt(C.slate); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.text(k.label.toUpperCase(), bx + bw / 2, y + 7, { align: 'center' });
      // value
      setTxt(C.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.text(k.value, bx + bw / 2, y + 17, { align: 'center' });
      // sub
      setTxt(k.color); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
      pdf.text(k.sub.toUpperCase(), bx + bw / 2, y + 25, { align: 'center' });
    });
    y += bh + 10;
  }

  // Demo notice
  setFill(C.surface); pdf.rect(ML, y, CW, 9, 'F');
  setDraw(C.amber); pdf.setLineWidth(0.5); pdf.rect(ML, y, CW, 9, 'S');
  setTxt(C.amber); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
  pdf.text('NOTE: ' + t.pdfDemoNote, ML + 4, y + 6);
  y += 14;

  // Divider
  setDraw(C.border); pdf.setLineWidth(0.4); pdf.line(ML, y, ML + CW, y); y += 8;

  // Contents list on cover
  setTxt(C.blueL); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
  pdf.text('CONTENTS', ML, y); y += 7;
  const contents = [t.pdfSection1, t.pdfSection2, t.pdfSection3, t.pdfSection4, t.pdfSection5,
                    t.pdfSection6, t.pdfSection7, t.pdfSection8, t.pdfSection9, t.pdfSection10];
  contents.forEach((c, i) => {
    setTxt(C.slateL); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text(c, ML + 4, y);
    setTxt(C.border as any);
    y += 6;
  });

  // ── PAGES 2+ ──────────────────────────────────────────────────────────────
  newPage();

  // ── SECTION 1: Executive Summary ──
  sectionHeading(t.pdfSection1);
  if (health && drought && gw) {
    para(
      `${villageName} (${district}): ` +
      `Water Health Score: ${health.overall_score}/100 (${health.category}). ` +
      `Drought Risk: ${drought.risk_level} (${drought.risk_score}/100). ` +
      `Groundwater: ${gw.current_depth_m}m — ${gw.trend} (+${gw.annual_change_m}m/yr since 2019). ` +
      (budget ? `Water Balance: ${budget.balance.deficit_mcm > 0 ? `Deficit ${budget.balance.deficit_mcm} MCM` : `Surplus ${Math.abs(budget.balance.deficit_mcm)} MCM`}.` : '')
    );
  }
  y += 4;

  // ── SECTION 2: Groundwater ──
  sectionHeading(t.pdfSection2);
  if (gw) {
    kvRow(t.pdfCurrentDepth,  `${gw.current_depth_m} m bgl`,           riskColor(gw.trend), false);
    kvRow(t.pdfHistorical,    `${gw.historical_depth_m} m bgl`,         C.slateL,            true);
    kvRow(t.pdfAnnualChange,  `+${gw.annual_change_m} m/yr`,            C.amber,             false);
    kvRow(t.pdfChangeSince,   `+${gw.change_pct_since_2019}%`,          riskColor(gw.trend), true);
    kvRow(t.pdfTrend,         gw.trend,                                  riskColor(gw.trend), false);
    kvRow(t.pdfSeverity,      gw.severity,                               riskColor(gw.severity), true);
  } else { para('N/A'); }
  y += 4;

  // ── SECTION 3: Drought Risk ──
  sectionHeading(t.pdfSection3);
  if (drought) {
    kvRow(t.pdfRiskScore,     `${drought.risk_score}/100`,               riskColor(drought.risk_level), false);
    kvRow(t.pdfRiskLevel,     drought.risk_level,                        riskColor(drought.risk_level), true);
    kvRow(t.confidence,       drought.confidence,                        C.blueL,                       false);
    y += 3;
    progressBar(t.pdfRainfallScore, drought.components.rainfall_score,    40, C.orange);
    progressBar(t.pdfGWScore,       drought.components.groundwater_score,  30, C.blue);
    progressBar(t.pdfDemandScore,   drought.components.demand_score,       30, C.amber);
  } else { para('N/A'); }
  y += 4;

  // ── SECTION 4: Water Health ──
  sectionHeading(t.pdfSection4);
  if (health) {
    kvRow(t.pdfOverallScore,  `${health.overall_score}/100`,             riskColor(health.category),  false);
    kvRow(t.pdfCategory,      health.category,                           riskColor(health.category),  true);
    y += 3;
    progressBar(t.pdfGWComponent,    health.components.groundwater_score, health.components.groundwater_max, C.blue);
    progressBar(t.pdfRainfallComp,   health.components.rainfall_score,    health.components.rainfall_max,    C.blueL);
    progressBar(t.pdfDroughtComp,    health.components.drought_score,     health.components.drought_max,     C.orange);
    progressBar(t.pdfDemandComp,     health.components.demand_score,      health.components.demand_max,      C.amber);
    progressBar(t.pdfRechargeComp,   health.components.recharge_score,    health.components.recharge_max,    C.green);
  } else { para('N/A'); }
  y += 4;

  // ── SECTION 5: Water Budget ──
  sectionHeading(t.pdfSection5);
  if (budget) {
    kvRow(t.pdfTotalSupply,   `${budget.supply.total_mcm} MCM`,          C.green,                          false);
    kvRow(t.pdfTotalDemand,   `${budget.demand.total_mcm} MCM`,          C.orange,                         true);
    kvRow(t.pdfAgriDemand,    `${budget.demand.agricultural_mcm} MCM (${budget.demand.agricultural_pct}%)`, C.slateL, false);
    kvRow(t.pdfDomDemand,     `${budget.demand.domestic_mcm} MCM (${budget.demand.domestic_pct}%)`,         C.slateL, true);
    kvRow(t.pdfIndDemand,     `${budget.demand.industrial_mcm} MCM (${budget.demand.industrial_pct}%)`,     C.slateL, false);
    kvRow(t.pdfBalance,       `${budget.balance.deficit_mcm > 0 ? '−' : '+'}${Math.abs(budget.balance.deficit_mcm)} MCM`, riskColor(budget.balance.status), true);
    kvRow(t.pdfBalanceStatus, budget.balance.status,                     riskColor(budget.balance.status), false);
  } else { para('N/A'); }
  y += 4;

  newPage();

  // ── SECTION 6: Evidence ──
  sectionHeading(t.pdfSection6);
  if (gw?.evidence?.length) {
    setTxt(C.blueL); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold');
    pdf.text(t.gwEvidence + ':', ML + 3, y); y += 6;
    gw.evidence.forEach(e => bullet(e));
    y += 2;
  }
  if (drought?.factors?.length) {
    setTxt(C.orange); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold');
    pdf.text(t.droughtEvidence + ':', ML + 3, y); y += 6;
    drought.factors.forEach(f => bullet(f));
  }
  y += 4;

  // ── SECTION 7: Recommended Actions ──
  sectionHeading(t.pdfSection7);
  if (drought?.recommended_actions?.length) {
    drought.recommended_actions.forEach((a, i) => bullet(a, i + 1));
  } else { para('N/A'); }
  y += 4;

  // ── SECTION 8: Savings ──
  sectionHeading(t.pdfSection8);
  if (budget?.potential_savings?.length) {
    // table header
    checkY(10);
    setFill(C.navy); pdf.rect(ML, y, CW, 7, 'F');
    setTxt(C.white); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    pdf.text(t.pdfMeasure, ML + 4, y + 5);
    pdf.text(t.pdfSaving,  ML + CW - 4, y + 5, { align: 'right' });
    y += 7;
    budget.potential_savings.forEach((s, i) => {
      checkY(7);
      if (i % 2 === 0) { setFill(C.surface); pdf.rect(ML, y, CW, 7, 'F'); }
      setTxt(C.slateL); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(s.measure, ML + 4, y + 5);
      setTxt(C.green); pdf.setFont('helvetica', 'bold');
      pdf.text(`${s.saving_mcm} MCM`, ML + CW - 4, y + 5, { align: 'right' });
      y += 7;
    });
  } else { para('N/A'); }
  y += 4;

  // ── SECTION 9: AI Narrative ──
  if (reportText) {
    newPage();
    sectionHeading(t.pdfSection9);
    // tinted background box
    checkY(10);
    const boxY = y;
    const lines = pdf.splitTextToSize(reportText, CW - 8);
    const boxH = lines.length * 5 + 8;
    setFill([18, 26, 54] as [number,number,number]); pdf.rect(ML, boxY, CW, Math.min(boxH, PH - boxY - 20), 'F');
    setDraw(C.blue); pdf.setLineWidth(0.4); pdf.rect(ML, boxY, CW, Math.min(boxH, PH - boxY - 20), 'S');
    setTxt(C.blueL); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
    // split into page-sized chunks
    let lineIdx = 0;
    while (lineIdx < lines.length) {
      if (y + 6 > PH - 18) { newPage(); sectionHeading(t.pdfSection9 + ' (contd.)'); }
      pdf.text(lines[lineIdx], ML + 4, y + 5);
      y += 5;
      lineIdx++;
    }
    y += 4;
  }

  // ── SECTION 10: Limitations ──
  checkY(14);
  sectionHeading(t.pdfSection10);
  [t.lim1, t.lim2, t.lim3, t.lim4].forEach(l => bullet(l));
  y += 4;

  // ── FOOTER on every page ──
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    setFill(C.navy); pdf.rect(0, PH - 12, PW, 12, 'F');
    setTxt(C.slate); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
    pdf.text(t.pdfFooter, ML, PH - 4.5);
    setTxt(C.blueL);
    pdf.text(`${p} / ${totalPages}`, PW - MR, PH - 4.5, { align: 'right' });
  }

  return pdf;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunityReports() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { addReport } = useReport();
  const [villages, setVillages]           = useState<Village[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [lang, setLang]                   = useState<Lang>('en');

  const [report, setReport]   = useState<any>(null);
  const [gw, setGw]           = useState<GroundwaterResult | null>(null);
  const [drought, setDrought] = useState<DroughtResult | null>(null);
  const [health, setHealth]   = useState<WaterHealthResult | null>(null);
  const [budget, setBudget]   = useState<WaterBudgetResult | null>(null);
  // track which village the current report was generated for
  const [reportedVillage, setReportedVillage] = useState<string>('');

  const clearReport = () => {
    setReport(null); setGw(null); setDrought(null); setHealth(null); setBudget(null);
    setReportedVillage('');
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  const scoreRing   = useMemo(() => makeScoreRing(isDark),   [isDark]);
  const TOOLTIP_STYLE = useMemo(() => makeTooltipStyle(isDark), [isDark]);

  const loader = useStagedLoading(t.loadSteps);

  useEffect(() => {
    getVillages().then(d => {
      const list = Array.isArray(d?.villages) ? d.villages : [];
      setVillages(list);
      if (list.length) setSelectedVillage(list[0].village_id);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedVillage) return;
    clearReport();
    loader.start();

    const [r, gwData, drData, whData, wbData] = await Promise.all([
      generateReport(selectedVillage).catch(() => null),
      getGroundwater(selectedVillage).catch(() => null),
      getDroughtRisk(selectedVillage).catch(() => null),
      getWaterHealth(selectedVillage).catch(() => null),
      getWaterBudget(selectedVillage).catch(() => null),
    ]);

    // Data is ready — set all state + mark which village this report is for,
    // then stop the loader in the same React batch (no empty-state flash).
    setReport(r); setGw(gwData); setDrought(drData); setHealth(whData); setBudget(wbData);
    setReportedVillage(selectedVillage);
    loader.stop();

    const village = villages.find(v => v.village_id === selectedVillage);
    addReport({
      id: crypto.randomUUID(),
      villageId: selectedVillage,
      villageName: village?.name ?? selectedVillage,
      type: lang === 'gu' ? 'સંપૂર્ણ ગ્રામ જળ અહેવાલ' : 'Complete Village Water Report',
      period: lang === 'gu' ? 'છેલ્લા 30 દિવસ' : 'Last 30 days',
      generatedAt: new Date().toISOString(),
      content: r?.report_text ?? '',
    });
  };

  const downloadPdf = () => {
    const village = villages.find(v => v.village_id === selectedVillage);
    const vname   = village?.name ?? selectedVillage;
    const district = village?.district ?? '';
    const pdf = buildPdf(lang, vname, district, gw, drought, health, budget, report?.report_text ?? '');
    pdf.save(`JalRakshak_${vname}_${lang.toUpperCase()}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ── derived chart data ──
  const gwSeries    = gw?.timeseries?.map(p => ({ label: `${p.year}/${String(p.month).padStart(2,'0')}`, depth: +p.depth_m.toFixed(2) })) ?? [];
  const healthRadar = health ? [
    { axis: lang==='gu'?'ભૂ.જળ':'Groundwater', score: health.components.groundwater_score, max: health.components.groundwater_max },
    { axis: lang==='gu'?'વરસાદ':'Rainfall',    score: health.components.rainfall_score,    max: health.components.rainfall_max },
    { axis: lang==='gu'?'દુષ્કાળ':'Drought',    score: health.components.drought_score,     max: health.components.drought_max },
    { axis: lang==='gu'?'માંગ':'Demand',        score: health.components.demand_score,      max: health.components.demand_max },
    { axis: lang==='gu'?'રિચાર્જ':'Recharge',  score: health.components.recharge_score,    max: health.components.recharge_max },
  ] : [];
  const budgetPie   = budget ? [
    { name: lang==='gu'?'ખેતી':'Agriculture', value: +budget.demand.agricultural_mcm.toFixed(1) },
    { name: lang==='gu'?'ઘરેલૂ':'Domestic',  value: +budget.demand.domestic_mcm.toFixed(1) },
    { name: lang==='gu'?'ઉદ્યોગ':'Industrial',value: +budget.demand.industrial_mcm.toFixed(1) },
  ] : [];
  const droughtBar  = drought ? [
    { name: lang==='gu'?'વરસાદ':'Rainfall',    score: drought.components.rainfall_score },
    { name: lang==='gu'?'ભૂ.જળ':'Groundwater', score: drought.components.groundwater_score },
    { name: lang==='gu'?'માંગ':'Demand',        score: drought.components.demand_score },
  ] : [];

  // Use reportedVillage (not selectedVillage) so changing the dropdown
  // immediately clears the report — name/district always match the data shown.
  const villageName = villages.find(v => v.village_id === reportedVillage)?.name ?? reportedVillage;
  const district    = villages.find(v => v.village_id === reportedVillage)?.district ?? '';
  const generated   = reportedVillage !== '' && (gw !== null || report !== null);

  // ── inline styles (theme-aware) ──
  const cardBg    = isDark ? 'rgba(16,24,39,0.7)'  : 'var(--bg-card)';
  const cardBdr   = isDark ? '#1e293b'              : 'var(--border-glass)';
  const trackBg   = isDark ? '#1e293b'              : '#e2e8f0';
  const langIdleBg= isDark ? '#1e293b'              : 'var(--bg-card)';
  const langIdleBdr=isDark ? '#334155'              : 'var(--border-glass)';
  const selectBg  = isDark ? '#1e293b'              : 'var(--bg-card)';
  const selectBdr = isDark ? '#334155'              : 'var(--border-glass)';
  const coverBg   = isDark ? 'linear-gradient(135deg,#0f2044 0%,#0f172a 100%)' : 'linear-gradient(135deg,#e8f0fe 0%,#f1f5fb 100%)';
  const coverBdr  = isDark ? '#1e293b'              : 'var(--border-glass)';
  const reportWrapBg = isDark ? '#0f172a'           : 'var(--bg-card)';
  const footerBdr    = isDark ? '#1e293b'           : 'var(--border-glass)';
  const footerTxt    = isDark ? '#334155'           : 'var(--text-muted)';
  const emptyIconClr = isDark ? '#334155'           : '#cbd5e1';
  const actionItemBg = isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.06)';
  const actionItemBdr= isDark ? 'rgba(34,197,94,0.2)'  : 'rgba(34,197,94,0.3)';
  const savBarBg     = isDark ? '#1e293b'           : '#e2e8f0';
  const infoBoxBg    = isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)';
  const infoBoxBdr   = isDark ? 'rgba(59,130,246,0.2)'  : 'rgba(59,130,246,0.25)';
  const infoBoxClr   = isDark ? '#93c5fd'           : '#1d4ed8';
  const warnBoxBg    = isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.06)';
  const warnBoxBdr   = isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.35)';
  const warnBoxClr   = isDark ? '#fcd34d'           : '#92400e';
  const radarGridClr = isDark ? '#1e293b'           : '#e2e8f0';
  const radarMaxStk  = isDark ? '#334155'           : '#cbd5e1';

  const S = {
    page:    { minHeight:'100vh', background:'var(--bg-main)', color:'var(--text-main)', fontFamily:'Inter,-apple-system,system-ui,sans-serif', padding:'28px 24px' } as React.CSSProperties,
    card:    { background: cardBg, border:`1px solid ${cardBdr}`, borderRadius:10, padding:'20px 22px' } as React.CSSProperties,
    cTitle:  { fontSize:'0.82rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:14 },
    secHead: { fontSize:'1rem', fontWeight:700, color:'var(--text-main)', display:'flex', alignItems:'center', gap:8, marginBottom:14 } as React.CSSProperties,
    muted:   { fontSize:'0.83rem', color:'var(--text-muted)', lineHeight:1.6 },
    infoBox: { background: infoBoxBg, border:`1px solid ${infoBoxBdr}`, borderRadius:8, padding:'12px 16px', fontSize:'0.83rem', color: infoBoxClr, lineHeight:1.7 } as React.CSSProperties,
    warnBox: { background: warnBoxBg, border:`1px solid ${warnBoxBdr}`, borderRadius:8, padding:'12px 16px', fontSize:'0.83rem', color: warnBoxClr, lineHeight:1.7 } as React.CSSProperties,
    statBox: (c: string) => ({ background:`${c}11`, border:`1px solid ${c}33`, borderRadius:8, padding:'14px 18px', flex:'1 1 160px', minWidth:150 } as React.CSSProperties),
    btnP:    { background:'#2563eb', color:'#fff', border:'none', borderRadius:7, padding:'9px 18px', cursor:'pointer', fontWeight:600, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:6 } as React.CSSProperties,
    btnG:    (c='#22c55e') => ({ background:`${c}15`, color:c, border:`1px solid ${c}40`, borderRadius:7, padding:'7px 14px', cursor:'pointer', fontWeight:600, fontSize:'0.83rem', display:'flex', alignItems:'center', gap:5 } as React.CSSProperties),
    langBtn: (active: boolean) => ({ background: active?'#3b82f6': langIdleBg, color: active?'#fff':'var(--text-muted)', border:`1px solid ${active?'#3b82f6': langIdleBdr}`, borderRadius:5, padding:'5px 12px', cursor:'pointer', fontWeight:600, fontSize:'0.82rem' } as React.CSSProperties),
  };

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.45rem', fontWeight:700, display:'flex', alignItems:'center', gap:9 }}>
            <FileText size={22} color="#3b82f6" /> {t.pageTitle}
          </h1>
          <p style={{ margin:'4px 0 0', ...S.muted }}>{t.pageSubtitle}</p>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {/* Language toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:6, background: langIdleBg, borderRadius:7, padding:'4px 6px', border:`1px solid ${langIdleBdr}` }}>
            <Globe size={14} color="#64748b" />
            <button style={S.langBtn(lang==='en')} onClick={() => setLang('en')}>EN</button>
            <button style={S.langBtn(lang==='gu')} onClick={() => setLang('gu')}>ગુ</button>
          </div>

          <VillageSelect
            villages={villages}
            value={selectedVillage}
            onChange={id => { setSelectedVillage(id); clearReport(); }}
            width={220}
          />

          <button style={{ ...S.btnP, opacity: loader.loading ? 0.65 : 1 }} onClick={handleGenerate} disabled={loader.loading}>
            {loader.loading ? <><RefreshCw size={14} className="spin" /> {loader.stage}</> : <><RefreshCw size={14} /> {t.generateBtn}</>}
          </button>

          {generated && (
            <>
              <button style={S.btnG('#22c55e')} onClick={downloadPdf}>
                <Download size={14} /> {t.pdfBtn}
              </button>
              <button style={S.btnG('#94a3b8')} onClick={() => window.print()}>
                <Printer size={14} /> {t.printBtn}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Boot / Loading animation ── */}
      {(loader.loading || !generated) && (
        <div style={{
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '48px 24px',
          borderRadius: 14,
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.13) 0%, transparent 70%), rgba(10,14,23,0.97)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.07) 0%, transparent 70%), rgba(248,250,252,0.97)',
          border: `1px solid ${cardBdr}`,
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Ambient grid lines */}
          <div style={{ position:'absolute', inset:0, backgroundImage: isDark
            ? 'linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)'
            : 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',
            backgroundSize:'40px 40px', pointerEvents:'none' }} />

          {/* Central ring stack */}
          <div style={{ position:'relative', width:120, height:120, marginBottom:28 }}>
            {/* Outer rotating ring */}
            <svg width={120} height={120} viewBox="0 0 120 120" style={{ position:'absolute', inset:0, animation:'bootRingOuter 2.4s linear infinite' }}>
              <circle cx={60} cy={60} r={52} fill="none" stroke={isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.12)'} strokeWidth={2}/>
              <circle cx={60} cy={60} r={52} fill="none" stroke="#3b82f6" strokeWidth={2.5}
                strokeDasharray="40 90" strokeLinecap="round"/>
            </svg>
            {/* Middle counter-rotating ring */}
            <svg width={120} height={120} viewBox="0 0 120 120" style={{ position:'absolute', inset:0, animation:'bootRingMid 1.8s linear infinite reverse' }}>
              <circle cx={60} cy={60} r={40} fill="none" stroke={isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.12)'} strokeWidth={2}/>
              <circle cx={60} cy={60} r={40} fill="none" stroke="#6366f1" strokeWidth={2}
                strokeDasharray="25 55" strokeLinecap="round"/>
            </svg>
            {/* Progress ring — fills based on step; full + pulsing when timer done & awaiting API */}
            {loader.loading && (() => {
              const pct = loader.timerDone ? 1 : (loader.totalSteps > 0 ? (loader.stageIdx + 1) / loader.totalSteps : 0);
              const rr = 28, circ = 2 * Math.PI * rr;
              return (
                <svg width={120} height={120} viewBox="0 0 120 120" style={{ position:'absolute', inset:0 }}>
                  <circle cx={60} cy={60} r={rr} fill="none" stroke={isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'} strokeWidth={4}/>
                  <circle cx={60} cy={60} r={rr} fill="none"
                    stroke={loader.timerDone ? '#3b82f6' : '#22c55e'} strokeWidth={4}
                    strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
                    style={{
                      transform:'rotate(-90deg)', transformOrigin:'center',
                      transition:'stroke-dasharray 0.5s ease, stroke 0.4s ease',
                      animation: loader.timerDone ? 'pulse 1.2s ease-in-out infinite' : 'none',
                    }}/>
                </svg>
              );
            })()}
            {/* Centre icon */}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {loader.loading
                ? <Droplet size={30} color="#3b82f6" style={{ filter:'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }}/>
                : <FileText size={30} color={isDark ? '#334155' : '#94a3b8'}/>
              }
            </div>
          </div>

          {/* Title / status */}
          {loader.loading ? (
            <>
              <div style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--text-main)', marginBottom:6, textAlign:'center' }}>
                {loader.timerDone
                  ? (lang === 'gu' ? 'ડેટા ચકાસી રહ્યા છીએ…' : 'Finalising intelligence…')
                  : loader.stage}
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:24, textAlign:'center', maxWidth:340 }}>
                {t.loading}
              </div>

              {/* Step list */}
              <div style={{ display:'flex', flexDirection:'column', gap:7, width:'100%', maxWidth:340 }}>
                {t.loadSteps.map((step, i) => {
                  // When timer has cycled through all steps, mark everything done
                  const allDone = loader.timerDone;
                  const done    = allDone || i < loader.stageIdx;
                  const active  = !allDone && i === loader.stageIdx;
                  const pending = !allDone && i > loader.stageIdx;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                      opacity: pending ? 0.38 : 1,
                      transition:'opacity 0.3s',
                    }}>
                      <div style={{
                        width:22, height:22, borderRadius:'50%', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'0.72rem', fontWeight:700,
                        background: done ? '#22c55e' : active ? '#3b82f6' : (isDark ? '#1e293b' : '#e2e8f0'),
                        color: (done || active) ? '#fff' : 'var(--text-muted)',
                        boxShadow: active ? '0 0 0 3px rgba(59,130,246,0.3)' : 'none',
                        transition:'all 0.3s',
                      }}>
                        {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      <span style={{
                        fontSize:'0.83rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--text-main)' : done ? (isDark ? '#22c55e' : '#15803d') : 'var(--text-muted)',
                        transition:'color 0.3s',
                      }}>{step}</span>
                      {active && <span style={{ marginLeft:'auto', display:'inline-block', width:14, height:14, borderRadius:'50%',
                        border:`2px solid #3b82f6`, borderTopColor:'transparent',
                        animation:'spin 0.8s linear infinite', flexShrink:0 }}/>}
                      {done && !active && (
                        <span style={{ marginLeft:'auto', display:'flex', alignItems:'center',
                          color: isDark ? '#22c55e' : '#15803d' }}><Check size={13} strokeWidth={2.5} /></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop:22, width:'100%', maxWidth:340, background: trackBg, borderRadius:6, height:4, overflow:'hidden' }}>
                <div style={{
                  background: loader.timerDone
                    ? 'linear-gradient(90deg,#22c55e,#3b82f6)'
                    : 'linear-gradient(90deg,#3b82f6,#6366f1)',
                  height:'100%', borderRadius:6,
                  width: loader.timerDone ? '100%'
                    : `${loader.totalSteps > 0 ? ((loader.stageIdx + 1) / loader.totalSteps) * 100 : 0}%`,
                  transition:'width 0.5s ease, background 0.4s ease',
                  animation: loader.timerDone ? 'pulse 1.2s ease-in-out infinite' : 'none',
                }}/>
              </div>
              <div style={{ marginTop:8, fontSize:'0.75rem', color:'var(--text-muted)' }}>
                {loader.timerDone
                  ? (lang === 'gu' ? 'પ્રતીક્ષા કરો…' : 'Waiting for data…')
                  : `${loader.stageIdx + 1} / ${loader.totalSteps}`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-main)', marginBottom:8, textAlign:'center' }}>
                {t.emptyTitle}
              </div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', textAlign:'center', maxWidth:340, lineHeight:1.65, marginBottom:28 }}>
                {t.emptyDesc}
              </div>

              {/* Quick-start steps */}
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
                {[
                  { icon: <MapPin size={22} color="#3b82f6" />, label: lang==='gu' ? 'ગ્રામ પસંદ કરો' : 'Select Village' },
                  { isArrow: true },
                  { icon: <Zap size={22} color="#f59e0b" />, label: lang==='gu' ? 'અહેવાલ ક્લિક' : 'Click Generate' },
                  { isArrow: true },
                  { icon: <BarChart3 size={22} color="#10b981" />, label: lang==='gu' ? 'ઈન્ટેલિજન્સ મળે' : 'Get Intelligence' },
                ].map((s: any, i) => s.isArrow
                  ? <span key={i} style={{ color:'var(--text-muted)', display:'flex', alignItems:'center' }}><ArrowRight size={16} /></span>
                  : (
                    <div key={i} style={{
                      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                      background: isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)',
                      border: `1px solid ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.2)'}`,
                      borderRadius:10, padding:'12px 18px', minWidth:90,
                    }}>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</span>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textAlign:'center' }}>{s.label}</span>
                    </div>
                  )
                )}
              </div>

              {/* Capability pills */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:22 }}>
                {['Groundwater Analysis','Drought Risk','Water Budget','AI Narrative','PDF Export'].map(cap => (
                  <span key={cap} style={{
                    fontSize:'0.73rem', fontWeight:600, padding:'3px 10px',
                    background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`,
                    color: isDark ? '#a5b4fc' : '#4f46e5',
                    borderRadius:20,
                  }}>{cap}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ REPORT ══════════════════════════════════════════════════════════ */}
      {generated && !loader.loading && (
        <div ref={previewRef} style={{ background: reportWrapBg, borderRadius:12, overflow:'hidden', border:`1px solid ${cardBdr}` }}>

          {/* Cover */}
          <div style={{ background: coverBg, borderBottom:`1px solid ${coverBdr}`, padding:'32px 30px 28px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Droplet size={22} color="#60a5fa" />
                  <span style={{ fontSize:'0.78rem', color:'#60a5fa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    {t.reportBrand}
                  </span>
                </div>
                <h2 style={{ margin:'0 0 4px', fontSize:'1.6rem', fontWeight:800, color:'var(--text-main)' }}>{villageName}</h2>
                <p style={{ margin:0, color:'var(--text-muted)', fontSize:'0.88rem' }}>
                  {district} · {new Date().toLocaleDateString(lang==='gu'?'gu-IN':'en-IN', { year:'numeric', month:'long', day:'numeric' })}
                </p>
              </div>
              <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
                {health && scoreRing(health.overall_score, 100, t.waterHealth)}
                {drought && scoreRing(Math.round(100 - drought.risk_score), 100, t.safetyScore)}
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
              {health && (
                <div style={{ display:'flex', alignItems:'center', gap:6, ...S.statBox(RISK_COLOR[health.category]??'#94a3b8') }}>
                  <Droplet size={16} color={RISK_COLOR[health.category]??'#94a3b8'} />
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.waterHealth}</div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)' }}>{health.overall_score}/100 — {badge(health.category)}</div>
                  </div>
                </div>
              )}
              {drought && (
                <div style={{ display:'flex', alignItems:'center', gap:6, ...S.statBox(RISK_COLOR[drought.risk_level]??'#94a3b8') }}>
                  <AlertTriangle size={16} color={RISK_COLOR[drought.risk_level]??'#94a3b8'} />
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.droughtRisk}</div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)' }}>{t.score} {drought.risk_score} — {badge(drought.risk_level)}</div>
                  </div>
                </div>
              )}
              {gw && (
                <div style={{ display:'flex', alignItems:'center', gap:6, ...S.statBox(RISK_COLOR[gw.trend]??'#94a3b8') }}>
                  {gw.trend==='DECLINING'?<TrendingDown size={16} color="#ef4444"/>:gw.trend==='IMPROVING'?<TrendingUp size={16} color="#22c55e"/>:<Minus size={16} color="#f59e0b"/>}
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.groundwater}</div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)' }}>{gw.current_depth_m}m — {badge(gw.trend)}</div>
                  </div>
                </div>
              )}
              {budget && (
                <div style={{ display:'flex', alignItems:'center', gap:6, ...S.statBox(budget.balance.deficit_mcm>0?'#ef4444':'#22c55e') }}>
                  {budget.balance.deficit_mcm>0?<XCircle size={16} color="#ef4444"/>:<CheckCircle size={16} color="#22c55e"/>}
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.waterBalance}</div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)' }}>
                      {budget.balance.deficit_mcm>0?`−${budget.balance.deficit_mcm} MCM`:`+${Math.abs(budget.balance.deficit_mcm)} MCM`} — {badge(budget.balance.status)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {report?.demo_mode && (
              <div style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(124,58,237,0.15)', color:'#c4b5fd', border:'1px solid rgba(124,58,237,0.3)', borderRadius:5, padding:'4px 10px', fontSize:'0.75rem' }}>
                <Clock size={12} /> {t.demoNotice}
              </div>
            )}
          </div>

          {/* Charts & sections */}
          <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}>

            {/* Row 1: GW + Drought */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {gwSeries.length>0 && (
                <div style={S.card}>
                  <div style={S.cTitle}><Droplet size={15} style={{ display:'inline', verticalAlign:'middle', marginRight:6, color:'#3b82f6' }} />{t.gwTrend}</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={gwSeries} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                      <defs>
                        <linearGradient id="gwG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fill:'#64748b', fontSize:10 }} interval={3}/>
                      <YAxis tick={{ fill:'#64748b', fontSize:10 }} reversed/>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any) => [`${v}m`,'Depth']}/>
                      <Area type="monotone" dataKey="depth" stroke="#3b82f6" fill="url(#gwG)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  {gw && (
                    <div style={{ marginTop:10, display:'flex', gap:14, flexWrap:'wrap' }}>
                      <span style={S.muted}>{t.changePerYear}: <strong style={{ color:'var(--text-main)' }}>+{gw.annual_change_m}m</strong></span>
                      <span style={S.muted}>{t.since2019}: <strong style={{ color:'#ef4444', display:'inline-flex', alignItems:'center', gap:2 }}><TrendingUp size={12} />{gw.change_pct_since_2019}%</strong></span>
                      <span style={S.muted}>{t.status}: {badge(gw.trend)}</span>
                    </div>
                  )}
                </div>
              )}
              {droughtBar.length>0 && (
                <div style={S.card}>
                  <div style={S.cTitle}><CloudRain size={15} style={{ display:'inline', verticalAlign:'middle', marginRight:6, color:'#f97316' }} />{t.droughtFactors}</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={droughtBar} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                      <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }}/>
                      <YAxis tick={{ fill:'#64748b', fontSize:10 }}/>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                      <Bar dataKey="score" radius={[4,4,0,0]}>
                        {droughtBar.map((_,i) => <Cell key={i} fill={['#f97316','#3b82f6','#8b5cf6'][i%3]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {drought && (
                    <div style={{ marginTop:10, display:'flex', gap:14, flexWrap:'wrap' }}>
                      <span style={S.muted}>{t.overall}: <strong style={{ color:'var(--text-main)' }}>{drought.risk_score}/100</strong></span>
                      <span style={S.muted}>{t.level}: {badge(drought.risk_level)}</span>
                      <span style={S.muted}>{t.confidence}: <strong style={{ color:'var(--text-main)' }}>{drought.confidence}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: Radar + Pie */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {healthRadar.length>0 && (
                <div style={S.card}>
                  <div style={S.cTitle}><Activity size={15} style={{ display:'inline', verticalAlign:'middle', marginRight:6, color:'#8b5cf6' }} />{t.healthBreakdown}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={healthRadar}>
                      <PolarGrid stroke={radarGridClr}/>
                      <PolarAngleAxis dataKey="axis" tick={{ fill:'var(--text-muted)', fontSize:11 }}/>
                      <Radar name={t.score} dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2}/>
                      <Radar name="Max"     dataKey="max"   stroke={radarMaxStk} fill="none" strokeDasharray="3 3"/>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                      <Legend wrapperStyle={{ color:'var(--text-muted)', fontSize:'0.78rem' }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {budgetPie.length>0 && (
                <div style={S.card}>
                  <div style={S.cTitle}><BarChart3 size={15} style={{ display:'inline', verticalAlign:'middle', marginRight:6, color:'#10b981' }} />{t.demandPie}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={budgetPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={{ stroke:'#334155' }}>
                        {budgetPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any) => [`${v} MCM`]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {budget && (
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:8 }}>
                      <span style={S.muted}>{t.supply}: <strong style={{ color:'#22c55e' }}>{budget.supply.total_mcm} MCM</strong></span>
                      <span style={S.muted}>{t.demand}: <strong style={{ color:'#f97316' }}>{budget.demand.total_mcm} MCM</strong></span>
                      <span style={S.muted}>{t.deficit}: <strong style={{ color: budget.balance.deficit_mcm>0?'#ef4444':'#22c55e' }}>{budget.balance.deficit_mcm>0?budget.balance.deficit_mcm:0} MCM</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Evidence */}
            {(drought||gw) && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                {gw && (gw.evidence?.length ?? 0) > 0 && (
                  <div style={S.card}>
                    <div style={S.secHead}><TrendingDown size={16} color="#ef4444"/> {t.gwEvidence}</div>
                    <ul style={{ margin:0, paddingLeft:18, display:'flex', flexDirection:'column', gap:6 }}>
                      {gw.evidence!.map((e,i) => <li key={i} style={{ ...S.muted, color:'var(--text-main)' }}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {drought && (drought.factors?.length ?? 0) > 0 && (
                  <div style={S.card}>
                    <div style={S.secHead}><AlertTriangle size={16} color="#f97316"/> {t.droughtEvidence}</div>
                    <ul style={{ margin:0, paddingLeft:18, display:'flex', flexDirection:'column', gap:6 }}>
                      {drought.factors!.map((f,i) => <li key={i} style={{ ...S.muted, color:'var(--text-main)' }}>{f}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Actions */}
            {drought && (drought.recommended_actions?.length ?? 0) > 0 && (
              <div style={S.card}>
                <div style={S.secHead}><CheckCircle size={16} color="#22c55e"/> {t.recommended}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                  {drought.recommended_actions!.map((a,i) => (
                    <div key={i} style={{ background: actionItemBg, border:`1px solid ${actionItemBdr}`, borderRadius:7, padding:'10px 14px', fontSize:'0.83rem', color: isDark ? '#d1fae5' : '#065f46', lineHeight:1.5, display:'flex', gap:8, alignItems:'flex-start' }}>
                      <span style={{ color:'#22c55e', fontWeight:700, marginTop:1 }}>{i+1}.</span>{a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Savings */}
            {budget && (budget.potential_savings?.length ?? 0) > 0 && (
              <div style={S.card}>
                <div style={S.secHead}><Droplet size={16} color="#3b82f6"/> {t.savings}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {budget.potential_savings!.map((s,i) => {
                    const pct = budget!.demand.total_mcm>0?(s.saving_mcm/budget!.demand.total_mcm)*100:0;
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:180, fontSize:'0.83rem', color:'var(--text-main)', flexShrink:0 }}>{s.measure}</div>
                        <div style={{ flex:1, background: savBarBg, borderRadius:4, height:8 }}>
                          <div style={{ width:`${Math.min(pct,100)}%`, background:'#3b82f6', height:'100%', borderRadius:4 }}/>
                        </div>
                        <div style={{ fontSize:'0.83rem', color:'#22c55e', width:70, textAlign:'right' }}>{s.saving_mcm} MCM</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Narrative */}
            {report?.report_text && (
              <div style={S.card}>
                <div style={S.secHead}><FileText size={16} color="#8b5cf6"/> {t.aiNarrative}</div>
                <div style={{ ...S.infoBox, whiteSpace:'pre-wrap', lineHeight:1.85, color: isDark ? '#e2e8f0' : '#1e3a5f', maxHeight:420, overflowY:'auto' }}>
                  {report.report_text}
                </div>
              </div>
            )}

            {/* Limitations */}
            <div style={S.warnBox}>
              <strong style={{ display:'flex', alignItems:'center', gap:6 }}>
                <AlertTriangle size={14}/> {t.limitations}
              </strong>
              <ul style={{ margin:'8px 0 0', paddingLeft:18, lineHeight:1.8 }}>
                <li>{t.lim1}</li><li>{t.lim2}</li><li>{t.lim3}</li><li>{t.lim4}</li>
              </ul>
            </div>

            {/* Footer */}
            <div style={{ borderTop:`1px solid ${footerBdr}`, paddingTop:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontSize:'0.75rem', color: footerTxt }}>{t.reportFooter}</span>
              <span style={{ fontSize:'0.75rem', color: footerTxt }}>
                {new Date().toLocaleString(lang==='gu'?'gu-IN':'en-IN')} · {t.demoData}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite}
        @keyframes bootRingOuter{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bootRingMid{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
