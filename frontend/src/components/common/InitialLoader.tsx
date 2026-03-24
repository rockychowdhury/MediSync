"use client";

import React from "react";
import MediSyncLogo from "./MediSyncLogo";

/**
 * InitialLoader — Full-page loader for initial site load / reload
 *
 * Animation sequence (GPU-accelerated, transform + opacity only):
 * 1. Outer gear ring fades in with a gentle pulse
 * 2. Inner icons appear one by one with staggered fade-in:
 *    Clock → Calendar → Patient Calendar → Checkmark
 * 3. "MediSync" brand text fades in last
 *
 * Uses will-change + translateZ(0) for compositing layer promotion.
 */
export default function InitialLoader() {
  return (
    <>
      <div
        className="initial-loader"
        role="status"
        aria-label="Loading MediSync"
      >
        <div className="initial-loader__content">
          {/* Logo with animated icons */}
          <div className="initial-loader__logo">
            <MediSyncLogo size={160} animatable />
          </div>

          {/* Brand name */}
          <h1 className="initial-loader__title">
            Medi<span className="initial-loader__title-accent">Sync</span>
          </h1>
          <p className="initial-loader__subtitle">
            Smart Healthcare Scheduling
          </p>
        </div>
      </div>

      {/* Scoped CSS-only animation for maximum performance */}
      <style>{`
        .initial-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          will-change: opacity;
        }

        .initial-loader__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        /* ── Outer ring: fade in ── */
        .initial-loader__logo {
          animation: il-fadeIn 0.6s ease-out forwards;
          will-change: transform, opacity;
          transform: translateZ(0);
        }

        /* ── Inner icon staggered fade-in ── */
        .initial-loader__logo .medisync-icon-1 {
          opacity: 0;
          animation: il-iconFadeIn 0.4s ease-out 0.3s forwards;
          will-change: transform, opacity;
          transform-origin: center;
        }
        .initial-loader__logo .medisync-icon-2 {
          opacity: 0;
          animation: il-iconFadeIn 0.4s ease-out 0.5s forwards;
          will-change: transform, opacity;
          transform-origin: center;
        }
        .initial-loader__logo .medisync-icon-3 {
          opacity: 0;
          animation: il-iconFadeIn 0.4s ease-out 0.7s forwards;
          will-change: transform, opacity;
          transform-origin: center;
        }
        .initial-loader__logo .medisync-icon-4 {
          opacity: 0;
          animation: il-iconFadeIn 0.4s ease-out 0.9s forwards;
          will-change: transform, opacity;
          transform-origin: center;
        }

        /* ── Brand text ── */
        .initial-loader__title {
          font-family: var(--font-montserrat), "Montserrat", sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1E4A9E;
          letter-spacing: -0.02em;
          opacity: 0;
          animation: il-textFadeInUp 0.5s ease-out 1.1s forwards;
          will-change: transform, opacity;
          transform: translateZ(0);
          margin: 0;
          line-height: 1.2;
        }
        .initial-loader__title-accent {
          background: linear-gradient(135deg, #40A8C4, #5CC8C1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .initial-loader__subtitle {
          font-family: var(--font-inter), "Inter", sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          color: #6b7280;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0;
          animation: il-textFadeInUp 0.5s ease-out 1.3s forwards;
          will-change: transform, opacity;
          transform: translateZ(0);
          margin: 0;
        }

        /* ── Keyframes (GPU only: transform + opacity) ── */
        @keyframes il-fadeIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateZ(0);
          }
          to {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        @keyframes il-iconFadeIn {
          from {
            opacity: 0;
            transform: scale(0.7) translateZ(0);
          }
          to {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        @keyframes il-textFadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }
      `}</style>
    </>
  );
}
