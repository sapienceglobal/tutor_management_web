"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Maximize,
  Minimize,
  ChevronRight,
  Menu,
  Lock,
  Zap,
  Loader2,
  Timer,
  HelpCircle,
  Award,
  LayoutGrid,
  LogOut,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  Sparkles,
  UserCheck,
  Flag,
  CheckSquare,
  Users,
  Mic,
} from "lucide-react";
import api from "@/lib/axios";
import { sanitizeHtml } from "@/lib/sanitize";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import Link from "next/link";
import { T } from "@/constants/studentTokens";
import { useFaceProctoring } from "@/hooks/useFaceProctoring";

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
  const [step, setStep] = useState("instructions");
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [micVolume, setMicVolume] = useState(0);

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
  const [cameraPermission, setCameraPermission] = useState("pending");
  const [showCameraBlockModal, setShowCameraBlockModal] = useState(false);

  const [showQuestionList, setShowQuestionList] = useState(false);

  const attemptIdRef = useRef(null);
  const isExamRunning = step === "exam";

  // ── Focus Mode Effect (Scroll Lock) ──────────────────────────────────
  useEffect(() => {
    if (isExamRunning) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isExamRunning]);

  // 🔥 Proctoring Event Handler (Audio & Gaze Included)
  const handleProctoringEvent = useCallback((event) => {
    setProctoringEvents((prev) => [...prev, event]);
    if (event.eventType === "no_face") {
      toast.error(
        "⚠️ Warning: Face not detected. Please stay in camera frame!",
        { id: "ai-no-face", duration: 4000 },
      );
    } else if (event.eventType === "multiple_faces") {
      toast.error("🚨 ALERT: Multiple faces detected! This is recorded.", {
        id: "ai-multi-face",
        duration: 5000,
      });
    } else if (
      event.eventType === "audio_anomaly" &&
      event.details?.includes("Speech detected")
    ) {
      const words = event.details.split('"')[1] || "voice";
      toast.error(`🎤 ALERT: Voice detected! AI captured: "${words}"`, {
        id: "ai-speech",
        duration: 5000,
      });
    } else if (
      event.eventType === "audio_anomaly" &&
      event.details?.includes("noise")
    ) {
      toast.error("🎤 Warning: Suspicious background noise detected.", {
        id: "ai-audio",
        duration: 3000,
      });
    } else if (event.eventType === "audio_anomaly") {
      toast.error("⚠️ Warning: Please look straight at your screen.", {
        id: "ai-look-away",
        duration: 3000,
      });
    } else if (
      event.eventType === "unauthorized_object" &&
      event.details?.includes("down")
    ) {
      toast.error("⚠️ Warning: Please do not look down continuously.", {
        id: "ai-look-down",
        duration: 4000,
      });
    }
  }, []);

  const {
    status: faceStatus,
    faceCount,
    isFaceAligned,
  } = useFaceProctoring({
    videoRef,
    isActive:
      (step === "verification" || step === "exam") &&
      !loading &&
      !!exam &&
      !!exam.isProctoringEnabled,
    isVerificationMode: step === "verification",
    examDuration: exam ? exam.duration * 60 : 0,
    timeLeftRef,
    onEvent: handleProctoringEvent,
  });

  const ProctoringBadge = () => {
    if (faceStatus === "loading") {
      return (
        <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{" "}
          Loading AI...
        </div>
      );
    }
    if (faceStatus === "error") {
      return (
        <div className="absolute top-2 left-2 bg-slate-500/90 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white" /> Cam Unavailable
        </div>
      );
    }
    if (faceStatus === "active") {
      const badgeBg =
        faceCount === 0
          ? "bg-red-500/90"
          : faceCount === 1 && !isFaceAligned
            ? "bg-amber-500/90"
            : faceCount === 1
              ? "bg-emerald-500/90"
              : "bg-rose-600/90";
      const label =
        faceCount === 0
          ? "No Face Detected"
          : faceCount === 1 && !isFaceAligned
            ? "Looking Away"
            : faceCount === 1
              ? "AI Active"
              : faceCount + " Faces Detected!";
      return (
        <div
          className={cn(
            "absolute top-2 left-2 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black z-10 flex items-center gap-1.5 shadow-md",
            badgeBg,
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{" "}
          {label}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // ── AI Webcam Initialization ───────────────────────────────────
  useEffect(() => {
    if (loading || !exam) return;
    if (!exam.isProctoringEnabled && !exam.isAudioProctoringEnabled) {
      setCameraPermission("not_required");
      setIsCameraActive(false);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      if (mediaStreamRef.current) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission("denied");
        setShowCameraBlockModal(true);
        return;
      }
      try {
        const constraints = {};
        if (exam.isProctoringEnabled)
          constraints.video = {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          };
        if (exam.isAudioProctoringEnabled) constraints.audio = true;

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;

        if (
          videoRef.current &&
          videoRef.current.srcObject !== stream &&
          exam.isProctoringEnabled
        ) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(console.error);
        }
        setCameraPermission("granted");
        setIsCameraActive(true);
      } catch (err) {
        if (cancelled) return;
        setCameraPermission("denied");
        setIsCameraActive(false);
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.name === "NotFoundError" ||
          err.name === "OverconstrainedError"
        ) {
          setShowCameraBlockModal(true);
        }
        setProctoringEvents((prev) => [
          ...prev,
          {
            eventType: "no_face",
            severity: "high",
            timestamp: new Date().toISOString(),
            details: `Hardware access denied: ${err.name} — ${err.message}`,
            videoTimestamp: 0,
          },
        ]);
      }
    };
    startCamera();
    return () => {
      cancelled = true;
    };
  }, [loading, exam]);

  useEffect(() => {
    if (
      exam?.isProctoringEnabled &&
      videoRef.current &&
      mediaStreamRef.current
    ) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current
          .play()
          .catch((e) => console.warn("Auto-play prevented", e));
      }
    }
  }, [step, exam]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 🔥 ── LIVE MIC VOLUME VISUALIZER (VERIFICATION STEP) ─────────────────
  useEffect(() => {
    if (
      step !== "verification" ||
      !exam?.isAudioProctoringEnabled ||
      !mediaStreamRef.current
    )
      return;

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

        const source = audioContext.createMediaStreamSource(
          new MediaStream([audioTracks[0]]),
        );
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
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    };
  }, [step, exam?.isAudioProctoringEnabled, isCameraActive]);

  // ── Advanced Speech-to-Text (Voice Capture) ───────────────────────────
  useEffect(() => {
    if (!isExamRunning || !exam?.isAudioProctoringEnabled) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn(
        "Speech Recognition API not supported. Falling back to noise detection.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    let isStoppedIntentionally = false;

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim();

      if (transcript.length > 2) {
        const videoTimestamp = timeLeftRef.current
          ? exam.duration * 60 - timeLeftRef.current
          : 0;
        handleProctoringEvent({
          eventType: "audio_anomaly",
          severity: "high",
          timestamp: new Date().toISOString(),
          details: `Speech detected: "${transcript}"`,
          videoTimestamp: Math.max(0, videoTimestamp),
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        isStoppedIntentionally = true;
      }
    };

    recognition.onend = () => {
      if (!isStoppedIntentionally) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    try {
      recognition.start();
    } catch (e) {}

    return () => {
      isStoppedIntentionally = true;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isExamRunning, exam, handleProctoringEvent]);

  // ── Tab-switch tracker ────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden || !exam || loading || step !== "exam") return;
      const newCount = tabSwitchCount + 1;
      setTabSwitchCount(newCount);
      const newEvent = {
        eventType: "tab_switch",
        severity: newCount >= 5 ? "high" : newCount >= 3 ? "medium" : "low",
        timestamp: new Date().toISOString(),
        details: `Tab switch #${newCount} — strictTabSwitching: ${exam.strictTabSwitching}`,
        videoTimestamp: timeLeftRef.current
          ? exam.duration * 60 - timeLeftRef.current
          : 0,
      };
      setProctoringEvents((prev) => [...prev, newEvent]);

      if (exam.strictTabSwitching) {
        const msg =
          newCount >= 5
            ? `🚨 CRITICAL: ${newCount} tab switches! Exam flagged as HIGH RISK.`
            : newCount >= 3
              ? `🚨 Warning #${newCount}: Tab switching will result in exam cancellation.`
              : `⚠️ Tab switch detected (${newCount}/5). Strict monitoring is active.`;
        toast.error(msg, { duration: 5000, id: "tab-switch" });
      } else {
        if (newCount <= 3) {
          toast(`ℹ️ Tab switch recorded (${newCount})`, {
            duration: 2500,
            id: "tab-switch",
            style: { background: "#334155", color: "#fff", fontSize: 13 },
          });
        }
        if (newCount > 3) {
          toast.error(`⚠️ Multiple tab switches (${newCount}) recorded.`, {
            duration: 3000,
            id: "tab-switch",
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
                if (
                  typeof savedTime === "number" &&
                  savedTime > 0 &&
                  savedTime <= fetchedExam.duration * 60
                ) {
                  setTimeLeft(savedTime);
                } else {
                  setTimeLeft(fetchedExam.duration * 60);
                }
                toast.success("Your previous progress has been restored.", {
                  icon: "💾",
                });
              } else {
                setTimeLeft(fetchedExam.duration * 60);
              }
            } else {
              setTimeLeft(fetchedExam.duration * 60);
            }
          } catch {
            setTimeLeft(fetchedExam.duration * 60);
          }

          if (fetchedExam.sections?.length > 0) {
            const timers = {};
            fetchedExam.sections.forEach((sec, idx) => {
              timers[idx] = sec.duration * 60;
            });
            setSectionTimers(timers);
          }
          if (fetchedExam.isAdaptive) fetchNextAdaptiveQuestion([], null);
        }
      } catch (error) {
        toast.error("Failed to load exam. Please try again.");
        router.push("/student/exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, router, AUTOSAVE_KEY]);

  // ── Adaptive ─────────────────────────────────────────────────────────
  const fetchNextAdaptiveQuestion = async (answeredIds, wasCorrect) => {
    setAdaptiveLoading(true);
    try {
      const res = await api.post(`/student/exams/${id}/next-question`, {
        answeredQuestionIds: answeredIds,
        lastAnswerCorrect: wasCorrect,
      });
      if (res.data.success) {
        if (res.data.finished) setAdaptiveFinished(true);
        else {
          setAdaptiveQuestion(res.data.question);
          setAdaptiveSelection(null);
        }
      }
    } catch (err) {
      toast.error("Failed to load next question.");
    } finally {
      setAdaptiveLoading(false);
    }
  };

  const handleAdaptiveSubmitAnswer = async () => {
    if (adaptiveSelection === null) {
      toast.error("Please select an option.");
      return;
    }
    const q = adaptiveQuestion;
    const newAnswered = [
      ...adaptiveAnswered,
      { questionId: q._id, selectedOption: adaptiveSelection },
    ];
    setAdaptiveAnswered(newAnswered);
    await fetchNextAdaptiveQuestion(
      newAnswered.map((a) => a.questionId),
      lastCorrect,
    );
  };

  // ── Section timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !exam || !hasSections || step !== "exam") return;
    const sectionTimer = setInterval(() => {
      setSectionTimers((prev) => {
        const updated = { ...prev };
        let anyChanged = false;
        Object.keys(updated).forEach((secIdx) => {
          const idx = Number(secIdx);
          if (!lockedSections.has(idx) && updated[idx] > 0) {
            updated[idx] -= 1;
            anyChanged = true;
            if (updated[idx] <= 0) {
              setLockedSections((prevLocked) => {
                const n = new Set(prevLocked);
                n.add(idx);
                return n;
              });
              toast.error(`Section "${exam.sections[idx]?.name}" time is up!`);
            }
          }
        });
        return anyChanged ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(sectionTimer);
  }, [loading, exam, hasSections, lockedSections, step]);

  const getSectionForQuestion = useCallback(
    (qIdx) => {
      if (!hasSections || !exam?.sections) return -1;
      return exam.sections.findIndex(
        (s) => qIdx >= s.questionStartIndex && qIdx <= s.questionEndIndex,
      );
    },
    [hasSections, exam],
  );

  const isQuestionLocked = useCallback(
    (qIdx) => {
      if (!hasSections) return false;
      const secIdx = getSectionForQuestion(qIdx);
      return secIdx !== -1 && lockedSections.has(secIdx);
    },
    [hasSections, getSectionForQuestion, lockedSections],
  );

  // ── Auto-save ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !exam || step !== "exam") return;

    const saveToLocal = () => {
      if (attemptIdRef.current) return; // Do not save if already submitted
      try {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            examId: id,
            selections,
            currentQuestionIndex,
            visitedQuestions: [...visitedQuestions],
            timeLeft: timeLeftRef.current,
            savedAt: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
    };

    const autoSaveInterval = setInterval(saveToLocal, 10000);

    return () => {
      clearInterval(autoSaveInterval);
      saveToLocal(); // Save immediately when unmounting or changing dependencies
    };
  }, [
    loading,
    exam,
    selections,
    currentQuestionIndex,
    visitedQuestions,
    id,
    step,
    AUTOSAVE_KEY,
  ]);

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {}
  }, [AUTOSAVE_KEY]);

  // ── Main timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !exam || isAdaptive || step !== "exam") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, exam, isAdaptive, step]);

  // ── Visited questions ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "exam") return;
    setVisitedQuestions((prev) => {
      const n = new Set(prev);
      n.add(currentQuestionIndex);
      return n;
    });
  }, [currentQuestionIndex, step]);

  // ── Answer handlers ──────────────────────────────────────────────────
  const handleOptionSelect = (optionIndex) => {
    if (isQuestionLocked(currentQuestionIndex)) {
      toast.error("This section's time has expired.");
      return;
    }
    setSelections((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || {}),
        optionIndex,
      },
    }));
  };
  const handleNumericAnswer = (value) => {
    if (isQuestionLocked(currentQuestionIndex)) return;
    setSelections((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || {}),
        numericAnswer: value,
      },
    }));
  };
  const handleSubjectiveAnswer = (text) => {
    if (isQuestionLocked(currentQuestionIndex)) return;
    setSelections((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || {}),
        textAnswer: text,
      },
    }));
  };
  const handleMatchAnswer = (leftItem, rightItem) => {
    if (isQuestionLocked(currentQuestionIndex)) return;
    setSelections((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || {}),
        matchAnswers: {
          ...(prev[currentQuestionIndex]?.matchAnswers || {}),
          [leftItem]: rightItem,
        },
      },
    }));
  };
  const handleClearResponse = () => {
    if (isQuestionLocked(currentQuestionIndex)) return;
    setSelections((prev) => {
      const n = { ...prev };
      if (n[currentQuestionIndex])
        n[currentQuestionIndex] = {
          ...n[currentQuestionIndex],
          optionIndex: null,
          numericAnswer: null,
          textAnswer: "",
          matchAnswers: {},
        };
      return n;
    });
  };
  const handleMarkForReview = () => {
    setSelections((prev) => {
      const current = prev[currentQuestionIndex] || {};
      return {
        ...prev,
        [currentQuestionIndex]: { ...current, isMarked: !current.isMarked },
      };
    });
  };
  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1)
      setCurrentQuestionIndex((prev) => prev + 1);
  };
  const handleSkip = () => {
    if (currentQuestionIndex < exam.questions.length - 1)
      setCurrentQuestionIndex((prev) => prev + 1);
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const isConfirmed = await confirmDialog(
        "Finish Test",
        "Are you sure you want to finish the test? You won't be able to change your answers.",
      );
      if (!isConfirmed) return;
    }
    setSubmitting(true);
    try {
      const answersToSubmit = isAdaptive
        ? adaptiveAnswered
        : Object.entries(selections).map(([qIdx, data]) => ({
            questionId: exam.questions[Number(qIdx)]._id,
            selectedOption: data.optionIndex ?? -1,
            selectedOptionText:
              data.optionIndex !== undefined && data.optionIndex !== null
                ? exam.questions[Number(qIdx)]?.options?.[data.optionIndex]
                    ?.text || null
                : null,
            numericAnswer: data.numericAnswer || null,
            matchAnswers: data.matchAnswers || null,
            textAnswer: data.textAnswer || "",
          }));

      const timeSpent = exam.duration * 60 - timeLeft;
      const res = await api.post(`/student/exams/${id}/submit`, {
        answers: answersToSubmit,
        timeSpent,
        startedAt:
          startedAt || new Date(Date.now() - timeSpent * 1000).toISOString(),
        tabSwitchCount,
        proctoringEvents,
      });
      if (res.data.success) {
        if (res.data.proctoring?.riskLevel !== "Safe") {
          const msg =
            res.data.proctoring.riskLevel === "Cheating Detected"
              ? "🚨 Your exam has been flagged for suspicious activity."
              : "⚠️ Some suspicious activity was detected during your exam.";
          toast.error(msg, { duration: 6000 });
        }
        attemptIdRef.current = res.data.attemptId;
        clearAutoSave();
        toast.success("Test Submitted Successfully!");

        if (exam.showResultImmediately) {
          router.replace(`/student/exams/${res.data.attemptId}/result`);
        } else {
          router.replace("/student/exams");
          toast.success("Results will be published later by your tutor.");
        }
      }
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getQuestionStatus = (index) => {
    const sel = selections[index] || {};
    const hasAnswer =
      (sel.optionIndex !== undefined && sel.optionIndex !== null) ||
      (sel.textAnswer && sel.textAnswer.trim().length > 0) ||
      (sel.numericAnswer !== undefined &&
        sel.numericAnswer !== null &&
        sel.numericAnswer !== "") ||
      (sel.matchAnswers && Object.keys(sel.matchAnswers).length > 0);
    const isMarked = !!sel.isMarked;
    const isVisited = visitedQuestions.has(index);
    if (isMarked && hasAnswer) return "marked_answered";
    if (isMarked && !hasAnswer) return "marked";
    if (hasAnswer) return "answered";
    if (isVisited && !hasAnswer) return "not_answered";
    return "not_visited";
  };

  const getStatusCounts = () => {
    const counts = {
      answered: 0,
      marked: 0,
      marked_answered: 0,
      not_visited: 0,
      not_answered: 0,
    };
    if (!exam) return counts;
    exam.questions.forEach((_, idx) => {
      counts[getQuestionStatus(idx)]++;
    });
    return counts;
  };

  // Helper for grid button styles
  const getGridBtnStyles = (status) => {
    switch (status) {
      case "answered":
        return {
          border: "1px solid #E2E8F0",
          color: "#1E1B4B",
          barColor: "#22C55E",
        };
      case "not_answered":
        return {
          border: "1px solid #EF4444",
          color: "#EF4444",
          barColor: "#EF4444",
        };
      case "marked":
        return {
          border: "1px solid #A855F7",
          color: "#A855F7",
          barColor: "#A855F7",
        };
      case "marked_answered":
        return {
          border: "1px solid #FBBF24",
          color: "#F97316",
          barColor: "#FBBF24",
        };
      case "not_visited":
      default:
        return {
          border: "1px solid #E2E8F0",
          color: "#1E1B4B",
          barColor: "#CBD5E1",
        };
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
            </div>
          </div>
          <p
            className="text-sm text-slate-400 font-medium"
            style={{ fontFamily: T.fontFamily }}
          >
            Loading exam…
          </p>
        </div>
      </div>
    );

  if (!exam)
    return (
      <div
        className="p-8 text-center text-slate-500"
        style={{ fontFamily: T.fontFamily }}
      >
        Exam not found
      </div>
    );

  // ── Camera/Mic Blocked Modal ─────────────────────────────────────────────
  const CameraBlockModal = () => {
    if (!showCameraBlockModal) return null;
    return (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style={{
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
          <div className="p-6 bg-red-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black mb-1">
              Hardware Access Required
            </h2>
            <p className="text-red-100 text-sm">
              This exam requires strict AI proctoring
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm font-semibold text-center">
                🚫 Camera/Microphone permission was denied. You cannot start
                this exam without granting required access.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                How to fix this:
              </p>
              {[
                "Click the lock icon in your browser's address bar",
                'Set Camera & Microphone permissions to "Allow"',
                "Refresh the page and try again",
                "Make sure no other app is using them",
              ].map((stepDesc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600">{stepDesc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Exams
              </button>
              <button
                onClick={() => {
                  setShowCameraBlockModal(false);
                  setCameraPermission("pending");
                  setStep("instructions");
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Retry Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 1 — INSTRUCTIONS
  // ════════════════════════════════════════════════════════════════════
  if (step === "instructions") {
    const needsProctoring =
      exam.isProctoringEnabled || exam.isAudioProctoringEnabled;
    return (
      <div
        className="space-y-5 pb-10 px-4 mt-6 max-w-6xl mx-auto"
        style={{ fontFamily: T.fontFamily }}
      >
        <CameraBlockModal />
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Link
            href="/student/dashboard"
            className="hover:text-[var(--theme-primary)] transition-colors"
          >
            Dashboard
          </Link>
          <span>›</span>
          <Link
            href="/student/exams"
            className="hover:text-[var(--theme-primary)] transition-colors"
          >
            Tests
          </Link>
          <span>›</span>
          <span className="font-semibold text-slate-700">
            Exam Instructions
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="w-8 h-8 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-[var(--theme-primary)]" />
              </div>
              <h1 className="text-base font-bold text-slate-800">
                Exam Instructions
              </h1>
            </div>
            <div className="p-6 space-y-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-[0.06em]">
                Please Read the Instructions Carefully
              </h2>
              <ul className="space-y-2.5">
                {[
                  `This test contains <strong>${exam.questions.length}</strong> questions`,
                  `Total duration is <strong>${exam.duration} minutes</strong>`,
                  "You cannot pause the <strong>test once started</strong>",
                  "Do not refresh or close the browser",
                  "Test will <strong>auto submit</strong> after <strong>time expires</strong>",
                  "Your progress is <strong>saved automatically</strong> every 10 seconds",
                  "Ensure stable internet connection",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]/40 mt-2 shrink-0" />
                    <span
                      className="text-sm text-slate-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                    />
                  </li>
                ))}
                {exam.negativeMarking && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span className="text-sm text-red-600 font-semibold">
                      Negative marking enabled — incorrect answers will deduct
                      marks.
                    </span>
                  </li>
                )}
              </ul>
              {(exam.description || exam.instructions) && (
                <div className="bg-[var(--theme-primary)]/10 rounded-xl p-4 border border-[var(--theme-primary)]/20">
                  <p className="text-[11px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-2">
                    Additional Instructions
                  </p>
                  <div
                    className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        exam.description || exam.instructions,
                      ),
                    }}
                  />
                </div>
              )}
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-[var(--theme-primary)]/10 transition-colors border border-slate-100">
                <input
                  type="checkbox"
                  checked={agreedToInstructions}
                  onChange={(e) => setAgreedToInstructions(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                  style={{ accentColor: "var(--theme-primary)" }}
                />
                <span className="text-sm text-slate-700 font-medium">
                  I've read all instructions carefully and have understood them
                </span>
              </label>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back to Tests
                </button>
                <button
                  onClick={() => {
                    if (!agreedToInstructions) return;
                    if (needsProctoring) {
                      setStep("verification");
                    } else {
                      setStep("exam");
                      setStartedAt(new Date().toISOString());
                    }
                  }}
                  disabled={!agreedToInstructions}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "var(--theme-sidebar)" }}
                  onMouseEnter={(e) => {
                    if (agreedToInstructions)
                      e.currentTarget.style.backgroundColor =
                        "var(--theme-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-sidebar)";
                  }}
                >
                  {needsProctoring ? "Proceed to Setup" : "Start Test"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
                {needsProctoring && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 w-full absolute -bottom-[4rem] left-0 md:static">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-semibold">
                      🎥 Strict AI Proctoring is enabled. Hardware access is{" "}
                      <strong>mandatory</strong>.
                    </p>
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
                <span className="text-sm font-semibold text-[var(--theme-primary)] truncate">
                  {exam.title}
                </span>
              </div>
              {[
                {
                  icon: Clock,
                  label: "Duration",
                  value: `${exam.duration} mins`,
                },
                {
                  icon: HelpCircle,
                  label: "Questions",
                  value: exam.questions.length,
                },
                {
                  icon: CheckCircle,
                  label: "Total Marks",
                  value: exam.totalMarks || exam.questions.length,
                },
                {
                  icon: Sparkles,
                  label: "Attempts Allowed",
                  value: `${exam.maxAttempts || 1} Allowed`,
                },
                {
                  icon: XCircle,
                  label: "Negative Marking",
                  value: exam.negativeMarking ? "Yes" : "No",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 2 — PRE-EXAM VERIFICATION (No-Scroll Optimized Split Layout)
  // ════════════════════════════════════════════════════════════════════
  if (step === "verification") {
    const isVideoOk =
      !exam.isProctoringEnabled ||
      (faceStatus === "active" && faceCount === 1 && isFaceAligned);
    const isAudioOk =
      !exam.isAudioProctoringEnabled || cameraPermission === "granted";
    const canStart = isVideoOk && isAudioOk;

    return (
      <div
        className="h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-[#F4F6FB] overflow-hidden"
        style={{ fontFamily: T.fontFamily }}
      >
        <CameraBlockModal />

        {/* Main Card - Forced to max available height */}
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col max-h-full">
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#6366F1] shrink-0" />

          {/* Header - Reduced paddings */}
          <div className="px-6 pt-5 pb-4 flex items-center gap-4 border-b border-slate-100 bg-white shrink-0">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 hidden sm:flex">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#1E1B4B] mb-1">
                System & Identity Verification
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                Please ensure you are in a quiet, well-lit room. This exam
                environment is actively monitored.
              </p>
            </div>
          </div>

          {/* Main Split Content - Flexible height */}
          <div className="flex flex-col lg:flex-row p-5 md:p-6 gap-6 lg:gap-8 bg-slate-50/50 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
            {/* ── LEFT COLUMN: Camera & Mic ── */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Video Area */}
              {exam.isProctoringEnabled && (
                <div className="flex flex-col h-full min-h-0">
                  <h3 className="text-[14px] font-bold text-[#1E1B4B] mb-2 flex items-center gap-2 shrink-0">
                    <Eye className="w-4 h-4 text-indigo-600" /> Live Camera Feed
                  </h3>
                  {/* Changed aspect ratio to aspect-video (16:9) to save vertical space */}
                  <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-200 shrink-0">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {faceStatus === "loading" && (
                      <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                        <p className="font-bold text-sm tracking-wide">
                          Loading AI Models...
                        </p>
                      </div>
                    )}
                    {faceStatus === "active" && (
                      <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
                        {faceCount === 0 && (
                          <span className="bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider animate-pulse">
                            No Face Detected
                          </span>
                        )}
                        {faceCount > 1 && (
                          <span className="bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider animate-pulse">
                            Multiple Faces Detected!
                          </span>
                        )}
                        {faceCount === 1 && !isFaceAligned && (
                          <span className="bg-amber-500/90 backdrop-blur-md border border-amber-400/50 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider">
                            Please Look Straight
                          </span>
                        )}
                        {faceCount === 1 && isFaceAligned && (
                          <span className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400/50 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Face
                            Verified
                          </span>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className={cn(
                          "w-[50%] h-[70%] border-2 border-dashed rounded-[100%] transition-colors duration-500",
                          faceStatus !== "active"
                            ? "border-white/20"
                            : faceCount === 1 && isFaceAligned
                              ? "border-emerald-500/80 bg-emerald-500/10"
                              : "border-amber-500/80 bg-amber-500/10",
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Mic Check */}
              {exam.isAudioProctoringEnabled && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                        micVolume > 5
                          ? "bg-emerald-100 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          : "bg-slate-100 text-slate-400",
                      )}
                    >
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[14px] font-bold text-[#1E1B4B]">
                        Microphone Check
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500">
                        Speak to test audio levels
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-6 px-1 pb-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
                      const threshold = bar * 8;
                      const isActive = micVolume > threshold;
                      const rawHeight = isActive ? 30 + micVolume * 0.7 : 25;
                      const finalHeight = Math.min(
                        100,
                        Math.max(20, rawHeight),
                      );

                      return (
                        <div
                          key={bar}
                          className={cn(
                            "w-1 rounded-full transition-all duration-75",
                            isActive ? "bg-emerald-500" : "bg-slate-200",
                          )}
                          style={{ height: `${finalHeight}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Checklist & Action ── */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div>
                <h3 className="text-[14px] font-bold text-[#1E1B4B] mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" /> Pre-Exam
                  Checklist
                </h3>

                {/* Compact Checklist */}
                <div className="space-y-2.5 mb-4">
                  {[
                    {
                      show: true,
                      label: "Hardware Permissions Granted",
                      sub: "Camera & mic access enabled",
                      isReady: cameraPermission === "granted",
                    },
                    {
                      show: exam.isProctoringEnabled,
                      label: "Visual AI Model Loaded",
                      sub: "Proctoring engine active",
                      isReady: faceStatus === "active",
                    },
                    {
                      show: exam.isProctoringEnabled,
                      label: "Face Position Optimal",
                      sub: "Lighting & angle verified",
                      isReady: faceCount === 1 && isFaceAligned,
                    },
                    {
                      show: exam.isAudioProctoringEnabled,
                      label: "Microphone Input Received",
                      sub: "Audio levels detectable",
                      isReady: micVolume > 5,
                    },
                  ].map(
                    (item, idx) =>
                      item.show && (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            item.isReady
                              ? "bg-white border-emerald-100 shadow-sm"
                              : "bg-slate-50/50 border-slate-200",
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              item.isReady ? "bg-emerald-50" : "bg-slate-100",
                            )}
                          >
                            {item.isReady ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-[14px] font-bold truncate",
                                item.isReady
                                  ? "text-[#1E1B4B]"
                                  : "text-slate-500",
                              )}
                            >
                              {item.label}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                              {item.sub}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {item.isReady ? (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                                Ready
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              </div>

              <div className="shrink-0 mt-auto">
                {/* Security Notice - More compact */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3.5 flex gap-3 mb-4">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-indigo-900 font-medium leading-snug">
                    Environment monitored by AI. Stay in frame, avoid talking,
                    and do not switch tabs.
                  </p>
                </div>

                {/* Start Button */}
                <button
                  disabled={!canStart}
                  onClick={() => {
                    setStep("exam");
                    setStartedAt(new Date().toISOString());
                  }}
                  className={cn(
                    "w-full py-3.5 text-white text-[16px] font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                    canStart
                      ? "bg-[#1E1B4B] hover:bg-slate-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 border-[1px] border-[#1E1B4B]"
                      : "bg-slate-300 cursor-not-allowed text-slate-500",
                  )}
                >
                  {canStart ? "Start Exam Now" : "Complete Verification"}
                  {canStart && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // ADAPTIVE MODE (Requires `step === 'exam'`)
  // ════════════════════════════════════════════════════════════════════
  if (isAdaptive && isExamRunning) {
    // [Existing Adaptive Logic unchanged, omitted for brevity but should be retained]
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] overflow-hidden"
        style={{ fontFamily: T.fontFamily }}
      >
        <header className="h-16 text-white flex items-center justify-between px-6 shadow-sm z-30 shrink-0 bg-[#1e293b]">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg">{exam.title}</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold text-amber-300">
              Adaptive Mode
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 opacity-70" />{" "}
              {adaptiveAnswered.length} / {exam.questions?.length || "?"}{" "}
              Answered
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
              <p className="text-slate-500 font-semibold">
                Generating next optimal question...
              </p>
            </div>
          ) : adaptiveFinished ? (
            <div className="text-center space-y-6 max-w-md bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <Zap className="w-10 h-10 text-emerald-500 fill-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                  Adaptive Test Complete!
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  You have successfully answered all adaptive questions. Submit
                  to see your analysis.
                </p>
              </div>
              <button
                onClick={() => handleSubmit(false)}
                className="w-full py-3.5 text-base font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/25"
              >
                Submit Final Test
              </button>
            </div>
          ) : adaptiveQuestion ? (
            <div className="max-w-3xl w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-md tracking-wide"
                  style={{
                    color: "var(--theme-primary)",
                    backgroundColor:
                      "color-mix(in srgb, var(--theme-primary) 10%, white)",
                  }}
                >
                  Difficulty: {adaptiveQuestion.difficulty?.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
                  {adaptiveQuestion.points || 1} POINTS
                </span>
              </div>
              <p className="text-slate-800 text-xl font-bold mb-8 leading-snug">
                {adaptiveQuestion.question}
              </p>
              <div className="grid gap-3">
                {adaptiveQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAdaptiveSelection(idx)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all w-full text-left",
                      adaptiveSelection === idx
                        ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 shadow-md shadow-purple-500/10"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                        adaptiveSelection === idx
                          ? "text-white"
                          : "bg-slate-100 text-slate-500",
                      )}
                      style={
                        adaptiveSelection === idx
                          ? { backgroundColor: "var(--theme-primary)" }
                          : {}
                      }
                    >
                      {["A", "B", "C", "D"][idx]}
                    </div>
                    <span
                      className={cn(
                        "text-base font-medium transition-colors",
                        adaptiveSelection === idx
                          ? "text-slate-900"
                          : "text-slate-600",
                      )}
                    >
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                <button
                  onClick={handleAdaptiveSubmitAnswer}
                  disabled={adaptiveSelection === null}
                  className="flex items-center gap-2 px-8 py-3.5 font-bold text-base text-white rounded-xl disabled:opacity-50 transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: "var(--theme-sidebar)" }}
                >
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
  // SCREEN 3 — PREMIUM UI EXAM PLAYER (Matching Exactly with Image)
  // ════════════════════════════════════════════════════════════════════
  if (isExamRunning) {
    const currentQ = exam?.questions?.[currentQuestionIndex] || {};
    const currentSel = selections[currentQuestionIndex] || {};
    const counts = getStatusCounts();
    const totalMarksObtainable = exam.totalMarks || exam.questions.length;
    const answeredCount = counts.answered + counts.marked_answered;
    const marksProgress = Math.round(
      (answeredCount / exam.questions.length) * 100,
    );

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[#F4F6FB] overflow-hidden"
        style={{ fontFamily: T.fontFamily }}
      >
        {/* ── 1. Top Header Row ── */}
        <div className="px-4 md:px-6 pt-5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100">
            <div className="w-6 h-6 bg-[#EAE8FA] rounded flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-[#6366F1]" />
            </div>
            <span className="text-[16px] text-slate-500 font-medium">
              Test:{" "}
              <span className="font-black text-[#1E1B4B] ml-1">
                {exam.title}
              </span>
            </span>
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white text-[17px] font-medium rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 border-none"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Submit Test
          </button>
        </div>

        {/* ── 2. Stats Row ── */}
        <div className="px-4 md:px-6 py-5 flex gap-4 overflow-x-auto shrink-0 z-20 custom-scrollbar border-b border-slate-100/50">
          {/* Time Left Box */}
          <div className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0 whitespace-nowrap min-w-[200px]">
            <Timer className="w-[22px] h-[22px] text-[#4338CA]" />
            <span className="text-[16px] font-medium text-slate-500">
              Time Left:
            </span>
            <span className="text-[22px] font-black text-[#1E1B4B]">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Questions Box */}
          <div className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0 whitespace-nowrap min-w-[200px]">
            <Clock className="w-[22px] h-[22px] text-[#4338CA]" />
            <span className="text-[16px] font-medium text-slate-500">
              Questions:
            </span>
            <span className="text-[22px] font-black text-[#1E1B4B]">
              {currentQuestionIndex + 1} / {exam.questions.length}
            </span>
          </div>

          {/* Marks Box */}
          <div className="flex-1 flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0 whitespace-nowrap min-w-[200px]">
            <Award className="w-[22px] h-[22px] text-[#EA580C]" />
            <span className="text-[16px] font-medium text-slate-500">
              Marks:
            </span>
            <span className="text-[22px] font-black text-[#1E1B4B]">
              {answeredCount *
                Math.round(totalMarksObtainable / exam.questions.length)}{" "}
              / {totalMarksObtainable}
            </span>
          </div>

          {/* Progress Box */}
          <div className="flex-1 flex items-center justify-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0 whitespace-nowrap min-w-[250px]">
            <span className="text-[16px] font-medium text-slate-500">
              Progress
            </span>
            <div className="w-24 h-2.5 bg-[#EAE8FA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22C55E] rounded-full transition-all duration-500"
                style={{ width: `${marksProgress}%` }}
              />
            </div>
            <span className="text-[20px] font-black text-[#1E1B4B]">
              {marksProgress}%
            </span>
          </div>
        </div>

        {/* ── Main Layout Split ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 w-full px-4 md:px-6 pb-6 overflow-hidden">
          {/* ── LEFT: Question Area ── */}
          <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm relative overflow-hidden border border-slate-100">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <motion.div
                key={currentQ._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Question Header */}

                <div className="flex items-center gap-3 pb-2 mb-6">
                  <h2 className="text-[17px] font-bold text-[#1E1B4B]">
                    Q{currentQuestionIndex + 1} of {exam.questions.length}
                  </h2>
                  <span className="text-slate-300 text-lg font-light">|</span>
                  <span className="text-[15px] font-medium text-[#8B95A5] uppercase tracking-wide">
                    {currentQ?.section ||
                      exam?.title?.toUpperCase() ||
                      "GENERAL"}
                  </span>
                </div>

                {/* Main Question */}
                <div className="flex items-start gap-2 mb-6">
                  <div
                    className="prose prose-xl max-w-none text-[#1E1B4B] font-bold leading-snug text-[22px]"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        `Q${currentQuestionIndex + 1}. ` + currentQ.question,
                      ),
                    }}
                  />
                </div>

                {/* Options Logic */}
                {currentQ.options?.length > 0 &&
                  (!(currentQ?.type || currentQ?.questionType) ||
                    (currentQ?.type || currentQ?.questionType) === "mcq" ||
                    (currentQ?.type || currentQ?.questionType) ===
                      "passage_based") && (
                    <div className="space-y-3.5">
                      <div className="inline-flex px-4 py-2.5 bg-[#F4F6FB] text-[#1E1B4B] text-[15px] font-medium rounded-md mb-3">
                        Choose one from below options
                      </div>
                      {currentQ.options.map((option, idx) => {
                        const isSelected = currentSel.optionIndex === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              !isQuestionLocked(currentQuestionIndex) &&
                              handleOptionSelect(idx)
                            }
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 rounded-lg border transition-all duration-200",
                              isQuestionLocked(currentQuestionIndex)
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer",
                              isSelected
                                ? "border-[#4338CA] bg-[#F8FAFC] shadow-[0_2px_10px_-3px_rgba(67,56,202,0.15)]"
                                : "border-[#E2E8F0] bg-white hover:border-slate-300",
                            )}
                          >
                            <div
                              className={cn(
                                "w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors text-[13px] font-bold",
                                isSelected
                                  ? "border-[#4338CA] text-[#4338CA]"
                                  : "border-[#CBD5E1] text-transparent",
                              )}
                            >
                              {isSelected ? String.fromCharCode(65 + idx) : ""}
                            </div>

                            <span
                              className={cn(
                                "text-[17px] transition-colors flex-1",
                                isSelected
                                  ? "text-[#1E1B4B] font-medium"
                                  : "text-[#1E1B4B]",
                              )}
                            >
                              {option.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Numeric Question */}
                {(currentQ?.type || currentQ?.questionType) === "numeric" && (
                  <div className="mt-6">
                    <input
                      type="number"
                      step="any"
                      value={currentSel.numericAnswer || ""}
                      onChange={(e) => handleNumericAnswer(e.target.value)}
                      disabled={isQuestionLocked(currentQuestionIndex)}
                      placeholder="Enter numeric value..."
                      className="w-full max-w-md px-5 py-4 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-lg font-bold text-slate-800 transition-colors disabled:opacity-50 bg-white"
                    />
                  </div>
                )}

                {/* Subjective Question */}
                {(currentQ?.type || currentQ?.questionType) ===
                  "subjective" && (
                  <div className="mt-6">
                    <textarea
                      value={currentSel.textAnswer || ""}
                      onChange={(e) => handleSubjectiveAnswer(e.target.value)}
                      disabled={isQuestionLocked(currentQuestionIndex)}
                      placeholder="Type your answer here..."
                      className="w-full p-6 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 min-h-[200px] resize-y text-slate-800 bg-white transition-all text-base font-medium disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="h-10" />
              </motion.div>
            </div>

            {/* Bottom Actions Bar */}

            <div className="p-6 md:p-8 flex flex-wrap items-center gap-3 bg-white z-20 mt-auto border-t border-slate-50">
              <button
                onClick={handleClearResponse}
                className="px-6 py-2.5 text-[15px] font-medium text-[#EA580C] border border-[#EA580C] rounded-md hover:bg-orange-50 transition-colors bg-white"
              >
                Clear Answer
              </button>
              <button
                onClick={handleMarkForReview}
                className="px-6 py-2.5 text-[15px] font-medium text-[#EA580C] border border-[#EA580C] rounded-md hover:bg-orange-50 transition-colors bg-white"
              >
                {currentSel.isMarked ? "Unmark Review" : "Mark for Review"}
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-2.5 text-[15px] font-medium text-[#1E1B4B] border border-[#C7D2FE] rounded-md hover:bg-[#F4F6FB] transition-colors bg-white"
              >
                Skip Question
              </button>
              <button
                onClick={
                  currentQuestionIndex === exam.questions.length - 1
                    ? () => handleSubmit(false)
                    : handleNext
                }
                className="ml-auto flex items-center gap-2 px-6 py-2.5 text-white text-[15px] font-medium rounded-md transition-all bg-[#1E1B4B] hover:bg-slate-800 border-[1px] border-[#1E1B4B] shadow-sm"
              >
                {currentQuestionIndex === exam.questions.length - 1
                  ? "Save & Finish"
                  : "Save & Next"}
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          </main>

          {/* ── RIGHT: Sidebar ── */}
         {/* ── RIGHT: Sidebar ── */}
          <aside
            className={cn(
              "w-full lg:w-[320px] flex flex-col gap-4 transition-all duration-300 z-40 shrink-0 h-[calc(100vh-2rem)] lg:max-h-full",
              !isSidebarOpen && "hidden lg:flex",
            )}
          >
            {/* ── Proctoring Camera inside UI (Pinned at Top) ── */}
            {exam?.isProctoringEnabled && (
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 shrink-0">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video w-full shadow-inner">
                  <ProctoringBadge />
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                </div>
              </div>
            )}

            {/* ── Scrollable Middle Area (Grid / List + Legend) ── */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
              
              {/* Header: Answered Status & Menu Toggle (Fixed within scroll) */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] shrink-0 pt-1 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="font-semibold text-[#1E1B4B] text-[16px]">
                    {counts?.answered || 0}/{exam?.questions?.length || 0} Answered
                  </span>
                </div>
                <div 
                  className="w-9 h-9 rounded-lg text-[#1E1B4B] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  style={{ backgroundColor: showQuestionList ? "#6366F1" : "#EAE8FA", color: showQuestionList ? "#ffffff" : "#1E1B4B" }}
                  onClick={() => setShowQuestionList(!showQuestionList)}
                  title={showQuestionList ? "Show Grid" : "Show Question List"}
                >
                  {showQuestionList ? <XCircle className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
                </div>
              </div>

              {/* ── CONDITIONAL RENDER: Question List View vs Grid View ── */}
              {showQuestionList ? (
                /* Question List View */
                <div className="flex flex-col gap-2.5 pb-2">
                  {exam?.questions?.map((q, idx) => {
                    const status = getQuestionStatus(idx);
                    const styles = getGridBtnStyles(status);
                    const isActive = idx === currentQuestionIndex;
                    
                    // Safely strip HTML tags for preview (Clean text only)
                    const cleanTextPreview = q?.question?.replace(/<[^>]+>/g, '') || "Question text not available";

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setShowQuestionList(false); // Selection ke baad grid wapis show ho jayega
                        }}
                        className="flex items-start gap-3 p-3.5 rounded-xl border-none cursor-pointer w-full text-left transition-all shrink-0 hover:-translate-y-px"
                        style={{
                          backgroundColor: isActive ? "#EAE8FA" : "#ffffff",
                          border: isActive ? `1px solid #6366F1` : `1px solid #E2E8F0`,
                          boxShadow: isActive ? "0 2px 8px rgba(99,102,241,0.15)" : "0 2px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        {/* Status Dot & Q Number */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-0.5 w-7">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: isActive ? "#6366F1" : styles.barColor }} 
                          />
                          <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#6366F1" : "#64748b" }}>
                            Q{idx + 1}
                          </span>
                        </div>

                        {/* Question Snippet */}
                        <div className="flex-1 min-w-0">
                          <p 
                            className="line-clamp-2 m-0" 
                            style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: isActive ? "#1E1B4B" : "#334155", 
                              lineHeight: 1.4 
                            }}
                          >
                            {cleanTextPreview}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Grid View (Original) */
                <div className="overflow-y-auto custom-scrollbar pr-2 shrink-0 max-h-[175px]">
                  <div className="flex flex-wrap justify-center gap-2.5 pb-2">
                    {exam?.questions?.map((_, idx) => {
                      const status = getQuestionStatus(idx);
                      const styles = getGridBtnStyles(status);
                      const isActive = idx === currentQuestionIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className="flex flex-col overflow-hidden transition-all hover:-translate-y-px border-none cursor-pointer shrink-0"
                          style={{
                            width: 44,
                            height: 48,
                            backgroundColor: isActive ? "#EAE8FA" : "#ffffff",
                            border: isActive ? `1px solid #6366F1` : styles.border,
                            borderRadius: 8,
                            boxShadow: isActive ? `0 0 0 2px rgba(99,102,241,0.2)` : "0 2px 4px rgba(0,0,0,0.04)",
                            padding: 0,
                          }}
                        >
                          {/* Number area */}
                          <div
                            className="flex-1 flex items-center justify-center w-full"
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: isActive ? "#6366F1" : styles.color,
                            }}
                          >
                            {idx + 1}
                          </div>
                          {/* Colored bottom bar */}
                          <div
                            style={{
                              height: 4,
                              width: "100%",
                              backgroundColor: isActive ? "#6366F1" : styles.barColor,
                              borderRadius: "0 0 8px 8px",
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Legend Card ── */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-1 border border-slate-100 mt-auto shrink-0">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  {[
                    {
                      key: "answered",
                      count: counts?.answered || 0,
                      label: "Answered",
                      outerBorder: "border-[#22C55E]",
                      text: "text-[#1E1B4B]",
                      bottomBg: "bg-[#22C55E]",
                    },
                    {
                      key: "not_answered",
                      count: counts?.not_answered || 0,
                      label: "Not Answered",
                      outerBorder: "border-[#EF4444]",
                      text: "text-[#EF4444]",
                      bottomBg: "bg-[#EF4444]",
                    },
                    {
                      key: "marked",
                      count: counts?.marked || 0,
                      label: "Review",
                      outerBorder: "border-[#A855F7]",
                      text: "text-[#A855F7]",
                      bottomBg: "bg-[#A855F7]",
                    },
                    {
                      key: "marked_answered",
                      count: counts?.marked_answered || 0,
                      label: "Ans & Review",
                      outerBorder: "border-[#FBBF24]",
                      text: "text-[#F97316]",
                      bottomBg: "bg-[#FBBF24]",
                    },
                    {
                      key: "not_visited",
                      count: counts?.not_visited || 0,
                      label: "Not Visited",
                      outerBorder: "border-[#94A3B8]",
                      text: "text-[#1E1B4B]",
                      bottomBg: "bg-[#94A3B8]",
                    },
                  ].map(({ count, label, outerBorder, text, bottomBg }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-10 rounded-md border flex flex-col overflow-hidden shrink-0 bg-white",
                          outerBorder,
                        )}
                      >
                        <div
                          className={cn(
                            "flex-1 flex items-center justify-center text-[14px] font-bold",
                            text,
                          )}
                        >
                          {count}
                        </div>
                        <div className={cn("h-1.5 w-full", bottomBg)} />
                      </div>
                      <span className="text-[11px] text-[#1E1B4B] font-semibold leading-tight pr-1">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Finish Button (Pinned at Bottom) ── */}
            <div className="shrink-0 pt-1">
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#DE3B49] text-white text-[17px] font-semibold rounded-[14px] shadow-sm hover:bg-[#C82A37] transition-colors border-none cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="w-[20px] h-[20px] rounded-full border-[2.5px] border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                Finish Test
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }
}
