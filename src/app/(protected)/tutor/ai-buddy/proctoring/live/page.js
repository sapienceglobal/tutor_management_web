"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Users,
  Bell,
  UserX,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Filter,
  Activity,
  Maximize2,
  Volume2,
  Eye,
  Info,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { motion, AnimatePresence } from "framer-motion";
import { T, S } from "@/constants/tutorTokens";

export default function LiveProctoringCenter() {
  const router = useRouter();
  const { socket } = useSocket();
  const { confirmDialog } = useConfirm();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Direct warning modal states
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningTarget, setWarningTarget] = useState(null); // { studentId, studentName }
  const [warningMessage, setWarningMessage] = useState("");
  const [warningTone, setWarningTone] = useState("assertive");
  const [sendingWarning, setSendingWarning] = useState(false);

  // Expanded logs sidebar / drawer state for a student
  const [selectedSessionLogs, setSelectedSessionLogs] = useState(null);

  // Available exam options for filtering
  const [examOptions, setExamOptions] = useState([]);

  // Fetch initial list of active sessions
  const fetchActiveSessions = async () => {
    try {
      const res = await api.get("/ai/proctoring/live-sessions");
      if (res.data?.success) {
        // Enriched sessions with initial local tracking states
        const enriched = (res.data.sessions || []).map((session) => ({
          ...session,
          violationsCount: 0,
          violationsList: [],
          tabSwitchCount: 0,
          faceCount: 1,
          riskScore: 0,
          riskLevel: "Safe",
          isConnected: true,
        }));
        setSessions(enriched);

        // Extract unique exams for the filter
        const uniqueExams = Array.from(
          new Set(res.data.sessions.map((s) => s.examTitle))
        );
        setExamOptions(uniqueExams);
      }
    } catch (err) {
      console.error("Failed to load active exam sessions:", err);
      const errMsg = err.response?.data?.message || "Failed to load active exam sessions";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  // Listen for real-time proctoring updates via Socket
  useEffect(() => {
    if (!socket) return;

    // Handle proctoring alerts from student pages
    const handleLiveProctoringAlert = (alert) => {
      console.log("🚨 Live proctoring event received in dashboard:", alert);

      // Trigger silent audio warning locally or alert badge outside the state updater function
      const sessionExists = sessionsRef.current.some(
        (session) =>
          session.studentId === alert.studentId &&
          session.examId === alert.examId
      );
      if (sessionExists && alert.severity === "high") {
        toast.error(`⚠️ ${alert.studentName} flagged: ${alert.eventType}`, {
          id: `warning-${alert.studentId}-${Date.now()}`,
          duration: 4000,
        });
      }

      setSessions((prevSessions) => {
        return prevSessions.map((session) => {
          // Match by both student ID and exam ID
          if (
            session.studentId === alert.studentId &&
            session.examId === alert.examId
          ) {
            const timestamp = new Date();
            const timeStr = timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            // Append violation to list
            const newViolation = {
              eventType: alert.eventType,
              severity: alert.severity,
              details: alert.details || "Anomaly detected",
              timeStr,
              timestamp,
            };

            const updatedList = [newViolation, ...(session.violationsList || [])].slice(0, 15);
            const newViolationsCount = (session.violationsCount || 0) + 1;

            // Update specific metrics
            let newTabSwitch = session.tabSwitchCount || 0;
            let newFaceCount = session.faceCount || 1;

            if (alert.eventType === "tab_switch") {
              newTabSwitch += 1;
            } else if (alert.eventType === "no_face") {
              newFaceCount = 0;
            } else if (alert.eventType === "multiple_faces") {
              newFaceCount = 2;
            } else if (alert.eventType === "face_aligned") {
              newFaceCount = 1;
            }

            // Dynamically calculate risk score and level
            const highSeverityCount = updatedList.filter((v) => v.severity === "high").length;
            const mediumSeverityCount = updatedList.filter((v) => v.severity === "medium").length;
            
            const calculatedScore = Math.min(
              100,
              newTabSwitch * 20 + highSeverityCount * 25 + mediumSeverityCount * 12
            );

            let calculatedRisk = "Safe";
            if (calculatedScore >= 70) calculatedRisk = "Cheating Detected";
            else if (calculatedScore >= 40) calculatedRisk = "Suspicious Detected";
            else if (calculatedScore >= 15) calculatedRisk = "Low Confidence Detected";

            return {
              ...session,
              violationsCount: newViolationsCount,
              violationsList: updatedList,
              tabSwitchCount: newTabSwitch,
              faceCount: newFaceCount,
              riskScore: calculatedScore,
              riskLevel: calculatedRisk,
            };
          }
          return session;
        });
      });
    };

    // Handle student joining the exam session
    const handleStudentJoinedExam = (session) => {
      console.log("✍️ Student joined exam session:", session);
      
      setSessions((prevSessions) => {
        const exists = prevSessions.some(
          (s) => s.studentId === session.studentId && s.examId === session.examId
        );
        if (exists) {
          // If already in list, make sure it is marked as connected
          return prevSessions.map((s) => {
            if (s.studentId === session.studentId && s.examId === session.examId) {
              return {
                ...s,
                isConnected: true,
                socketId: session.socketId,
              };
            }
            return s;
          });
        }
        
        // Add new session
        const enriched = {
          ...session,
          violationsCount: 0,
          violationsList: [],
          tabSwitchCount: 0,
          faceCount: 1,
          riskScore: 0,
          riskLevel: "Safe",
          isConnected: true,
        };

        // Add exam title to exam options filter if not present
        setExamOptions((prev) => {
          if (!prev.includes(session.examTitle)) {
            return [...prev, session.examTitle];
          }
          return prev;
        });

        return [enriched, ...prevSessions];
      });
    };

    // Handle student leaving or finishing the exam session
    const handleStudentLeftExam = (data) => {
      console.log("🚪 Student left exam session:", data);
      
      // Let's mark the session as disconnected first and then fade it out after 3 seconds
      setSessions((prevSessions) => {
        return prevSessions.map((session) => {
          if (
            session.studentId === data.studentId &&
            session.examId === data.examId
          ) {
            return {
              ...session,
              isConnected: false,
            };
          }
          return session;
        });
      });

      // Remove the session completely after 3.5 seconds if they haven't reconnected
      setTimeout(() => {
        setSessions((prev) =>
          prev.filter(
            (s) => {
              if (s.studentId === data.studentId && s.examId === data.examId) {
                return s.isConnected; // Keep if reconnected, remove if still disconnected
              }
              return true;
            }
          )
        );
        // If the drawer was open for this student, close it if they are still disconnected
        setSelectedSessionLogs((prevLogs) => {
          if (prevLogs && prevLogs.studentId === data.studentId) {
            const current = sessionsRef.current.find(
              (s) => s.studentId === data.studentId && s.examId === data.examId
            );
            if (current && !current.isConnected) {
              return null;
            }
          }
          return prevLogs;
        });
      }, 3500);
    };

    socket.on("proctoring_alert", handleLiveProctoringAlert);
    socket.on("student_left_exam", handleStudentLeftExam);
    socket.on("student_joined_exam", handleStudentJoinedExam);

    return () => {
      socket.off("proctoring_alert", handleLiveProctoringAlert);
      socket.off("student_left_exam", handleStudentLeftExam);
      socket.off("student_joined_exam", handleStudentJoinedExam);
    };
  }, [socket]);

  // Keep selected logs drawer in sync with updated session logs
  useEffect(() => {
    if (selectedSessionLogs) {
      const currentSession = sessions.find(
        (s) =>
          s.studentId === selectedSessionLogs.studentId &&
          s.examId === selectedSessionLogs.examId
      );
      if (currentSession) {
        setSelectedSessionLogs(currentSession);
      }
    }
  }, [sessions, selectedSessionLogs]);

  // Terminate a student's session
  const handleTerminateSession = async (session) => {
    const isConfirmed = await confirmDialog(
      "BLOCK & TERMINATE EXAM",
      `Are you absolutely sure you want to block ${session.studentName} and terminate their exam attempt? They will be locked out immediately and their exam will be auto-submitted.`,
      "Yes, Terminate Session"
    );

    if (!isConfirmed) return;

    try {
      const res = await api.post("/ai/proctoring/terminate-session", {
        studentId: session.studentId,
        examId: session.examId,
        reason: "Academic dishonesty detected by Proctoring Center",
      });

      if (res.data?.success) {
        toast.success(`Exam attempt terminated for ${session.studentName}`);

        // Instant visual removal transition
        setSessions((prev) =>
          prev.filter(
            (s) =>
              !(
                s.studentId === session.studentId && s.examId === session.examId
              )
          )
        );

        if (
          selectedSessionLogs &&
          selectedSessionLogs.studentId === session.studentId
        ) {
          setSelectedSessionLogs(null);
        }
      } else {
        toast.error(res.data?.message || "Failed to terminate exam session");
      }
    } catch (err) {
      console.error("Failed to terminate exam session:", err);
      toast.error("Failed to terminate exam session");
    }
  };

  // Open Direct Warning Modal
  const openWarningModal = (session) => {
    setWarningTarget({
      studentId: session.studentId,
      studentName: session.studentName,
    });
    setWarningMessage("");
    setIsWarningModalOpen(true);
  };

  // Send Direct Warning Notification
  const sendWarningNotification = async () => {
    if (!warningMessage.trim()) return toast.error("Please enter a warning message");

    setSendingWarning(true);
    try {
      const res = await api.post("/ai/send-notification", {
        targetStudentName: warningTarget.studentName,
        message: `⚠️ WARNING: ${warningMessage}`,
        tone: warningTone,
      });

      if (res.data?.success) {
        toast.success(`Warning successfully sent to ${warningTarget.studentName}'s screen!`);
        setIsWarningModalOpen(false);
      } else {
        toast.error(res.data?.message || "Failed to send warning");
      }
    } catch (err) {
      console.error("Failed to send warning notification:", err);
      toast.error("Failed to deliver warning notification");
    } finally {
      setSendingWarning(false);
    }
  };

  // Filtered sessions list
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = examFilter === "All" || s.examTitle === examFilter;
    const matchesRisk = riskFilter === "All" || s.riskLevel === riskFilter;
    return matchesSearch && matchesExam && matchesRisk;
  });

  // Risk Level Config
  const RISK_CONFIG = {
    "Cheating Detected": {
      color: "text-red-500",
      bg: "bg-red-950/40",
      border: "border-red-500/50 hover:border-red-500",
      badgeBg: "bg-red-500 text-white",
      outlineGlow: "shadow-[0_0_15px_rgba(239,68,68,0.25)] border-red-500/60 animate-pulse",
    },
    "Suspicious Detected": {
      color: "text-amber-500",
      bg: "bg-amber-950/40",
      border: "border-amber-500/50 hover:border-amber-500",
      badgeBg: "bg-amber-500 text-white",
      outlineGlow: "shadow-[0_0_15px_rgba(245,158,11,0.2)] border-amber-500/60",
    },
    "Low Confidence Detected": {
      color: "text-emerald-400",
      bg: "bg-emerald-950/40",
      border: "border-emerald-500/30 hover:border-emerald-500",
      badgeBg: "bg-emerald-500 text-white",
      outlineGlow: "border-emerald-500/40",
    },
    "Safe": {
      color: "text-slate-400",
      bg: "bg-slate-900/60",
      border: "border-slate-800 hover:border-slate-700",
      badgeBg: "bg-slate-800 text-slate-300",
      outlineGlow: "border-slate-800",
    },
  };

  const getElapsedTimeString = (elapsedSecs) => {
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Setup ticking timers for elapsed exam times
  useEffect(() => {
    const timer = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          elapsedSeconds: s.elapsedSeconds + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* ── MAIN WORKSPACE ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 z-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/tutor/ai-buddy/proctoring"
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-850 flex items-center justify-center border border-slate-800 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Live Proctoring Center
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Surveillance dashboard with warning delivery and remote lockout controls.
              </p>
            </div>
          </div>

          {/* Stats Summary Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-850 px-4 py-2.5 rounded-2xl">
              <Users className="w-4 h-4 text-purple-400" />
              <div className="text-xs">
                <span className="block font-black text-white text-base leading-none">
                  {sessions.length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Active Users
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-850 px-4 py-2.5 rounded-2xl">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <div className="text-xs">
                <span className="block font-black text-red-500 text-base leading-none">
                  {sessions.filter((s) => s.riskLevel === "Cheating Detected").length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Cheating Flagged
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-850 px-4 py-2.5 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div className="text-xs">
                <span className="block font-black text-amber-500 text-base leading-none">
                  {sessions.filter((s) => s.riskLevel === "Suspicious Detected").length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Suspicious
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-md border border-slate-900 px-4 py-3 rounded-2xl flex-shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search candidate by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-850 pl-10 pr-4 py-2 rounded-xl text-xs outline-none text-slate-200 focus:border-purple-500 transition-all placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filter by Exam */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full appearance-none bg-slate-950/85 border border-slate-850 pl-4 pr-9 py-2 rounded-xl text-xs outline-none text-slate-300 focus:border-purple-500 transition-all"
              >
                <option value="All">All Live Exams</option>
                {examOptions.map((title, i) => (
                  <option key={i} value={title}>
                    {title}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Filter by Risk */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full appearance-none bg-slate-950/85 border border-slate-850 pl-4 pr-9 py-2 rounded-xl text-xs outline-none text-slate-300 focus:border-purple-500 transition-all"
              >
                <option value="All">All Risk Levels</option>
                <option value="Cheating Detected">Cheating Detected</option>
                <option value="Suspicious Detected">Suspicious Detected</option>
                <option value="Low Confidence Detected">Low Confidence</option>
                <option value="Safe">Safe</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sessions Monitor Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-xs text-slate-400">Synchronizing live proctoring grid...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-900 rounded-3xl p-12 text-center bg-slate-900/10">
              <ShieldAlert className="w-12 h-12 text-slate-800 mb-4" />
              <p className="text-sm text-slate-400 font-medium">
                No active candidate attempts found matching the selected filters.
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Active candidates joining their exam page will connect and render here automatically.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredSessions.map((session) => {
                  const rConfig = RISK_CONFIG[session.riskLevel] || RISK_CONFIG.Safe;

                  return (
                    <motion.div
                      key={`${session.studentId}-${session.examId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className={`relative flex flex-col bg-slate-900 border rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
                        session.isConnected ? "" : "opacity-50"
                      } ${rConfig.outlineGlow}`}
                    >
                      {/* Top indicator bar matching current risk */}
                      <div
                        className={`h-1.5 w-full ${
                          session.riskLevel === "Cheating Detected"
                            ? "bg-red-500"
                            : session.riskLevel === "Suspicious Detected"
                            ? "bg-amber-500"
                            : session.riskLevel === "Low Confidence Detected"
                            ? "bg-emerald-500"
                            : "bg-slate-700"
                        }`}
                      />

                      {/* Card Content wrapper */}
                      <div className="p-5 flex flex-col gap-4 flex-1">
                        
                        {/* Profile Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-sm flex-shrink-0 border border-slate-700">
                              {session.studentAvatar ? (
                                <img
                                  src={session.studentAvatar}
                                  alt={session.studentName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                session.studentName?.[0]?.toUpperCase() || "S"
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-white truncate max-w-[150px]">
                                {session.studentName}
                              </h3>
                              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {session.studentEmail}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-purple-400 font-bold bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded-full">
                              Live
                            </span>
                            <span className="text-[9px] text-slate-500 mt-1">
                              {getElapsedTimeString(session.elapsedSeconds)}
                            </span>
                          </div>
                        </div>

                        {/* Exam Title */}
                        <div className="bg-slate-950/50 border border-slate-950 px-3.5 py-2.5 rounded-2xl">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            EXAM TITLE
                          </p>
                          <p className="text-xs font-black text-slate-200 mt-0.5 truncate">
                            {session.examTitle}
                          </p>
                        </div>

                        {/* Risk Gauge Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              Risk Index:{" "}
                              <strong className={`${rConfig.color} font-black`}>
                                {session.riskScore}%
                              </strong>
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rConfig.badgeBg}`}>
                              {session.riskLevel}
                            </span>
                          </div>
                          
                          {/* Progress gauge track */}
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div
                              className={`h-full transition-all duration-300 ${
                                session.riskLevel === "Cheating Detected"
                                  ? "bg-red-500"
                                  : session.riskLevel === "Suspicious Detected"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${session.riskScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Core Violations Counters Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          
                          <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl">
                            <span className="block text-slate-500 text-[9px] font-bold uppercase">
                              Tab Switch
                            </span>
                            <span
                              className={`block font-black text-sm mt-0.5 ${
                                session.tabSwitchCount > 0 ? "text-amber-500" : "text-slate-400"
                              }`}
                            >
                              {session.tabSwitchCount}x
                            </span>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl">
                            <span className="block text-slate-500 text-[9px] font-bold uppercase">
                              Face Check
                            </span>
                            {session.faceCount === 1 ? (
                              <span className="block font-black text-sm text-emerald-400 mt-0.5">
                                Normal
                              </span>
                            ) : session.faceCount === 0 ? (
                              <span className="block font-black text-sm text-red-500 mt-0.5 animate-pulse">
                                Missing
                              </span>
                            ) : (
                              <span className="block font-black text-sm text-amber-500 mt-0.5">
                                Multi-Face
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-950/40 border border-slate-850 p-2 rounded-xl">
                            <span className="block text-slate-500 text-[9px] font-bold uppercase">
                              Violations
                            </span>
                            <span
                              className={`block font-black text-sm mt-0.5 ${
                                session.violationsCount > 0 ? "text-red-500" : "text-slate-400"
                              }`}
                            >
                              {session.violationsCount}
                            </span>
                          </div>

                        </div>

                        {/* Warnings ticker summary */}
                        <div className="bg-slate-950/30 border border-slate-900 rounded-xl p-2.5 h-[58px] overflow-hidden flex flex-col justify-center">
                          {session.violationsList && session.violationsList.length > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-red-400/80 font-bold block uppercase tracking-wider leading-none mb-1">
                                LATEST ANOMALY LOGGER
                              </span>
                              <p className="text-[10px] text-slate-300 font-medium truncate leading-tight">
                                • {session.violationsList[0].details || session.violationsList[0].eventType}
                              </p>
                              <span className="text-[9px] text-slate-500 font-bold mt-0.5 block leading-none">
                                {session.violationsList[0].timeStr}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 font-medium italic text-center">
                              No violations triggered yet. Secure monitoring active.
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Card Action Controls Footer */}
                      <div className="bg-slate-950/80 border-t border-slate-900 p-3 flex items-center justify-between gap-2">
                        
                        <button
                          onClick={() => setSelectedSessionLogs(session)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all border border-transparent"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Log ({session.violationsCount})
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openWarningModal(session)}
                            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-yellow-500 flex items-center justify-center transition-all"
                            title="Deliver Direct Warning Notice"
                          >
                            <Bell className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleTerminateSession(session)}
                            className="w-8 h-8 rounded-lg bg-red-950/30 hover:bg-red-650 border border-red-950 hover:border-transparent text-red-500 hover:text-white flex items-center justify-center transition-all"
                            title="Lockout Attempt Session"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>

      {/* ── EXPANDED LOGS DRAWER (RIGHT SIDEBAR) ───────────────────────── */}
      <AnimatePresence>
        {selectedSessionLogs && (
          <motion.div
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.95 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="w-[380px] bg-slate-900 border-l border-slate-850 h-full flex flex-col z-40 shadow-2xl flex-shrink-0"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-black text-white">Surveillance Activity Log</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Real-time timeline review for {selectedSessionLogs.studentName}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionLogs(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-all border border-transparent"
              >
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>

            {/* Student Stats overview in Drawer */}
            <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-850 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {selectedSessionLogs.studentName?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {selectedSessionLogs.studentName}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">
                    {selectedSessionLogs.studentEmail}
                  </p>
                </div>
              </div>
              
              {/* Micro specs details */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
                <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-400">
                  Total violations:{" "}
                  <strong className="text-white font-bold block">
                    {selectedSessionLogs.violationsCount}
                  </strong>
                </div>
                <div className="bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg text-slate-400">
                  Tab Switches:{" "}
                  <strong className="text-white font-bold block">
                    {selectedSessionLogs.tabSwitchCount}
                  </strong>
                </div>
              </div>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
              {selectedSessionLogs.violationsList &&
              selectedSessionLogs.violationsList.length > 0 ? (
                <div className="relative border-l border-slate-800 pl-4 space-y-5">
                  {selectedSessionLogs.violationsList.map((log, i) => {
                    const isHigh = log.severity === "high";
                    const isMed = log.severity === "medium";

                    return (
                      <div key={i} className="relative">
                        {/* Dot indicator on vertical line */}
                        <div
                          className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            isHigh
                              ? "bg-red-500"
                              : isMed
                              ? "bg-amber-500"
                              : "bg-emerald-400"
                          }`}
                        />
                        <div className="text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-slate-200 capitalize">
                              {log.eventType?.replace("_", " ")}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold">
                              {log.timeStr}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            {log.details}
                          </p>
                          <span
                            className={`inline-block text-[8px] font-black uppercase px-1 rounded-sm mt-1.5 ${
                              isHigh
                                ? "bg-red-950 text-red-400 border border-red-900/30"
                                : isMed
                                ? "bg-amber-950 text-amber-400 border border-amber-900/30"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-900/30"
                            }`}
                          >
                            {log.severity} severity
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="text-xs text-slate-400 font-medium">Candidate Integrity Clear</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    No logs recorded. Any incoming anomalies will register here.
                  </p>
                </div>
              )}
            </div>

            {/* Quick block controls from log sidebar */}
            <div className="p-6 border-t border-slate-850 bg-slate-950/20 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => openWarningModal(selectedSessionLogs)}
                className="flex-1 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-850 text-xs font-bold transition-all text-slate-300"
              >
                Send Warning
              </button>
              <button
                onClick={() => handleTerminateSession(selectedSessionLogs)}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-550 text-white rounded-xl text-xs font-bold transition-all"
              >
                Lock Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DIRECT WARNING MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {isWarningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWarningModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-white text-base">Send Direct Screen Warning</h3>
                </div>
                <button
                  onClick={() => setIsWarningModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Target candidate: <strong className="text-slate-200">{warningTarget?.studentName}</strong>
                </p>

                {/* Quick select templates */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                    Quick Warning Messages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Please look at your screen. Face alignment deviation detected.",
                      "Ensure you are alone. Secondary voice activity has been logged.",
                      "Do not switch windows or tabs. Strict compliance required.",
                      "Keep background noise level low during the exam attempt.",
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => setWarningMessage(template)}
                        className="text-[10px] text-slate-300 hover:text-white bg-slate-950 border border-slate-850 hover:border-slate-700 px-3 py-1.5 rounded-lg text-left transition-all max-w-full truncate"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                    Custom Warning Notice
                  </label>
                  <textarea
                    rows="3"
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder="Enter explicit warning message to show on student's screen..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs outline-none text-slate-200 focus:border-amber-500 transition-all placeholder-slate-600 resize-none"
                  />
                </div>

                {/* Tone Select */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                    Warning Urgency/Tone
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "encouraging", label: "Mild/Encourage" },
                      { key: "assertive", label: "Assertive/Warn" },
                      { key: "stern", label: "Stern/Urgent" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setWarningTone(item.key)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          warningTone === item.key
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setIsWarningModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-850 hover:bg-slate-850 rounded-xl text-xs font-bold transition-all text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={sendWarningNotification}
                  disabled={sendingWarning}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {sendingWarning ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  {sendingWarning ? "Delivering..." : "Deliver Notice"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
