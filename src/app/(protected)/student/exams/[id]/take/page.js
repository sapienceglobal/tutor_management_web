'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Clock, Maximize, Minimize, ChevronRight, Menu, Lock, Zap, Loader2,
    Timer, HelpCircle, Award, LayoutGrid, LogOut, AlertCircle, ArrowRight,
    CheckCircle, XCircle, Eye, Sparkles, UserCheck, Flag, CheckSquare, Users, Mic
} from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';
import { T } from '@/constants/studentTokens';
import { useFaceProctoring } from '@/hooks/useFaceProctoring';

export default function TakeExamPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const AUTOSAVE_KEY = `exam_autosave_${id}`;

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selections, setSelections] = useState({});
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { confirmDialog } = useConfirm();
    const timeLeftRef = useRef(0);

    // ── Multistep Workflow ───────────────────────────────────────────────
    const [step, setStep] = useState('instructions');
    const [agreedToInstructions, setAgreedToInstructions] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [micVolume, setMicVolume] = useState(0); // 🔥 NEW: Live Mic Volume State

    // ── Section-based timing ─────────────────────────────────────────────
    const [sectionTimers, setSectionTimers] = useState({});
    const [activeSection, setActiveSection] = useState(0);
    const [lockedSections, setLockedSections] = useState(new Set());
    const hasSections = exam?.sections?.length > 0;

    // ── Adaptive testing ─────────────────────────────────────────────────
    const [adaptiveQuestion, setAdaptiveQuestion] = useState(null);
    const [adaptiveAnswered, setAdaptiveAnswered] = useState([]);
    const [adaptiveSelection, setAdaptiveSelection] = useState(null);
    const [adaptiveFinished, setAdaptiveFinished] = useState(false);
    const [adaptiveLoading, setAdaptiveLoading] = useState(false);
    const [lastCorrect, setLastCorrect] = useState(null);
    const isAdaptive = exam?.isAdaptive || false;

    // ── Proctoring & Tab-switch tracking ─────────────────────────────────
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [proctoringEvents, setProctoringEvents] = useState([]);
    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // ── Camera Permission State ──────────────────────────────────────────
    const [cameraPermission, setCameraPermission] = useState('pending');
    const [showCameraBlockModal, setShowCameraBlockModal] = useState(false);

    const attemptIdRef = useRef(null);
    const isExamRunning = step === 'exam';

    // ── Focus Mode Effect (Scroll Lock) ──────────────────────────────────
    useEffect(() => {
        if (isExamRunning) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isExamRunning]);

    // 🔥 Proctoring Event Handler (Audio & Gaze Included)
    const handleProctoringEvent = useCallback((event) => {
        setProctoringEvents(prev => [...prev, event]);
        if (event.eventType === 'no_face') {
            toast.error('⚠️ Warning: Face not detected. Please stay in camera frame!', { id: 'ai-no-face', duration: 4000 });
        } else if (event.eventType === 'multiple_faces') {
            toast.error('🚨 ALERT: Multiple faces detected! This is recorded.', { id: 'ai-multi-face', duration: 5000 });
        } else if (event.eventType === 'audio_anomaly' && event.details?.includes('Speech detected')) {
            const words = event.details.split('"')[1] || 'voice';
            toast.error(`🎤 ALERT: Voice detected! AI captured: "${words}"`, { id: 'ai-speech', duration: 5000 });
        } else if (event.eventType === 'audio_anomaly' && event.details?.includes('noise')) {
            toast.error('🎤 Warning: Suspicious background noise detected.', { id: 'ai-audio', duration: 3000 });
        } else if (event.eventType === 'audio_anomaly') {
            toast.error('⚠️ Warning: Please look straight at your screen.', { id: 'ai-look-away', duration: 3000 });
        } else if (event.eventType === 'unauthorized_object' && event.details?.includes('down')) {
            toast.error('⚠️ Warning: Please do not look down continuously.', { id: 'ai-look-down', duration: 4000 });
        }
    }, []);

    const { status: faceStatus, faceCount, isFaceAligned } = useFaceProctoring({
        videoRef,
        isActive: (step === 'verification' || step === 'exam') && !loading && !!exam && !!exam.isProctoringEnabled,
        isVerificationMode: step === 'verification',
        examDuration: exam ? exam.duration * 60 : 0,
        timeLeftRef,
        onEvent: handleProctoringEvent,
    });

    const ProctoringBadge = () => {
        if (faceStatus === 'loading') {
            return (
                <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Loading AI...
                </div>
            );
        }
        if (faceStatus === 'error') {
            return (
                <div className="absolute top-2 left-2 bg-slate-500/90 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Cam Unavailable
                </div>
            );
        }
        if (faceStatus === 'active') {
            const badgeBg = faceCount === 0 ? 'bg-red-500/90'
                : faceCount === 1 && !isFaceAligned ? 'bg-amber-500/90'
                    : faceCount === 1 ? 'bg-emerald-500/90'
                        : 'bg-rose-600/90';
            const label = faceCount === 0 ? 'No Face Detected'
                : faceCount === 1 && !isFaceAligned ? 'Looking Away'
                    : faceCount === 1 ? 'AI Active'
                        : faceCount + ' Faces Detected!';
            return (
                <div className={cn('absolute top-2 left-2 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md', badgeBg)}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {label}
                </div>
            );
        }
        return null;
    };

    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

    // ── AI Webcam Initialization ───────────────────────────────────
    useEffect(() => {
        if (loading || !exam) return;
        if (!exam.isProctoringEnabled && !exam.isAudioProctoringEnabled) {
            setCameraPermission('not_required');
            setIsCameraActive(false);
            return;
        }

        let cancelled = false;

        const startCamera = async () => {
            if (mediaStreamRef.current) return;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraPermission('denied');
                setShowCameraBlockModal(true);
                return;
            }
            try {
                // Dynamically request permissions based on exam settings
                const constraints = {};
                if (exam.isProctoringEnabled) constraints.video = { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } };
                if (exam.isAudioProctoringEnabled) constraints.audio = true;

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                mediaStreamRef.current = stream;

                if (videoRef.current && videoRef.current.srcObject !== stream && exam.isProctoringEnabled) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(console.error);
                }
                setCameraPermission('granted');
                setIsCameraActive(true);
            } catch (err) {
                if (cancelled) return;
                setCameraPermission('denied');
                setIsCameraActive(false);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
                    setShowCameraBlockModal(true);
                }
                setProctoringEvents(prev => [...prev, {
                    eventType: 'no_face', severity: 'high', timestamp: new Date().toISOString(),
                    details: `Hardware access denied: ${err.name} — ${err.message}`, videoTimestamp: 0,
                }]);
            }
        };
        startCamera();
        return () => { cancelled = true; };
    }, [loading, exam]);

    // ── Keep Video Stream Attached when Screen Changes ────────────────────
    useEffect(() => {
        if (exam?.isProctoringEnabled && videoRef.current && mediaStreamRef.current) {
            if (videoRef.current.srcObject !== mediaStreamRef.current) {
                videoRef.current.srcObject = mediaStreamRef.current;
                videoRef.current.play().catch(e => console.warn("Auto-play prevented", e));
            }
        }
    }, [step, exam]);

    // ── Cleanup Camera on Exit ────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // 🔥 ── LIVE MIC VOLUME VISUALIZER (VERIFICATION STEP) ─────────────────
    useEffect(() => {
        // FIXED — verification AUR exam dono pe kaam karega
        // const isAudioActive = step === 'verification' || isExamRunning;
        // if (!isAudioActive || !exam?.isAudioProctoringEnabled || !mediaStreamRef.current) return;

        if (step !== 'verification' || !exam?.isAudioProctoringEnabled || !mediaStreamRef.current) return;

        let audioContext;
        let analyser;
        let dataArray;
        let animationId;

        const initAudio = async () => {
            try {
                const audioTracks = mediaStreamRef.current.getAudioTracks();
                if (audioTracks.length === 0) return;

                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;

                const source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
                source.connect(analyser);
                dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateVolume = () => {
                    if (!analyser) return;
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;
                    // Multiply to make it visually bounce more
                    const volumePercent = Math.min(100, Math.round(average * 1.5));
                    setMicVolume(volumePercent);
                    animationId = requestAnimationFrame(updateVolume);
                };
                updateVolume();
            } catch (e) {
                console.warn("Could not initialize mic visualizer", e);
            }
        };

        initAudio();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(() => { });
            }
        };
    }, [step, exam?.isAudioProctoringEnabled, isCameraActive]);

    // ── Advanced Speech-to-Text (Voice Capture) ───────────────────────────
    useEffect(() => {
        if (!isExamRunning || !exam?.isAudioProctoringEnabled) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported in this browser. Falling back to simple noise detection only.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Works well for English and Hinglish

        let isStoppedIntentionally = false;

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();

            if (transcript.length > 2) {
                const videoTimestamp = timeLeftRef.current ? (exam.duration * 60) - timeLeftRef.current : 0;
                handleProctoringEvent({
                    eventType: 'audio_anomaly',
                    severity: 'high',
                    timestamp: new Date().toISOString(),
                    details: `Speech detected: "${transcript}"`,
                    videoTimestamp: Math.max(0, videoTimestamp)
                });
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                isStoppedIntentionally = true;
            }
        };

        recognition.onend = () => {
            if (!isStoppedIntentionally) {
                try { recognition.start(); } catch (e) { }
            }
        };

        try { recognition.start(); } catch (e) { }

        return () => {
            isStoppedIntentionally = true;
            try { recognition.stop(); } catch (e) { }
        };
    }, [isExamRunning, exam, handleProctoringEvent]);

    // ── Tab-switch tracker ────────────────────────────────────────────────
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden || !exam || loading || step !== 'exam') return;
            const newCount = tabSwitchCount + 1;
            setTabSwitchCount(newCount);
            const newEvent = {
                eventType: 'tab_switch',
                severity: newCount >= 5 ? 'high' : newCount >= 3 ? 'medium' : 'low',
                timestamp: new Date().toISOString(),
                details: `Tab switch #${newCount} — strictTabSwitching: ${exam.strictTabSwitching}`,
                videoTimestamp: timeLeftRef.current ? (exam.duration * 60) - timeLeftRef.current : 0,
            };
            setProctoringEvents(prev => [...prev, newEvent]);

            if (exam.strictTabSwitching) {
                const msg = newCount >= 5 ? `🚨 CRITICAL: ${newCount} tab switches! Exam flagged as HIGH RISK.`
                    : newCount >= 3 ? `🚨 Warning #${newCount}: Tab switching will result in exam cancellation.`
                        : `⚠️ Tab switch detected (${newCount}/5). Strict monitoring is active.`;
                toast.error(msg, { duration: 5000, id: 'tab-switch' });
            } else {
                if (newCount <= 3) { toast(`ℹ️ Tab switch recorded (${newCount})`, { duration: 2500, id: 'tab-switch', style: { background: '#334155', color: '#fff', fontSize: 13 } }); }
                if (newCount > 3) { toast.error(`⚠️ Multiple tab switches (${newCount}) recorded.`, { duration: 3000, id: 'tab-switch' }); }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [exam, loading, tabSwitchCount, step]);

    // ── Fetch exam ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/student/exams/${id}`);
                if (res.data.success) {
                    const fetchedExam = res.data.exam;
                    setExam(fetchedExam);
                    try {
                        const saved = localStorage.getItem(AUTOSAVE_KEY);
                        if (saved) {
                            const parsed = JSON.parse(saved);
                            if (parsed.examId === id) {
                                setSelections(parsed.selections || {});
                                setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                                setVisitedQuestions(new Set(parsed.visitedQuestions || [0]));
                                const savedTime = parsed.timeLeft;
                                if (typeof savedTime === 'number' && savedTime > 0 && savedTime <= fetchedExam.duration * 60) {
                                    setTimeLeft(savedTime);
                                } else { setTimeLeft(fetchedExam.duration * 60); }
                                toast.success('Your previous progress has been restored.', { icon: '💾' });
                            } else { setTimeLeft(fetchedExam.duration * 60); }
                        } else { setTimeLeft(fetchedExam.duration * 60); }
                    } catch { setTimeLeft(fetchedExam.duration * 60); }

                    if (fetchedExam.sections?.length > 0) {
                        const timers = {};
                        fetchedExam.sections.forEach((sec, idx) => { timers[idx] = sec.duration * 60; });
                        setSectionTimers(timers);
                    }
                    if (fetchedExam.isAdaptive) fetchNextAdaptiveQuestion([], null);
                }
            } catch (error) {
                toast.error('Failed to load exam. Please try again.');
                router.push('/student/exams');
            } finally { setLoading(false); }
        };
        fetchExam();
    }, [id, router, AUTOSAVE_KEY]);

    // ── Adaptive ─────────────────────────────────────────────────────────
    const fetchNextAdaptiveQuestion = async (answeredIds, wasCorrect) => {
        setAdaptiveLoading(true);
        try {
            const res = await api.post(`/student/exams/${id}/next-question`, { answeredQuestionIds: answeredIds, lastAnswerCorrect: wasCorrect, });
            if (res.data.success) {
                if (res.data.finished) setAdaptiveFinished(true);
                else { setAdaptiveQuestion(res.data.question); setAdaptiveSelection(null); }
            }
        } catch (err) { toast.error('Failed to load next question.'); }
        finally { setAdaptiveLoading(false); }
    };

    const handleAdaptiveSubmitAnswer = async () => {
        if (adaptiveSelection === null) { toast.error('Please select an option.'); return; }
        const q = adaptiveQuestion;
        const newAnswered = [...adaptiveAnswered, { questionId: q._id, selectedOption: adaptiveSelection }];
        setAdaptiveAnswered(newAnswered);
        await fetchNextAdaptiveQuestion(newAnswered.map(a => a.questionId), lastCorrect);
    };

    // ── Section timer ────────────────────────────────────────────────────
    useEffect(() => {
        if (loading || !exam || !hasSections || step !== 'exam') return;
        const sectionTimer = setInterval(() => {
            setSectionTimers(prev => {
                const updated = { ...prev };
                let anyChanged = false;
                Object.keys(updated).forEach(secIdx => {
                    const idx = Number(secIdx);
                    if (!lockedSections.has(idx) && updated[idx] > 0) {
                        updated[idx] -= 1;
                        anyChanged = true;
                        if (updated[idx] <= 0) {
                            setLockedSections(prevLocked => { const n = new Set(prevLocked); n.add(idx); return n; });
                            toast.error(`Section "${exam.sections[idx]?.name}" time is up!`);
                        }
                    }
                });
                return anyChanged ? updated : prev;
            });
        }, 1000);
        return () => clearInterval(sectionTimer);
    }, [loading, exam, hasSections, lockedSections, step]);

    const getSectionForQuestion = useCallback((qIdx) => {
        if (!hasSections || !exam?.sections) return -1;
        return exam.sections.findIndex(s => qIdx >= s.questionStartIndex && qIdx <= s.questionEndIndex);
    }, [hasSections, exam]);

    const isQuestionLocked = useCallback((qIdx) => {
        if (!hasSections) return false;
        const secIdx = getSectionForQuestion(qIdx);
        return secIdx !== -1 && lockedSections.has(secIdx);
    }, [hasSections, getSectionForQuestion, lockedSections]);

    // ── Auto-save ────────────────────────────────────────────────────────
    useEffect(() => {
        if (loading || !exam || step !== 'exam') return;
        const autoSaveInterval = setInterval(() => {
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
                    examId: id, selections, currentQuestionIndex,
                    visitedQuestions: [...visitedQuestions],
                    timeLeft: timeLeftRef.current, savedAt: Date.now(),
                }));
            } catch { /* ignore */ }
        }, 10000);
        return () => clearInterval(autoSaveInterval);
    }, [loading, exam, selections, currentQuestionIndex, visitedQuestions, id, step, AUTOSAVE_KEY]);

    const clearAutoSave = useCallback(() => { try { localStorage.removeItem(AUTOSAVE_KEY); } catch { } }, [AUTOSAVE_KEY]);

    // ── Main timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (loading || !exam || isAdaptive || step !== 'exam') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); handleSubmit(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, exam, isAdaptive, step]);

    // ── Visited questions ────────────────────────────────────────────────
    useEffect(() => {
        if (step !== 'exam') return;
        setVisitedQuestions(prev => { const n = new Set(prev); n.add(currentQuestionIndex); return n; });
    }, [currentQuestionIndex, step]);

    // ── Answer handlers ──────────────────────────────────────────────────
    const handleOptionSelect = (optionIndex) => {
        if (isQuestionLocked(currentQuestionIndex)) { toast.error("This section's time has expired."); return; }
        setSelections(prev => ({ ...prev, [currentQuestionIndex]: { ...(prev[currentQuestionIndex] || {}), optionIndex } }));
    };
    const handleNumericAnswer = (value) => {
        if (isQuestionLocked(currentQuestionIndex)) return;
        setSelections(prev => ({ ...prev, [currentQuestionIndex]: { ...(prev[currentQuestionIndex] || {}), numericAnswer: value } }));
    };
    const handleSubjectiveAnswer = (text) => {
        if (isQuestionLocked(currentQuestionIndex)) return;
        setSelections(prev => ({ ...prev, [currentQuestionIndex]: { ...(prev[currentQuestionIndex] || {}), textAnswer: text } }));
    };
    const handleMatchAnswer = (leftItem, rightItem) => {
        if (isQuestionLocked(currentQuestionIndex)) return;
        setSelections(prev => ({ ...prev, [currentQuestionIndex]: { ...(prev[currentQuestionIndex] || {}), matchAnswers: { ...(prev[currentQuestionIndex]?.matchAnswers || {}), [leftItem]: rightItem } } }));
    };
    const handleClearResponse = () => {
        if (isQuestionLocked(currentQuestionIndex)) return;
        setSelections(prev => {
            const n = { ...prev };
            if (n[currentQuestionIndex]) n[currentQuestionIndex] = { ...n[currentQuestionIndex], optionIndex: null, numericAnswer: null, textAnswer: '', matchAnswers: {} };
            return n;
        });
    };
    const handleMarkForReview = () => {
        setSelections(prev => {
            const current = prev[currentQuestionIndex] || {};
            return { ...prev, [currentQuestionIndex]: { ...current, isMarked: !current.isMarked } };
        });
    };
    const handleNext = () => { if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1); };
    const handleSkip = () => { if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1); };

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const isConfirmed = await confirmDialog('Finish Test', "Are you sure you want to finish the test? You won't be able to change your answers.");
            if (!isConfirmed) return;
        }
        setSubmitting(true);
        try {
            const answersToSubmit = isAdaptive ? adaptiveAnswered : Object.entries(selections).map(([qIdx, data]) => ({
                questionId: exam.questions[Number(qIdx)]._id,
                selectedOption: data.optionIndex ?? -1,
                selectedOptionText: data.optionIndex !== undefined && data.optionIndex !== null
                    ? (exam.questions[Number(qIdx)]?.options?.[data.optionIndex]?.text || null) : null,
                numericAnswer: data.numericAnswer || null,
                matchAnswers: data.matchAnswers || null,
                textAnswer: data.textAnswer || '',
            }));

            const timeSpent = (exam.duration * 60) - timeLeft;
            const res = await api.post(`/student/exams/${id}/submit`, {
                answers: answersToSubmit, timeSpent,
                startedAt: startedAt || new Date(Date.now() - timeSpent * 1000).toISOString(),
                tabSwitchCount, proctoringEvents
            });
            if (res.data.success) {
                if (res.data.proctoring?.riskLevel !== 'Safe') {
                    const msg = res.data.proctoring.riskLevel === 'Cheating Detected'
                        ? '🚨 Your exam has been flagged for suspicious activity.' : '⚠️ Some suspicious activity was detected during your exam.';
                    toast.error(msg, { duration: 6000 });
                }
                attemptIdRef.current = res.data.attemptId;
                clearAutoSave();
                toast.success('Test Submitted Successfully!');

                if (exam.showResultImmediately) { router.replace(`/student/exams/${res.data.attemptId}/result`); }
                else { router.replace('/student/exams'); toast.success("Results will be published later by your tutor."); }
            }
        } catch (error) { toast.error('Submission failed. Please try again.'); }
        finally { setSubmitting(false); }
    };

    // ── Helpers ──────────────────────────────────────────────────────────
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    const getQuestionStatus = (index) => {
        const sel = selections[index] || {};
        const hasAnswer = (sel.optionIndex !== undefined && sel.optionIndex !== null)
            || (sel.textAnswer && sel.textAnswer.trim().length > 0)
            || (sel.numericAnswer !== undefined && sel.numericAnswer !== null && sel.numericAnswer !== '')
            || (sel.matchAnswers && Object.keys(sel.matchAnswers).length > 0);
        const isMarked = !!sel.isMarked;
        const isVisited = visitedQuestions.has(index);
        if (isMarked && hasAnswer) return 'marked_answered';
        if (isMarked && !hasAnswer) return 'marked';
        if (hasAnswer) return 'answered';
        if (isVisited && !hasAnswer) return 'not_answered';
        return 'not_visited';
    };

    const getStatusCounts = () => {
        const counts = { answered: 0, marked: 0, marked_answered: 0, not_visited: 0, not_answered: 0 };
        if (!exam) return counts;
        exam.questions.forEach((_, idx) => { counts[getQuestionStatus(idx)]++; });
        return counts;
    };

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium" style={{ fontFamily: T.fontFamily }}>Loading exam…</p>
            </div>
        </div>
    );

    if (!exam) return <div className="p-8 text-center text-slate-500" style={{ fontFamily: T.fontFamily }}>Exam not found</div>;

    // ── Camera/Mic Blocked Modal ─────────────────────────────────────────────
    const CameraBlockModal = () => {
        if (!showCameraBlockModal) return null;
        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
                <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
                    <div className="p-6 bg-red-600 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-black mb-1">Hardware Access Required</h2>
                        <p className="text-red-100 text-sm">This exam requires strict AI proctoring</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-800 text-sm font-semibold text-center">
                                🚫 Camera/Microphone permission was denied. You cannot start this exam without granting required access.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-700">How to fix this:</p>
                            {['Click the lock icon in your browser\'s address bar', 'Set Camera & Microphone permissions to "Allow"', 'Refresh the page and try again', 'Make sure no other app is using them'].map((stepDesc, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                                    <p className="text-sm text-slate-600">{stepDesc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => router.back()} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Back to Exams</button>
                            <button onClick={() => { setShowCameraBlockModal(false); setCameraPermission('pending'); setStep('instructions'); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Retry Setup</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ════════════════════════════════════════════════════════════════════
    // SCREEN 1 — INSTRUCTIONS
    // ════════════════════════════════════════════════════════════════════
    if (step === 'instructions') {
        const needsProctoring = exam.isProctoringEnabled || exam.isAudioProctoringEnabled;
        return (
            <div className="space-y-5 pb-10 px-4 mt-6 max-w-6xl mx-auto" style={{ fontFamily: T.fontFamily }}>
                <CameraBlockModal />
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Link href="/student/dashboard" className="hover:text-[var(--theme-primary)] transition-colors">Dashboard</Link>
                    <span>›</span>
                    <Link href="/student/exams" className="hover:text-[var(--theme-primary)] transition-colors">Tests</Link>
                    <span>›</span>
                    <span className="font-semibold text-slate-700">Exam Instructions</span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                            <div className="w-8 h-8 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h1 className="text-base font-bold text-slate-800">Exam Instructions</h1>
                        </div>
                        <div className="p-6 space-y-5">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-[0.06em]">Please Read the Instructions Carefully</h2>
                            <ul className="space-y-2.5">
                                {[
                                    `This test contains <strong>${exam.questions.length}</strong> questions`,
                                    `Total duration is <strong>${exam.duration} minutes</strong>`,
                                    'You cannot pause the <strong>test once started</strong>',
                                    'Do not refresh or close the browser',
                                    'Test will <strong>auto submit</strong> after <strong>time expires</strong>',
                                    'Your progress is <strong>saved automatically</strong> every 10 seconds',
                                    'Ensure stable internet connection',
                                ].map((text, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]/40 mt-2 shrink-0" />
                                        <span className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
                                    </li>
                                ))}
                                {exam.negativeMarking && (
                                    <li className="flex items-start gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                                        <span className="text-sm text-red-600 font-semibold">Negative marking enabled — incorrect answers will deduct marks.</span>
                                    </li>
                                )}
                            </ul>
                            {(exam.description || exam.instructions) && (
                                <div className="bg-[var(--theme-primary)]/10 rounded-xl p-4 border border-[var(--theme-primary)]/20">
                                    <p className="text-[11px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-2">Additional Instructions</p>
                                    <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(exam.description || exam.instructions) }} />
                                </div>
                            )}
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-[var(--theme-primary)]/10 transition-colors border border-slate-100">
                                <input type="checkbox" checked={agreedToInstructions} onChange={e => setAgreedToInstructions(e.target.checked)} className="w-4 h-4 rounded border-slate-300 cursor-pointer" style={{ accentColor: 'var(--theme-primary)' }} />
                                <span className="text-sm text-slate-700 font-medium">I've read all instructions carefully and have understood them</span>
                            </label>
                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button onClick={() => router.back()} className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Back to Tests</button>
                                <button onClick={() => { if (!agreedToInstructions) return; if (needsProctoring) { setStep('verification'); } else { setStep('exam'); setStartedAt(new Date().toISOString()); } }} disabled={!agreedToInstructions} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-40" style={{ backgroundColor: 'var(--theme-sidebar)' }} onMouseEnter={e => { if (agreedToInstructions) e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--theme-sidebar)'; }}>
                                    {needsProctoring ? 'Proceed to Setup' : 'Start Test'} <ArrowRight className="w-4 h-4" />
                                </button>
                                {needsProctoring && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 w-full absolute -bottom-[4rem] left-0 md:static">
                                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-700 font-semibold">🎥 Strict AI Proctoring is enabled. Hardware access is <strong>mandatory</strong>.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Test Summary card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-fit">
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                            <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center">
                                <Award className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Test Summary</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex items-center gap-2.5 p-3 bg-[var(--theme-primary)]/10 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
                                <span className="text-sm font-semibold text-[var(--theme-primary)] truncate">{exam.title}</span>
                            </div>
                            {[
                                { icon: Clock, label: 'Duration', value: `${exam.duration} mins` },
                                { icon: HelpCircle, label: 'Questions', value: exam.questions.length },
                                { icon: CheckCircle, label: 'Total Marks', value: exam.totalMarks || exam.questions.length },
                                { icon: Sparkles, label: 'Attempts Allowed', value: `${exam.maxAttempts || 1} Allowed` },
                                { icon: XCircle, label: 'Negative Marking', value: exam.negativeMarking ? 'Yes' : 'No' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2"><item.icon className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">{item.label}</span></div>
                                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // SCREEN 2 — PRE-EXAM VERIFICATION (Industry Standard)
    // ════════════════════════════════════════════════════════════════════
    if (step === 'verification') {
        // Validation check for Start Button
        const isVideoOk = !exam.isProctoringEnabled || (faceStatus === 'active' && faceCount === 1 && isFaceAligned);
        const isAudioOk = !exam.isAudioProctoringEnabled || (cameraPermission === 'granted');
        const canStart = isVideoOk && isAudioOk;

        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4" style={{ fontFamily: T.fontFamily }}>
                <CameraBlockModal />
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--theme-sidebar)] to-[var(--theme-primary)]" />
                    <div className="w-16 h-16 bg-[var(--theme-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-8 h-8 text-[var(--theme-primary)]" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">System & Identity Verification</h2>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto text-sm">Please ensure you are in a quiet room and your face is clearly visible. This exam is proctored.</p>

                    {/* Video Area */}
                    {exam.isProctoringEnabled && (
                        <div className="relative w-full max-w-[480px] aspect-[4/3] mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-xl mb-6 ring-4 ring-slate-100">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                            {faceStatus === 'loading' && (
                                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-[var(--theme-primary)]" />
                                    <p className="font-bold text-lg tracking-wide">Loading AI Models...</p>
                                    <p className="text-xs text-slate-400 mt-2">Setting up visual proctoring.</p>
                                </div>
                            )}
                            {faceStatus === 'active' && (
                                <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                                    {faceCount === 0 && <span className="bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg uppercase tracking-wider animate-pulse">No Face Detected</span>}
                                    {faceCount > 1 && <span className="bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg uppercase tracking-wider animate-pulse">Multiple Faces Detected!</span>}
                                    {faceCount === 1 && !isFaceAligned && <span className="bg-amber-500/90 backdrop-blur-md border border-amber-400/50 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg uppercase tracking-wider">Please Look Straight</span>}
                                    {faceCount === 1 && isFaceAligned && <span className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400/50 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg uppercase tracking-wider flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Face Verified</span>}
                                </div>
                            )}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={cn("w-[60%] h-[70%] border-2 border-dashed rounded-[100%] transition-colors duration-500", faceStatus !== 'active' ? "border-white/20" : faceCount === 1 && isFaceAligned ? "border-emerald-500/80 bg-emerald-500/10" : "border-amber-500/80 bg-amber-500/10")} />
                            </div>
                        </div>
                    )}

                    {/* 🔥 NEW: Live Mic Audio Check Bars */}
                    {exam.isAudioProctoringEnabled && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto flex items-center justify-between mb-8 shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                    micVolume > 5 ? "bg-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-200 text-slate-400"
                                )}>
                                    <Mic className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-slate-800">Live Mic Check</h4>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Say something loudly</p>
                                </div>
                            </div>
                            {/* Animated Audio Bars */}
                            <div className="flex items-end gap-1 h-8 px-2 pb-1">
                                {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
                                    const threshold = bar * 8; // Sensitivty map
                                    const isActive = micVolume > threshold;
                                    // Make height dynamic based on exact volume for a bouncy feel
                                    const rawHeight = isActive ? 30 + (micVolume * 0.7) : 25;
                                    const finalHeight = Math.min(100, Math.max(20, rawHeight));

                                    return (
                                        <div
                                            key={bar}
                                            className={cn(
                                                "w-1.5 rounded-full transition-all duration-75",
                                                isActive ? "bg-emerald-500" : "bg-slate-200"
                                            )}
                                            style={{ height: `${finalHeight}%` }}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Status Checklist */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-sm mx-auto text-left mb-8 space-y-3">
                        <div className="flex items-center gap-3">
                            {cameraPermission === 'granted' ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
                            <span className={cn("text-sm font-semibold", cameraPermission === 'granted' ? "text-slate-800" : "text-slate-400")}>Hardware Permissions Granted</span>
                        </div>

                        {exam.isProctoringEnabled && (
                            <>
                                <div className="flex items-center gap-3">
                                    {faceStatus === 'active' ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />}
                                    <span className={cn("text-sm font-semibold", faceStatus === 'active' ? "text-slate-800" : "text-slate-400")}>Visual AI Model Loaded</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(faceCount === 1 && isFaceAligned) ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />}
                                    <span className={cn("text-sm font-semibold", (faceCount === 1 && isFaceAligned) ? "text-slate-800" : "text-slate-400")}>Face Position & Lighting Optimal</span>
                                </div>
                            </>
                        )}

                        {exam.isAudioProctoringEnabled && (
                            <div className="flex items-center gap-3">
                                {micVolume > 5 ? <CheckCircle className="text-emerald-500 w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />}
                                <span className={cn("text-sm font-semibold", micVolume > 5 ? "text-slate-800" : "text-slate-400")}>Microphone Input Received</span>
                            </div>
                        )}
                    </div>

                    <button disabled={!canStart} onClick={() => { setStep('exam'); setStartedAt(new Date().toISOString()); }} className={cn("w-full max-w-sm mx-auto py-4 text-white text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2", canStart ? "hover:scale-[1.02] shadow-xl hover:shadow-2xl" : "opacity-50 cursor-not-allowed")} style={{ backgroundColor: canStart ? 'var(--theme-primary)' : 'var(--theme-sidebar)' }}>
                        {canStart ? 'Start Exam Now' : 'Complete Verification to Start'} {canStart && <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // ADAPTIVE MODE (Requires `step === 'exam'`)
    // ════════════════════════════════════════════════════════════════════
    if (isAdaptive && isExamRunning) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: T.fontFamily }}>
                <header className="h-16 text-white flex items-center justify-between px-6 shadow-sm z-30 shrink-0 bg-[#1e293b]">
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-lg">{exam.title}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold text-amber-300">Adaptive Mode</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 opacity-70" /> {adaptiveAnswered.length} / {exam.questions?.length || '?'} Answered
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-70" /> {formatTime(timeLeft)}
                        </div>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                    {adaptiveLoading ? (
                        <div className="text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-[var(--theme-primary)] mx-auto" />
                            <p className="text-slate-500 font-semibold">Generating next optimal question...</p>
                        </div>
                    ) : adaptiveFinished ? (
                        <div className="text-center space-y-6 max-w-md bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                                <Zap className="w-10 h-10 text-emerald-500 fill-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Adaptive Test Complete!</h2>
                                <p className="text-slate-500 text-sm font-medium">You have successfully answered all adaptive questions. Submit to see your analysis.</p>
                            </div>
                            <button onClick={() => handleSubmit(false)} className="w-full py-3.5 text-base font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/25">
                                Submit Final Test
                            </button>
                        </div>
                    ) : adaptiveQuestion ? (
                        <div className="max-w-3xl w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="mb-6 flex items-center gap-3">
                                <span className="text-xs font-bold px-3 py-1 rounded-md tracking-wide" style={{ color: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                    Difficulty: {adaptiveQuestion.difficulty?.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">{adaptiveQuestion.points || 1} POINTS</span>
                            </div>
                            <p className="text-slate-800 text-xl font-bold mb-8 leading-snug">{adaptiveQuestion.question}</p>
                            <div className="grid gap-3">
                                {adaptiveQuestion.options.map((opt, idx) => (
                                    <button key={idx} onClick={() => setAdaptiveSelection(idx)}
                                        className={cn('flex items-center gap-4 p-5 rounded-2xl border-2 transition-all w-full text-left',
                                            adaptiveSelection === idx ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 shadow-md shadow-purple-500/10' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50')}>
                                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                                            adaptiveSelection === idx ? 'text-white' : 'bg-slate-100 text-slate-500')}
                                            style={adaptiveSelection === idx ? { backgroundColor: 'var(--theme-primary)' } : {}}>
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </div>
                                        <span className={cn('text-base font-medium transition-colors', adaptiveSelection === idx ? 'text-slate-900' : 'text-slate-600')}>
                                            {opt.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                                <button onClick={handleAdaptiveSubmitAnswer} disabled={adaptiveSelection === null}
                                    className="flex items-center gap-2 px-8 py-3.5 font-bold text-base text-white rounded-xl disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                                    style={{ backgroundColor: 'var(--theme-sidebar)' }}>
                                    Submit Answer & Next <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // SCREEN 3 — STANDARD EXAM PLAYER (FOCUS MODE & PREMIUM UI)
    // ════════════════════════════════════════════════════════════════════
    if (isExamRunning) {
        const currentQ = exam.questions[currentQuestionIndex];
        const currentSel = selections[currentQuestionIndex] || {};
        const counts = getStatusCounts();
        const totalMarksObtainable = exam.totalMarks || exam.questions.length;
        const answeredCount = counts.answered + counts.marked_answered;
        const marksProgress = Math.round((answeredCount / exam.questions.length) * 100);
        const isLowTime = timeLeft < 300;

        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: T.fontFamily }}>

                {/* ── 1. Top Header Bar ── */}
                <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-30">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <div className="w-6 h-6 bg-[var(--theme-primary)]/10 rounded text-[var(--theme-primary)] flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4" />
                        </div>
                        <span className="font-black text-sm text-slate-800 tracking-wide">Test: {exam.title}</span>
                    </div>
                    <button onClick={() => handleSubmit(false)} disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Submit Test
                    </button>
                </div>

                {/* ── 2. Premium Stats Bar ── */}
                <div className="px-6 py-3 flex items-center gap-4 bg-[#F8FAFC] shrink-0 z-20 overflow-x-auto custom-scrollbar">
                    <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black tabular-nums border shadow-sm bg-white shrink-0',
                        isLowTime ? 'text-red-600 border-red-200 animate-pulse' : 'text-slate-800 border-slate-200')}>
                        <Timer className={cn("w-5 h-5", isLowTime ? "text-red-500" : "text-[var(--theme-primary)]")} />
                        Time Left: {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-700 border border-slate-200 shadow-sm shrink-0">
                        <HelpCircle className="w-5 h-5 text-[var(--theme-primary)]" />
                        Questions: {currentQuestionIndex + 1} / {exam.questions.length}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-700 border border-slate-200 shadow-sm shrink-0">
                        <Users className="w-5 h-5 text-[var(--theme-primary)]" />
                        Marks: {answeredCount * Math.round(totalMarksObtainable / exam.questions.length)} / {totalMarksObtainable}
                    </div>

                    <div className="flex items-center gap-3 w-48 sm:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${marksProgress}%`, backgroundColor: 'var(--theme-primary)' }} />
                        </div>
                        <span className="text-xs font-black text-slate-700">{marksProgress}%</span>
                    </div>
                </div>

                {/* ── Main Layout (Left: Questions, Right: Sidebar) ── */}
                <div className="flex-1 flex overflow-hidden w-full mx-auto">

                    {/* ── LEFT: Question Area ── */}
                    <main className="flex-1 flex flex-col overflow-hidden bg-white m-4 mr-2 rounded-2xl border border-slate-200 shadow-sm relative">

                        {hasSections && (
                            <div className="h-12 border-b border-slate-200 flex items-center gap-2 px-6 bg-slate-50 shrink-0 overflow-x-auto z-10">
                                {exam.sections.map((sec, secIdx) => (
                                    <button key={secIdx}
                                        onClick={() => { setActiveSection(secIdx); setCurrentQuestionIndex(sec.questionStartIndex); }}
                                        className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-2',
                                            activeSection === secIdx ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]/30'
                                                : lockedSections.has(secIdx) ? 'bg-red-50 text-red-500 opacity-60'
                                                    : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-200')}>
                                        {lockedSections.has(secIdx) && <Lock className="w-3.5 h-3.5" />}
                                        {sec.name.toUpperCase()}
                                        <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-mono bg-white border',
                                            lockedSections.has(secIdx) ? 'border-red-200 text-red-500' : 'border-slate-200 text-slate-600')}>
                                            {lockedSections.has(secIdx) ? '00:00' : formatTime(sectionTimers[secIdx] || 0)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                            <div className="max-w-4xl w-full">
                                <motion.div key={currentQ._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                                        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                            Q{currentQuestionIndex + 1} of {exam.questions.length}
                                        </h2>
                                        {currentQ.section && (
                                            <>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{currentQ.section}</span>
                                            </>
                                        )}
                                        {isQuestionLocked(currentQuestionIndex) && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] ml-auto font-bold">LOCKED</span>}
                                    </div>

                                    {currentQ.questionType === 'passage_based' && currentQ.passage && (
                                        <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <h4 className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Reference Passage
                                            </h4>
                                            <div className="prose prose-sm max-w-none text-slate-700 leading-loose"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.passage) }} />
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2 mb-8">
                                        <span className="text-xl font-black text-[var(--theme-primary)] shrink-0 mt-0.5">Q{currentQuestionIndex + 1}.</span>
                                        <div className="prose prose-lg max-w-none text-slate-800 font-bold leading-snug"
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.question) }} />
                                    </div>

                                    {currentQ.options?.length > 0 && (!currentQ.questionType || currentQ.questionType === 'mcq' || currentQ.questionType === 'passage_based') && (
                                        <div className="space-y-4">
                                            <div className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg mb-2">
                                                Choose one from below options
                                            </div>
                                            {currentQ.options.map((option, idx) => {
                                                const isSelected = currentSel.optionIndex === idx;
                                                return (
                                                    <div key={idx}
                                                        onClick={() => !isQuestionLocked(currentQuestionIndex) && handleOptionSelect(idx)}
                                                        className={cn('flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 group',
                                                            isQuestionLocked(currentQuestionIndex) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                                                            isSelected ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 shadow-md shadow-[var(--theme-primary)]/10' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm')}>

                                                        <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors text-xs font-bold',
                                                            isSelected ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-slate-300 text-slate-500 group-hover:border-slate-400')}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>

                                                        <span className={cn('text-base font-semibold transition-colors flex-1', isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800')}>
                                                            {option.text}
                                                        </span>

                                                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                                            isSelected ? 'border-[var(--theme-primary)]' : 'border-slate-300')}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-primary)]" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {currentQ.questionType === 'numeric' && (
                                        <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <label className="block text-sm font-bold text-slate-700 mb-3">Enter your numeric answer:</label>
                                            <input type="number" step="any"
                                                value={currentSel.numericAnswer || ''}
                                                onChange={e => handleNumericAnswer(e.target.value)}
                                                disabled={isQuestionLocked(currentQuestionIndex)}
                                                placeholder="e.g. 42.5"
                                                className="w-full max-w-sm px-5 py-4 rounded-xl border-2 border-slate-300 focus:border-[var(--theme-primary)] focus:ring-0 text-xl font-bold text-slate-800 transition-colors disabled:opacity-50 bg-white"
                                                style={{ fontFamily: T.fontFamily }} />
                                        </div>
                                    )}

                                    {(!currentQ.options?.length || currentQ.questionType === 'subjective') && currentQ.questionType !== 'numeric' && currentQ.questionType !== 'match_the_following' && (
                                        <div className="mt-8">
                                            <textarea
                                                value={currentSel.textAnswer || ''}
                                                onChange={e => handleSubjectiveAnswer(e.target.value)}
                                                disabled={isQuestionLocked(currentQuestionIndex)}
                                                placeholder="Type your detailed explanatory answer here..."
                                                className="w-full p-6 rounded-2xl border-2 border-slate-200 focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 min-h-[250px] resize-y text-slate-800 bg-slate-50 focus:bg-white shadow-inner transition-all text-base font-medium placeholder:text-slate-400 disabled:opacity-50"
                                                style={{ fontFamily: T.fontFamily }} />
                                        </div>
                                    )}

                                    {currentQ.questionType === 'match_the_following' && currentQ.pairs?.length > 0 && (
                                        <div className="mt-8 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <p className="text-sm font-bold text-slate-500 mb-5">Select the correct match for each item on the left.</p>
                                            {currentQ.pairs.map((pair, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex-1 font-bold text-slate-700">{idx + 1}. {pair.left}</div>
                                                    <div className="hidden sm:block text-slate-300 font-bold px-2">→</div>
                                                    <div className="flex-1">
                                                        <select
                                                            value={currentSel.matchAnswers?.[pair.left] || ''}
                                                            onChange={e => handleMatchAnswer(pair.left, e.target.value)}
                                                            disabled={isQuestionLocked(currentQuestionIndex)}
                                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] disabled:opacity-50 outline-none hover:border-slate-300 transition-colors"
                                                            style={{ fontFamily: T.fontFamily }}>
                                                            <option value="" disabled>Select best match…</option>
                                                            {currentQ.pairs.map((p, i) => (
                                                                <option key={i} value={p.right}>{String.fromCharCode(65 + i)}. {p.right}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="h-10" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Fixed Bottom Action Bar */}
                        <div className="h-20 border-t border-slate-200 bg-white px-6 lg:px-10 flex items-center justify-between shrink-0 z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={handleClearResponse}
                                    className="px-5 py-2.5 text-sm font-bold text-orange-500 border-2 border-orange-400 rounded-lg hover:bg-orange-50 transition-colors bg-white">
                                    Clear Answer
                                </button>
                                <button onClick={handleMarkForReview}
                                    className={cn('px-5 py-2.5 text-sm font-bold border-2 rounded-lg transition-all flex items-center gap-2 bg-white',
                                        currentSel.isMarked ? 'text-purple-600 border-purple-400 bg-purple-50' : 'text-orange-500 border-orange-400 hover:bg-orange-50')}>
                                    {currentSel.isMarked ? 'Unmark Review' : 'Mark for Review'}
                                </button>
                                <button onClick={handleSkip}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors hidden sm:block bg-white">
                                    Skip Question
                                </button>
                            </div>
                            <button
                                onClick={currentQuestionIndex === exam.questions.length - 1 ? () => handleSubmit(false) : handleNext}
                                className="flex items-center gap-2 px-8 py-3 text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 bg-slate-900 hover:bg-slate-800">
                                {currentQuestionIndex === exam.questions.length - 1 ? 'Save & Finish' : 'Save & Next'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </main>

                    {/* ── RIGHT: Sidebar (Question Palette & Camera) ── */}
                    <aside className={cn(
                        'w-[340px] flex flex-col transition-all duration-300 z-40 shrink-0 m-4 ml-0',
                        !isSidebarOpen && 'hidden lg:flex'
                    )}>
                        {/* ── Proctoring Section ────────────────────────────────────────── */}
                        {exam?.isProctoringEnabled && (
                            <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-3 flex-shrink-0">
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Proctoring</span>
                                    </div>
                                    {cameraPermission === 'denied' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                </div>

                                {/* Camera Feed */}
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video w-full shadow-inner">
                                    <ProctoringBadge />
                                    {!isCameraActive && cameraPermission !== 'denied' && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                        </div>
                                    )}
                                    {cameraPermission === 'denied' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/90 p-4 text-center">
                                            <AlertCircle className="w-6 h-6 text-red-300" />
                                            <span className="text-[10px] text-red-100 font-bold leading-tight">Camera Denied<br />Exam integrity compromised</span>
                                        </div>
                                    )}
                                    <video ref={videoRef} autoPlay playsInline muted
                                        className="w-full h-full object-cover transform -scale-x-100" />
                                </div>

                                {/* Audio Bar */}
                                {/* {exam?.isAudioProctoringEnabled && isCameraActive && (
                                    <div className="mt-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                                            micVolume > 10 ? "bg-red-100 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-white border border-slate-200"
                                        )}>
                                            <Mic className="w-3.5 h-3.5" style={{ color: micVolume > 10 ? '#EF4444' : '#94A3B8' }} />
                                        </div>
                                        <div className="flex items-end gap-1 h-6 flex-1 px-1">
                                            {[1, 2, 3, 4, 5, 6].map(bar => (
                                                <div key={bar}
                                                    className="flex-1 rounded-full transition-all duration-75"
                                                    style={{
                                                        height: micVolume > bar * 10 ? `${Math.min(100, 30 + micVolume)}%` : '20%',
                                                        backgroundColor: micVolume > 40 ? '#EF4444' : micVolume > 10 ? '#F59E0B' : '#E2E8F0',
                                                    }} />
                                            ))}
                                        </div>
                                        <span className="flex-shrink-0 w-10 text-right" style={{ fontSize: '9px', fontWeight: 800, color: micVolume > 10 ? '#EF4444' : '#94A3B8', textTransform: 'uppercase' }}>
                                            {micVolume > 40 ? 'VOICE!' : micVolume > 10 ? 'Noise' : 'Silent'}
                                        </span>
                                    </div>
                                )} */}
                            </div>
                        )}

                        {/* ── Questions Navigator ───────────────────────────────────────── */}
                        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">

                            {/* Header */}
                            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0 bg-slate-50/80">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="font-bold text-slate-800 text-sm">
                                        {counts?.answered || 0}/{exam?.questions?.length || 0} Answered
                                    </span>
                                </div>
                                <Menu className="w-5 h-5 text-slate-400 cursor-pointer lg:hidden hover:text-slate-700 transition-colors" onClick={() => setIsSidebarOpen(false)} />
                            </div>

                            {/* Scrollable Questions Grid (Scrollbar Hidden) */}
                            <div className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <div className="grid grid-cols-5 gap-3">
                                    {exam?.questions?.map((_, idx) => {
                                        const status = getQuestionStatus(idx);
                                        const isCurrent = currentQuestionIndex === idx;

                                        let baseClass = 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 border-b-4';

                                        if (status === 'answered') { baseClass = 'bg-emerald-50 border-emerald-400 text-emerald-700 border-b-emerald-500'; }
                                        else if (status === 'not_answered') { baseClass = 'bg-red-50 border-red-400 text-red-700 border-b-red-500'; }
                                        else if (status === 'marked') { baseClass = 'bg-purple-50 border-purple-400 text-purple-700 border-b-purple-500'; }
                                        else if (status === 'marked_answered') { baseClass = 'bg-yellow-50 border-yellow-400 text-yellow-700 border-b-yellow-500'; }

                                        if (isCurrent) {
                                            baseClass += ' ring-2 ring-offset-2 ring-slate-800 z-10 font-black';
                                        }

                                        return (
                                            <button key={idx} onClick={() => setCurrentQuestionIndex(idx)}
                                                className={cn('relative aspect-square rounded-lg border flex items-center justify-center text-sm font-bold transition-colors shadow-sm', baseClass)}>
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer: Legend & Submit */}
                            <div className="p-5 border-t border-slate-200 bg-slate-50 shrink-0">
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-5">
                                    {[
                                        { key: 'answered', count: counts?.answered || 0, color: 'emerald', label: 'Answered', bg: 'border-emerald-500' },
                                        { key: 'not_answered', count: counts?.not_answered || 0, color: 'red', label: 'Not Answered', bg: 'border-red-500' },
                                        { key: 'marked', count: counts?.marked || 0, color: 'purple', label: 'Marked (Review)', bg: 'border-purple-500' },
                                        { key: 'marked_answered', count: counts?.marked_answered || 0, color: 'yellow', label: 'Ans & Marked', bg: 'border-yellow-500' },
                                        { key: 'not_visited', count: counts?.not_visited || 0, color: 'slate', label: 'Not Visited', bg: 'border-slate-400' },
                                    ].map(({ count, label, bg }) => (
                                        <div key={label} className="flex items-start gap-2">
                                            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                                <div className={cn("w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-black text-slate-700 bg-white shadow-sm", bg)}>
                                                    {count}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-600 font-bold leading-tight pt-1">{label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => handleSubmit(false)} disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 border-b-4 border-[#B91C1C] active:border-b-0 active:translate-y-[4px]">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    {submitting ? 'Submitting...' : 'Finish Test'}
                                </button>
                            </div>
                        </div>
                    </aside>

                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="fixed bottom-24 right-6 z-50 p-4 bg-slate-800 text-white rounded-full shadow-2xl lg:hidden flex items-center justify-center">
                        <LayoutGrid className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }
}