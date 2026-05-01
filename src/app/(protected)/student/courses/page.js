"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdSearch,
  MdFolder,
  MdAssignment,
  MdVideocam,
  MdKeyboardArrowDown,
  MdArticle,
  MdAutoAwesome,
  MdCampaign,
  MdEdit,
  MdDelete,
  MdStar,
  MdSchool,
  MdMenuBook,
  MdPsychology,
  MdPlayCircleOutline,
  MdChevronLeft,
  MdChevronRight,
  MdArrowForward,
  MdFavorite,
} from "react-icons/md";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { getAudienceDisplay } from "@/lib/audienceDisplay";
import { C, T, S, R } from "@/constants/studentTokens";
import StatCard from "@/components/StatCard";
import { useSearchParams } from "next/navigation";

const COURSES_PER_PAGE = 8;
const progressColors = ["#5E9D9D", "#7573E8", "#6267E9", "#4748AA"]; // Dashboard colors

// ─── FallbackImage ────────────────────────────────────────────────────────────
function FallbackImage({ src, alt, className }) {
  const defaultImg =
    "https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600";
  const [imgSrc, setImgSrc] = useState(src || defaultImg);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || defaultImg);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: C.innerBg }}
      >
        <MdMenuBook className="w-8 h-8" style={{ color: C.textMuted }} />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== defaultImg) setImgSrc(defaultImg);
        else setHasError(true);
      }}
    />
  );
}

