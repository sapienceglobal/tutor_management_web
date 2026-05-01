// File: components/StatCard.jsx
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
      className="flex items-center justify-center shrink-0"
      style={{ width: 48, height: 48, backgroundColor: bg || C.iconBg, borderRadius: '10px' }}
    >
      {Icon && <Icon style={{ width: 24, height: 24, color: iconColor || C.iconColor }} />}
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
export default function StatCard({ icon: Icon, value, label, href, isAI, subtext, iconBg, iconColor, bgSvgPath }) {
  const pillBg    = iconBg    || C.iconBg;
  const pillColor = iconColor || C.iconColor;

  // BUG FIX: Agar icon white hai, toh arc ko background color (pillBg) de do. 
  // Varna arc white-on-white invisible ho jayega.
  const decorColor = pillColor === C.iconColor || pillColor === '#ffffff' || pillColor === '#fff' ? pillBg : pillColor;

  const cardContent = (
    <div
      className="relative overflow-hidden transition-all duration-300 cursor-pointer group"
      style={
        isAI
          ? {
              background: 'linear-gradient(to bottom, #4A00E0, #8E2DE2)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: R['2xl'],
              minHeight: 130,
              boxShadow: S.card,
            }
          : {
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: R['2xl'],
              minHeight: 130,
              boxShadow: S.card,
            }
      }
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = isAI ? S.aiHover : S.cardHover;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = S.card;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ─── AI Card Glow Effects ─────────────────────────────────────── */}
      {isAI && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-50" style={{ backgroundColor: '#6366f1' }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#a855f7' }} />
          <style>{`
            @keyframes aiPulse {
              0%, 100% { transform: translateY(0px) scale(1); }
              50%      { transform: translateY(-3px) scale(1.05); }
            }
            .ai-icon-anim { animation: aiPulse 3s ease-in-out infinite; }
          `}</style>
        </>
      )}

      {/* ─── Normal Card: Corner Arc Decor ────────────────────────────── */}
      {!isAI && <DecorB color={decorColor} />}

      {/* ─── Card Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full justify-between p-5">

        {/* Top: Icon + Label + Value */}
        <div className="flex items-start gap-3.5">
          {isAI ? (
            <div className="flex items-center justify-center shrink-0 w-12 h-12 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
              <MdAutoAwesome style={{ width: 24, height: 24, color: '#ffffff' }} />
            </div>
          ) : (
            <IconPill icon={Icon} bg={pillBg} iconColor={pillColor} />
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5">
            {/* Label */}
            <p style={{
              fontFamily:    T.fontFamily,
              fontSize:      T.size.md,
              fontWeight:    T.weight.bold,
              color:         isAI ? '#ffffff' : C.textSlate,
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
                fontWeight: T.weight.bold,
                color:      isAI ? '#ffffff' : C.headingDark,
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
                  color:      isAI ? 'rgba(255,255,255,0.7)' : C.textFaint,
                  margin: 0,
                }}>
                  {subtext}
                </p>
              )}
            </div>
          </div>

          {/* AI card: decorative image */}
          {isAI && bgSvgPath && (
            <div className="absolute right-4 top-25 -translate-y-1/2 pointer-events-none transition-transform duration-500" style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' }}>
              <Image src={bgSvgPath} alt="AI Icon" width={60} height={60} className="ai-icon-anim object-contain" />
            </div>
          )}
        </div>

        {/* Bottom: Action button */}
        <div className="mt-4">
          {isAI ? (
            <span
              className="inline-flex items-center justify-center py-2 px-3.5 transition-transform"
              style={{
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                fontFamily: T.fontFamily,
                fontSize:   T.size.base,
                fontWeight: T.weight.bold,
                boxShadow:  S.aiBtn,
                borderRadius: '10px'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <MdAutoAwesome style={{ width: 16, height: 16, marginRight: 6 }} /> Start AI Plan
            </span>
          ) : (
            href && (
              <span
                className="inline-flex items-center justify-center py-1.5 px-3 transition-colors"
                style={{
                  backgroundColor: C.btnViewAllBg,
                  color:           C.btnViewAllText,
                  fontFamily:      T.fontFamily,
                  fontSize:        T.size.base,
                  fontWeight:      T.weight.bold,
                  border:          `1px solid ${C.cardBorder}`,
                  borderRadius:    '10px'
                }}
              >
                View All <MdArrowForward style={{ width: 16, height: 16, marginLeft: 4 }} />
              </span>
            )
          )}
        </div>

      </div>
    </div>
  );

  return href ? <Link href={href} className="block text-decoration-none">{cardContent}</Link> : cardContent;
}