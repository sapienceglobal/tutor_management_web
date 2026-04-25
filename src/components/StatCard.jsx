// File: components/StatCard.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { C, S, T } from '@/constants/studentTokens'; 

// ─── Global Icon Pill Component ───
function IconPill({ icon: Icon, size = 24, bg, iconColor, customSizeClasses }) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 ${customSizeClasses || 'rounded-xl'}`}
      style={{ width: '48px', height: '48px', backgroundColor: bg }}
    >
      {Icon && <Icon size={size} color={iconColor} strokeWidth={2.5} />}
    </div>
  );
}

// ─── Global StatCard Component ───
export default function StatCard({ icon: Icon, value, label, href, isAI, subtext, iconBg, iconColor, bgSvgPath }) {
  const currentIconBg = iconBg || C.iconBg;
  const currentIconColor = iconColor || C.iconColor;

  const cardContent = (
    <div
      className={`relative rounded-[16px] p-5 overflow-hidden transition-all duration-300 cursor-pointer group ${
        isAI ? "hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)]" : "hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
      }`}
      style={
        isAI
          ? {
              background: "linear-gradient(135deg, #0B1021 0%, #17153B 50%, #2E236C 100%)",
              border: `1px solid rgba(99, 102, 241, 0.4)`,
              minHeight: 130,
              boxShadow: S.card,
            }
          : {
              backgroundColor: '#ffffff', 
              border: `1px solid #E2E8F0`,
              minHeight: 130,
              boxShadow: S.card,
            }
      }
    >
      {/* ─── AI CARD GLOW EFFECTS ─── */}
      {isAI && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] opacity-30 pointer-events-none -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full blur-[40px] opacity-20 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
          <style> 
            {`
            @keyframes aiActive {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-3px) scale(1.05); }
            }
            .ai-animated-icon {
                animation: aiActive 3s ease-in-out infinite;
            }
            `}
          </style>
        </>
      )}

      {/* ─── NORMAL CARD (BOTTOM-RIGHT HALF CIRCLE & HOVER IMAGE) ─── */}
      {!isAI && bgSvgPath && (
        <div 
          // Ye div Bottom Right corner me half-circle banayega 
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none z-0 transition-transform duration-500 group-hover:scale-[1.05]"
          style={{ backgroundColor: currentIconBg }}
        >
          {/* Image ko circle ke top-left side adjust kiya hai taaki sahi jagah dikhe */}
          <div className="absolute top-6 left-6 w-14 h-14 transition-transform duration-500 group-hover:scale-[1.15] group-hover:-translate-y-1">
            <Image
              src={bgSvgPath}
              alt={`${label} illustration`}
              width={56}
              height={56}
              className="w-full h-full object-contain grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
            />
          </div>
        </div>
      )}

      {/* ─── CARD CONTENT LAYOUT ─── */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        
        {/* Top Row: Pill Icon (Left) + Text (Right) */}
        <div className="flex items-start gap-3.5">
          {isAI ? (
            <div className="flex items-center justify-center shrink-0 w-12 h-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
          ) : (
            <IconPill
              icon={Icon}
              bg={currentIconBg}
              iconColor={currentIconColor}
            />
          )}

          {/* Text wrapper se pr-10 hata diya kyunki ab image neeche hai */}
          <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5"> 
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: isAI ? '#A5B4FC' : '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p style={{ fontFamily: T.fontFamily, fontSize: '26px', fontWeight: 900, color: isAI ? '#ffffff' : '#1E1B4B', lineHeight: 1 }}>
                {value}
              </p>
              {subtext && (
                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: isAI ? '#818CF8' : '#94A3B8' }}>
                  {subtext}
                </p>
              )}
            </div>
          </div>
          
          {/* AI Card Big Image (Right Side Center) */}
          {isAI && bgSvgPath && (
             <div className="absolute right-0 top-22 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Image src={bgSvgPath} alt="AI Icon" width={80} height={80} className="ai-animated-icon w-15 h-15 object-contain" />
             </div>
          )}
        </div>

        {/* Bottom Row: Action Buttons */}
        <div className="mt-5">
          {isAI ? (
            <span className="inline-flex items-center justify-center py-2 px-3.5 text-white rounded-lg transition-transform active:scale-95"
              style={{ backgroundColor: '#4F46E5', fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.bold, boxShadow: `0 4px 14px rgba(79, 70, 229, 0.4)` }}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Start AI Plan
            </span>
          ) : (
            href && (
              <span className="inline-flex items-center justify-center py-1.5 px-3 rounded-lg transition-colors"
                style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.bold }}>
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            )
          )}
        </div>

      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{cardContent}</Link> : cardContent;
}