// ─── Enrolled course card ─────────────────────────────────────────────────────
function EnrolledCourseCard({ enrollment, index }) {
  const course = enrollment.courseId;
  if (!course) return null;
  const progress = enrollment.progress?.percentage ?? 0;
  const instructorName = course.tutorId?.userId?.name || "Instructor";
  const audienceInfo = getAudienceDisplay(course);
  const isNew =
    enrollment.enrolledAt &&
    Date.now() - new Date(enrollment.enrolledAt).getTime() <
      14 * 24 * 60 * 60 * 1000;
  const isCertified = progress >= 100;
  const barColor = progressColors[index % progressColors.length];

  return (
    <div
      className="group overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: "10px",
      }}
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: C.innerBg }}
      >
        <FallbackImage
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <MdPlayCircleOutline className="w-12 h-12 text-white opacity-90 shadow-2xl rounded-full" />
        </div>

        {(isNew || isCertified) && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider text-white shadow-md backdrop-blur-sm"
            style={{
              backgroundColor: isCertified
                ? "rgba(16, 185, 129, 0.9)"
                : "rgba(79, 70, 229, 0.9)",
              fontFamily: T.fontFamily,
              fontWeight: T.weight.bold,
            }}
          >
            {isCertified ? "Certified" : "New"}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="line-clamp-2 flex-1"
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.md,
              fontWeight: T.weight.semibold,
              color: C.heading,
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: "11px",
              fontWeight: T.weight.medium,
              color: C.text,
              opacity: 0.6,
            }}
          >
            By {instructorName}
          </p>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider ${audienceInfo.badgeClass}`}
            style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold }}
          >
            {audienceInfo.label}
          </span>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex justify-between items-center">
            <span
              style={{
                fontSize: "12px",
                fontWeight: T.weight.semibold,
                color: C.text,
                fontFamily: T.fontFamily,
              }}
            >
              {progress}% Complete
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: C.innerBg }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-between mt-4 pt-4"
          style={{ borderTop: `1px solid ${C.cardBorder}` }}
        >
          <Link href={`/student/courses/${course._id}`} className="flex-1">
            <button
              className="w-full py-2 text-white transition-all hover:opacity-90 flex items-center justify-center gap-1.5 border-none cursor-pointer"
              style={{
                background: C.gradientBtn,
                fontFamily: T.fontFamily,
                fontSize: T.size.sm,
                fontWeight: T.weight.bold,
                borderRadius: R.sm,
                boxShadow: S.btn,
              }}
            >
              {progress > 0 ? "Resume Course" : "Start Course"}{" "}
              <MdArrowForward size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Discover course card ─────────────────────────────────────────────────────
function DiscoverCourseCard({ course, isWishlisted, onWishlistToggle }) {
  const instructorName = course.tutorId?.userId?.name || "Instructor";
  const audienceInfo = getAudienceDisplay(course);
  const isFree = !course.price || course.price === 0;

  return (
    <Link
      href={`/student/courses/${course._id}`}
      className="group overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg block"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: "10px",
      }}
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: C.innerBg }}
      >
        <FallbackImage
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute top-3 right-3 px-3 py-1 text-[11px] shadow-md backdrop-blur-md ${isFree ? "text-white" : "bg-white/95 text-slate-900"}`}
          style={{
            ...(isFree ? { backgroundColor: "rgba(16, 185, 129, 0.9)" } : {}),
            fontFamily: T.fontFamily,
            fontWeight: T.weight.bold,
            borderRadius: R.sm,
          }}
        >
          {isFree ? "FREE" : `₹${course.price}`}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onWishlistToggle) onWishlistToggle(course._id, isWishlisted);
          }}
          className="absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all group/heart bg-white/80 hover:bg-white shadow-sm z-10 border-none cursor-pointer"
        >
          <MdFavorite
            className={`w-4 h-4 transition-all duration-300 ${isWishlisted ? "text-red-500 scale-110" : "text-slate-400 group-hover/heart:text-red-400"}`}
          />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="line-clamp-2 flex-1"
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.md,
              fontWeight: T.weight.semibold,
              color: C.heading,
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3 mt-1">
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: "11px",
              fontWeight: T.weight.medium,
              color: C.text,
              opacity: 0.6,
            }}
          >
            By {instructorName}
          </p>
          {course.rating > 0 && (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: T.fontFamily,
                fontSize: "11px",
                fontWeight: T.weight.semibold,
                color: "#F59E0B",
              }}
            >
              <MdStar className="w-3.5 h-3.5 text-amber-500" />
              {course.rating?.toFixed(1)}
            </span>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2 mt-auto pt-4"
          style={{ borderTop: `1px solid ${C.cardBorder}` }}
        >
          <span
            className="px-2.5 py-1"
            style={{
              backgroundColor: C.innerBg,
              color: C.text,
              fontFamily: T.fontFamily,
              fontSize: "10px",
              fontWeight: T.weight.semibold,
              borderRadius: R.sm,
            }}
          >
            <MdMenuBook className="w-3 h-3 inline mr-1 opacity-50" />
            {course.lessons?.length || 0} Lessons
          </span>
          <span
            className={`shrink-0 px-2.5 py-1 text-[10px] uppercase ${audienceInfo.badgeClass}`}
            style={{
              fontFamily: T.fontFamily,
              fontWeight: T.weight.bold,
              borderRadius: R.sm,
            }}
          >
            {audienceInfo.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
  const [liveClassesCount, setLiveClassesCount] = useState(0);
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);


  const [scopeTab, setScopeTab] = useState("institute");

  const [discoverCourses, setDiscoverCourses] = useState([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [myInstitutes, setMyInstitutes] = useState([]);
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);

  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab");
    // Tabs state
  const [mainTab, setMainTab] = useState(
    searchParams.get("tab") === "discover" ? "discover" : "enrollments",
  );

  const handleWishlistToggle = async (courseId, currentlyWishlisted) => {
    try {
      if (currentlyWishlisted) {
        setWishlistIds((prev) => prev.filter((id) => id !== courseId));
        await api.delete(`/wishlist/${courseId}`);
        toast.success("Removed from wishlist");
      } else {
        setWishlistIds((prev) => [...prev, courseId]);
        await api.post("/wishlist", { courseId });
        toast.success("Added to wishlist");
      }
    } catch (err) {
      if (currentlyWishlisted) setWishlistIds((prev) => [...prev, courseId]);
      else setWishlistIds((prev) => prev.filter((id) => id !== courseId));
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  };

  useEffect(() => {
    if (currentTab === "discover") {
      setMainTab("discover");
    } else {
      setMainTab("enrollments");
    }
  }, [currentTab]);

  useEffect(() => {
    fetchData();
    fetchMembership();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "discover") setMainTab("discover");
  }, []);

  const fetchMembership = async () => {
    try {
      const res = await api.get("/membership/my-institutes");
      if (res.data?.success) {
        setMyInstitutes(res.data.institutes || []);
        if (!res.data.currentInstitute) setScopeTab("global");
      }
    } catch {
      setScopeTab("global");
    }
  };

  useEffect(() => {
    if (mainTab === "discover") fetchDiscoverCourses();
  }, [mainTab, scopeTab]);

  const fetchDiscoverCourses = async () => {
    setLoadingDiscover(true);
    try {
      const res = await api.get(`/courses?scope=${scopeTab}`);
      if (res.data.success) setDiscoverCourses(res.data.courses || []);
    } catch {
      setDiscoverCourses([]);
    } finally {
      setLoadingDiscover(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        enrollRes,
        examsRes,
        liveRes,
        batchesRes,
        annRes,
        aiRes,
        wishlistRes,
      ] = await Promise.all([
        api.get("/enrollments/my-enrollments"),
        api.get("/student/exams/all").catch(() => ({ data: { exams: [] } })),
        api.get("/live-classes").catch(() => ({ data: { liveClasses: [] } })),
        api.get("/batches/my").catch(() => ({ data: { batches: [] } })),
        api
          .get("/enrollments/my-announcements")
          .catch(() => ({ data: { announcements: [] } })),
        api
          .get("/ai/quick-recommendations")
          .catch(() => ({ data: { recommendations: [] } })),
        api.get("/wishlist").catch(() => ({ data: { data: [] } })),
      ]);
      if (enrollRes.data.success)
        setEnrollments(enrollRes.data.enrollments || []);
      if (examsRes.data?.exams)
        setUpcomingExamsCount(
          examsRes.data.exams.filter(
            (e) =>
              e.endDate && new Date(e.endDate) >= new Date() && !e.isCompleted,
          ).length,
        );
      if (liveRes.data?.liveClasses)
        setLiveClassesCount(
          liveRes.data.liveClasses.filter(
            (c) => c.dateTime && new Date(c.dateTime) >= new Date(),
          ).length,
        );
      if (batchesRes.data?.batches) setBatches(batchesRes.data.batches);
      if (annRes.data?.announcements)
        setAnnouncements(annRes.data.announcements);
      if (aiRes.data?.recommendations)
        setAiRecommendations(aiRes.data.recommendations);
      if (wishlistRes.data?.data)
        setWishlistIds(
          wishlistRes.data.data.map((w) => w.course?._id || w.course),
        );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const c = e.courseId;
    if (!c) return false;
    return (
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tutorId?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnrollments.length / COURSES_PER_PAGE),
  );
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE,
  );

  if (loading)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: C.pageBg }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: C.btnPrimary }}
          />
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.sm,
              fontWeight: T.weight.semibold,
              color: C.text,
            }}
          >
            Loading your courses...
          </p>
        </div>
      </div>
    );

  return (
    <div
      className="space-y-5 min-h-screen"
      style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}
    >
      {/* ── Header & Tabs ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
        style={{
          backgroundColor: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
          borderRadius: "10px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size["2xl"],
              fontWeight: T.weight.black,
              color: C.heading,
            }}
          >
            My Learning Hub
          </h1>
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.sm,
              fontWeight: T.weight.medium,
              color: C.text,
              opacity: 0.6,
              marginTop: 2,
            }}
          >
            Manage your enrollments and discover new courses.
          </p>
        </div>

        {/* Modern Segmented Tab Switcher */}
        <div
          className="flex p-1 gap-1 shrink-0"
          style={{
            backgroundColor: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: R.md,
          }}
        >
          {[
            { id: "enrollments", label: "My Enrollments", icon: MdMenuBook },
            { id: "discover", label: "Discover Courses", icon: MdAutoAwesome },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2 transition-colors duration-200 border-none cursor-pointer"
              style={
                mainTab === tab.id
                  ? {
                      backgroundColor: C.btnPrimary,
                      color: "#ffffff",
                      fontSize: T.size.sm,
                      fontWeight: T.weight.semibold,
                      borderRadius: R.sm,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: C.text,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.semibold,
                      borderRadius: R.sm,
                    }
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── LEFT: Main content (8 cols) ────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">
          {/* ENROLLMENTS tab */}
          {mainTab === "enrollments" && (
            <>
              {/* Quick Stats — uses global dashboard-consistent StatCard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={MdFolder}
                  label="Enrolled Courses"
                  value={enrollments.length}
                  iconBg="#EEF2FF"
                  iconColor="#4F46E5"
                />
                <StatCard
                  icon={MdAssignment}
                  label="Upcoming Exams"
                  value={upcomingExamsCount}
                  href="/student/exams"
                  iconBg="#FFF7ED"
                  iconColor="#F59E0B"
                />
                <StatCard
                  icon={MdVideocam}
                  label="Live Classes"
                  value={liveClassesCount}
                  href="/student/live-classes"
                  iconBg="#ECFDF5"
                  iconColor="#10B981"
                />
              </div>

              {/* Search & List Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 mb-2">
                <h2
                  style={{
                    fontSize: T.size.lg,
                    fontWeight: T.weight.semibold,
                    color: C.heading,
                  }}
                >
                  Active Courses{" "}
                  <span style={{ color: C.btnPrimary, fontSize: T.size.sm }}>
                    ({filteredEnrollments.length})
                  </span>
                </h2>
                <div className="relative w-full sm:w-72">
                  <MdSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: C.textMuted }}
                  />
                  <input
                    type="text"
                    placeholder="Search my courses…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 focus:outline-none transition-all"
                    style={{
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                      color: C.heading,
                      fontSize: T.size.sm,
                      borderRadius: R.md,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.btnPrimary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.cardBorder;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {filteredEnrollments.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedEnrollments.map((enrollment, i) => (
                      <EnrolledCourseCard
                        key={enrollment._id}
                        enrollment={enrollment}
                        index={i}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div
                      className="flex items-center justify-center gap-2 pt-4 border-t"
                      style={{ borderColor: C.cardBorder }}
                    >
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="w-9 h-9 flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: C.surfaceWhite,
                          border: `1px solid ${C.cardBorder}`,
                          color: C.text,
                          borderRadius: R.sm,
                        }}
                      >
                        <MdChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className="w-9 h-9 flex items-center justify-center transition-all cursor-pointer border-none"
                            style={
                              currentPage === p
                                ? {
                                    background: C.gradientBtn,
                                    color: "#ffffff",
                                    boxShadow: S.btn,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.bold,
                                    borderRadius: R.sm,
                                  }
                                : {
                                    backgroundColor: C.surfaceWhite,
                                    color: C.text,
                                    border: `1px solid ${C.cardBorder}`,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.semibold,
                                    borderRadius: R.sm,
                                  }
                            }
                          >
                            {p}
                          </button>
                        ),
                      )}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="w-9 h-9 flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: C.surfaceWhite,
                          border: `1px solid ${C.cardBorder}`,
                          color: C.text,
                          borderRadius: R.sm,
                        }}
                      >
                        <MdChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="p-10 text-center mt-4"
                  style={{
                    backgroundColor: C.cardBg,
                    border: `1px dashed ${C.cardBorder}`,
                    borderRadius: "10px",
                  }}
                >
                  <MdFolder
                    className="w-10 h-10 mx-auto mb-3"
                    style={{ color: C.cardBorder }}
                  />
                  <h3
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.semibold,
                      color: C.heading,
                      marginBottom: 6,
                    }}
                  >
                    No courses found
                  </h3>
                  <p
                    style={{
                      fontSize: T.size.sm,
                      color: C.textMuted,
                      marginBottom: 16,
                    }}
                  >
                    {searchQuery
                      ? "We couldn't find any courses matching your search."
                      : "You haven't enrolled in any courses yet."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setMainTab("discover")}
                      className="px-5 py-2 text-white transition-colors border-none cursor-pointer"
                      style={{
                        background: C.gradientBtn,
                        fontWeight: T.weight.semibold,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.sm,
                        borderRadius: R.sm,
                        boxShadow: S.btn,
                      }}
                    >
                      Discover Courses
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* DISCOVER tab */}
          {mainTab === "discover" && (
            <div className="space-y-5">
              <div
                className="flex flex-col gap-4 p-5"
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  borderRadius: "10px",
                  boxShadow: S.card,
                }}
              >
                {/* Title + scope row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2
                      style={{
                        fontSize: T.size.lg,
                        fontWeight: T.weight.semibold,
                        color: C.heading,
                      }}
                    >
                      Course Catalog
                    </h2>
                    <p
                      style={{
                        fontSize: T.size.xs,
                        color: C.textMuted,
                        marginTop: "2px",
                      }}
                    >
                      Find the perfect course for your goals.
                    </p>
                  </div>
                  {myInstitutes.length > 0 && (
                    <div
                      className="flex p-1 gap-1 shrink-0"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: R.md,
                      }}
                    >
                      {["institute", "global"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setScopeTab(s)}
                          className="px-4 py-1.5 capitalize transition-colors border-none cursor-pointer"
                          style={
                            scopeTab === s
                              ? {
                                  backgroundColor: C.btnPrimary,
                                  color: "#ffffff",
                                  fontSize: T.size.xs,
                                  fontWeight: T.weight.semibold,
                                  borderRadius: R.sm,
                                }
                              : {
                                  backgroundColor: "transparent",
                                  color: C.textMuted,
                                  fontSize: T.size.xs,
                                  fontWeight: T.weight.medium,
                                  borderRadius: R.sm,
                                }
                          }
                        >
                          {s === "institute" ? "My Institute" : "Global"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search + Filter row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MdSearch
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: C.textMuted }}
                    />
                    <input
                      type="text"
                      placeholder="Search courses by name or instructor…"
                      value={discoverSearch}
                      onChange={(e) => setDiscoverSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 focus:outline-none transition-all"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        color: C.heading,
                        fontSize: T.size.sm,
                        borderRadius: R.md,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = C.btnPrimary;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = C.cardBorder;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div className="relative shrink-0">
                    <MdKeyboardArrowDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: C.textMuted }}
                    />
                    <select
                      value={discoverCategory}
                      onChange={(e) => setDiscoverCategory(e.target.value)}
                      className="w-full sm:w-auto pl-4 pr-9 py-2 focus:outline-none transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        color: C.heading,
                        fontSize: T.size.sm,
                        fontWeight: T.weight.medium,
                        fontFamily: T.fontFamily,
                        borderRadius: R.md,
                      }}
                    >
                      <option value="">All Categories</option>
                      {[
                        ...new Set(
                          discoverCourses.flatMap((c) =>
                            c.category ? [c.category] : [],
                          ),
                        ),
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingDiscover ? (
                <div className="flex justify-center py-20">
                  <Loader2
                    className="w-8 h-8 animate-spin"
                    style={{ color: C.btnPrimary }}
                  />
                </div>
              ) : (
                (() => {
                  const filtered = discoverCourses.filter((course) => {
                    const q = discoverSearch.toLowerCase();
                    const matchSearch =
                      !q ||
                      course.title?.toLowerCase().includes(q) ||
                      course.tutorId?.userId?.name?.toLowerCase().includes(q);
                    const matchCat =
                      !discoverCategory || course.category === discoverCategory;
                    return matchSearch && matchCat;
                  });
                  return filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filtered.map((course) => (
                        <DiscoverCourseCard
                          key={course._id}
                          course={course}
                          isWishlisted={wishlistIds.includes(course._id)}
                          onWishlistToggle={handleWishlistToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="p-10 text-center"
                      style={{
                        backgroundColor: C.cardBg,
                        border: `1px dashed ${C.cardBorder}`,
                        borderRadius: "10px",
                      }}
                    >
                      <MdAutoAwesome
                        className="w-10 h-10 mx-auto mb-3"
                        style={{ color: C.cardBorder }}
                      />
                      <h3
                        style={{
                          fontSize: T.size.md,
                          fontWeight: T.weight.semibold,
                          color: C.heading,
                          marginBottom: 6,
                        }}
                      >
                        No courses found
                      </h3>
                      <p style={{ fontSize: T.size.sm, color: C.textMuted }}>
                        {discoverSearch || discoverCategory
                          ? "Try adjusting your search or filter."
                          : `No ${scopeTab === "institute" ? "institute" : "global"} courses yet.`}
                      </p>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar (4 cols) ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Magic Study Plan Card (Using Global StatCard) */}
          <StatCard
            isAI
            label="AI Study Buddy"
            value="Smart Plans"
            subtext="Get personalized recommendations"
            href="/student/ai-analytics"
          />

          {/* Announcements */}
          <div
            className="p-5"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.card,
              borderRadius: "10px",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.innerBg, borderRadius: R.sm }}
              >
                <MdCampaign
                  className="w-4 h-4"
                  style={{ color: C.btnPrimary }}
                />
              </div>
              <h2
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.semibold,
                  color: C.heading,
                }}
              >
                Recent Updates
              </h2>
            </div>

            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 border transition-colors hover:bg-slate-50"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: R.md,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="px-2 py-0.5 text-[9px] uppercase"
                        style={{
                          fontFamily: T.fontFamily,
                          fontWeight: T.weight.bold,
                          backgroundColor: C.cardBg,
                          color: C.text,
                          borderRadius: R.sm,
                          border: `1px solid ${C.cardBorder}`,
                        }}
                      >
                        {a.courseTitle || "General"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: T.size.sm,
                        fontWeight: T.weight.semibold,
                        color: C.heading,
                        lineHeight: 1.3,
                        marginBottom: "4px",
                      }}
                    >
                      {a.title}
                    </p>
                    <p
                      className="line-clamp-2"
                      style={{
                        fontSize: "11px",
                        color: C.textMuted,
                        fontFamily: T.fontFamily,
                      }}
                    >
                      {a.message}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  className="py-5 text-center border border-dashed"
                  style={{ borderColor: C.cardBorder, borderRadius: R.md }}
                >
                  <p
                    style={{
                      fontSize: T.size.sm,
                      fontWeight: T.weight.semibold,
                      color: C.textMuted,
                    }}
                  >
                    No new updates.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links / Batches */}
          <div
            className="p-5"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.card,
              borderRadius: "10px",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.innerBg, borderRadius: R.sm }}
              >
                <MdSchool className="w-4 h-4" style={{ color: C.btnPrimary }} />
              </div>
              <h2
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.semibold,
                  color: C.heading,
                }}
              >
                My Batches
              </h2>
            </div>

            <div className="space-y-2">
              {batches.length > 0 ? (
                batches.slice(0, 4).map((batch) => {
                  const courseName =
                    batch.courseId?.title || batch.name || "Course";
                  return (
                    <Link
                      key={batch._id}
                      href="/student/batches"
                      className="flex items-center justify-between p-3 border transition-colors block"
                      style={{
                        backgroundColor: C.innerBg,
                        borderColor: C.cardBorder,
                        borderRadius: R.md,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.btnViewAllBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.innerBg;
                      }}
                    >
                      <div className="min-w-0 pr-2">
                        <p
                          className="truncate"
                          style={{
                            fontSize: T.size.sm,
                            fontWeight: T.weight.semibold,
                            color: C.heading,
                          }}
                        >
                          {batch.name}
                        </p>
                        <p
                          className="truncate"
                          style={{
                            fontSize: "10px",
                            color: C.textMuted,
                            fontFamily: T.fontFamily,
                          }}
                        >
                          {courseName}
                        </p>
                      </div>
                      <MdArrowForward
                        className="w-4 h-4 shrink-0"
                        style={{ color: C.textMuted }}
                      />
                    </Link>
                  );
                })
              ) : (
                <p
                  style={{
                    fontSize: T.size.sm,
                    color: C.textMuted,
                    textAlign: "center",
                    padding: "12px 0",
                  }}
                >
                  You are not assigned to any batches.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
