// File: components/StatCard.jsx
// Global StatCard — single source of truth for all student stat cards.
// Uses ONLY tokens from studentTokens.js. Never hardcode colors here.
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdArrowForward, MdAutoAwesome } from 'react-icons/md';
import { C, S, T, R } from '@/constants/studentTokens';

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, bg, iconColor }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-xl"
      style={{ width: 48, height: 48, backgroundColor: bg || C.iconBg }}
    >
      {Icon && <Icon size={24} style={{ color: iconColor || C.iconColor }} />}
    </div>
  );
}

// ─── Decor: Layered arc slices from bottom-right corner ──────────────────────
function DecorB({ color }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <svg
        className="absolute -bottom-0.5 -right-0.5 w-40 h-40 transition-transform duration-500 group-hover:scale-110"
        style={{ transformOrigin: 'bottom right' }}
        viewBox="0 0 110 110"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M110 110 Q110 0 0 110 Z"   fill={color} opacity="0.15" />
        <path d="M110 110 Q110 30 30 110 Z"  fill={color} opacity="0.18" />
        <path d="M110 110 Q110 58 58 110 Z"  fill={color} opacity="0.28" />
      </svg>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Props:
//   icon       — Lucide icon component (required for normal cards)
//   value      — Number or string to display prominently
//   label      — Uppercase label text (e.g. "Enrolled Courses")
//   href       — If provided, wraps card in <Link> and shows "View All" button
//   isAI       — Boolean: renders the dark gradient AI variant
//   subtext    — Small secondary text below value (e.g. "Overall Score")
//   iconBg     — Icon pill background color (overrides C.iconBg)
//   iconColor  — Icon color (overrides C.iconColor)
//   bgSvgPath  — Decorative image path (AI card only)
export default function StatCard({ icon: Icon, value, label, href, isAI, subtext, iconBg, iconColor, bgSvgPath }) {
  const pillBg    = iconBg    || C.iconBg;
  const pillColor = iconColor || C.iconColor;

  const cardContent = (
    <div
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
        isAI
          ? 'hover:-translate-y-1'
          : 'hover:-translate-y-1'
      }`}
      style={
        isAI
          ? {
              background: 'linear-gradient(to top, #4A00E0, #8E2DE2)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: R.xl,
              minHeight: 130,
              boxShadow: S.card,
            }
          : {
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: R.xl,
              minHeight: 130,
              boxShadow: S.card,
            }
      }
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = isAI ? S.aiHover : S.statHover;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = S.card;
      }}
    >
      {/* ─── AI Card Glow Effects ─────────────────────────────────────── */}
      {isAI && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full blur-[40px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
          <style>{`
            @keyframes aiPulse {
              0%, 100% { transform: translateY(0px) scale(1); }
              50%       { transform: translateY(-3px) scale(1.05); }
            }
            .ai-icon-anim { animation: aiPulse 3s ease-in-out infinite; }
          `}</style>
        </>
      )}

      {/* ─── Normal Card: Corner Arc Decor ────────────────────────────── */}
      {!isAI && <DecorB color={pillColor} />}

      {/* ─── Card Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full justify-between p-5">

        {/* Top: Icon + Label + Value */}
        <div className="flex items-start gap-3.5">
          {isAI ? (
            <div className="flex items-center justify-center shrink-0 w-12 h-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <MdAutoAwesome className="w-6 h-6 text-white" />
            </div>
          ) : (
            <IconPill icon={Icon} bg={pillBg} iconColor={pillColor} />
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5">
            {/* Label */}
            <p style={{
              fontFamily:    T.fontFamily,
              fontSize:      T.size.md,
              fontWeight:    T.weight.semibold,
              color:         isAI ? 'white' : C.textSlate,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: 0,
            }}>
              {label}
            </p>

            {/* Value + subtext */}
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p style={{
                fontFamily: T.fontFamily,
                fontSize:   T.size.stat,
                fontWeight: T.weight.black,
                color:      isAI ? 'white' : C.headingDark,
                lineHeight: 1,
                margin: 0,
              }}>
                {value}
              </p>
              {subtext && (
                <p style={{
                  fontFamily: T.fontFamily,
                  fontSize:   T.size.xs,
                  fontWeight: T.weight.medium,
                  color:      isAI ? 'white' : C.textFaint,
                  margin: 0,
                }}>
                  {subtext}
                </p>
              )}
            </div>
          </div>

          {/* AI card: big decorative image — UNCHANGED */}
          {isAI && bgSvgPath && (
            <div className="absolute right-4 top-25 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Image src={bgSvgPath} alt="AI Icon" width={60} height={60} className="ai-icon-anim object-contain" />
            </div>
          )}
        </div>

        {/* Bottom: Action button */}
        <div className="mt-4">
          {isAI ? (
            <span
              className="inline-flex items-center justify-center py-2 px-3.5 text-white rounded-lg transition-transform active:scale-95"
              style={{
                backgroundColor: '#4F46E5',
                fontFamily: T.fontFamily,
                fontSize:   T.size.sm,
                fontWeight: T.weight.bold,
                boxShadow:  S.aiBtn,
              }}
            >
              <MdAutoAwesome className="w-3.5 h-3.5 mr-1.5" /> Start AI Plan
            </span>
          ) : (
            href && (
              <span
                className="inline-flex items-center justify-center py-1.5 px-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: C.btnViewAllBg,
                  color:           C.btnViewAllText,
                  fontFamily:      T.fontFamily,
                  fontSize:        T.size.sm,
                  fontWeight:      T.weight.bold,
                }}
              >
                View All <MdArrowForward className="w-3.5 h-3.5 ml-1" />
              </span>
            )
          )}
        </div>

      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{cardContent}</Link> : cardContent;
}