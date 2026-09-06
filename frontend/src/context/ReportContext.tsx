import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for the report data (simplified for demo)
export interface ReportSection {
  title: string;
  content: ReactNode;
}

export interface ReportData {
  villageId: string;
  villageName: string;
  reportType?: string;
  period?: string;
  generatedAt: string; // ISO string
  demoData?: boolean;
  sections?: ReportSection[];
}

export interface ReportHistoryItem extends ReportData {
  id: string; // unique id
  type?: string;
  content?: string;
}

interface ReportContextProps {
  reportData: ReportData | null;
  setReportData: (data: ReportData | null) => void;
  history: ReportHistoryItem[];
  addToHistory: (item: ReportHistoryItem) => void;
  addReport: (item: ReportHistoryItem) => void;
  clearHistory: () => void;
}

const ReportContext = createContext<ReportContextProps | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  // Load persisted history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('communityReportHistory');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse report history', e);
      }
    }
  }, []);

  // Persist history whenever it changes
  useEffect(() => {
    localStorage.setItem('communityReportHistory', JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: ReportHistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  const addReport = (item: ReportHistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('communityReportHistory');
  };

  return (
    <ReportContext.Provider value={{ reportData, setReportData, history, addToHistory, addReport, clearHistory }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = (): ReportContextProps => {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error('useReport must be used within ReportProvider');
  }
  return ctx;
};
