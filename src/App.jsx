import React, { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { HubHome } from './components/HubHome';
import { HubWMart } from './components/HubWMart';
import { WarehouseSidebar } from './components/WarehouseSidebar';
import { EcountSidebar } from './components/EcountSidebar';
import { WarehouseRuleViewer } from './components/WarehouseRuleViewer';
import { WarehouseMap } from './components/WarehouseMap';
import { EcountViewer } from './components/EcountViewer';
import { LanguageSelector } from './components/LanguageSelector';
import { Bars3Icon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from './components/Icons';

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash === 'hub') return { manual: 'hub', page: 0 };
  if (hash === 'wmart' || hash.startsWith('wmart/')) return { manual: 'wmart', page: 0 };
  if (hash.startsWith('warehouse')) {
    const page = Number(hash.split('/')[1] ?? 0);
    return { manual: 'warehouse', page: Number.isFinite(page) ? Math.max(0, page) : 0 };
  }
  if (hash.startsWith('ecount')) {
    const page = Number(hash.split('/')[1] ?? 0);
    return { manual: 'ecount', page: Number.isFinite(page) ? Math.max(0, page) : 0 };
  }
  return { manual: 'hub', page: 0 };
}

function navigate(manual, page = 0) {
  if (manual === 'hub') {
    window.location.hash = '#/';
    return;
  }
  if (manual === 'wmart') {
    window.location.hash = '#/wmart';
    return;
  }
  window.location.hash = `#/${manual}/${page}`;
}

export function App() {
  const { t } = useLanguage();
  const [route, setRoute] = useState(parseHash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const warehousePages = t.warehouse.pages;
  const ecountPages = t.ecount;

  const goToHub = () => navigate('hub');
  const goToWMart = () => navigate('wmart');
  const goToWarehouse = (p = 0) => {
    const safeP = Math.max(0, Math.min(warehousePages.length - 1, p));
    navigate('warehouse', safeP);
  };
  const goToEcount = (p = 0) => {
    const safeP = Math.max(0, Math.min(ecountPages.length - 1, p));
    navigate('ecount', safeP);
  };

  const selectWarehouseChapter = (chapterId) => {
    const pageIdx = warehousePages.findIndex((p) => p.chapter === chapterId);
    goToWarehouse(pageIdx >= 0 ? pageIdx : 0);
  };

  // 1. Hub
  if (route.manual === 'hub') {
    return <HubHome onOpenWmart={goToWMart} />;
  }

  // 2. W MART Sub-hub
  if (route.manual === 'wmart') {
    return (
      <HubWMart
        onBack={goToHub}
        onOpenWarehouse={() => goToWarehouse(0)}
        onOpenEcount={() => goToEcount(0)}
      />
    );
  }

  // 3. ECOUNT Manual
  if (route.manual === 'ecount') {
    const safeIdx = Math.min(route.page, ecountPages.length - 1);
    const currentPage = ecountPages[safeIdx] ?? ecountPages[0];

    return (
      <div className="app-shell">
        <EcountSidebar
          pageIndex={safeIdx}
          onSelectPage={goToEcount}
          onHome={goToWMart}
          open={mobileMenuOpen}
        />
        <main className="main">
          <div className="mobile-bar">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={t.common.tocTitle}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              {t.common.tocTitle}
            </button>
            <strong>{t.common.ecountManualTitle}</strong>
            <LanguageSelector className="mobile-lang-selector" />
          </div>

          {mobileMenuOpen && (
            <button
              type="button"
              className="nav-backdrop"
              aria-label={t.common.tocClose}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <article className="page">
            <div className="page-inner">
              <header className="page-head">
                <div className="page-head-top">
                  <div>
                    <h2>{currentPage.title}</h2>
                    <p>{currentPage.sub}</p>
                  </div>
                  <LanguageSelector className="desktop-lang-selector" />
                </div>
                <div className="page-meta mono">
                  {String(safeIdx + 1).padStart(2, '0')} / {String(ecountPages.length).padStart(2, '0')}
                </div>
              </header>

              <EcountViewer pageIndex={safeIdx} />

              <nav className="pager" aria-label="페이지 이동">
                <button
                  type="button"
                  disabled={safeIdx <= 0}
                  onClick={() => goToEcount(safeIdx - 1)}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  {t.common.prevBtn}
                </button>
                <button type="button" onClick={goToWMart}>
                  {t.common.homeBtn}
                </button>
                <button
                  type="button"
                  disabled={safeIdx >= ecountPages.length - 1}
                  onClick={() => goToEcount(safeIdx + 1)}
                >
                  {t.common.nextBtn}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </article>
        </main>
      </div>
    );
  }

  // 4. Warehouse Manual (Default)
  const safeIdx = Math.min(route.page, warehousePages.length - 1);
  const currentPage = warehousePages[safeIdx] ?? warehousePages[0];
  const chapter = currentPage.chapter;

  return (
    <div className="app-shell">
      <WarehouseSidebar
        chapter={chapter}
        onSelect={selectWarehouseChapter}
        onHome={goToWMart}
        open={mobileMenuOpen}
      />
      <main className="main">
        <div className="mobile-bar">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={t.common.tocTitle}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            {t.common.tocTitle}
          </button>
          <strong>{t.common.warehouseManualTitle}</strong>
          <LanguageSelector className="mobile-lang-selector" />
        </div>

        {mobileMenuOpen && (
          <button
            type="button"
            className="nav-backdrop"
            aria-label={t.common.tocClose}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <article className="page">
          <div className="page-inner">
            <header className="page-head">
              <div className="page-head-top">
                <div>
                  <h2>{t.warehouse.chapters[chapter]}</h2>
                  <p>{currentPage.sub}</p>
                </div>
                <LanguageSelector className="desktop-lang-selector" />
              </div>
              <div className="page-meta mono">
                {String(safeIdx + 1).padStart(2, '0')} / {String(warehousePages.length).padStart(2, '0')}
              </div>
            </header>

            {chapter === 'map' ? (
              <WarehouseMap />
            ) : (
              <WarehouseRuleViewer pageIndex={currentPage.rulePage ?? 0} />
            )}

            <nav className="pager" aria-label="페이지 이동">
              <button
                type="button"
                disabled={safeIdx <= 0}
                onClick={() => goToWarehouse(safeIdx - 1)}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t.common.prevBtn}
              </button>
              <button type="button" onClick={goToWMart}>
                {t.common.homeBtn}
              </button>
              <button
                type="button"
                disabled={safeIdx >= warehousePages.length - 1}
                onClick={() => goToWarehouse(safeIdx + 1)}
              >
                {t.common.nextBtn}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </article>
      </main>
    </div>
  );
}
