/**
 * VillageSelect – custom styled village picker used across all pages.
 * Replaces the browser-native <select> which had inconsistent OS styling.
 * Supports both dark and light themes via CSS variable classes.
 */
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { Village } from '../services/api';

interface Props {
  villages: Village[];
  value: string;
  onChange: (id: string) => void;
  width?: number | string;
  /** Align the dropdown to the right edge of the trigger (use when near right edge of viewport) */
  dropdownAlign?: 'left' | 'right';
}

export default function VillageSelect({ villages, value, onChange, width = 220, dropdownAlign = 'left' }: Props) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const containerRef          = useRef<HTMLDivElement>(null);
  const searchRef             = useRef<HTMLInputElement>(null);

  const selected = villages.find(v => v.village_id === value);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? villages.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.district.toLowerCase().includes(query.toLowerCase())
      )
    : villages;

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <style>{`
        .vs-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: var(--vs-bg, var(--bg-dark));
          border: 1px solid var(--vs-border, rgba(59,130,246,0.25));
          border-radius: 8px;
          color: var(--text-main);
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-align: left;
          font-family: inherit;
        }
        .vs-trigger.open {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }
        .vs-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          min-width: 100%;
          background: var(--vs-dropdown-bg, #0f1829);
          border: 1px solid var(--vs-dropdown-border, rgba(59,130,246,0.35));
          border-radius: 10px;
          box-shadow: var(--vs-shadow, 0 16px 48px rgba(0,0,0,0.85));
          z-index: 9999;
          overflow: hidden;
        }
        .vs-search-wrap {
          padding: 10px 12px 8px;
          border-bottom: 1px solid var(--vs-divider, #1e2d45);
        }
        .vs-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--vs-search-bg, #1a2540);
          padding: 8px 12px;
          border-radius: 6px;
        }
        .vs-search-box input {
          background: none;
          border: none;
          outline: none;
          box-shadow: none;
          color: var(--vs-input-color, #f1f5f9);
          caret-color: #60a5fa;
          font-size: 0.85rem;
          width: 100%;
          padding: 0;
          line-height: 1.4;
          border-radius: 0;
          -webkit-text-fill-color: var(--vs-input-color, #f1f5f9);
          font-family: inherit;
        }
        .vs-search-box input::placeholder {
          color: var(--vs-placeholder, #4b6080);
          -webkit-text-fill-color: var(--vs-placeholder, #4b6080);
        }
        .vs-options {
          max-height: 252px;
          overflow-y: auto;
          padding: 4px 0;
        }
        .vs-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--vs-opt-bg, #0f1829);
          border: none;
          border-left: 3px solid transparent;
          color: var(--vs-opt-color, #e2e8f0);
          cursor: pointer;
          font-size: 0.875rem;
          text-align: left;
          transition: background 0.15s;
          line-height: 1.4;
          font-family: inherit;
        }
        .vs-option:hover {
          background: var(--vs-opt-hover, #1a2540);
        }
        .vs-option-active {
          background: var(--vs-opt-active-bg, rgba(59,130,246,0.18)) !important;
          border-left-color: var(--primary);
          color: var(--vs-opt-active-color, #93c5fd) !important;
        }
        .vs-empty {
          padding: 14px 16px;
          color: #64748b;
          font-size: 0.83rem;
        }
        .vs-district-tag {
          font-size: 0.72rem;
          color: var(--vs-district, #4b6080);
          flex-shrink: 0;
          padding-left: 6px;
        }
        /* ── Light theme overrides ── */
        [data-theme="light"] .vs-trigger {
          --vs-bg: #ffffff;
          --vs-border: rgba(37,99,235,0.3);
        }
        [data-theme="light"] .vs-dropdown {
          --vs-dropdown-bg: #ffffff;
          --vs-dropdown-border: rgba(37,99,235,0.25);
          --vs-shadow: 0 8px 32px rgba(0,0,0,0.12);
          --vs-divider: rgba(0,0,0,0.08);
        }
        [data-theme="light"] .vs-search-box {
          --vs-search-bg: #f1f5f9;
          --vs-input-color: #0f172a;
          --vs-placeholder: #94a3b8;
          background: #f1f5f9;
        }
        [data-theme="light"] .vs-search-box input {
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }
        [data-theme="light"] .vs-search-box input::placeholder {
          color: #94a3b8;
          -webkit-text-fill-color: #94a3b8;
        }
        [data-theme="light"] .vs-option {
          background: #ffffff;
          color: #1e293b;
        }
        [data-theme="light"] .vs-option:hover {
          background: #f1f5f9;
        }
        [data-theme="light"] .vs-option-active {
          background: rgba(37,99,235,0.1) !important;
          color: #1d4ed8 !important;
        }
        [data-theme="light"] .vs-district-tag {
          color: #64748b;
        }
        [data-theme="light"] .vs-empty {
          color: #94a3b8;
        }
      `}</style>
      <div ref={containerRef} style={{ position: 'relative', width }}>
        {/* Trigger button */}
        <button
          type="button"
          className={`vs-trigger${open ? ' open' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          <MapPin size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.name : 'Select village…'}
          </span>
          {selected && (
            <span style={{
              fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400,
              background: 'var(--border-glass)', borderRadius: 3,
              padding: '1px 5px', flexShrink: 0,
            }}>
              {selected.district}
            </span>
          )}
          <ChevronDown
            size={14}
            color="var(--text-muted)"
            style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className="vs-dropdown"
            style={{
              ...(dropdownAlign === 'right' ? { right: 0 } : { left: 0 }),
              width: Math.max(typeof width === 'number' ? width : 220, 240),
            }}
          >
            {/* Search */}
            {villages.length > 5 && (
              <div className="vs-search-wrap">
                <div className="vs-search-box">
                  <Search size={14} color="#4b6080" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search village or district…"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="vs-options">
              {filtered.length === 0 ? (
                <div className="vs-empty">No villages match "{query}"</div>
              ) : filtered.map(v => {
                const isActive = v.village_id === value;
                return (
                  <button
                    key={v.village_id}
                    type="button"
                    className={`vs-option${isActive ? ' vs-option-active' : ''}`}
                    onClick={() => handleSelect(v.village_id)}
                  >
                    <MapPin size={13} color={isActive ? '#3b82f6' : '#60a5fa'} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{v.name}</span>
                    <span className="vs-district-tag">{v.district}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
