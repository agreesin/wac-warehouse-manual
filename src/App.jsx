import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './context/LanguageContext';
import { HubHome } from './components/HubHome';
import { HubWMart } from './components/HubWMart';
import { WarehouseSidebar } from './components/WarehouseSidebar';
import { EcountSidebar } from './components/EcountSidebar';
import { WarehouseRuleViewer } from './components/WarehouseRuleViewer';
import { WarehouseMap } from './components/WarehouseMap';
import { EcountViewer } from './components/EcountViewer';
import { LanguageSelector } from './components/LanguageSelector';
import { ImageModal } from './components/ImageModal';
import { QuickSearchModal } from './components/QuickSearchModal';
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
  const { lang, t } = useLanguage();
  const [route, setRoute] = useState(parseHash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Touch swipe tracking ref
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
      setMobileMenuOpen(false);
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global hotkey for search: '/' or 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !searchOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

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

  const handleOpenImage = (src, alt, caption) => {
    setModalImage({ src, alt, caption });
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e, currentManual, currentIdx, maxIdx) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Only treat as swipe if horizontal movement is strong and vertical movement is minor
      if (deltaTime < 500 && Math.abs(deltaX) > 65 && Math.abs(deltaY) < 55) {
        if (deltaX < 0 && currentIdx < maxIdx) {
          // Swiped left -> Next page
          if (currentManual === 'warehouse') goToWarehouse(currentIdx + 1);
          else if (currentManual === 'ecount') goToEcount(currentIdx + 1);
        } else if (deltaX > 0 && currentIdx > 0) {
          // Swiped right -> Previous page
          if (currentManual === 'warehouse') goToWarehouse(currentIdx - 1);
          else if (currentManual === 'ecount') goToEcount(currentIdx - 1);
        }
      }
    }
  };

  const searchBtnLabel = lang === 'en' ? 'Search (Ctrl+K)' : lang === 'zh-HK' ? '搜尋 (Ctrl+K)' : '빠른 검색 (Ctrl+K)';

  const handleNavigateFromSearch = (manual, page) => {
    document.body.style.overflow = '';
    setSearchOpen(false);

    if (manual === 'warehouse') goToWarehouse(page);
    else if (manual === 'ecount') goToEcount(page);

    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => {
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'instant' });
    }, 50);
  };

  let mainContent = null;

  if (route.manual === 'hub') {
    mainContent = <HubHome onOpenWmart={goToWMart} />;
  } else if (route.manual === 'wmart') {
    mainContent = (
      <HubWMart
        onBack={goToHub}
        onOpenWarehouse={() => goToWarehouse(0)}
        onOpenEcount={() => goToEcount(0)}
      />
    );
  } else if (route.manual === 'ecount') {
    const safeIdx = Math.min(route.page, ecountPages.length - 1);
    const currentPage = ecountPages[safeIdx] ?? ecountPages[0];

    mainContent = (
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
            <div className="mobile-actions">
              <button
                type="button"
                className="header-search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                title={searchBtnLabel}
              >
                🔍
              </button>
              <LanguageSelector className="mobile-lang-selector" />
            </div>
          </div>

          {mobileMenuOpen && (
            <button
              type="button"
              className="nav-backdrop"
              aria-label={t.common.tocClose}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <article
            className="page"
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, 'ecount', safeIdx, ecountPages.length - 1)}
          >
            <div className="page-inner">
              <header className="page-head">
                <div className="page-head-top">
                  <div>
                    <h2>{currentPage.title}</h2>
                    <p>{currentPage.sub}</p>
                  </div>
                  <div className="desktop-actions">
                    <button
                      type="button"
                      className="header-search-btn"
                      onClick={() => setSearchOpen(true)}
                      title={searchBtnLabel}
                    >
                      🔍 <span className="search-btn-text">{lang === 'en' ? 'Search' : lang === 'zh-HK' ? '搜尋' : '검색'}</span>
                      <kbd className="search-kbd">Ctrl+K</kbd>
                    </button>
                    <LanguageSelector className="desktop-lang-selector" />
                  </div>
                </div>
                <div className="page-meta mono">
                  {String(safeIdx + 1).padStart(2, '0')} / {String(ecountPages.length).padStart(2, '0')}
                </div>
              </header>

              <EcountViewer pageIndex={safeIdx} onOpenImage={handleOpenImage} />

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
  } else {
    // 4. Warehouse Manual (Default)
    const safeIdx = Math.min(route.page, warehousePages.length - 1);
    const currentPage = warehousePages[safeIdx] ?? warehousePages[0];
    const chapter = currentPage.chapter;

    mainContent = (
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
            <div className="mobile-actions">
              <button
                type="button"
                className="header-search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                title={searchBtnLabel}
              >
                🔍
              </button>
              <LanguageSelector className="mobile-lang-selector" />
            </div>
          </div>

          {mobileMenuOpen && (
            <button
              type="button"
              className="nav-backdrop"
              aria-label={t.common.tocClose}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <article
            className="page"
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, 'warehouse', safeIdx, warehousePages.length - 1)}
          >
            <div className="page-inner">
              <header className="page-head">
                <div className="page-head-top">
                  <div>
                    <h2>{t.warehouse.chapters[chapter]}</h2>
                    <p>{currentPage.sub}</p>
                  </div>
                  <div className="desktop-actions">
                    <button
                      type="button"
                      className="header-search-btn"
                      onClick={() => setSearchOpen(true)}
                      title={searchBtnLabel}
                    >
                      🔍 <span className="search-btn-text">{lang === 'en' ? 'Search' : lang === 'zh-HK' ? '搜尋' : '검색'}</span>
                      <kbd className="search-kbd">Ctrl+K</kbd>
                    </button>
                    <LanguageSelector className="desktop-lang-selector" />
                  </div>
                </div>
                <div className="page-meta mono">
                  {String(safeIdx + 1).padStart(2, '0')} / {String(warehousePages.length).padStart(2, '0')}
                </div>
              </header>

              {chapter === 'map' ? (
                <WarehouseMap onOpenImage={handleOpenImage} />
              ) : (
                <WarehouseRuleViewer
                  pageIndex={currentPage.rulePage ?? 0}
                  onOpenImage={handleOpenImage}
                />
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

  return (
    <>
      {mainContent}
      <ImageModal
        src={modalImage?.src}
        alt={modalImage?.alt}
        caption={modalImage?.caption}
        onClose={() => setModalImage(null)}
      />
      <QuickSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigateFromSearch}
      />
    </>
  );
}
