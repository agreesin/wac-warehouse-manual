import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

const heroVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (idx) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.08 + idx * 0.1,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

export function HubHome({ onOpenWmart }) {
  const { t } = useLanguage();

  return (
    <div className="hub-shell">
      <div className="hub-top-bar">
        <LanguageSelector />
      </div>
      <div className="hub hub-premium">
        <section className="hub-stage">
          <motion.div
            className="hub-hero"
            custom={0}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            <img className="hub-brand" src="/wac-logo.png" alt="WAC Logistics" />
            <p className="hub-kicker">{t.common.hubKicker}</p>
            <h1 className="hub-headline">
              {t.common.hubTitle}
              <span>{t.common.hubSubtitle}</span>
            </h1>
            <p className="hub-lead">{t.common.hubLead}</p>
          </motion.div>

          <motion.div
            className="hub-units"
            custom={1}
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {/* Unit 1: W MART */}
            <button type="button" className="hub-unit" onClick={onOpenWmart}>
              <span className="hub-unit-meta">
                <span className="hub-unit-no">01</span>
                <span className="hub-unit-tag">{t.common.unit1Tag}</span>
              </span>
              <div className="hub-unit-logo-wrap">
                <img
                  className="hub-unit-logo hub-unit-logo-mart"
                  src="/wmart-card-logo.png"
                  alt="W MART"
                />
              </div>
              <strong className="hub-unit-title">{t.common.unit1Title}</strong>
              <em className="hub-unit-desc">{t.common.unit1Desc}</em>
              <span className="hub-unit-cta">
                {t.common.unit1Cta}
                <span aria-hidden="true">→</span>
              </span>
            </button>

            {/* Unit 2: W Express */}
            <a
              className="hub-unit"
              href={t.common.slidesUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span className="hub-unit-meta">
                <span className="hub-unit-no">02</span>
                <span className="hub-unit-tag">{t.common.unit2Tag}</span>
              </span>
              <div className="hub-unit-logo-wrap">
                <img
                  className="hub-unit-logo hub-unit-logo-express"
                  src="/w-express-logo.png"
                  alt="W Express"
                />
              </div>
              <strong className="hub-unit-title">{t.common.unit2Title}</strong>
              <em className="hub-unit-desc">{t.common.unit2Desc}</em>
              <span className="hub-unit-cta">
                {t.common.unit2Cta}
                <span aria-hidden="true">↗</span>
              </span>
            </a>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
