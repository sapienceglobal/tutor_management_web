"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  MdVideocam,
  MdCalendarMonth,
  MdAccessTime,
  MdAdd,
  MdDelete,
  MdEdit,
  MdPlayCircleOutline,
  MdMenuBook,
  MdPeople,
  MdHourglassEmpty,
  MdClose,
  MdList,
  MdSave,
} from "react-icons/md";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import AudienceSelector from "@/components/shared/AudienceSelector";
import useInstitute from "@/hooks/useInstitute";
import { C, T, FX, S, R } from "@/constants/studentTokens";
import StatCard from "@/components/StatCard";

// Focus Handlers
const onFocusHandler = (e) => {
  e.target.style.border = `1px solid ${C.btnPrimary}`;
  e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = (e) => {
  e.target.style.border = `1px solid ${C.cardBorder}`;
  e.target.style.boxShadow = "none";
};

const baseInputStyle = {
  backgroundColor: C.innerBg,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: "10px",
  color: C.heading,
  fontFamily: T.fontFamily,
  fontSize: T.size.sm,
  fontWeight: T.weight.semibold,
  outline: "none",
  width: "100%",
  padding: "12px 16px",
  transition: "all 0.2s ease",
};

export default function TutorLiveClassesPage() {
  const router = useRouter();
  const { institute } = useInstitute();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'today', 'upcoming', 'past'
  const { confirmDialog } = useConfirm();

  const initialFormState = {
    title: "",
    description: "",
    courseId: "none",
    dateTime: "",
    duration: 60,
    meetingLink: "",
    meetingId: "",
    passcode: "",
    recordingLink: "",
    platform: "jitsi",
    autoCreate: true,
    audience: {
      scope: "institute",
      instituteId: null,
      batchIds: [],
      studentIds: [],
    },
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchClasses();
    fetchCourses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/live-classes");
      if (res?.data?.success) setClasses(res.data.liveClasses || []);
    } catch {
      toast.error("Failed to load live classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/my-courses");
      if (res?.data?.success) setCourses(res.data.courses || []);
    } catch {
      /* silent */
    }
  };

  const handleEditClick = (cls) => {
    setEditingId(cls._id);
    setFormData({
      title: cls.title,
      description: cls.description || "",
      courseId: cls.courseId?._id || "none",
      dateTime: new Date(cls.dateTime).toISOString().slice(0, 16),
      duration: cls.duration,
      meetingLink: cls.meetingLink,
      meetingId: cls.meetingId || "",
      passcode: cls.passcode || "",
      recordingLink: cls.recordingLink || "",
      materialLink: cls.materialLink || "",
      platform: cls.platform || "jitsi",
      autoCreate: false,
      audience: cls.audience || {
        scope: cls.batchId ? "batch" : cls.instituteId ? "institute" : "global",
        instituteId: cls.instituteId || institute?._id || null,
        batchIds: cls.batchId ? [cls.batchId] : [],
        studentIds: [],
      },
    });
    setIsCreating(true);
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classStart = new Date(formData.dateTime);
    if (classStart < new Date() && !editingId) {
      toast.error("Cannot schedule a class in the past.");
      return;
    }

    const classEnd = new Date(classStart.getTime() + formData.duration * 60000);
    const hasOverlap = classes.some((cls) => {
      if (editingId && cls._id === editingId) return false;
      const s = new Date(cls.dateTime);
      const e2 = new Date(s.getTime() + (cls.duration || 60) * 60000);
      return classStart < e2 && classEnd > s;
    });
    if (hasOverlap) {
      toast.error(
        "Scheduling Conflict: This time overlaps with another class.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData };
      payload.audience = {
        ...formData.audience,
        instituteId: formData.audience?.instituteId || institute?._id || null,
      };
      payload.scope = payload.audience.scope;
      payload.batchId =
        payload.audience.scope === "batch"
          ? payload.audience.batchIds?.[0] || null
          : null;
      if (payload.courseId === "none") delete payload.courseId;

      if (editingId) {
        const res = await api.patch(`/live-classes/${editingId}`, payload);
        if (res?.data?.success) toast.success("Live class updated!");
      } else {
        const res = await api.post("/live-classes", payload);
        if (res?.data?.success) toast.success("Live class scheduled!");
      }
      handleCancelEdit();
      fetchClasses();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchAudienceTargets = async () => {
      if (!isCreating || !formData.courseId || formData.courseId === "none") {
        setAvailableBatches([]);
        setAvailableStudents([]);
        return;
      }
      try {
        const [batchesRes, studentsRes] = await Promise.all([
          api.get("/batches"),
          api.get(`/enrollments/students/${formData.courseId}`),
        ]);
        setAvailableBatches(
          (batchesRes?.data?.batches || []).filter(
            (b) => (b.courseId?._id || b.courseId) === formData.courseId,
          ),
        );
        setAvailableStudents(
          (studentsRes?.data?.students || [])
            .map((i) => ({
              _id: i.studentId?._id,
              name: i.studentId?.name,
              email: i.studentId?.email,
            }))
            .filter((i) => i._id),
        );
      } catch {
        setAvailableBatches([]);
        setAvailableStudents([]);
      }
    };
    fetchAudienceTargets();
  }, [isCreating, formData.courseId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      audience: {
        ...prev.audience,
        instituteId: prev.audience?.instituteId || institute?._id || null,
      },
    }));
  }, [institute?._id]);

  const handleDeleteClass = async (id) => {
    const ok = await confirmDialog(
      "Cancel Class",
      "Are you sure you want to cancel this class?",
      { variant: "destructive" },
    );
    if (!ok) return;
    try {
      const res = await api.delete(`/live-classes/${id}`);
      if (res?.data?.success) {
        toast.success("Class cancelled");
        fetchClasses();
      }
    } catch {
      toast.error("Failed to cancel class");
    }
  };

  // Calculate Stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const stats = {
    total: classes.length,
    upcomingToday: classes.filter(
      (c) => new Date(c.dateTime) >= now && new Date(c.dateTime) < todayEnd,
    ).length,
    liveNow: classes.filter((c) => {
      const start = new Date(c.dateTime);
      const end = new Date(start.getTime() + (c.duration || 60) * 60000);
      return now >= start && now <= end;
    }).length,
    completed: classes.filter((c) => {
      const end = new Date(
        new Date(c.dateTime).getTime() + (c.duration || 60) * 60000,
      );
      return now > end;
    }).length,
  };

  // Filter Classes
  const filteredClasses = classes
    .filter((c) => {
      const start = new Date(c.dateTime);
      const end = new Date(start.getTime() + (c.duration || 60) * 60000);

      if (activeTab === "today") return start >= todayStart && start < todayEnd;
      if (activeTab === "upcoming") return start > now;
      if (activeTab === "past") return end < now;
      return true;
    })
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
        style={{ backgroundColor: C.pageBg }}
      >
        <MdHourglassEmpty
          className="animate-spin"
          style={{ color: C.btnPrimary, width: "28px", height: "28px" }}
        />
        <p
          style={{
            color: C.textMuted,
            fontSize: T.size.sm,
            fontWeight: T.weight.bold,
            fontFamily: T.fontFamily,
          }}
        >
          Loading classes...
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen space-y-6"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* ── Header & Tabs ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5"
        style={{
          backgroundColor: C.cardBg,
          borderRadius: R["2xl"],
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{ backgroundColor: C.iconBg, borderRadius: "10px" }}
          >
            <MdVideocam size={24} color={C.iconColor} />
          </div>
          <div>
            <h1
              style={{
                fontSize: T.size["2xl"],
                fontWeight: T.weight.black,
                color: C.heading,
                margin: "0 0 2px 0",
              }}
            >
              Live Classes
            </h1>
            <p
              style={{
                fontSize: T.size.sm,
                fontWeight: T.weight.medium,
                color: C.textMuted,
                margin: 0,
              }}
            >
              Schedule and manage your interactive sessions
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div
            className="flex items-center p-1 w-full sm:w-auto"
            style={{
              backgroundColor: C.innerBg,
              borderRadius: R.xl,
              border: `1px solid ${C.cardBorder}`,
            }}
          >
            {[
              { id: "today", label: "Today" },
              { id: "upcoming", label: "Upcoming" },
              { id: "past", label: "Past" },
              { id: "all", label: "All Classes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 sm:flex-none px-4 py-2 cursor-pointer border-none transition-all"
                style={{
                  backgroundColor:
                    activeTab === tab.id ? C.surfaceWhite : "transparent",
                  color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                  borderRadius: R.lg,
                  boxShadow: activeTab === tab.id ? S.card : "none",
                  fontSize: T.size.sm,
                  fontWeight: T.weight.bold,
                  fontFamily: T.fontFamily,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setFormData(initialFormState);
              setEditingId(null);
              setIsCreating(true);
            }}
            className="flex items-center justify-center gap-2 px-6 h-11 w-full sm:w-auto cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
            style={{
              background: C.gradientBtn,
              color: "#ffffff",
              borderRadius: "10px",
              fontSize: T.size.sm,
              fontWeight: T.weight.bold,
              fontFamily: T.fontFamily,
              boxShadow: S.btn,
            }}
          >
            <MdAdd size={18} /> Schedule Class
          </button>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
        <StatCard
          label="Total Classes"
          value={stats.total}
          icon={MdMenuBook}
          iconBg={C.iconBg}
          iconColor={C.btnPrimary}
        />
        <StatCard
          label="Upcoming Today"
          value={stats.upcomingToday}
          icon={MdAccessTime}
          iconBg={C.successBg}
          iconColor={C.success}
        />
        <StatCard
          label="Live Now"
          value={stats.liveNow}
          icon={MdPlayCircleOutline}
          iconBg={C.dangerBg}
          iconColor={C.danger}
        />
        <StatCard
          label="Completed Classes"
          value={stats.completed}
          icon={MdCalendarMonth}
          iconBg={C.warningBg}
          iconColor={C.warning}
        />
      </div>

      {/* ── Class List ────────────────────────────────────────────────── */}
      <div
        className="p-5 animate-in fade-in duration-500 delay-200"
        style={{
          backgroundColor: C.cardBg,
          borderRadius: R["2xl"],
          border: `1px solid ${C.cardBorder}`,
          boxShadow: S.card,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            style={{
              fontSize: T.size.md,
              fontWeight: T.weight.black,
              color: C.heading,
              margin: 0,
            }}
          >
            Live Classes
          </h2>
          <div
            className="flex items-center gap-1 p-1"
            style={{
              backgroundColor: C.innerBg,
              borderRadius: "8px",
              border: `1px solid ${C.cardBorder}`,
            }}
          >
            <button
              className="w-8 h-8 flex items-center justify-center border-none cursor-pointer"
              style={{
                backgroundColor: C.surfaceWhite,
                borderRadius: "6px",
                boxShadow: S.card,
              }}
            >
              <MdList size={18} color={C.btnPrimary} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border-none cursor-pointer bg-transparent opacity-50 hover:opacity-100 transition-opacity">
              <MdCalendarMonth size={18} color={C.heading} />
            </button>
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            style={{
              backgroundColor: C.innerBg,
              borderRadius: R.xl,
              border: `1px dashed ${C.cardBorder}`,
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center mb-3"
              style={{
                backgroundColor: C.surfaceWhite,
                borderRadius: "10px",
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <MdVideocam
                size={28}
                color={C.textMuted}
                style={{ opacity: 0.5 }}
              />
            </div>
            <p
              style={{
                fontSize: T.size.md,
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 4px 0",
              }}
            >
              No classes found
            </p>
            <p
              style={{
                fontSize: T.size.sm,
                fontWeight: T.weight.medium,
                color: C.textMuted,
                margin: 0,
              }}
            >
              No classes match the selected filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredClasses.map((cls, index) => {
              const start = new Date(cls.dateTime);
              const end = new Date(
                start.getTime() + (cls.duration || 60) * 60000,
              );
              const isLive = now >= start && now <= end;
              const isCompleted = now > end;

              let statusColor = C.warning;
              let statusBg = C.warningBg;
              let statusText = "Upcoming";

              if (isLive) {
                statusColor = C.danger;
                statusBg = C.dangerBg;
                statusText = "LIVE NOW";
              } else if (isCompleted) {
                statusColor = C.success;
                statusBg = C.successBg;
                statusText = "Completed";
              }

              return (
                <div
                  key={cls._id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-white/40"
                  style={{
                    backgroundColor: C.innerBg,
                    borderRadius: "10px",
                    border: `1px solid ${C.cardBorder}`,
                    borderLeft: `4px solid ${statusColor}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = C.btnViewAllBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = C.innerBg)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: T.weight.black,
                          color: statusColor,
                          backgroundColor: statusBg,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: T.tracking.wider,
                        }}
                      >
                        {statusText}
                      </span>
                      {isLive && (
                        <span
                          className="flex items-center gap-1"
                          style={{
                            fontSize: "10px",
                            fontWeight: T.weight.bold,
                            color: C.danger,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: C.danger }}
                          ></span>{" "}
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <h3
                      className="truncate"
                      style={{
                        fontSize: T.size.lg,
                        fontWeight: T.weight.black,
                        color: C.heading,
                        margin: "0 0 6px 0",
                      }}
                    >
                      {cls.title}
                    </h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <p
                        className="flex items-center gap-1.5"
                        style={{
                          fontSize: T.size.sm,
                          fontWeight: T.weight.bold,
                          color: C.textMuted,
                          margin: 0,
                        }}
                      >
                        <MdPeople size={16} />{" "}
                        {cls.audience?.scope === "batch"
                          ? "Batch Students"
                          : cls.courseId?.title || "All Students"}
                      </p>
                      <p
                        className="flex items-center gap-1.5"
                        style={{
                          fontSize: T.size.sm,
                          fontWeight: T.weight.bold,
                          color: C.textMuted,
                          margin: 0,
                        }}
                      >
                        <MdCalendarMonth size={16} />{" "}
                        {format(start, "d MMM yyyy")}
                      </p>
                      <p
                        className="flex items-center gap-1.5"
                        style={{
                          fontSize: T.size.sm,
                          fontWeight: T.weight.bold,
                          color: C.textMuted,
                          margin: 0,
                        }}
                      >
                        <MdAccessTime size={16} /> {format(start, "h:mm a")} -{" "}
                        {format(end, "h:mm a")} ({cls.duration} min)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 mt-2 md:mt-0">
                    {!isCompleted && (
                      <button
                        onClick={() =>
                          window.open(
                            cls.meetingId
                              ? `https://meet.jit.si/${cls.meetingId}`
                              : cls.meetingLink,
                            "_blank",
                          )
                        }
                        className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm shrink-0"
                        style={{
                          backgroundColor: C.success,
                          color: "#ffffff",
                          borderRadius: "8px",
                          fontSize: T.size.sm,
                          fontWeight: T.weight.bold,
                          fontFamily: T.fontFamily,
                        }}
                      >
                        <MdVideocam size={18} /> Start Class
                      </button>
                    )}
                    <button
                      onClick={() =>
                        router.push(`/tutor/live-classes/${cls._id}/attendance`)
                      }
                      className="flex items-center justify-center gap-2 h-10 px-4 cursor-pointer border-none transition-colors hover:opacity-80 shrink-0"
                      style={{
                        backgroundColor: C.surfaceWhite,
                        color: C.btnPrimary,
                        borderRadius: "8px",
                        fontSize: T.size.sm,
                        fontWeight: T.weight.bold,
                        fontFamily: T.fontFamily,
                        border: `1px solid ${C.cardBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.btnPrimary;
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surfaceWhite;
                        e.currentTarget.style.color = C.btnPrimary;
                      }}
                    >
                      <MdPeople size={16} /> Join
                    </button>
                    <button
                      onClick={() => handleEditClick(cls)}
                      className="flex items-center justify-center h-10 px-4 cursor-pointer border-none transition-colors hover:opacity-80 shrink-0"
                      style={{
                        backgroundColor: C.surfaceWhite,
                        color: C.textMuted,
                        borderRadius: "8px",
                        fontSize: T.size.sm,
                        fontWeight: T.weight.bold,
                        fontFamily: T.fontFamily,
                        border: `1px solid ${C.cardBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.textMuted;
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surfaceWhite;
                        e.currentTarget.style.color = C.textMuted;
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls._id)}
                      className="flex items-center justify-center h-10 px-4 cursor-pointer border-none transition-colors hover:opacity-80 shrink-0"
                      style={{
                        backgroundColor: C.surfaceWhite,
                        color: C.danger,
                        borderRadius: "8px",
                        fontSize: T.size.sm,
                        fontWeight: T.weight.bold,
                        fontFamily: T.fontFamily,
                        border: `1px solid ${C.cardBorder}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.danger;
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.surfaceWhite;
                        e.currentTarget.style.color = C.danger;
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Form Modal ──────────────────────────────────────── */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in duration-200"
            style={{
              backgroundColor: C.cardBg,
              borderRadius: R["2xl"],
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.cardHover,
            }}
          >
            <div
              className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: `1px solid ${C.cardBorder}` }}
            >
              <h3
                style={{
                  fontSize: T.size.lg,
                  fontWeight: T.weight.black,
                  color: C.heading,
                  margin: 0,
                }}
              >
                {editingId ? "Edit Live Class" : "Schedule Live Class"}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center transition-colors"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: C.innerBg,
                  borderRadius: "8px",
                }}
              >
                <MdClose size={18} color={C.heading} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter class title..."
                />
              </div>

              <div className="space-y-1">
                <label
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Select Course *
                </label>
                <select
                  style={{
                    ...baseInputStyle,
                    backgroundColor: C.surfaceWhite,
                    cursor: "pointer",
                  }}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                >
                  <option value="none">General / No Course Linked</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    style={{
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: T.tracking.wider,
                    }}
                  >
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    style={{
                      ...baseInputStyle,
                      backgroundColor: C.surfaceWhite,
                    }}
                    onFocus={onFocusHandler}
                    onBlur={onBlurHandler}
                    min={new Date(
                      new Date().getTime() -
                        new Date().getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)}
                    value={formData.dateTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dateTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label
                    style={{
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: T.tracking.wider,
                    }}
                  >
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    style={{
                      ...baseInputStyle,
                      backgroundColor: C.surfaceWhite,
                    }}
                    onFocus={onFocusHandler}
                    onBlur={onBlurHandler}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Video Platform *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        autoCreate: true,
                        platform: "jitsi",
                      })
                    }
                    className="h-12 border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: formData.autoCreate
                        ? C.surfaceWhite
                        : C.innerBg,
                      borderRadius: "10px",
                      border: formData.autoCreate
                        ? `2px solid ${C.btnPrimary}`
                        : `1px solid ${C.cardBorder}`,
                      color: formData.autoCreate ? C.btnPrimary : C.textMuted,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    <MdVideocam size={18} /> Auto Jitsi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        autoCreate: false,
                        platform: "zoom",
                      })
                    }
                    className="h-12 border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor:
                        !formData.autoCreate && formData.platform === "zoom"
                          ? C.surfaceWhite
                          : C.innerBg,
                      borderRadius: "10px",
                      border:
                        !formData.autoCreate && formData.platform === "zoom"
                          ? `2px solid ${C.btnPrimary}`
                          : `1px solid ${C.cardBorder}`,
                      color:
                        !formData.autoCreate && formData.platform === "zoom"
                          ? C.btnPrimary
                          : C.textMuted,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    Zoom
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        autoCreate: false,
                        platform: "meet",
                      })
                    }
                    className="h-12 border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor:
                        !formData.autoCreate && formData.platform === "meet"
                          ? C.surfaceWhite
                          : C.innerBg,
                      borderRadius: "10px",
                      border:
                        !formData.autoCreate && formData.platform === "meet"
                          ? `2px solid ${C.btnPrimary}`
                          : `1px solid ${C.cardBorder}`,
                      color:
                        !formData.autoCreate && formData.platform === "meet"
                          ? C.btnPrimary
                          : C.textMuted,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    G-Meet
                  </button>
                </div>
              </div>

              {!formData.autoCreate && (
                <div className="space-y-1 pt-2 animate-in fade-in duration-300">
                  <label
                    style={{
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: T.tracking.wider,
                    }}
                  >
                    External Meeting Link *
                  </label>
                  <input
                    type="url"
                    required
                    style={{
                      ...baseInputStyle,
                      backgroundColor: C.surfaceWhite,
                    }}
                    onFocus={onFocusHandler}
                    onBlur={onBlurHandler}
                    placeholder="https://zoom.us/j/..."
                    value={formData.meetingLink}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingLink: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-1 pt-2">
                <label
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Description{" "}
                  <span
                    style={{
                      fontWeight: T.weight.semibold,
                      textTransform: "none",
                      letterSpacing: "normal",
                    }}
                  >
                    (Optional)
                  </span>
                </label>
                <textarea
                  style={{
                    ...baseInputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                    backgroundColor: C.surfaceWhite,
                  }}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What will be covered?"
                />
              </div>

              <div className="pt-2">
                <AudienceSelector
                  value={formData.audience}
                  onChange={(audience) =>
                    setFormData({ ...formData, audience })
                  }
                  availableBatches={availableBatches}
                  availableStudents={availableStudents}
                  allowGlobal={Boolean(
                    !institute?._id ||
                    institute?.features?.allowGlobalPublishingByInstituteTutors,
                  )}
                  instituteId={institute?._id || null}
                />
              </div>

              <div
                className="flex justify-end gap-3 pt-6 mt-4"
                style={{ borderTop: `1px solid ${C.cardBorder}` }}
              >
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 cursor-pointer bg-transparent border-none transition-opacity hover:opacity-70"
                  style={{
                    color: C.textMuted,
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                    fontFamily: T.fontFamily,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                  style={{
                    background: C.gradientBtn,
                    color: "#ffffff",
                    borderRadius: "10px",
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                    fontFamily: T.fontFamily,
                    boxShadow: S.btn,
                  }}
                >
                  {saving ? (
                    <MdHourglassEmpty size={18} className="animate-spin" />
                  ) : (
                    <MdSave size={18} />
                  )}{" "}
                  {editingId ? "Update Class" : "Schedule Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
