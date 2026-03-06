'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BookOpen, CheckCircle, GraduationCap, Shield, Star,
  Users, Zap, Menu, X, Brain, BarChart3, Video, Building2,
  Award, Globe, Layers, ChevronRight, Play, Sparkles,
  ClipboardList, TrendingUp, Lock, MessageSquare, Cpu
} from 'lucide-react';

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const endVal = parseInt(end.replace(/\D/g, ''));
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * endVal));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(endVal);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({ href, children }) {
  return (
    <a href={href} className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-violet-400 group-hover:w-full transition-all duration-300" />
    </a>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, color, title, desc, delay = 0 }) {
  return (
    <div
      className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ChevronRight className="w-4 h-4 text-violet-400" />
      </div>
    </div>
  );
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
function Testimonial({ name, role, org, text, avatar, rating = 5 }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed flex-1">"{text}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover bg-slate-700" />
        <div>
          <p className="text-white text-sm font-semibold">{name}</p>
          <p className="text-slate-500 text-xs">{role}, {org}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    { icon: Brain, color: 'bg-violet-600', title: 'AI Tutor (RAG)', desc: 'Context-aware AI assistant trained on your course content — answers questions, explains concepts, and guides students 24/7.' },
    { icon: ClipboardList, color: 'bg-blue-600', title: 'Adaptive Exam Engine', desc: 'AI-powered question generation and adaptive testing that adjusts difficulty in real-time based on student performance.' },
    { icon: Video, color: 'bg-rose-600', title: 'Zoom Live Classes', desc: 'Seamless Zoom integration for live sessions, recordings, and attendance tracking — all within one platform.' },
    { icon: BarChart3, color: 'bg-emerald-600', title: 'Predictive Analytics', desc: 'AI predicts student performance, identifies at-risk learners, and surfaces actionable insights for educators.' },
    { icon: Building2, color: 'bg-orange-600', title: 'Multi-Tenant SaaS', desc: 'Each institute gets isolated data, custom branding, white-label domains, and plan-based feature access.' },
    { icon: Users, color: 'bg-cyan-600', title: 'CRM & Lead Management', desc: 'Built-in CRM for student lifecycle management — from lead capture to enrollment to alumni engagement.' },
    { icon: Globe, color: 'bg-indigo-600', title: 'CMS Website Builder', desc: 'Each institute gets a custom public website managed through a headless CMS — no developer needed.' },
    { icon: Layers, color: 'bg-pink-600', title: 'Course & Batch Management', desc: 'Organize content into modules, batches, and cohorts with granular enrollment controls and progress tracking.' },
    { icon: TrendingUp, color: 'bg-teal-600', title: 'Payment & Billing', desc: 'Subscription-based billing, course payments, and institute-level invoicing with full financial reporting.' },
  ];

  const testimonials = [
    {
      name: 'Dr. Priya Sharma', role: 'Director', org: 'Apex Coaching Institute',
      text: 'Sapience LMS transformed how we deliver education. The AI tutor alone has reduced our support load by 60%.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', rating: 5,
    },
    {
      name: 'Rohit Mehta', role: 'Head of Academics', org: 'TechLearn University',
      text: 'The adaptive exam engine is a game-changer. Students get personalized tests and we get deep performance analytics.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit', rating: 5,
    },
    {
      name: 'Ananya Singh', role: 'Program Manager', org: 'FutureCorp Training',
      text: 'Multi-tenant architecture means every department has their own branded portal. Our corporate clients love it.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', rating: 5,
    },
  ];

  const stats = [
    { value: '50', suffix: 'k+', label: 'Active Students' },
    { value: '1200', suffix: '+', label: 'Expert Tutors' },
    { value: '5', suffix: 'M+', label: 'Exams Conducted' },
    { value: '99', suffix: '%', label: 'Uptime SLA' },
  ];

  const plans = [
    {
      name: 'Starter', price: '₹4,999', period: '/mo', desc: 'For small coaching centres',
      features: ['Up to 500 students', '5 tutors', 'LMS + Exam Engine', 'Basic Analytics', 'Email support'],
      cta: 'Start Free Trial', highlight: false,
    },
    {
      name: 'Growth', price: '₹14,999', period: '/mo', desc: 'For growing institutes',
      features: ['Up to 5,000 students', '50 tutors', 'AI Tutor + Live Classes', 'Advanced Analytics', 'CRM & Lead Management', 'White-label domain', 'Priority support'],
      cta: 'Get Started', highlight: true,
    },
    {
      name: 'Enterprise', price: 'Custom', period: '', desc: 'For large organisations',
      features: ['Unlimited students', 'Unlimited tutors', 'Full AI Suite', 'Predictive Analytics', 'Multi-tenant SaaS', 'Dedicated infrastructure', 'SLA + Dedicated CSM'],
      cta: 'Contact Sales', highlight: false,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#080b14]/95 backdrop-blur-md border-b border-white/[0.06] shadow-xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                <GraduationCap className="h-4 h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Sapience<span className="text-violet-400">LMS</span>
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How it Works</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#testimonials">Testimonials</NavLink>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60 hover:-translate-y-px">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(v => !v)}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0d1120] border-b border-white/[0.06] px-5 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
            {['#features', '#how-it-works', '#pricing', '#testimonials'].map((href, i) => (
              <a key={i} href={href} onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-slate-300 hover:text-white border-b border-white/[0.04]">
                {href.replace('#', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </a>
            ))}
            <div className="flex flex-col gap-2.5 pt-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-3 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors">Sign In</button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-3 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 transition-colors">Get Started Free</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-900/20 rounded-full blur-[80px]" />
          <div className="absolute top-40 right-10 w-56 h-56 bg-blue-900/20 rounded-full blur-[80px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise AI-Powered LMS · Now Available
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-white tracking-tight mb-6 max-w-5xl mx-auto leading-[1.08]">
            The Intelligent Platform for{' '}
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                Modern Education
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8C80 4 160 2 200 2C240 2 320 4 398 8" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#818cf8"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sapience LMS empowers coaching institutes, universities, and corporates with AI tutoring, adaptive exams, live classes, and deep analytics — all in one enterprise platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/register">
              <button className="group flex items-center gap-2.5 h-13 px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl transition-all shadow-2xl shadow-violet-900/40 hover:shadow-violet-900/60 hover:-translate-y-0.5">
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link href="/login">
              <button className="group flex items-center gap-2.5 h-13 px-8 py-3.5 text-base font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all hover:bg-white/5">
                <Play className="w-4 h-4 text-violet-400" />
                Watch Demo
              </button>
            </Link>
          </div>

          <p className="text-slate-500 text-sm">No credit card required · 14-day free trial · Cancel anytime</p>

          {/* Dashboard preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-b from-violet-900/20 to-indigo-900/10 rounded-3xl blur-xl -z-10" />
            <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#111827] border-b border-white/[0.05]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <div className="ml-4 flex-1 bg-white/5 rounded-lg h-6 flex items-center px-3">
                  <span className="text-slate-500 text-xs">app.sapienceLMS.com/dashboard</span>
                </div>
              </div>
              {/* Dashboard mockup */}
              <div className="p-6 grid grid-cols-4 gap-4">
                <div className="col-span-4 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Active Students', val: '12,480', color: 'text-violet-400' },
                    { label: 'Live Sessions', val: '24', color: 'text-emerald-400' },
                    { label: 'Exams Today', val: '138', color: 'text-blue-400' },
                    { label: 'Avg. Score', val: '84%', color: 'text-amber-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-slate-500 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Bar chart mockup */}
                <div className="col-span-3 bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 h-36 flex items-end gap-2">
                  {[40, 65, 55, 80, 70, 90, 75, 85, 60, 95, 72, 88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all"
                      style={{ height: `${h}%`, background: `linear-gradient(to top, #7c3aed${Math.floor(h * 2).toString(16)}, #818cf8${Math.floor(h).toString(16)})`, minHeight: 4 }} />
                  ))}
                </div>
                <div className="col-span-1 bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 space-y-3">
                  {['AI Tutor', 'Live Classes', 'Assignments'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${['bg-violet-500', 'bg-emerald-500', 'bg-blue-500'][i]}`} />
                      <span className="text-slate-400 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-4xl font-bold text-white">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">
              <Cpu className="w-3 h-3" /> Full Feature Suite
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything Your Institution Needs
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From AI-powered tutoring to enterprise analytics — Sapience LMS is the only platform you'll ever need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 50} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Up & Running in Minutes</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Three simple steps to transform your institution's learning experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-violet-600/0 via-violet-600/50 to-violet-600/0" />
            {[
              { step: '01', icon: Building2, title: 'Set Up Your Institute', desc: 'Register, configure your branding, add tutors, and import your existing content — in under 30 minutes.' },
              { step: '02', icon: Users, title: 'Enroll Students', desc: 'Invite via email, share enrollment links, or sync from your existing student database via API.' },
              { step: '03', icon: Sparkles, title: 'AI Takes Over', desc: 'Our AI engine personalizes learning paths, generates questions, and provides real-time insights automatically.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center relative">
                  <step.icon className="w-9 h-9 text-violet-400" />
                  <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURE HIGHLIGHT ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Brain className="w-3 h-3" /> AI-First Architecture
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                An AI Tutor That Actually Understands Your Course
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Built on RAG (Retrieval-Augmented Generation) architecture, our AI Tutor is trained on your specific course content — not generic web data. Students get precise, contextual answers 24/7.
              </p>
              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: 'Answers questions using your course materials' },
                  { icon: CheckCircle, text: 'Generates revision notes and summaries on demand' },
                  { icon: CheckCircle, text: 'Identifies knowledge gaps and recommends content' },
                  { icon: CheckCircle, text: 'Fully multilingual — supports Hindi, English, and more' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-violet-400 shrink-0" />
                    <span className="text-slate-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/register">
                  <button className="group flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-900/30">
                    Try AI Tutor Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* AI chat mockup */}
            <div className="relative">
              <div className="absolute -inset-6 bg-violet-900/10 rounded-3xl blur-2xl" />
              <div className="relative bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05] bg-[#111827]">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Sapience AI Tutor</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-emerald-400 text-[10px] font-medium">Online</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
                      <p className="text-white text-sm">Explain Newton's Second Law with an example</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Newton's Second Law states that <span className="text-violet-300 font-semibold">F = ma</span> — force equals mass times acceleration.
                      </p>
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        <strong className="text-slate-300">Example:</strong> A 5 kg box pushed with 20 N accelerates at 4 m/s². As per your Chapter 3 notes, this is covered in the "Dynamics" section. 📚
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                      <span className="text-slate-500 text-sm">Ask anything about your course...</span>
                    </div>
                    <button className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Loved by Educators Everywhere</h2>
            <p className="text-slate-400">Trusted by 200+ institutions across India and beyond</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => <Testimonial key={i} {...t} />)}
          </div>
          {/* Logos strip */}
          <div className="mt-16 text-center">
            <p className="text-slate-600 text-xs uppercase tracking-widest font-semibold mb-8">Trusted by institutions including</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {['Apex Coaching', 'TechLearn University', 'FutureCorp Training', 'BrightMinds Academy', 'EduSpark Institute'].map((name, i) => (
                <span key={i} className="text-slate-600 font-bold text-sm tracking-wide">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-6 flex flex-col ${plan.highlight
                ? 'bg-gradient-to-b from-violet-600/20 to-indigo-600/10 border-2 border-violet-500/50 shadow-2xl shadow-violet-900/20'
                : 'bg-white/[0.03] border border-white/[0.08]'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-500 text-sm">{plan.desc}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-slate-400 text-sm mb-1">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                    : 'border border-white/10 text-white hover:bg-white/5'
                  }`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-indigo-900/20" />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Zap className="w-3 h-3 fill-violet-400" /> Start Today
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5">
            Transform Your Institution with AI
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Join 200+ institutions already using Sapience LMS to deliver world-class education at scale. 14-day free trial, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-violet-900/40 hover:-translate-y-0.5 text-sm">
                Start Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link href="/login">
              <button className="flex items-center justify-center gap-2 px-8 py-4 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-semibold rounded-2xl transition-all text-sm">
                Contact Sales <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Enterprise AI-powered LMS for coaching institutes, universities, and corporate training organisations.
              </p>
              <div className="flex gap-3 mt-5">
                {['Twitter', 'LinkedIn', 'GitHub'].map((s, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold">
                    {s[0]}
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Platform', links: ['AI Tutor', 'Exam Engine', 'Live Classes', 'Analytics', 'CMS Builder'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact', 'Partners'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Security', 'GDPR', 'Cookies'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-sm">© 2026 Sapience LMS. All rights reserved.</p>
            <p className="text-slate-600 text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Enterprise-grade security · ISO 27001 compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}