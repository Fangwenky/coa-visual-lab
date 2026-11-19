import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Menu, Search, X } from 'lucide-react';
import { MODULES } from './data/courseMeta';
import type { RouteId } from './types/course';
import OverviewView from './components/OverviewView';
import FormulaSheetView from './components/FormulaSheetView';
import Module1View from './modules/Module1View';
import Module2View from './modules/Module2View';
import Module3View from './modules/Module3View';
import Module4View from './modules/Module4View';
import Module5View from './modules/Module5View';
import Module6View from './modules/Module6View';

const STORAGE_KEY = 'bit-coa-mastered-modules-v1';

export default function App() {
  const [route, setRoute] = useState<RouteId>('overview');
  const [activeAnchor, setActiveAnchor] = useState<string>('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [doneModules, setDoneModules] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doneModules));
    } catch {
      // ignore storage errors
    }
  }, [doneModules]);

  const doneSet = useMemo(() => new Set(doneModules), [doneModules]);

  const toggleDone = (id: string) => {
    setDoneModules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const activeModule = useMemo(() => MODULES.find((m) => m.id === route) || null, [route]);

  const navigate = (nextRoute: RouteId, anchor?: string) => {
    setRoute(nextRoute);
    setMobileRailOpen(false);
    setSearchOpen(false);
    setQuery('');
    if (anchor) {
      setActiveAnchor(anchor);
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      setActiveAnchor('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Build search index across all modules & sections
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: { modId: RouteId; modCode: string; anchor: string; title: string; isLab?: boolean }[] = [];
    for (const m of MODULES) {
      for (const s of m.sections) {
        const hay = `${m.title} ${s.title} ${(s.keywords || []).join(' ')}`.toLowerCase();
        if (hay.includes(q)) {
          hits.push({ modId: m.id, modCode: m.code, anchor: s.id, title: s.title, isLab: s.isLab });
        }
      }
    }
    return hits.slice(0, 14);
  }, [query]);

  // Track active scroll anchor inside module pages
  useEffect(() => {
    if (!activeModule) return;
    const ids = activeModule.sections.map((s) => s.id);
    const onScroll = () => {
      let current = ids[0] || '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) {
          current = id;
        }
      }
      setActiveAnchor(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeModule]);

  return (
    <div className="app-shell">
      <header className="topbar">
        {activeModule && (
          <button
            type="button"
            className="mobile-rail-btn"
            aria-label="打开章节目录"
            onClick={() => setMobileRailOpen((v) => !v)}
          >
            {mobileRailOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        )}

        <button type="button" className="brand-btn" onClick={() => navigate('overview')}>
          <div className="brand-mark">COA</div>
          <div>
            <div className="brand-title">计算机组成与结构</div>
            <div className="brand-sub">BIT · 可视化交互复习台</div>
          </div>
        </button>

        <nav className="nav-tabs" aria-label="课程模块导航">
          <button
            type="button"
            className={`nav-tab ${route === 'overview' ? 'active' : ''}`}
            onClick={() => navigate('overview')}
          >
            总览
          </button>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`nav-tab ${route === m.id ? 'active' : ''}`}
              onClick={() => navigate(m.id)}
            >
              <span className="nav-tab-code">{m.code.replace('MOD-', 'M')}</span>
              <span>{m.shortTitle}</span>
            </button>
          ))}
          <button
            type="button"
            className={`nav-tab ${route === 'formulas' ? 'active' : ''}`}
            onClick={() => navigate('formulas')}
          >
            <BookOpen size={13} />
            <span>公式速查</span>
          </button>
        </nav>

        <div className="topbar-tools">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="search"
              className="search-input"
              placeholder="搜索知识点 / 实验..."
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
            />
            {searchOpen && query.trim().length > 0 && (
              <div className="search-dropdown">
                {searchResults.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--slate)' }}>
                    未找到 “{query}”，可尝试：补码、IEEE、Booth、寻址、Cache、流水线、DMA
                  </div>
                ) : (
                  searchResults.map((hit) => (
                    <button
                      key={`${hit.modId}-${hit.anchor}`}
                      type="button"
                      className="search-item"
                      onClick={() => navigate(hit.modId, hit.anchor)}
                    >
                      <span>
                        {hit.isLab && <span className="rail-lab-tag" style={{ marginRight: 6 }}>实验</span>}
                        {hit.title}
                      </span>
                      <span className="search-item-mod">{hit.modCode}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <span className="progress-pill">进度 {doneSet.size}/6</span>
        </div>
      </header>

      {route === 'overview' && <OverviewView doneSet={doneSet} onNavigate={navigate} />}
      {route === 'formulas' && <FormulaSheetView onNavigate={navigate} />}

      {activeModule && (
        <div className="workspace-body">
          <aside className={`left-rail ${mobileRailOpen ? 'open' : ''}`} aria-label="本模块目录">
            <div className="rail-module-badge">{activeModule.code}</div>
            <h2 className="rail-module-name">{activeModule.title}</h2>
            <div className="rail-meta">
              {activeModule.slideCount} 页课件 · {activeModule.labCount} 个交互实验台
            </div>
            <ul className="rail-list">
              {activeModule.sections.map((sec) => (
                <li key={sec.id}>
                  <button
                    type="button"
                    className={`rail-link ${activeAnchor === sec.id ? 'active' : ''}`}
                    onClick={() => navigate(activeModule.id, sec.id)}
                  >
                    <span>{sec.title}</span>
                    {sec.isLab && <span className="rail-lab-tag">LAB</span>}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="main-sheet" onClick={() => setSearchOpen(false)}>
            <div className="sheet-inner">
              {route === 'm1' && <Module1View isDone={doneSet.has('m1')} onToggleDone={toggleDone} onNavigate={navigate} />}
              {route === 'm2' && <Module2View isDone={doneSet.has('m2')} onToggleDone={toggleDone} onNavigate={navigate} />}
              {route === 'm3' && <Module3View isDone={doneSet.has('m3')} onToggleDone={toggleDone} onNavigate={navigate} />}
              {route === 'm4' && <Module4View isDone={doneSet.has('m4')} onToggleDone={toggleDone} onNavigate={navigate} />}
              {route === 'm5' && <Module5View isDone={doneSet.has('m5')} onToggleDone={toggleDone} onNavigate={navigate} />}
              {route === 'm6' && <Module6View isDone={doneSet.has('m6')} onToggleDone={toggleDone} onNavigate={navigate} />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
