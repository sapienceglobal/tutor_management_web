'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, GraduationCap, Layout, Shield, Star, Users, Zap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                TutorApp
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 shadow-xl animate-in fade-in slide-in-from-top-5">
            <div className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#testimonials"
                className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-indigo-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-white"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4 fill-indigo-700" />
            <span>The #1 Platform for Interactive Learning</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
            Master Your Subjects with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Expert Guidance
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and tutors. Create quizzes, track progress,
            and achieve your academic goals with our powerful learning tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 hover:translate-y-[-2px] transition-all">
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-slate-50">
                Explore As Tutor
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-slate-100 pt-10">
            {[
              { label: 'Active Students', value: '10k+' },
              { label: 'Expert Tutors', value: '500+' },
              { label: 'Quizzes Taken', value: '1M+' },
              { label: 'Success Rate', value: '98%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need to Excel</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our platform provides comprehensive tools for both students and tutors to maximize learning outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Layout className="w-6 h-6 text-white" />,
                color: 'bg-blue-500',
                title: 'Interactive Quizzes',
                description: 'Engage with dynamic content using our advanced quiz player with instant feedback modes.'
              },
              {
                icon: <Zap className="w-6 h-6 text-white" />,
                color: 'bg-indigo-500',
                title: 'Real-time Analytics',
                description: 'Track your performance with detailed insights, progress charts, and improvement recommendations.'
              },
              {
                icon: <Shield className="w-6 h-6 text-white" />,
                color: 'bg-purple-500',
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security ensures your data is safe while you focus on what matters most.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Trusted by Educators and Students Worldwide</h2>
              <p className="text-lg text-slate-600 mb-8">
                "TutorApp has completely transformed how I manage my students. The analytics features are a game-changer."
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  {/* Placeholder Avatar */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Dr. Sarah Johnson</div>
                  <div className="text-slate-500 text-sm">Mathematics Professor</div>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-3xl transform rotate-3 scale-95 -z-10"></div>
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Quiz Completed</div>
                    <div className="text-slate-400 text-sm">Just now</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-slate-700 rounded-full w-3/4"></div>
                  <div className="h-2 bg-slate-700 rounded-full w-1/2"></div>
                  <div className="h-2 bg-slate-700 rounded-full w-5/6"></div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-white">98%</div>
                    <div className="text-slate-400 text-sm">Average Score</div>
                  </div>
                  <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">View Report</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
            Join our community today and get access to thousands of practice questions and expert tutors.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl h-14 px-8 text-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">TutorApp</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering students and educators with next-generation learning tools.
              </p>
            </div>

            {[
              { title: 'Platform', links: ['Features', 'Pricing', 'Tutors', 'Students'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-900 mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © 2024 TutorApp Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              {['Twitter', 'GitHub', 'LinkedIn'].map((social, i) => (
                <a key={i} href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
