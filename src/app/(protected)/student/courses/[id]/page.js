"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  MdPlayCircle,
  MdCheckCircle,
  MdLock,
  MdAccessTime,
  MdStar,
  MdStarBorder,
  MdQuiz,
  MdEmojiEvents,
  MdPeople,
  MdDownload,
  MdMessage,
  MdThumbUp,
  MdKeyboardArrowDown,
  MdEdit,
  MdDelete,
  MdBolt,
  MdTrackChanges,
  MdCalendarMonth,
  MdClose,
  MdAutoAwesome,
  MdLanguage,
  MdShieldMoon,
  MdVisibility,
  MdAssignment,
  MdPsychology,
  MdArticle,
  MdSkipNext,
  MdSmartToy,
  MdMenuBook,
  MdFavorite,
  MdFavoriteBorder,
  MdPlayArrow,
  MdBarChart,
  MdWarning,
  MdCampaign,
  MdVideocam,
} from "react-icons/md";
import api from "@/lib/axios";
import assignmentService from "@/services/assignmentService";
import LessonPlayerModal from "@/components/LessonPlayerModal";
import ExamHistoryModal from "@/components/ExamHistoryModal";
import { ReportAbuseModal } from "@/components/shared/ReportAbuseModal";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import Link from "next/link";
import AiTutorWidget from "@/components/AiTutorWidget";
import { motion, AnimatePresence } from "framer-motion";
import { C, T, S, R } from "@/constants/studentTokens";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    completed: {
      label: "Completed",
      bg: C.successBg,
      color: C.success,
      border: C.successBorder,
    },
    "in-progress": {
      label: "In Progress",
      bg: C.btnViewAllBg,
      color: C.btnPrimary,
      border: C.cardBorder,
    },
    locked: {
      label: "Locked",
      bg: C.innerBg,
      color: C.text,
      border: C.cardBorder,
    },
    pending: {
      label: "Pending",
      bg: C.warningBg,
      color: C.warning,
      border: C.warningBorder,
    },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.bold,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: "3px 8px",
        borderRadius: "10px",
      }}
    >
      {status === "completed" && (
        <MdCheckCircle style={{ width: 12, height: 12 }} />
      )}
      {status === "in-progress" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
          style={{ backgroundColor: C.btnPrimary }}
        />
      )}
      {status === "locked" && <MdLock style={{ width: 12, height: 12 }} />}
      {c.label}
    </span>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ pct, size = 120 }) {
  const r = 48,
    circ = 2 * Math.PI * r,
    dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={C.innerBg}
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="url(#pg)"
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
          <defs>
            <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size["2xl"],
              fontWeight: T.weight.bold,
              color: C.heading,
              lineHeight: 1,
            }}
          >
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Score Row ───────────────────────────────────────────────────────────
function QuizScoreRow({ title, score }) {
  const color = score >= 80 ? C.success : score >= 60 ? C.warning : C.danger;
  return (
    <div
      className="flex items-center gap-3 transition-colors"
      style={{
        backgroundColor: C.innerBg,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: "10px",
        padding: 12,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          backgroundColor: C.cardBg,
        }}
      >
        <MdQuiz style={{ width: 16, height: 16, color: C.btnPrimary }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            fontWeight: T.weight.bold,
            color: C.heading,
            margin: "0 0 6px 0",
          }}
        >
          {title}
        </p>
        <div
          className="overflow-hidden"
          style={{ height: 6, borderRadius: "10px", backgroundColor: C.cardBg }}
        >
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${score}%`,
              backgroundColor: color,
              borderRadius: "10px",
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontFamily: T.fontFamily,
          fontSize: T.size.base,
          fontWeight: T.weight.bold,
          color,
          flexShrink: 0,
        }}
      >
        {score}%
      </span>
    </div>
  );
}

// ─── Primary Gradient Button ──────────────────────────────────────────────────
function DBtn({
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
  style: extra = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer ${className}`}
      style={{
        background: C.gradientBtn,
        fontFamily: T.fontFamily,
        fontWeight: T.weight.bold,
        borderRadius: "10px",
        border: "none",
        boxShadow: S.btn,
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CourseDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [courseProgress, setCourseProgress] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [quizScores, setQuizScores] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [expandedModules, setExpandedModules] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showExamHistoryModal, setShowExamHistoryModal] = useState(false);
  const [showLessonPlayerModal, setShowLessonPlayerModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lessonPage, setLessonPage] = useState(1);
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const LESSONS_PER_PAGE = 6;
  const { confirmDialog } = useConfirm();
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    loadCourseData();
    checkWishlistStatus();
  }, [id]);
  useEffect(() => {
    if (activeTab === "discussions") loadReviews();
  }, [activeTab, sortBy]);

  const loadCourseData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const response = await api.get(`/courses/${id}`);
      if (response.data?.success) {
        const courseData = response.data.course;
        let lessonsData = response.data.lessons || [];
        if (courseData.modules?.length > 0) {
          let sorted = [];
          const getModId = (l) =>
            (l.moduleId?._id || l.moduleId || "").toString();
          const byModule = {};
          lessonsData.forEach((l) => {
            const mid = getModId(l);
            if (!byModule[mid]) byModule[mid] = [];
            byModule[mid].push(l);
          });
          courseData.modules.forEach((m) => {
            const mid = m._id.toString();
            if (byModule[mid]) {
              sorted = [
                ...sorted,
                ...byModule[mid].sort(
                  (a, b) => (a.order || 0) - (b.order || 0),
                ),
              ];
              delete byModule[mid];
            }
          });
          Object.keys(byModule).forEach((k) => {
            sorted = [
              ...sorted,
              ...byModule[k].sort((a, b) => (a.order || 0) - (b.order || 0)),
            ];
          });
          lessonsData = sorted;
        } else {
          lessonsData.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        setCourse(courseData);
        setLessons(lessonsData);

        const enrollmentData = response.data.enrollment;
        setEnrollment(enrollmentData || null);

        if (enrollmentData && enrollmentData.status === "pending") {
          setIsPendingApproval(true);
          setIsEnrolled(false);
        } else {
          setIsPendingApproval(false);
          setIsEnrolled(response.data.isEnrolled || false);
        }

        setIsInstructor(response.data.isInstructor || false);
        const moduleIds = courseData.modules?.map((m) => m._id) || [];
        setExpandedModules((prev) => (prev.length ? prev : moduleIds));
      }
      if (
        (response.data?.isEnrolled || response.data?.isInstructor) &&
        !background
      ) {
        const [examRes, liveClassRes, assignmentRes, progressRes] =
          await Promise.all([
            api.get(`/exams/course/${id}`),
            api.get(`/live-classes?courseId=${id}`),
            assignmentService
              .getCourseAssignments(id)
              .catch(() => ({ success: false })),
            api.get(`/progress/course/${id}`).catch(() => ({ data: {} })),
          ]);
        if (examRes.data?.success) setExams(examRes.data.exams || []);
        if (liveClassRes.data?.success)
          setLiveClasses(liveClassRes.data.liveClasses || []);
        if (assignmentRes.success)
          setAssignments(assignmentRes.assignments || []);
        if (progressRes.data?.progress) setCourseProgress(progressRes.data);

        const quizPromises = (response.data.lessons || [])
          .slice(0, 10)
          .map((l) =>
            api
              .get(`/quiz/attempts/${l._id}`)
              .then((r) => ({
                lessonId: l._id,
                lessonTitle: l.title,
                attempts: r.data?.attempts || [],
              }))
              .catch(() => ({
                lessonId: l._id,
                lessonTitle: l.title,
                attempts: [],
              })),
          );
        const quizResults = await Promise.all(quizPromises);
        setQuizScores(
          quizResults
            .filter((q) => q.attempts.length > 0)
            .map((q) => ({
              title: q.lessonTitle?.slice(0, 28) || "Quiz",
              score:
                Math.round(
                  ((q.attempts[0].score ?? 0) /
                    (q.attempts[0].totalQuestions || 1)) *
                    100,
                ) || 0,
            }))
            .slice(0, 5),
        );
      }
    } catch (error) {
      console.error("Error loading course:", error);
      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes("Tutors can only preview")
      ) {
        toast.error(error.response.data.message);
        router.push("/tutor/dashboard");
      }
    } finally {
      if (!background) setLoading(false);
    }
  };

  const loadReviews = async (loadMore = false) => {
    if (loadingReviews) return;
    try {
      setLoadingReviews(true);
      if (!myReview && isEnrolled) {
        try {
          const r = await api.get(`/reviews/my-review/${id}`);
          if (r.data?.success && r.data?.review) setMyReview(r.data.review);
        } catch (_) {}
      }
      const page = loadMore ? currentPage + 1 : 1;
      const response = await api.get(`/reviews/course/${id}`, {
        params: { page, limit: 10, sortBy },
      });
      if (response.data?.success) {
        if (loadMore) setReviews((prev) => [...prev, ...response.data.reviews]);
        else {
          setReviews(response.data.reviews);
          setRatingDistribution(response.data.ratingDistribution || []);
        }
        setHasMoreReviews(response.data.pagination?.hasMore || false);
        setCurrentPage(page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const { data } = await api.get(`/wishlist/${id}/status`);
      setIsWishlisted(data.inWishlist);
    } catch (_) {}
  };
  const toggleWishlist = async () => {
    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        await api.delete(`/wishlist/${id}`);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post("/wishlist", { courseId: id });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (_) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (Boolean(course && !course.isFree && Number(course.price || 0) > 0)) {
      router.push(`/student/checkout/${id}`);
      return;
    }
    try {
      setEnrolling(true);
      const response = await api.post("/enrollments", { courseId: id });
      if (response.data?.success) {
        if (response.data.pending) {
          setIsPendingApproval(true);
          toast.success("Enrollment request sent to tutor.");
        } else {
          setIsEnrolled(true);
          loadCourseData();
        }
      }
    } catch (e) {
      if (e.response?.status === 402 || e.response?.data?.requiresPayment) {
        toast("Redirecting to checkout…", { icon: "💳" });
        router.push(`/student/checkout/${id}`);
        return;
      }
      toast.error(e.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (reviewForm.comment.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }
    try {
      setSubmittingReview(true);
      if (myReview)
        await api.put(`/reviews/${myReview._id}`, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      else
        await api.post("/reviews", {
          courseId: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
      setShowReviewModal(false);
      setMyReview(null);
      loadReviews();
      setReviewForm({ rating: 0, comment: "" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    const ok = await confirmDialog("Delete Review", "Delete your review?", {
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await api.delete(`/reviews/${myReview._id}`);
      setMyReview(null);
      loadReviews();
      toast.success("Review deleted");
    } catch (_) {
      toast.error("Failed to delete review");
    }
  };
  const toggleHelpful = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      loadReviews();
    } catch (_) {}
  };
  const toggleModule = (moduleId) =>
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((i) => i !== moduleId)
        : [...prev, moduleId],
    );
  const getLessonsByModule = (moduleId) =>
    lessons
      .filter(
        (l) =>
          (l.moduleId?._id || l.moduleId)?.toString() === moduleId?.toString(),
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  const isLessonLocked = (lesson) =>
    !isInstructor && !isEnrolled && !lesson.isFree;
  const handleLessonClick = (lesson) => {
    if (isLessonLocked(lesson)) {
      toast.error("Enroll to access this lesson");
      return;
    }
    setSelectedLessonIndex(lessons.findIndex((l) => l._id === lesson._id));
    setShowLessonPlayerModal(true);
  };
  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setShowExamHistoryModal(true);
  };
  const handleStartExam = () => {
    if (selectedExam) {
      setShowExamHistoryModal(false);
      router.push(`/student/exams/${selectedExam._id}`);
    }
  };
  const handleLessonComplete = async () => {
    await loadCourseData(true);
  };

  const handleAISummarize = async () => {
    if (!course) return;
    setAiLoading("summarize");
    setShowAiPanel(true);
    try {
      const res = await api.post("/ai/summarize-lesson", {
        courseId: course._id,
        lessonTitle: course.title,
        content: course.description,
      });
      setAiResult({
        type: "AI Summary",
        content: res.data.summary || res.data.data,
      });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
      setShowAiPanel(false);
    } finally {
      setAiLoading(null);
    }
  };
  const handleAIRevisionNotes = async () => {
    if (!course) return;
    setAiLoading("revision");
    setShowAiPanel(true);
    try {
      const res = await api.post("/ai/revision-notes", {
        courseId: course._id,
        lessonTitle: course.title,
        content: course.description,
      });
      setAiResult({
        type: "Revision Notes",
        content: res.data.notes || res.data.data,
      });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
      setShowAiPanel(false);
    } finally {
      setAiLoading(null);
    }
  };

  const handleJoinClass = async (cls) => {
    try {
      // Attendance mark karo silently
      await api.post(`/live-classes/${cls._id}/attendance`).catch(() => {});

      // Jitsi ya custom link naye tab mein open karo
      if (cls.meetingId) {
        window.open(`https://meet.jit.si/${cls.meetingId}`, "_blank");
      } else if (cls.meetingLink) {
        window.open(cls.meetingLink, "_blank");
      }
    } catch (e) {
      if (cls.meetingLink) window.open(cls.meetingLink, "_blank");
    }
  };
  // ── Derived ───────────────────────────────────────────────────────────────
  const completedIds = (courseProgress?.progress || [])
    .filter((p) => p.completed)
    .map((p) => p.lessonId?.toString());
  const completedCount = completedIds.length;
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
  const pct = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;
  const currentLesson = lessons[selectedLessonIndex] || lessons[0];
  const isCourseSuspended =
    course &&
    (course.status !== "published" ||
      !course?.tutorId?.isVerified ||
      course?.tutorId?.userId?.isBlocked);
  const resumeToFirst = () => {
    const idx = lessons.findIndex(
      (l) => !completedIds.includes(l._id?.toString()),
    );
    setSelectedLessonIndex(idx >= 0 ? idx : 0);
    setShowLessonPlayerModal(true);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: C.pageBg }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-full border-[3px] animate-spin"
            style={{
              width: 48,
              height: 48,
              borderColor: `${C.btnPrimary}30`,
              borderTopColor: C.btnPrimary,
            }}
          />
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.base,
              fontWeight: T.weight.medium,
              color: C.text,
            }}
          >
            Loading course hub…
          </p>
        </div>
      </div>
    );

  if (!course)
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: C.pageBg }}
      >
        <div
          className="text-center"
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: R["2xl"],
            padding: 40,
            boxShadow: S.card,
          }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-4"
            style={{
              width: 64,
              height: 64,
              borderRadius: "10px",
              backgroundColor: C.dangerBg,
            }}
          >
            <MdClose style={{ width: 32, height: 32, color: C.danger }} />
          </div>
          <h2
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.lg,
              fontWeight: T.weight.bold,
              color: C.heading,
              marginBottom: 12,
            }}
          >
            Course Not Found
          </h2>
          <button
            onClick={() => router.back()}
            className="cursor-pointer transition-all hover:opacity-80"
            style={{
              backgroundColor: C.innerBg,
              border: `1px solid ${C.cardBorder}`,
              color: C.heading,
              fontFamily: T.fontFamily,
              fontSize: T.size.base,
              fontWeight: T.weight.semibold,
              padding: "10px 24px",
              borderRadius: "10px",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );

  const tabs = [
    "overview",
    "lessons",
    "live",
    "assignments",
    "discussions",
    "resources",
  ];

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
    >
      {/* Instructor Preview Banner */}
      {isInstructor && (
        <div
          className="flex items-center justify-center gap-2 px-6 py-2.5"
          style={{
            background: "linear-gradient(90deg,#F59E0B,#F97316)",
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            fontWeight: T.weight.bold,
            textTransform: "uppercase",
            letterSpacing: T.tracking.wider,
            color: "#ffffff",
          }}
        >
          <MdVisibility style={{ width: 14, height: 14, flexShrink: 0 }} />
          Preview Mode — Videos &amp; content are fully unlocked for you.
        </div>
      )}

      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-30"
        style={{
          backgroundColor: `${C.cardBg}`,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
          borderRadius: R["2xl"],
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 pt-4 pb-2">
            <div className="min-w-0 flex-1">
              <h1
                className="truncate"
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.lg,
                  fontWeight: T.weight.bold,
                  color: C.heading,
                  margin: 0,
                }}
              >
                {course.title}
              </h1>
              {enrollment?.batchId && (
                <p
                  className="flex items-center gap-1 mt-1"
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.btnPrimary,
                    margin: 0,
                  }}
                >
                  <MdPeople style={{ width: 12, height: 12 }} /> Cohort:{" "}
                  {enrollment.batchId.name}
                </p>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {!isEnrolled && !isInstructor && (
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className="flex items-center justify-center cursor-pointer transition-all"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    backgroundColor: isWishlisted ? "#FEF2F2" : C.cardBg,
                    border: `1px solid ${isWishlisted ? "#FECACA" : C.cardBorder}`,
                  }}
                >
                  {wishlistLoading ? (
                    <div
                      className="rounded-full border-2 animate-spin"
                      style={{
                        width: 18,
                        height: 18,
                        borderColor: `${C.text}30`,
                        borderTopColor: C.text,
                      }}
                    />
                  ) : isWishlisted ? (
                    <MdFavorite
                      style={{ width: 20, height: 20, color: "#EF4444" }}
                    />
                  ) : (
                    <MdFavoriteBorder
                      style={{ width: 20, height: 20, color: C.text }}
                    />
                  )}
                </button>
              )}
              {(isEnrolled || isInstructor) && (
                <button
                  onClick={resumeToFirst}
                  className="shrink-0 flex items-center gap-2 text-white transition-all hover:opacity-90"
                  style={{
                    background: C.gradientBtn,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                    border: "none",
                    borderRadius: "10px",
                    boxShadow: S.btn,
                    height: 40,
                    padding: "0 20px",
                    cursor: "pointer",
                  }}
                >
                  <MdPlayArrow style={{ width: 16, height: 16 }} /> Resume
                  Learning
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto mt-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap transition-all cursor-pointer"
                style={
                  activeTab === tab
                    ? {
                        backgroundColor: C.btnPrimary,
                        color: "#ffffff",
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "6px 16px",
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: S.active,
                      }
                    : {
                        backgroundColor: "transparent",
                        color: C.text,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "6px 16px",
                        borderRadius: "10px",
                        border: "none",
                      }
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suspended Banner */}
      {isCourseSuspended && isEnrolled && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
          <div
            className="flex items-start gap-3"
            style={{
              backgroundColor: C.warningBg,
              border: `1px solid ${C.warningBorder}`,
              borderRadius: "10px",
              padding: 16,
            }}
          >
            <MdWarning
              style={{
                width: 20,
                height: 20,
                marginTop: 2,
                flexShrink: 0,
                color: C.warning,
              }}
            />
            <div>
              <p
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                  color: "#92400E",
                  margin: 0,
                }}
              >
                Course Suspended
              </p>
              <p
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.xs,
                  color: "#92400E",
                  opacity: 0.8,
                  marginTop: 4,
                }}
              >
                This course is no longer publicly available. You retain full
                access as an enrolled student.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* ══ OVERVIEW ══ */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* What you'll learn */}
                {course.whatYouWillLearn?.length > 0 && (
                  <div
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: R["2xl"],
                      padding: 24,
                      boxShadow: S.card,
                    }}
                  >
                    <h3
                      className="flex items-center gap-2 mb-4"
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.md,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 16px 0",
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "10px",
                          backgroundColor: "#FEF3C7",
                        }}
                      >
                        <MdBolt
                          style={{ width: 16, height: 16, color: "#D97706" }}
                        />
                      </div>
                      What You'll Learn
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {course.whatYouWillLearn.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "10px",
                            padding: 14,
                          }}
                        >
                          <MdCheckCircle
                            style={{
                              width: 16,
                              height: 16,
                              color: C.success,
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.base,
                              fontWeight: T.weight.semibold,
                              color: C.heading,
                            }}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About */}
                <div
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: R["2xl"],
                    padding: 24,
                    boxShadow: S.card,
                  }}
                >
                  <h3
                    className="flex items-center gap-2 mb-4"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: "0 0 16px 0",
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        backgroundColor: "#EFF6FF",
                      }}
                    >
                      <MdTrackChanges
                        style={{ width: 16, height: 16, color: "#3B82F6" }}
                      />
                    </div>
                    About This Course
                  </h3>
                  <p
                    className="leading-relaxed whitespace-pre-line"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      color: C.text,
                      fontWeight: T.weight.medium,
                      margin: 0,
                    }}
                  >
                    {course.description}
                  </p>
                </div>

                {/* Requirements */}
                {course.requirements?.length > 0 && (
                  <div
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: R["2xl"],
                      padding: 24,
                      boxShadow: S.card,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.md,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 16px 0",
                      }}
                    >
                      Prerequisites
                    </h3>
                    <ul className="space-y-2 m-0 p-0 list-none">
                      {course.requirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "10px",
                            padding: 14,
                            color: C.heading,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.semibold,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: C.btnPrimary }}
                          />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Study Toolkit */}
                {isEnrolled && (
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg,#1E1B4B 0%,#4338CA 100%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: R["2xl"],
                      padding: 24,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "radial-gradient(white 1px,transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                    <div className="relative z-10">
                      <h3
                        className="flex items-center gap-2 mb-5"
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.md,
                          fontWeight: T.weight.bold,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#ffffff",
                          margin: "0 0 20px 0",
                        }}
                      >
                        <MdPsychology
                          style={{ width: 20, height: 20, color: "#FCD34D" }}
                        />{" "}
                        AI Study Toolkit
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleAISummarize}
                          disabled={aiLoading === "summarize"}
                          className="flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-60 cursor-pointer"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#1E1B4B",
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px 20px",
                          }}
                        >
                          {aiLoading === "summarize" ? (
                            <div
                              className="rounded-full border-2 animate-spin"
                              style={{
                                width: 16,
                                height: 16,
                                borderColor: "#1E1B4B30",
                                borderTopColor: "#1E1B4B",
                              }}
                            />
                          ) : (
                            <MdAutoAwesome
                              style={{
                                width: 16,
                                height: 16,
                                color: "#F59E0B",
                              }}
                            />
                          )}
                          Summarize Course
                        </button>
                        <button
                          onClick={handleAIRevisionNotes}
                          disabled={aiLoading === "revision"}
                          className="flex items-center gap-2 text-white transition-all hover:scale-105 disabled:opacity-60 cursor-pointer"
                          style={{
                            background:
                              "linear-gradient(135deg,#059669,#0d9488)",
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px 20px",
                          }}
                        >
                          {aiLoading === "revision" ? (
                            <div
                              className="rounded-full border-2 animate-spin"
                              style={{
                                width: 16,
                                height: 16,
                                borderColor: "rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                              }}
                            />
                          ) : (
                            <MdArticle style={{ width: 16, height: 16 }} />
                          )}
                          Generate Revision Notes
                        </button>
                      </div>

                      <AnimatePresence>
                        {showAiPanel && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-5"
                          >
                            <div
                              className="relative"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.10)",
                                border: "1px solid rgba(255,255,255,0.20)",
                                borderRadius: "10px",
                                padding: 20,
                              }}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4
                                  className="flex items-center gap-2 text-white"
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    margin: 0,
                                  }}
                                >
                                  <MdPsychology
                                    style={{
                                      width: 16,
                                      height: 16,
                                      color: "#FCD34D",
                                    }}
                                  />
                                  {aiResult?.type || "Generating…"}
                                </h4>
                                <button
                                  onClick={() => setShowAiPanel(false)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  <MdClose
                                    style={{
                                      width: 16,
                                      height: 16,
                                      color: "rgba(255,255,255,0.6)",
                                    }}
                                  />
                                </button>
                              </div>
                              {aiLoading ? (
                                <div className="flex items-center gap-3 py-8 justify-center">
                                  <div
                                    className="rounded-full border-2 animate-spin"
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderColor: "rgba(255,255,255,0.3)",
                                      borderTopColor: "#FCD34D",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontFamily: T.fontFamily,
                                      fontSize: T.size.base,
                                      fontWeight: T.weight.semibold,
                                      color: "rgba(255,255,255,0.8)",
                                    }}
                                  >
                                    Reading course content…
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className="whitespace-pre-wrap"
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    color: "rgba(255,255,255,0.9)",
                                    fontWeight: T.weight.medium,
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {aiResult?.content}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ LESSONS ══ */}
            {activeTab === "lessons" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: R["2xl"],
                    padding: 24,
                    boxShadow: S.card,
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        backgroundColor: C.iconBg,
                      }}
                    >
                      <MdMenuBook
                        style={{ width: 16, height: 16, color: C.iconColor }}
                      />
                    </div>
                    <h3
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.md,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: 0,
                      }}
                    >
                      Course Content
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {(course.modules || []).map((module) => {
                      const mLessons = getLessonsByModule(module._id);
                      if (mLessons.length === 0) return null;
                      const mDone = mLessons.filter((l) =>
                        completedIds.includes(l._id?.toString()),
                      ).length;
                      const isExp = expandedModules.includes(module._id);

                      return (
                        <div
                          key={module._id}
                          className="overflow-hidden transition-all"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "10px",
                          }}
                        >
                          <button
                            onClick={() => toggleModule(module._id)}
                            className="w-full flex items-center justify-between transition-colors"
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 20,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${C.btnPrimary}08`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex items-center justify-center transition-transform"
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "10px",
                                  backgroundColor: isExp
                                    ? C.btnPrimary
                                    : C.cardBg,
                                  transform: isExp ? "rotate(180deg)" : "none",
                                }}
                              >
                                <MdKeyboardArrowDown
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: isExp ? "#ffffff" : C.text,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.base,
                                  fontWeight: T.weight.bold,
                                  color: C.heading,
                                }}
                              >
                                {module.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                style={{
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.xs,
                                  fontWeight: T.weight.bold,
                                  color: C.text,
                                }}
                              >
                                {mDone}/{mLessons.length} Completed
                              </span>
                              {mDone === mLessons.length &&
                                mLessons.length > 0 && (
                                  <MdCheckCircle
                                    style={{
                                      width: 16,
                                      height: 16,
                                      color: C.success,
                                    }}
                                  />
                                )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExp && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                              >
                                <div className="px-3 pb-3 space-y-2">
                                  {mLessons.map((lesson, li) => {
                                    const locked = isLessonLocked(lesson);
                                    const isDone = completedIds.includes(
                                      lesson._id?.toString(),
                                    );
                                    const isAct =
                                      lesson._id === currentLesson?._id;
                                    const status = locked
                                      ? "locked"
                                      : isDone
                                        ? "completed"
                                        : isAct
                                          ? "in-progress"
                                          : "pending";

                                    return (
                                      <div
                                        key={lesson._id}
                                        onClick={() =>
                                          !locked && handleLessonClick(lesson)
                                        }
                                        className="flex items-center gap-3 transition-all"
                                        style={{
                                          backgroundColor: isAct
                                            ? C.cardBg
                                            : C.innerBg,
                                          border: `1px solid ${isAct ? C.btnPrimary : C.cardBorder}`,
                                          borderRadius: "10px",
                                          padding: 16,
                                          opacity: locked ? 0.6 : 1,
                                          cursor: locked
                                            ? "not-allowed"
                                            : "pointer",
                                          boxShadow: isAct ? S.active : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!locked && !isAct) {
                                            e.currentTarget.style.borderColor =
                                              C.btnPrimary;
                                            e.currentTarget.style.transform =
                                              "translateY(-1px)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!locked && !isAct) {
                                            e.currentTarget.style.borderColor =
                                              C.cardBorder;
                                            e.currentTarget.style.transform =
                                              "none";
                                          }
                                        }}
                                      >
                                        <div
                                          className="flex items-center justify-center shrink-0"
                                          style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: "10px",
                                            backgroundColor: isDone
                                              ? C.successBg
                                              : isAct
                                                ? C.btnViewAllBg
                                                : C.cardBg,
                                          }}
                                        >
                                          {isDone ? (
                                            <MdCheckCircle
                                              style={{
                                                width: 18,
                                                height: 18,
                                                color: C.success,
                                              }}
                                            />
                                          ) : lesson.type === "video" ? (
                                            <MdPlayCircle
                                              style={{
                                                width: 18,
                                                height: 18,
                                                color: C.btnPrimary,
                                              }}
                                            />
                                          ) : lesson.type === "quiz" ? (
                                            <MdQuiz
                                              style={{
                                                width: 18,
                                                height: 18,
                                                color: C.warning,
                                              }}
                                            />
                                          ) : (
                                            <MdArticle
                                              style={{
                                                width: 18,
                                                height: 18,
                                                color: C.text,
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className="truncate"
                                            style={{
                                              fontFamily: T.fontFamily,
                                              fontSize: T.size.base,
                                              fontWeight: T.weight.bold,
                                              color: isAct
                                                ? C.btnPrimary
                                                : C.heading,
                                              margin: "0 0 2px 0",
                                            }}
                                          >
                                            {li + 1}. {lesson.title}
                                          </p>
                                          {lesson.duration > 0 && (
                                            <p
                                              className="flex items-center gap-1"
                                              style={{
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.semibold,
                                                color: C.text,
                                                margin: 0,
                                              }}
                                            >
                                              <MdAccessTime
                                                style={{
                                                  width: 10,
                                                  height: 10,
                                                }}
                                              />
                                              {Math.floor(lesson.duration / 60)}
                                              :
                                              {String(
                                                lesson.duration % 60,
                                              ).padStart(2, "0")}{" "}
                                              mins
                                            </p>
                                          )}
                                        </div>
                                        <div className="shrink-0 flex items-center gap-3">
                                          <StatusBadge status={status} />
                                          {!locked && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleLessonClick(lesson);
                                              }}
                                              className="hidden sm:flex items-center gap-1.5 text-white transition-all hover:opacity-90"
                                              style={{
                                                background: C.gradientBtn,
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                border: "none",
                                                borderRadius: "10px",
                                                height: 32,
                                                padding: "0 12px",
                                                cursor: "pointer",
                                              }}
                                            >
                                              {isDone ? (
                                                <>
                                                  <MdSkipNext
                                                    style={{
                                                      width: 12,
                                                      height: 12,
                                                    }}
                                                  />
                                                  Review
                                                </>
                                              ) : (
                                                <>
                                                  <MdPlayArrow
                                                    style={{
                                                      width: 12,
                                                      height: 12,
                                                    }}
                                                  />
                                                  Play
                                                </>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "live" && (
              <div
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 24,
                  boxShadow: S.card,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      backgroundColor: C.iconBg,
                    }}
                  >
                    <MdVideocam
                      style={{ width: 16, height: 16, color: C.iconColor }}
                    />
                  </div>
                  <h3
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Live Sessions
                  </h3>
                </div>

                {!isEnrolled && !isInstructor ? (
                  <div
                    className="text-center border-2 border-dashed"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                      padding: "48px 24px",
                    }}
                  >
                    {/* 2nd Fix */}
                    <MdLock
                      style={{
                        width: 48,
                        height: 48,
                        color: C.text,
                        opacity: 0.3,
                        margin: "0 auto 16px",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 16px 0",
                      }}
                    >
                      Enroll to access live classes
                    </p>
                  </div>
                ) : liveClasses.length > 0 ? (
                  liveClasses.map((cls) => (
                    <div
                      key={cls._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                      style={{
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: "10px",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="p-3 shrink-0"
                          style={{
                            backgroundColor: "#EEF2FF",
                            borderRadius: "10px",
                          }}
                        >
                          {/* 3rd Fix */}
                          <MdVideocam
                            style={{ width: 20, height: 20, color: "#4F46E5" }}
                          />
                        </div>
                        <div>
                          <h4
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: "0 0 4px 0",
                            }}
                          >
                            {cls.title}
                          </h4>
                          <p
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              color: C.text,
                              margin: 0,
                            }}
                          >
                            <MdCalendarMonth className="inline mr-1" />{" "}
                            {new Date(cls.dateTime).toLocaleDateString()} |{" "}
                            <MdAccessTime className="inline mr-1" />{" "}
                            {new Date(cls.dateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinClass(cls)}
                        className="px-5 py-2 border-none cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          background: C.gradientBtn,
                          color: "#fff",
                          borderRadius: "8px",
                          fontFamily: T.fontFamily,
                          fontWeight: T.weight.bold,
                        }}
                      >
                        Join Class
                      </button>
                    </div>
                  ))
                ) : (
                  <div
                    className="text-center border-2 border-dashed"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                      padding: "48px 24px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: 0,
                      }}
                    >
                      No upcoming live classes.
                    </p>
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.sm,
                        color: C.text,
                        margin: "8px 0 0 0",
                      }}
                    >
                      Make sure you have joined a batch!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══ ASSIGNMENTS ══ */}
            {activeTab === "assignments" && (
              <div
                className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 24,
                  boxShadow: S.card,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      backgroundColor: C.iconBg,
                    }}
                  >
                    <MdAssignment
                      style={{ width: 16, height: 16, color: C.iconColor }}
                    />
                  </div>
                  <h3
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Assignments
                  </h3>
                </div>

                {!isEnrolled && !isInstructor ? (
                  <div
                    className="text-center border-2 border-dashed"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                      padding: "48px 24px",
                    }}
                  >
                    <MdLock
                      style={{
                        width: 48,
                        height: 48,
                        color: C.text,
                        opacity: 0.3,
                        margin: "0 auto 16px",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 16px 0",
                      }}
                    >
                      Enroll to access assignments
                    </p>
                    <DBtn
                      onClick={handleEnroll}
                      style={{ padding: "12px 24px", fontSize: T.size.base }}
                    >
                      Enroll Now
                    </DBtn>
                  </div>
                ) : assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const sub = assignment.mySubmission;
                    const isGraded = sub?.status === "graded";
                    const isSubmitted = sub?.status === "submitted";
                    return (
                      <div
                        key={assignment._id}
                        onClick={() =>
                          router.push(
                            `/student/courses/${id}/assignments/${assignment._id}`,
                          )
                        }
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: "10px",
                          padding: 20,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = C.btnPrimary;
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = S.cardHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.cardBorder;
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex items-center justify-center text-white shrink-0"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "10px",
                              backgroundColor: isGraded
                                ? C.success
                                : isSubmitted
                                  ? C.warning
                                  : C.btnPrimary,
                            }}
                          >
                            <MdAssignment style={{ width: 20, height: 20 }} />
                          </div>
                          <div>
                            <h4
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                color: C.heading,
                                margin: "0 0 4px 0",
                              }}
                            >
                              {assignment.title}
                            </h4>
                            <div className="flex items-center gap-3">
                              {isGraded ? (
                                <span
                                  style={{
                                    backgroundColor: C.successBg,
                                    color: C.success,
                                    border: `1px solid ${C.successBorder}`,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    textTransform: "uppercase",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Score: {sub.grade}/{assignment.totalMarks}
                                </span>
                              ) : isSubmitted ? (
                                <span
                                  style={{
                                    backgroundColor: C.warningBg,
                                    color: C.warning,
                                    border: `1px solid ${C.warningBorder}`,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    textTransform: "uppercase",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Submitted
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: C.innerBg,
                                    color: C.text,
                                    border: `1px solid ${C.cardBorder}`,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                    textTransform: "uppercase",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                  }}
                                >
                                  Pending
                                </span>
                              )}
                              {assignment.dueDate && (
                                <span
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.semibold,
                                    color: C.text,
                                  }}
                                >
                                  <MdCalendarMonth
                                    style={{
                                      width: 10,
                                      height: 10,
                                      display: "inline",
                                      marginBottom: 2,
                                      marginRight: 2,
                                    }}
                                  />
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          className="text-white transition-all hover:opacity-80 cursor-pointer w-full sm:w-auto"
                          style={{
                            backgroundColor:
                              isGraded || isSubmitted
                                ? C.success
                                : C.btnPrimary,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            border: "none",
                            borderRadius: "10px",
                            height: 36,
                            padding: "0 20px",
                          }}
                        >
                          {isGraded || isSubmitted
                            ? "View Details"
                            : "Start Assignment"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="text-center border-2 border-dashed"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                      padding: "48px 24px",
                    }}
                  >
                    <MdAssignment
                      style={{
                        width: 48,
                        height: 48,
                        color: C.text,
                        opacity: 0.3,
                        margin: "0 auto 12px",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: 0,
                      }}
                    >
                      No assignments found.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══ REVIEWS ══ */}
            {activeTab === "discussions" && (
              <div
                className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 24,
                  boxShadow: S.card,
                }}
              >
                {/* Rating hero */}
                <div
                  className="flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
                  style={{
                    background: C.gradientBtn,
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: R["2xl"],
                    padding: 32,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        "radial-gradient(#fff 1px,transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="relative text-center shrink-0">
                    <div
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: "56px",
                        fontWeight: T.weight.bold,
                        color: "#ffffff",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {course.rating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="flex gap-1 justify-center mb-2">
                      {[...Array(5)].map((_, i) =>
                        i < Math.round(course.rating) ? (
                          <MdStar
                            key={i}
                            style={{ width: 16, height: 16, color: "#FCD34D" }}
                          />
                        ) : (
                          <MdStarBorder
                            key={i}
                            style={{
                              width: 16,
                              height: 16,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          />
                        ),
                      )}
                    </div>
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "rgba(255,255,255,0.6)",
                        margin: 0,
                      }}
                    >
                      {course.reviewCount} Course Reviews
                    </p>
                  </div>
                  <div className="relative flex-1 w-full space-y-2.5">
                    {ratingDistribution.map((dist) => (
                      <div
                        key={dist.rating}
                        className="flex items-center gap-3"
                      >
                        <span
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: "rgba(255,255,255,0.7)",
                            width: 24,
                          }}
                        >
                          {dist.rating}★
                        </span>
                        <div
                          className="flex-1 overflow-hidden"
                          style={{
                            height: 8,
                            borderRadius: "10px",
                            backgroundColor: "rgba(255,255,255,0.15)",
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${dist.percentage}%`,
                              backgroundColor: "#fff",
                              transition: "width 0.8s ease",
                              borderRadius: "10px",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            width: 20,
                            textAlign: "right",
                            fontWeight: T.weight.bold,
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          {dist.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isEnrolled && (
                  <DBtn
                    onClick={() => {
                      if (myReview)
                        setReviewForm({
                          rating: myReview.rating,
                          comment: myReview.comment,
                        });
                      setShowReviewModal(true);
                    }}
                    className="w-full gap-2 hover:scale-[1.01]"
                    style={{ padding: "16px 0", fontSize: T.size.base }}
                  >
                    <MdMessage style={{ width: 16, height: 16 }} />
                    {myReview ? "Edit Your Review" : "Write a Review"}
                  </DBtn>
                )}

                {/* Sort tabs */}
                <div
                  className="flex items-center gap-1 w-fit"
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: "10px",
                    padding: 4,
                  }}
                >
                  {["recent", "helpful", "rating"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className="capitalize transition-all cursor-pointer"
                      style={
                        sortBy === s
                          ? {
                              backgroundColor: C.btnPrimary,
                              color: "#ffffff",
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              padding: "6px 14px",
                              borderRadius: "10px",
                              border: "none",
                              boxShadow: S.active,
                            }
                          : {
                              backgroundColor: "transparent",
                              color: C.text,
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              padding: "6px 14px",
                              borderRadius: "10px",
                              border: "none",
                            }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {loadingReviews ? (
                  <div className="flex justify-center py-12">
                    <div
                      className="rounded-full border-[3px] animate-spin"
                      style={{
                        width: 32,
                        height: 32,
                        borderColor: `${C.btnPrimary}30`,
                        borderTopColor: C.btnPrimary,
                      }}
                    />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        style={{
                          backgroundColor:
                            review._id === myReview?._id ? C.cardBg : C.innerBg,
                          border: `1px solid ${review._id === myReview?._id ? C.btnPrimary : C.cardBorder}`,
                          borderRadius: "10px",
                          padding: 24,
                          boxShadow:
                            review._id === myReview?._id ? S.cardHover : "none",
                        }}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="flex items-center justify-center overflow-hidden shrink-0"
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: "10px",
                                border: `1px solid ${C.cardBorder}`,
                                backgroundColor: C.cardBg,
                              }}
                            >
                              {review.student?.profileImage ? (
                                <img
                                  src={review.student.profileImage}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  alt=""
                                />
                              ) : (
                                <span
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.md,
                                    fontWeight: T.weight.bold,
                                    color: C.btnPrimary,
                                  }}
                                >
                                  {review.student?.name?.[0]?.toUpperCase() ||
                                    "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.bold,
                                    color: C.heading,
                                    margin: 0,
                                  }}
                                >
                                  {review.student?.name}
                                </p>
                                {review._id === myReview?._id && (
                                  <span
                                    className="text-white"
                                    style={{
                                      background: C.gradientBtn,
                                      fontFamily: T.fontFamily,
                                      fontSize: T.size.xs,
                                      fontWeight: T.weight.bold,
                                      textTransform: "uppercase",
                                      padding: "2px 8px",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) =>
                                    i < review.rating ? (
                                      <MdStar
                                        key={i}
                                        style={{
                                          width: 12,
                                          height: 12,
                                          color: "#FCD34D",
                                        }}
                                      />
                                    ) : (
                                      <MdStarBorder
                                        key={i}
                                        style={{
                                          width: 12,
                                          height: 12,
                                          color: C.cardBorder,
                                        }}
                                      />
                                    ),
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    color: C.text,
                                    fontWeight: T.weight.semibold,
                                  }}
                                >
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            color: C.heading,
                            lineHeight: 1.6,
                            fontWeight: T.weight.medium,
                            margin: "0 0 12px 0",
                          }}
                        >
                          "{review.comment}"
                        </p>

                        {review.tutorResponse?.comment && (
                          <div
                            style={{
                              backgroundColor: C.cardBg,
                              borderLeft: `4px solid ${C.btnPrimary}`,
                              borderRadius: "10px",
                              padding: 16,
                              marginTop: 16,
                            }}
                          >
                            <p
                              className="flex items-center gap-1.5"
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: C.btnPrimary,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                margin: "0 0 6px 0",
                              }}
                            >
                              <MdEmojiEvents
                                style={{ width: 14, height: 14 }}
                              />{" "}
                              Instructor Reply
                            </p>
                            <p
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                color: C.heading,
                                fontWeight: T.weight.medium,
                                margin: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              {review.tutorResponse.comment}
                            </p>
                          </div>
                        )}

                        <div
                          className="flex items-center justify-between mt-4 pt-4"
                          style={{ borderTop: `1px solid ${C.cardBorder}` }}
                        >
                          {review._id !== myReview?._id ? (
                            <button
                              onClick={() => toggleHelpful(review._id)}
                              className="flex items-center gap-1.5 transition-colors cursor-pointer"
                              style={{
                                backgroundColor: C.cardBg,
                                color: C.text,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: "10px",
                                padding: "6px 12px",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  C.innerBg)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  C.cardBg)
                              }
                            >
                              <MdThumbUp style={{ width: 14, height: 14 }} />{" "}
                              Helpful ({review.helpfulCount || 0})
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReviewForm({
                                    rating: review.rating,
                                    comment: review.comment,
                                  });
                                  setShowReviewModal(true);
                                }}
                                className="flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "10px",
                                  backgroundColor: C.cardBg,
                                  border: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                <MdEdit
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: C.btnPrimary,
                                  }}
                                />
                              </button>
                              <button
                                onClick={handleDeleteReview}
                                className="flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "10px",
                                  backgroundColor: C.dangerBg,
                                  border: `1px solid ${C.dangerBorder}`,
                                }}
                              >
                                <MdDelete
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: C.danger,
                                  }}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center border-2 border-dashed"
                    style={{
                      borderColor: C.cardBorder,
                      backgroundColor: C.innerBg,
                      borderRadius: R["2xl"],
                      padding: "64px 24px",
                    }}
                  >
                    <MdMessage
                      style={{
                        width: 48,
                        height: 48,
                        color: C.text,
                        opacity: 0.3,
                        margin: "0 auto 12px",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.md,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 4px 0",
                      }}
                    >
                      No reviews yet.
                    </p>
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        color: C.text,
                        margin: 0,
                      }}
                    >
                      Be the first one to share your experience!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══ RESOURCES ══ */}
            {activeTab === "resources" && (
              <div
                className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 24,
                  boxShadow: S.card,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      backgroundColor: C.iconBg,
                    }}
                  >
                    <MdDownload
                      style={{ width: 16, height: 16, color: C.iconColor }}
                    />
                  </div>
                  <h3
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Course Resources
                  </h3>
                </div>
                {(() => {
                  const groupedResources = lessons
                    .map((l) => {
                      const lessonRes = [];
                      const c = typeof l.content === "object" ? l.content : {};
                      if (c.attachments?.length)
                        lessonRes.push(...c.attachments);
                      if (c.documents?.length) lessonRes.push(...c.documents);
                      return {
                        lessonId: l._id,
                        title: l.title,
                        resources: lessonRes,
                      };
                    })
                    .filter((g) => g.resources.length > 0);

                  if (groupedResources.length === 0)
                    return (
                      <div
                        className="text-center border-2 border-dashed"
                        style={{
                          backgroundColor: C.innerBg,
                          borderColor: C.cardBorder,
                          borderRadius: "10px",
                          padding: "48px 24px",
                        }}
                      >
                        <MdArticle
                          style={{
                            width: 48,
                            height: 48,
                            color: C.text,
                            opacity: 0.3,
                            margin: "0 auto 12px",
                          }}
                        />
                        <p
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                            margin: 0,
                          }}
                        >
                          No resources available
                        </p>
                      </div>
                    );

                  return (
                    <div className="space-y-8">
                      {groupedResources.map((group, idx) => (
                        <div key={group.lessonId} className="space-y-4">
                          <h4
                            className="flex items-center gap-3"
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: 0,
                            }}
                          >
                            <span
                              className="flex items-center justify-center text-white"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "10px",
                                background: C.gradientBtn,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                              }}
                            >
                              {idx + 1}
                            </span>
                            {group.title}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.resources.map((res, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between transition-all hover:-translate-y-1"
                                style={{
                                  backgroundColor: C.innerBg,
                                  border: `1px solid ${C.cardBorder}`,
                                  borderRadius: "10px",
                                  padding: 16,
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                  <div
                                    className="flex items-center justify-center shrink-0"
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: "10px",
                                      backgroundColor: C.cardBg,
                                    }}
                                  >
                                    <MdArticle
                                      style={{
                                        width: 18,
                                        height: 18,
                                        color: C.btnPrimary,
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className="truncate"
                                      style={{
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        color: C.heading,
                                        margin: "0 0 2px 0",
                                      }}
                                    >
                                      {res.name || "Document"}
                                    </p>
                                    <span
                                      style={{
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        color: C.text,
                                      }}
                                    >
                                      {res.type?.split("/")[1] || "File"}
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center shrink-0 transition-all hover:opacity-80"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "10px",
                                    backgroundColor: C.cardBg,
                                    border: `1px solid ${C.cardBorder}`,
                                    color: C.btnPrimary,
                                  }}
                                >
                                  <MdDownload
                                    style={{ width: 16, height: 16 }}
                                  />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── RIGHT Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">
            {activeTab === "lessons" && (isEnrolled || isInstructor) && (
              <div
                className="sticky top-24"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 24,
                  boxShadow: S.card,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Progress Tracker
                  </h3>
                  <span
                    style={{
                      backgroundColor: C.innerBg,
                      color: C.btnPrimary,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      padding: "4px 10px",
                      borderRadius: "10px",
                    }}
                  >
                    {completedCount}/{totalLessons}
                  </span>
                </div>
                <CircularProgress pct={pct} />

                <div
                  className="mt-8 pt-6"
                  style={{ borderTop: `1px solid ${C.cardBorder}` }}
                >
                  <h3
                    className="mb-4"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                    }}
                  >
                    Quiz Performance
                  </h3>
                  <div className="space-y-3">
                    {quizScores.map((q, i) => (
                      <QuizScoreRow key={i} title={q.title} score={q.score} />
                    ))}
                    {quizScores.length === 0 && (
                      <p
                        className="text-center border-2 border-dashed"
                        style={{
                          backgroundColor: C.innerBg,
                          borderColor: C.cardBorder,
                          borderRadius: "10px",
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.bold,
                          color: C.text,
                          padding: "16px 0",
                        }}
                      >
                        No quizzes attempted yet
                      </p>
                    )}
                  </div>
                  <Link
                    href="/student/history"
                    className="block text-center transition-all hover:opacity-80 mt-4"
                    style={{
                      backgroundColor: C.innerBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: "10px",
                      color: C.btnPrimary,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      padding: "12px 0",
                    }}
                  >
                    View Full Report
                  </Link>
                </div>
              </div>
            )}

            {/* Enrollment / Pricing Card */}
            {activeTab !== "lessons" && !isEnrolled && !isInstructor && (
              <div
                className="overflow-hidden"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  boxShadow: S.card,
                }}
              >
                <div
                  className="aspect-video relative overflow-hidden group"
                  style={{ backgroundColor: C.innerBg }}
                >
                  <img
                    src={
                      course.thumbnail || "https://via.placeholder.com/640x360"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.20)" }}
                  >
                    <div
                      className="flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        borderRadius: R.full,
                      }}
                    >
                      <MdPlayArrow
                        style={{
                          width: 28,
                          height: 28,
                          color: C.btnPrimary,
                          marginLeft: 4,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size["3xl"],
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        lineHeight: 1,
                      }}
                    >
                      {course.isFree ? "Free" : `₹${course.price}`}
                    </span>
                    {course.oldPrice && !course.isFree && (
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.md,
                            textDecoration: "line-through",
                            color: C.text,
                            fontWeight: T.weight.semibold,
                          }}
                        >
                          ₹{course.oldPrice}
                        </span>
                        <span
                          style={{
                            backgroundColor: C.successBg,
                            color: C.success,
                            border: `1px solid ${C.successBorder}`,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            padding: "2px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          {Math.round(
                            (1 - course.price / course.oldPrice) * 100,
                          )}
                          % OFF
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {isPendingApproval ? (
                      <div
                        className="flex-1 text-center py-4 rounded-xl"
                        style={{
                          backgroundColor: C.warningBg,
                          border: `1px solid ${C.warningBorder}`,
                          color: C.warning,
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                        }}
                      >
                        <MdAccessTime
                          className="inline-block mr-2"
                          style={{ width: 18, height: 18 }}
                        />
                        Request Pending Approval
                      </div>
                    ) : (
                      <DBtn
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="flex-1 gap-2"
                        style={{ padding: "16px 0", fontSize: T.size.base }}
                      >
                        {enrolling ? (
                          <>
                            <div
                              className="rounded-full border-2 animate-spin"
                              style={{
                                width: 16,
                                height: 16,
                                borderColor: "rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                              }}
                            />{" "}
                            Processing…
                          </>
                        ) : course.isFree ? (
                          "Enroll Now for Free"
                        ) : (
                          "Buy Now Securely"
                        )}
                      </DBtn>
                    )}
                    <button
                      onClick={toggleWishlist}
                      disabled={wishlistLoading}
                      className="flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "10px",
                        backgroundColor: isWishlisted ? "#FEF2F2" : C.cardBg,
                        border: `1px solid ${isWishlisted ? "#FECACA" : C.cardBorder}`,
                      }}
                    >
                      {wishlistLoading ? (
                        <div
                          className="rounded-full border-2 animate-spin"
                          style={{
                            width: 20,
                            height: 20,
                            borderColor: `${C.text}30`,
                            borderTopColor: C.text,
                          }}
                        />
                      ) : isWishlisted ? (
                        <MdFavorite
                          style={{ width: 24, height: 24, color: "#EF4444" }}
                        />
                      ) : (
                        <MdFavoriteBorder
                          style={{ width: 24, height: 24, color: C.text }}
                        />
                      )}
                    </button>
                  </div>
                  <p
                    className="text-center"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: C.text,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: "16px 0 0 0",
                    }}
                  >
                    🔒 30-Day Money-Back Guarantee
                  </p>
                </div>
              </div>
            )}

            {/* Course Includes */}
            {activeTab !== "lessons" && (
              <>
                <div
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: R["2xl"],
                    padding: 24,
                    boxShadow: S.card,
                  }}
                >
                  <h3
                    className="mb-5"
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: "0 0 20px 0",
                    }}
                  >
                    This Course Includes
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        icon: (
                          <MdPlayCircle
                            style={{
                              width: 16,
                              height: 16,
                              color: C.btnPrimary,
                            }}
                          />
                        ),
                        label: `${totalLessons} video lessons`,
                      },
                      {
                        icon: (
                          <MdAccessTime
                            style={{
                              width: 16,
                              height: 16,
                              color: C.chartLine,
                            }}
                          />
                        ),
                        label: `${Math.round(totalDuration / 3600)} hours on-demand video`,
                      },
                      {
                        icon: (
                          <MdDownload
                            style={{ width: 16, height: 16, color: C.success }}
                          />
                        ),
                        label: "Downloadable study resources",
                      },
                      {
                        icon: (
                          <MdEmojiEvents
                            style={{ width: 16, height: 16, color: C.warning }}
                          />
                        ),
                        label: "Certificate of completion",
                      },
                      {
                        icon: (
                          <MdLanguage
                            style={{ width: 16, height: 16, color: "#3B82F6" }}
                          />
                        ),
                        label: "Full lifetime access",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: "10px",
                          padding: 12,
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "10px",
                            backgroundColor: C.cardBg,
                          }}
                        >
                          {item.icon}
                        </div>
                        <span
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructor Info */}
                <div
                  className="text-center"
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: R["2xl"],
                    padding: 24,
                    boxShadow: S.card,
                  }}
                >
                  <h3
                    className="mb-5 pb-4"
                    style={{
                      borderBottom: `1px solid ${C.cardBorder}`,
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: "0 0 20px 0",
                    }}
                  >
                    Your Instructor
                  </h3>
                  <div className="flex flex-col items-center">
                    <div
                      className="overflow-hidden mb-4"
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: R.full,
                        border: `4px solid ${C.btnViewAllBg}`,
                        boxShadow: S.card,
                      }}
                    >
                      <img
                        src={
                          course.tutorId?.userId?.profileImage ||
                          "/default-avatar.svg"
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.md,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {course.tutorId?.userId?.name || "Instructor Name"}
                    </h4>
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        color: C.btnPrimary,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: 0,
                      }}
                    >
                      {course.tutorId?.experience || 0} Years Experience
                    </p>
                    <button
                      onClick={() =>
                        router.push(`/tutor/${course.tutorId?._id}`)
                      }
                      className="w-full cursor-pointer transition-all hover:opacity-80"
                      style={{
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        color: C.btnPrimary,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        borderRadius: "10px",
                        padding: "10px 0",
                        marginTop: 24,
                      }}
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating AI Button ── */}
      <button
        onClick={() => setAiWidgetOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-3 text-white transition-all hover:scale-105 cursor-pointer"
        style={{
          background: C.gradientBtn,
          fontFamily: T.fontFamily,
          fontSize: T.size.base,
          fontWeight: T.weight.bold,
          border: "none",
          borderRadius: R.full,
          boxShadow: S.btn,
          height: 56,
          padding: "0 20px",
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: R.full,
            backgroundColor: "rgba(255,255,255,0.20)",
          }}
        >
          <MdSmartToy style={{ width: 18, height: 18 }} />
          <span
            className="absolute top-0 right-0 border-2"
            style={{
              width: 10,
              height: 10,
              backgroundColor: "#34D399",
              borderColor: C.btnPrimary,
              borderRadius: R.full,
            }}
          />
        </div>
        Ask Course AI
      </button>

      {/* ── AI Drawer ── */}
      {aiWidgetOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setAiWidgetOpen(false)}
          />
          <div
            className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-300"
            style={{
              height: "85vh",
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: `${R["2xl"]} ${R["2xl"]} 0 0`,
            }}
          >
            <div
              className="flex items-center justify-between relative overflow-hidden shrink-0"
              style={{
                background: C.gradientBtn,
                borderBottom: `1px solid ${C.cardBorder}`,
                padding: "20px 24px",
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(white 1px,transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <MdSmartToy
                    style={{ width: 20, height: 20, color: "#ffffff" }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: "#ffffff",
                      margin: "0 0 2px 0",
                    }}
                  >
                    Course Assistant
                  </p>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: "rgba(255,255,255,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: 0,
                    }}
                  >
                    Ask anything about content
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiWidgetOpen(false)}
                className="relative flex items-center justify-center transition-all hover:opacity-70 cursor-pointer"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  border: "none",
                }}
              >
                <MdClose style={{ width: 16, height: 16, color: "#ffffff" }} />
              </button>
            </div>
            <div
              className="flex-1 overflow-hidden"
              style={{ backgroundColor: C.innerBg }}
            >
              <AiTutorWidget
                title="AI Insights"
                subtitle="I have analyzed the entire course curriculum for you."
                context={{ pageType: "course_details", courseId: course._id }}
                className="h-full border-none rounded-none shadow-none bg-transparent"
                recommendedTopics={[
                  "What are the prerequisites?",
                  "What are the main learning outcomes?",
                  "Is this suitable for beginners?",
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals — logic unchanged */}
      {showLessonPlayerModal && lessons[selectedLessonIndex] && (
        <LessonPlayerModal
          lessons={lessons}
          modules={course.modules}
          reviews={reviews}
          initialIndex={selectedLessonIndex}
          courseId={id}
          onClose={() => setShowLessonPlayerModal(false)}
          onLessonComplete={handleLessonComplete}
        />
      )}
      {showExamHistoryModal && selectedExam && (
        <ExamHistoryModal
          exam={selectedExam}
          onClose={() => setShowExamHistoryModal(false)}
          onViewAttempt={(data) => {
            setSelectedResult(data);
            setShowExamHistoryModal(false);
            setShowResultModal(true);
          }}
          onStartExam={handleStartExam}
        />
      )}
      {course && (
        <ReportAbuseModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={course._id}
          targetType="Course"
        />
      )}

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {showReviewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setShowReviewModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md pointer-events-auto"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: R["2xl"],
                  padding: 32,
                  boxShadow: S.cardHover,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.lg,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    {myReview ? "Edit Your Review" : "Write a Review"}
                  </h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex items-center justify-center transition-all hover:opacity-70 cursor-pointer"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "10px",
                      backgroundColor: C.innerBg,
                      border: "none",
                    }}
                  >
                    <MdClose style={{ width: 16, height: 16, color: C.text }} />
                  </button>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Star Rating */}
                  <div
                    className="flex flex-col items-center gap-3 border border-dashed"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                      padding: "16px 24px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.semibold,
                        color: C.text,
                        margin: 0,
                      }}
                    >
                      Tap a star to rate
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="transition-transform hover:scale-110"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          {reviewForm.rating >= star ? (
                            <MdStar
                              style={{
                                width: 36,
                                height: 36,
                                color: "#FCD34D",
                              }}
                            />
                          ) : (
                            <MdStarBorder
                              style={{
                                width: 36,
                                height: 36,
                                color: C.cardBorder,
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        marginBottom: 8,
                      }}
                    >
                      Share your experience
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        })
                      }
                      placeholder="What did you like about this course? How can it improve?"
                      rows={4}
                      className="w-full focus:outline-none resize-none transition-shadow"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: "10px",
                        color: C.heading,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.medium,
                        padding: "12px 16px",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = C.btnPrimary;
                        e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = C.cardBorder;
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.semibold,
                        color:
                          reviewForm.comment.length < 10 ? C.danger : C.success,
                        marginTop: 4,
                      }}
                    >
                      {reviewForm.comment.length < 10
                        ? `Minimum 10 characters (${reviewForm.comment.length}/10)`
                        : "Looks good!"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="flex-1 cursor-pointer transition-all hover:opacity-80"
                      style={{
                        backgroundColor: C.btnViewAllBg,
                        border: `1px solid ${C.cardBorder}`,
                        color: C.btnViewAllText,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        borderRadius: "10px",
                        padding: "14px 0",
                      }}
                    >
                      Cancel
                    </button>
                    <DBtn
                      type="submit"
                      disabled={
                        submittingReview ||
                        reviewForm.rating === 0 ||
                        reviewForm.comment.length < 10
                      }
                      className="flex-1"
                      style={{ padding: "14px 0", fontSize: T.size.base }}
                    >
                      {submittingReview ? (
                        <div
                          className="rounded-full border-2 animate-spin"
                          style={{
                            width: 20,
                            height: 20,
                            borderColor: "rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                          }}
                        />
                      ) : (
                        "Post Review"
                      )}
                    </DBtn>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
