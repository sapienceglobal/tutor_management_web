"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MdArrowBack,
  MdPeople,
  MdSearch,
  MdAdd,
  MdDelete,
  MdMail,
  MdCheckCircle,
  MdCampaign,
  MdBarChart,
  MdHourglassEmpty,
  MdSend,
  MdTrendingUp,
  MdDescription,
} from "react-icons/md";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";
import { C, T, S, R } from "@/constants/studentTokens";
import StatCard from "@/components/StatCard";

// Focus Handlers
const onFocusHandler = (e) => {
  e.target.style.borderColor = C.btnPrimary;
  e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = (e) => {
  e.target.style.borderColor = C.cardBorder;
  e.target.style.boxShadow = "none";
};

const baseInputStyle = {
  backgroundColor: C.innerBg,
  border: `1.5px solid ${C.cardBorder}`,
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

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBatchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBatchDetails = async () => {
    try {
      const res = await api.get(`/batches/${id}`);
      if (res?.data?.success) {
        setBatch(res.data.batch);
      }
    } catch (error) {
      console.error("Fetch batch details error:", error);
      toast.error("Failed to load batch details");
      router.push("/tutor/batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      const res = await api.get("/tutors/students");
      if (res?.data?.success) {
        const enrolledIds = batch.students.map((s) => s._id);
        const eligible = res.data.data.filter(
          (s) => !enrolledIds.includes(s._id),
        );
        setAllStudents(eligible);
        setIsAddingMode(true);
      }
    } catch (error) {
      console.error("Fetch students error:", error);
      toast.error("Failed to load eligible students");
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      const newStudentsList = [...batch.students.map((s) => s._id), studentId];
      const res = await api.put(`/batches/${id}/students`, {
        studentIds: newStudentsList,
      });
      if (res?.data?.success) {
        toast.success("Student added to batch");
        fetchBatchDetails();
        setIsAddingMode(false);
      }
    } catch (error) {
      console.error("Add student error:", error);
      toast.error("Failed to add student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Remove this student from the batch?")) return;

    try {
      const newStudentsList = batch.students
        .filter((s) => s._id !== studentId)
        .map((s) => s._id);
      const res = await api.put(`/batches/${id}/students`, {
        studentIds: newStudentsList,
      });
      if (res?.data?.success) {
        toast.success("Student removed from batch");
        fetchBatchDetails();
      }
    } catch (error) {
      console.error("Remove student error:", error);
      toast.error("Failed to remove student");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      return toast.error("Title and message are required");
    }
    setPostingAnnouncement(true);
    try {
      const res = await api.post(
        `/batches/${id}/announcements`,
        announcementForm,
      );
      if (res?.data?.success) {
        toast.success("Announcement posted!");
        setAnnouncementForm({ title: "", message: "" });
        fetchBatchDetails();
      }
    } catch (error) {
      toast.error("Failed to post announcement");
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const fetchAnalytics = async () => {
    if (analytics) return;
    setLoadingAnalytics(true);
    try {
      const res = await api.get(`/batches/${id}/analytics`);
      if (res?.data?.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex flex-col justify-center items-center min-h-screen w-full"
        style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
      >
        <MdHourglassEmpty
          className="w-8 h-8 animate-spin"
          style={{ color: C.btnPrimary }}
        />
        <p
          style={{
            marginTop: "12px",
            fontSize: T.size.sm,
            fontWeight: T.weight.bold,
            color: C.textMuted,
          }}
        >
          Loading batch details...
        </p>
      </div>
    );
  }

  if (!batch) return null;

  const filteredStudents = allStudents.filter(
    (s) =>
      s?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className="w-full min-h-screen space-y-6"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-opacity-80 shrink-0"
          style={{ backgroundColor: C.innerBg, borderRadius: "10px" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = C.btnViewAllBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = C.innerBg)
          }
        >
          <MdArrowBack size={20} color={C.heading} />
        </button>
        <div>
          <h1
            style={{
              fontSize: T.size["2xl"],
              fontWeight: T.weight.black,
              color: C.heading,
              margin: "0 0 2px 0",
            }}
          >
            {batch.name}
          </h1>
          <p
            style={{
              fontSize: T.size.sm,
              fontWeight: T.weight.medium,
              color: C.textMuted,
              margin: 0,
            }}
          >
            {batch.courseId?.title || "Unknown Course"} •{" "}
            {batch.scheduleDescription || "No Schedule"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 delay-100">
        {/* Left Column: Stats & Details */}
        <div className="lg:col-span-1 space-y-6">
          <div
            className="p-6"
            style={{
              backgroundColor: C.cardBg,
              borderRadius: R["2xl"],
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.card,
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ backgroundColor: C.iconBg, borderRadius: "10px" }}
              >
                <MdPeople size={24} color={C.iconColor} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                    margin: "0 0 2px 0",
                  }}
                >
                  Total Enrolled
                </p>
                <p
                  style={{
                    fontSize: T.size["3xl"],
                    fontWeight: T.weight.black,
                    color: C.heading,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {batch.students.length}
                </p>
              </div>
            </div>
            <Link
              href={`/tutor/batches/${id}/attendance`}
              style={{ textDecoration: "none" }}
            >
              <button
                className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
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
                <MdCheckCircle size={18} /> Daily Attendance Log
              </button>
            </Link>
          </div>

          <div
            className="p-6"
            style={{
              backgroundColor: C.cardBg,
              borderRadius: R["2xl"],
              border: `1px solid ${C.cardBorder}`,
              boxShadow: S.card,
            }}
          >
            <h3
              style={{
                fontSize: T.size.md,
                fontWeight: T.weight.black,
                color: C.heading,
                margin: "0 0 16px 0",
              }}
            >
              Batch Details
            </h3>
            <div className="space-y-4">
              <div
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
              >
                <span
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                  }}
                >
                  Status
                </span>
                <span
                  className="capitalize"
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.black,
                    color: batch.status === "active" ? C.success : C.warning,
                  }}
                >
                  {batch.status || "Active"}
                </span>
              </div>
              <div
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
              >
                <span
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                  }}
                >
                  Start Date
                </span>
                <span
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.black,
                    color: C.heading,
                  }}
                >
                  {batch.startDate
                    ? new Date(batch.startDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.bold,
                    color: C.textMuted,
                  }}
                >
                  End Date
                </span>
                <span
                  style={{
                    fontSize: T.size.sm,
                    fontWeight: T.weight.black,
                    color: C.heading,
                  }}
                >
                  {batch.endDate
                    ? new Date(batch.endDate).toLocaleDateString()
                    : "Ongoing"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Buttons */}
          <div
            className="flex gap-2 p-1 w-full sm:w-max"
            style={{
              backgroundColor: C.innerBg,
              borderRadius: "12px",
              border: `1px solid ${C.cardBorder}`,
            }}
          >
            {[
              { key: "students", label: "Students", icon: MdPeople },
              {
                key: "announcements",
                label: "Announcements",
                icon: MdCampaign,
              },
              { key: "analytics", label: "Analytics", icon: MdBarChart },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "analytics") fetchAnalytics();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 cursor-pointer border-none transition-all"
                style={{
                  backgroundColor:
                    activeTab === tab.key ? C.btnPrimary : "transparent",
                  color: activeTab === tab.key ? "#ffffff" : C.textMuted,
                  borderRadius: "10px",
                  boxShadow: activeTab === tab.key ? S.card : "none",
                  fontSize: T.size.sm,
                  fontWeight: T.weight.bold,
                  fontFamily: T.fontFamily,
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Students Tab ────────────────────────────────────────── */}
          {activeTab === "students" && (
            <div
              className="flex flex-col min-h-[500px] animate-in fade-in duration-500"
              style={{
                backgroundColor: C.cardBg,
                borderRadius: R["2xl"],
                border: `1px solid ${C.cardBorder}`,
                boxShadow: S.card,
              }}
            >
              <div
                className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
              >
                <h2
                  className="flex items-center gap-2"
                  style={{
                    fontSize: T.size.lg,
                    fontWeight: T.weight.black,
                    color: C.heading,
                    margin: 0,
                  }}
                >
                  <MdPeople size={22} color={C.btnPrimary} /> Enrolled Students
                </h2>

                {!isAddingMode ? (
                  <button
                    onClick={fetchEligibleStudents}
                    className="flex items-center gap-2 px-5 py-2 cursor-pointer border-none transition-colors hover:bg-opacity-80 shadow-sm"
                    style={{
                      backgroundColor: C.innerBg,
                      color: C.btnPrimary,
                      borderRadius: "8px",
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                      border: `1px solid ${C.cardBorder}`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = C.btnViewAllBg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = C.innerBg)
                    }
                  >
                    <MdAdd size={18} /> Add Students
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddingMode(false)}
                    className="bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
                    style={{
                      color: C.textMuted,
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    Cancel Adding
                  </button>
                )}
              </div>

              {isAddingMode && (
                <div
                  className="p-6 animate-in slide-in-from-top-4 duration-300"
                  style={{
                    backgroundColor: C.surfaceWhite,
                    borderBottom: `1px solid ${C.cardBorder}`,
                  }}
                >
                  <div className="relative">
                    <MdSearch
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      size={20}
                      color={C.textMuted}
                    />
                    <input
                      type="text"
                      placeholder="Search students to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        ...baseInputStyle,
                        paddingLeft: "44px",
                        backgroundColor: C.innerBg,
                      }}
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                    />
                  </div>
                  <div className="mt-4 max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredStudents.length === 0 ? (
                      <p
                        className="text-center py-4"
                        style={{
                          fontSize: T.size.sm,
                          color: C.textMuted,
                          fontWeight: T.weight.bold,
                          margin: 0,
                        }}
                      >
                        No eligible students found.
                      </p>
                    ) : (
                      filteredStudents.map((student) => (
                        <div
                          key={student._id}
                          className="flex justify-between items-center p-3 transition-colors hover:bg-opacity-70"
                          style={{
                            backgroundColor: C.innerBg,
                            borderRadius: "10px",
                            border: `1px solid ${C.cardBorder}`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                student.profileImage ||
                                `https://ui-avatars.com/api/?name=${student.name}`
                              }
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p
                                style={{
                                  fontSize: T.size.sm,
                                  fontWeight: T.weight.bold,
                                  color: C.heading,
                                  margin: 0,
                                }}
                              >
                                {student.name}
                              </p>
                              <p
                                style={{
                                  fontSize: T.size.xs,
                                  fontWeight: T.weight.medium,
                                  color: C.textMuted,
                                  margin: 0,
                                }}
                              >
                                {student.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddStudent(student._id)}
                            className="px-5 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                            style={{
                              background: C.gradientBtn,
                              color: "#ffffff",
                              borderRadius: "8px",
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              fontFamily: T.fontFamily,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                {batch.students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <div
                      className="flex items-center justify-center mb-3"
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: C.innerBg,
                        borderRadius: "12px",
                      }}
                    >
                      <MdPeople
                        size={32}
                        color={C.textMuted}
                        style={{ opacity: 0.5 }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: "0 0 16px 0",
                      }}
                    >
                      No students enrolled in this batch yet.
                    </p>
                    <button
                      onClick={fetchEligibleStudents}
                      className="px-6 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                      style={{
                        background: C.gradientBtn,
                        color: "#ffffff",
                        borderRadius: "10px",
                        fontSize: T.size.sm,
                        fontWeight: T.weight.bold,
                        fontFamily: T.fontFamily,
                      }}
                    >
                      Enroll Students
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batch.students.map((student, idx) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-4 group transition-colors"
                        style={{
                          backgroundColor: C.innerBg,
                          borderRadius: "10px",
                          border: `1px solid ${C.cardBorder}`,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            C.btnViewAllBg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = C.innerBg)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={
                                student.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`
                              }
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover shadow-sm"
                              style={{ border: `2px solid ${C.surfaceWhite}` }}
                            />
                            <span
                              className="absolute -bottom-1 -right-1 w-5 h-5 text-white flex items-center justify-center shadow-sm"
                              style={{
                                backgroundColor: C.heading,
                                fontSize: "10px",
                                fontWeight: T.weight.black,
                                borderRadius: R.full,
                                border: `2px solid ${C.surfaceWhite}`,
                              }}
                            >
                              {idx + 1}
                            </span>
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: T.size.sm,
                                fontWeight: T.weight.bold,
                                color: C.heading,
                                margin: 0,
                              }}
                            >
                              {student.name}
                            </h3>
                            <div
                              className="flex items-center gap-1.5 mt-1"
                              style={{
                                fontSize: T.size.xs,
                                fontWeight: T.weight.semibold,
                                color: C.textMuted,
                              }}
                            >
                              <MdMail size={14} />
                              {student.email}
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRemoveStudent(student._id)}
                            className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors shadow-sm"
                            style={{
                              backgroundColor: C.dangerBg,
                              borderRadius: "8px",
                              border: `1px solid ${C.dangerBorder}`,
                            }}
                          >
                            <MdDelete size={18} color={C.danger} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Announcements Tab ───────────────────────────────────── */}
          {activeTab === "announcements" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div
                className="p-6 space-y-4"
                style={{
                  backgroundColor: C.cardBg,
                  borderRadius: R["2xl"],
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                }}
              >
                <h3
                  className="flex items-center gap-2"
                  style={{
                    fontSize: T.size.md,
                    fontWeight: T.weight.black,
                    color: C.heading,
                    margin: 0,
                  }}
                >
                  <MdCampaign size={22} color={C.warning} />
                  Post New Announcement
                </h3>
                <input
                  placeholder="Announcement Title"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  style={{ ...baseInputStyle, backgroundColor: C.innerBg }}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                />
                <textarea
                  placeholder="Announcement message..."
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      message: e.target.value,
                    })
                  }
                  style={{
                    ...baseInputStyle,
                    minHeight: "120px",
                    resize: "vertical",
                    backgroundColor: C.innerBg,
                  }}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                />
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={postingAnnouncement}
                    className="flex items-center justify-center h-12 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md w-full sm:w-auto"
                    style={{
                      backgroundColor: C.warning,
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontSize: T.size.sm,
                      fontWeight: T.weight.bold,
                      fontFamily: T.fontFamily,
                    }}
                  >
                    {postingAnnouncement ? (
                      <MdHourglassEmpty size={18} className="animate-spin" />
                    ) : (
                      <MdSend size={18} />
                    )}
                    Post Announcement
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: C.cardBg,
                  borderRadius: R["2xl"],
                  border: `1px solid ${C.cardBorder}`,
                  boxShadow: S.card,
                  overflow: "hidden",
                }}
              >
                <div
                  className="p-6"
                  style={{
                    backgroundColor: C.innerBg,
                    borderBottom: `1px solid ${C.cardBorder}`,
                  }}
                >
                  <h3
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.black,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Previous Announcements
                  </h3>
                </div>
                {batch.announcements && batch.announcements.length > 0 ? (
                  <div className="flex flex-col">
                    {[...batch.announcements].reverse().map((ann, idx) => (
                      <div
                        key={idx}
                        className="p-6 transition-colors hover:bg-white/40"
                        style={{
                          borderBottom:
                            idx !== batch.announcements.length - 1
                              ? `1px solid ${C.cardBorder}`
                              : "none",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            style={{
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: 0,
                            }}
                          >
                            {ann.title}
                          </h4>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: T.weight.bold,
                              color: C.textMuted,
                              letterSpacing: T.tracking.wider,
                              textTransform: "uppercase",
                            }}
                          >
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: T.size.sm,
                            fontWeight: T.weight.medium,
                            color: C.text,
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {ann.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center flex flex-col items-center">
                    <div
                      className="flex items-center justify-center mb-3"
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: C.innerBg,
                        borderRadius: "12px",
                      }}
                    >
                      <MdCampaign
                        size={32}
                        color={C.textMuted}
                        style={{ opacity: 0.5 }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: 0,
                      }}
                    >
                      No announcements posted yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Analytics Tab ───────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div
              className="p-6 animate-in fade-in duration-500"
              style={{
                backgroundColor: C.cardBg,
                borderRadius: R["2xl"],
                border: `1px solid ${C.cardBorder}`,
                boxShadow: S.card,
              }}
            >
              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-20">
                  <MdHourglassEmpty
                    size={36}
                    className="animate-spin"
                    color={C.btnPrimary}
                  />
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  <h3
                    className="flex items-center gap-2"
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.black,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    <MdTrendingUp size={24} color={C.btnPrimary} />
                    Batch Performance Analytics
                  </h3>

                  {/* Global StatCards for Analytics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Students"
                      value={analytics.totalStudents}
                      icon={MdPeople}
                      iconBg="#EEF2FF"
                      iconColor="#4F46E5"
                    />
                    <StatCard
                      label="Avg Score"
                      value={`${analytics.avgScore}%`}
                      icon={MdTrendingUp}
                      iconBg="#ECFDF5"
                      iconColor="#10B981"
                    />
                    <StatCard
                      label="Pass Rate"
                      value={`${analytics.passRate}%`}
                      icon={MdCheckCircle}
                      iconBg="#EFF6FF"
                      iconColor="#3b82f6"
                    />
                    <StatCard
                      label="Total Exams"
                      value={analytics.totalExamResults}
                      icon={MdDescription}
                      iconBg="#F5F3FF"
                      iconColor="#8b5cf6"
                    />
                  </div>
                  {/* Per-Student Summary Table */}
                  {analytics.studentSummary &&
                    analytics.studentSummary.length > 0 && (
                      <div className="pt-4">
                        <h4
                          style={{
                            fontSize: T.size.md,
                            fontWeight: T.weight.black,
                            color: C.heading,
                            margin: "0 0 16px 0",
                          }}
                        >
                          Per-Student Summary
                        </h4>
                        <div
                          className="overflow-x-auto"
                          style={{
                            backgroundColor: C.innerBg,
                            borderRadius: "12px",
                            border: `1px solid ${C.cardBorder}`,
                          }}
                        >
                          <div className="min-w-[550px]">
                            <div
                              className="grid grid-cols-[50px_2fr_1fr_1fr] px-6 py-4"
                              style={{
                                borderBottom: `1px solid ${C.cardBorder}`,
                                backgroundColor: C.surfaceWhite,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: T.weight.bold,
                                  color: C.textMuted,
                                  textTransform: "uppercase",
                                  letterSpacing: T.tracking.wider,
                                }}
                              >
                                #
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: T.weight.bold,
                                  color: C.textMuted,
                                  textTransform: "uppercase",
                                  letterSpacing: T.tracking.wider,
                                }}
                              >
                                Student
                              </span>
                              <span
                                className="text-right"
                                style={{
                                  fontSize: "10px",
                                  fontWeight: T.weight.bold,
                                  color: C.textMuted,
                                  textTransform: "uppercase",
                                  letterSpacing: T.tracking.wider,
                                }}
                              >
                                Exams
                              </span>
                              <span
                                className="text-right"
                                style={{
                                  fontSize: "10px",
                                  fontWeight: T.weight.bold,
                                  color: C.textMuted,
                                  textTransform: "uppercase",
                                  letterSpacing: T.tracking.wider,
                                }}
                              >
                                Avg Score
                              </span>
                            </div>
                            <div className="flex flex-col">
                              {analytics.studentSummary.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-[50px_2fr_1fr_1fr] px-6 py-4 items-center transition-colors hover:bg-white/40"
                                  style={{
                                    borderBottom:
                                      idx !==
                                      analytics.studentSummary.length - 1
                                        ? `1px solid ${C.cardBorder}`
                                        : "none",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: T.size.sm,
                                      fontWeight: T.weight.black,
                                      color: C.textMuted,
                                    }}
                                  >
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <p
                                      style={{
                                        fontSize: T.size.sm,
                                        fontWeight: T.weight.bold,
                                        color: C.heading,
                                        margin: 0,
                                      }}
                                    >
                                      {s.student.name}
                                    </p>
                                    <p
                                      style={{
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.semibold,
                                        color: C.textMuted,
                                        margin: 0,
                                      }}
                                    >
                                      {s.student.email}
                                    </p>
                                  </div>
                                  <span
                                    className="text-right"
                                    style={{
                                      fontSize: T.size.sm,
                                      fontWeight: T.weight.bold,
                                      color: C.heading,
                                    }}
                                  >
                                    {s.examsTaken}
                                  </span>
                                  <div className="text-right">
                                    <span
                                      style={{
                                        fontSize: T.size.sm,
                                        fontWeight: T.weight.black,
                                        color:
                                          s.avgScore >= 60
                                            ? C.success
                                            : s.avgScore >= 40
                                              ? C.warning
                                              : C.danger,
                                      }}
                                    >
                                      {s.avgScore}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center">
                  <div
                    className="flex items-center justify-center mb-4"
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: C.innerBg,
                      borderRadius: "12px",
                    }}
                  >
                    <MdBarChart
                      size={32}
                      color={C.textMuted}
                      style={{ opacity: 0.5 }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    No analytics data available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
