import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'gu';

// ─── Translation dictionary ───────────────────────────────────────────────────
const TRANSLATIONS = {
  // ── Topbar / layout ────────────────────────────────────────────────────────
  admin:          { en: 'Admin',          gu: 'એડમિન' },
  logout:         { en: 'Logout',         gu: 'લૉગ આઉટ' },
  settings:       { en: 'Settings',       gu: 'સેટિંગ્સ' },
  adminDashboard: { en: 'Admin Dashboard',gu: 'એડમિન ડૅશબોર્ડ' },
  administrator:  { en: 'Administrator',  gu: 'વ્યવસ્થાપક' },
  waterAdmin:     { en: 'Water Administrator', gu: 'જળ વ્યવસ્થાપક' },

  // ── Sidebar section labels ──────────────────────────────────────────────────
  overview:        { en: 'Overview',          gu: 'સંક્ષિપ્ત' },
  waterIntelligence:{ en: 'Water Intelligence',gu: 'જળ બુદ્ધિ' },
  agriculture:     { en: 'Agriculture',       gu: 'ખેતી' },
  interventions:   { en: 'Interventions',     gu: 'હસ્તક્ષેપ' },
  aiIntelligence:  { en: 'AI Intelligence',   gu: 'AI બુદ્ધિ' },
  dataAndField:    { en: 'Data & Field',      gu: 'ડેટા & ક્ષેત્ર' },
  administration:  { en: 'Administration',    gu: 'વહીવટ' },

  // ── Sidebar nav labels ──────────────────────────────────────────────────────
  dashboard:           { en: 'Dashboard',          gu: 'ડૅશબોર્ડ' },
  hydroAtlas:          { en: 'Hydro Atlas',         gu: 'હાઇડ્રો એટ્લાસ' },
  alerts:              { en: 'Alerts',              gu: 'ચેતવણીઓ' },
  groundwaterExplorer: { en: 'Groundwater Explorer',gu: 'ભૂગર્ભ જળ અન્વેષક' },
  droughtMonitor:      { en: 'Drought Monitor',     gu: 'દુષ્કાળ મૉનિટર' },
  waterBudget:         { en: 'Water Budget',        gu: 'જળ બજેટ' },
  whatIfSimulator:     { en: 'What-If Simulator',   gu: 'શું-જો સિમ્યુલેટર' },
  cropAdvisor:         { en: 'Crop Advisor',        gu: 'પાક સલાહ' },
  rechargePlanner:     { en: 'Recharge Planner',    gu: 'રિચાર્જ આયોજક' },
  communityPriority:   { en: 'Community Priority',  gu: 'સામુદાયિક પ્રાથમિકતા' },
  interventionImpact:  { en: 'Intervention Impact', gu: 'હસ્તક્ષેપ પ્રભાવ' },
  actionPlans:         { en: 'Action Plans',        gu: 'ક્રિયા યોજનાઓ' },
  waterCopilot:        { en: 'Water Copilot',       gu: 'વૉટર કો-પાઇલટ' },
  agentTrace:          { en: 'Agent Trace',         gu: 'એજન્ટ ટ્રેસ' },
  aiReports:           { en: 'AI Reports',          gu: 'AI અહેવાલ' },
  approvals:           { en: 'Approvals',           gu: 'મંજૂરી' },
  dataTrust:           { en: 'Data Trust',          gu: 'ડેટા વિશ્વાસ' },
  villages:            { en: 'Villages',            gu: 'ગામ' },
  dataSources:         { en: 'Data Sources',        gu: 'ડેટા સ્ત્રોત' },

  // ── Common actions / labels ─────────────────────────────────────────────────
  refresh:        { en: 'Refresh',        gu: 'તાજું કરો' },
  search:         { en: 'Search',         gu: 'શોધો' },
  filter:         { en: 'Filter',         gu: 'ફિલ્ટર' },
  save:           { en: 'Save',           gu: 'સાચવો' },
  cancel:         { en: 'Cancel',         gu: 'રદ કરો' },
  delete:         { en: 'Delete',         gu: 'ભૂંસો' },
  edit:           { en: 'Edit',           gu: 'સંપાદિત કરો' },
  view:           { en: 'View',           gu: 'જુઓ' },
  add:            { en: 'Add',            gu: 'ઉમેરો' },
  close:          { en: 'Close',          gu: 'બંધ કરો' },
  back:           { en: 'Back',           gu: 'પાછળ' },
  approve:        { en: 'Approve',        gu: 'મંજૂર કરો' },
  reject:         { en: 'Reject',         gu: 'નામંજૂર' },
  submit:         { en: 'Submit',         gu: 'સ્વીકારો' },
  loading:        { en: 'Loading…',       gu: 'લોડ થઈ રહ્યું છે…' },
  export:         { en: 'Export',         gu: 'નિકાસ' },
  download:       { en: 'Download',       gu: 'ડાઉનલોડ' },
  noData:         { en: 'No data found',  gu: 'કોઈ ડેટા મળ્યો નથી' },
  status:         { en: 'Status',         gu: 'સ્થિતિ' },
  priority:       { en: 'Priority',       gu: 'પ્રાધાન્ય' },
  village:        { en: 'Village',        gu: 'ગામ' },
  district:       { en: 'District',       gu: 'જિલ્લો' },
  date:           { en: 'Date',           gu: 'તારીખ' },
  all:            { en: 'All',            gu: 'બધા' },
  type:           { en: 'Type',           gu: 'પ્રકાર' },
  details:        { en: 'Details',        gu: 'વિગત' },
  confirm:        { en: 'Confirm',        gu: 'પુષ્ટિ' },
  create:         { en: 'Create',         gu: 'બનાવો' },
  update:         { en: 'Update',         gu: 'અપડેટ' },
  notes:          { en: 'Notes',          gu: 'નોંધ' },
  comment:        { en: 'Comment',        gu: 'ટિપ્પણી' },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  regionalWaterIntelligence: { en: 'Regional Water Intelligence',  gu: 'પ્રાદેશિક જળ બુદ્ધિ' },
  districtsMonitored:        { en: 'Districts Monitored',          gu: 'જિલ્લા નિગેખ હેઠળ' },
  criticalDistricts:         { en: 'Critical Districts',           gu: 'ગંભીર જિલ્લા' },
  waterHealthScore:          { en: 'Water Health Score',           gu: 'જળ સ્વાસ્થ્ય સ્કોર' },
  gwAvgDepth:                { en: 'GW Avg Depth',                 gu: 'ભૂ-જળ સરેરાશ ઊંડાઈ' },
  droughtRisk:               { en: 'Drought Risk',                 gu: 'દુષ્કાળ જોખમ' },
  rainfallAnomaly:           { en: 'Rainfall Anomaly',             gu: 'વરસાદ વિચલન' },
  rechargePotential:         { en: 'Recharge Potential',           gu: 'રિચાર્જ ક્ષમતા' },
  regionalWaterSituation:    { en: 'Regional Water Situation',     gu: 'પ્રાદેશિક જળ સ્થિતિ' },
  top5PriorityAreas:         { en: 'Top 5 Priority Areas',         gu: 'ટોચ 5 પ્રાથમિક ક્ષેત્રો' },
  allDistricts:              { en: 'All Districts',                gu: 'બધા જિલ્લા' },
  location:                  { en: 'Location',                     gu: 'સ્થળ' },
  waterHealth:               { en: 'Water Health',                 gu: 'જળ સ્વાસ્થ્ય' },
  gwTrend:                   { en: 'GW Trend',                     gu: 'ભૂ-જળ પ્રવૃત્તિ' },
  aiPriority:                { en: 'AI Priority',                  gu: 'AI પ્રાધાન્ય' },
  recommendedAction:         { en: 'Recommended Action',           gu: 'ભલામણ કરેલ ક્રિયા' },
  analyzeRegion:             { en: 'Analyze Region',               gu: 'પ્રદેશ વિશ્લેષণ' },
  viewPriorityAreas:         { en: 'View Priority Areas',          gu: 'પ્રાથમિક ક્ષેત્ર જુઓ' },
  createActionPlan:          { en: 'Create Action Plan',           gu: 'ક્રિયા યોજના બનાવો' },
  recentAlerts:              { en: 'Recent Alerts',                gu: 'તાજેતરની ચેતવણી' },
  viewAll:                   { en: 'View All',                     gu: 'બધા જુઓ' },
  regionSummary:             { en: 'Region Summary',               gu: 'પ્રદેશ સારાંશ' },
  aiInsights:                { en: 'AI Insights',                  gu: 'AI આંતરદૃષ્ટિ' },

  // ── Action Plans ────────────────────────────────────────────────────────────
  actionPlan:         { en: 'Action Plans',        gu: 'ક્રિયા યોજના' },
  title:              { en: 'Title',               gu: 'શીર્ષક' },
  interventionType:   { en: 'Intervention Type',   gu: 'હસ્તક્ષેپ પ્રકાર' },
  budget:             { en: 'Budget',              gu: 'બજેટ' },
  startDate:          { en: 'Start Date',          gu: 'પ્રારંભ તારીખ' },
  targetDate:         { en: 'Target Date',         gu: 'લક્ષ્ય તારીખ' },
  owner:              { en: 'Owner',               gu: 'માલિક' },
  description:        { en: 'Description',         gu: 'વર્ણન' },
  planned:            { en: 'Planned',             gu: 'આયોજિત' },
  inProgress:         { en: 'In Progress',         gu: 'પ્રગતિ હેઠળ' },
  completed:          { en: 'Completed',           gu: 'પૂર્ણ' },
  newPlan:            { en: 'New Plan',            gu: 'નવી યોજના' },

  // ── Approvals ───────────────────────────────────────────────────────────────
  pending:           { en: 'Pending',              gu: 'પ્રતીક્ષા' },
  approved:          { en: 'Approved',             gu: 'મંજૂર' },
  rejected:          { en: 'Rejected',             gu: 'નામંજૂર' },
  confidence:        { en: 'Confidence',           gu: 'વિશ્વાસ' },
  aiRecommendations: { en: 'AI Recommendations',  gu: 'AI ભલામણ' },
  reason:            { en: 'Reason',               gu: 'કારણ' },

  // ── Alerts ──────────────────────────────────────────────────────────────────
  severity:          { en: 'Severity',             gu: 'ગંભીરતા' },
  critical:          { en: 'Critical',             gu: 'ગંભીર' },
  high:              { en: 'High',                 gu: 'ઊંચ' },
  medium:            { en: 'Medium',               gu: 'મધ્યમ' },
  low:               { en: 'Low',                  gu: 'ઓછ' },
  source:            { en: 'Source',               gu: 'સ્ત્રોત' },
  detected:          { en: 'Detected',             gu: 'ચિહ્નિત' },
  backToAlerts:      { en: 'Back to Alerts',       gu: 'ચેતવણી પર પાછળ' },
  groundwaterDepletion: { en: 'Groundwater Depletion', gu: 'ભૂ-જળ ઘટાડ' },
  whyAlertOccurred:  { en: 'Why Did This Alert Occur?', gu: 'આ ચેતવણી શા માટે?' },
  aiExplanation:     { en: 'AI Explanation',       gu: 'AI સ્પષ્ટીકરણ' },
  takeAction:        { en: 'Take Action',          gu: 'ક્રિયા કરો' },
  groundwaterDecline: { en: 'Groundwater Decline', gu: 'ભૂ-જળ ઘટ' },
  extraction:        { en: 'Extraction',           gu: 'ઉત્ખનન' },
  recharge:          { en: 'Recharge',             gu: 'રિચાર્જ' },
  historicalTrend:   { en: 'Historical Trend',     gu: 'ઐતિહાસિક ક્રમ' },

  // ── Villages ────────────────────────────────────────────────────────────────
  population:        { en: 'Population',           gu: 'વસ્તી' },
  households:        { en: 'Households',           gu: 'ઘર' },
  area:              { en: 'Area (ha)',             gu: 'ક્ષેત્ર (હૅ)' },
  crops:             { en: 'Crops',                gu: 'પાક' },
  aquifer:           { en: 'Aquifer',              gu: 'ભૂ-જળ સ્તર' },
  rainfall:          { en: 'Rainfall (mm)',        gu: 'વરસાદ (mm)' },
  addVillage:        { en: 'Add Village',          gu: 'ગામ ઉમેરો' },
  taluka:            { en: 'Taluka',               gu: 'તાલુકો' },

  // ── Agent Trace ─────────────────────────────────────────────────────────────
  runAllAgents:      { en: 'Run All Agents',       gu: 'બધા એજન્ટ ચલાવો' },
  selectVillage:     { en: 'Select Village',       gu: 'ગામ પસંદ કરો' },
  agentPipeline:     { en: 'Agent Pipeline',       gu: 'એજન્ટ પાઇપલાઇન' },
  executionTimeline: { en: 'Execution Timeline',   gu: 'અમલ ટાઇમલાઇન' },
  finalRecommendation:{ en: 'Final Recommendation',gu: 'અંતિમ ભલામણ' },
  analysisResult:    { en: 'Analysis Result',      gu: 'વિશ્લેષણ પરિણામ' },

  // ── Field Reports ───────────────────────────────────────────────────────────
  fieldReports:      { en: 'Field Reports',        gu: 'ક્ષેત્ર અહેવાલ' },
  reporter:          { en: 'Reporter',             gu: 'અહેવાલ લેખક' },
  assignedTo:        { en: 'Assigned To',          gu: 'સોંપ્યું' },
  category:          { en: 'Category',             gu: 'કેટેગરી' },
  aiAnalysis:        { en: 'AI Analysis',          gu: 'AI વિશ્લેષણ' },
  underReview:       { en: 'Under Review',         gu: 'સમીક્ષા હેઠળ' },
  resolved:          { en: 'Resolved',             gu: 'નિરાકરણ' },
  assignReport:      { en: 'Assign Report',        gu: 'અહેવાલ સોંપો' },
  
  // ── Farmers & Users ─────────────────────────────────────────────────────────
  farmerPortal:      { en: 'Farmer Portal',        gu: 'ખેડૂત પોર્ટલ' },
  farmersAndUsers:   { en: 'Farmers & Users',      gu: 'ખેડૂતો અને વપરાશકર્તાઓ' },
  farmerLogin:       { en: 'Farmer Login',         gu: 'ખેડૂત લૉગિન' },
  farmerSignup:      { en: 'Farmer Sign Up',       gu: 'ખેડૂત નોંધણી' },
  farmerDashboard:   { en: 'Farmer Dashboard',     gu: 'ખેડૂત ડૅશબોર્ડ' },
  landArea:          { en: 'Land Area (Ha)',       gu: 'જમીન ક્ષેત્રફળ (હે.)' },
  primaryCrops:      { en: 'Primary Crops',        gu: 'મુખ્ય પાક' },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

// ─── Context ──────────────────────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => TRANSLATIONS[key].en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('jalrakshak-admin-lang');
    return saved === 'gu' ? 'gu' : 'en';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('jalrakshak-admin-lang', l);
  };

  const t = (key: TranslationKey): string => TRANSLATIONS[key][lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLanguage = () => useContext(LangContext);
