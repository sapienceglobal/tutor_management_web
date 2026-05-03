"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MdCalendarToday,
  MdAccessTime,
  MdVideocam,
  MdPeople,
  MdChevronLeft,
  MdChevronRight,
  MdPlayCircleOutline,
  MdNotifications,
  MdRepeat,
  MdAutoAwesome,
  MdPerson,
  MdMenuBook,
} from "react-icons/md";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { getAudienceDisplay } from "@/lib/audienceDisplay";
import { C, T, S, R } from "@/constants/studentTokens";

// ─── Theme Colors ─────────────────────────────────────────────────────────────

const SCHEDULE_PAGE_SIZE = 4;

export default function LiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [schedulePage, setSchedulePage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/live-classes");
        if (res.data?.success && res.data.liveClasses)
          setLiveClasses(res.data.liveClasses);
      } catch (error) {
        console.error("Error fetching live classes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();

  const getClassesForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return liveClasses
      .filter((c) => {
        const dt = new Date(c.dateTime);
        return dt >= dayStart && dt < dayEnd;
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  };

  const todayClasses = getClassesForDate(selectedDate);
  const upcomingClasses = liveClasses
    .filter((c) => new Date(c.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .slice(0, 5);
  const pastClasses = liveClasses
    .filter((c) => new Date(c.dateTime) < now)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    .slice(0, 5);

  const allScheduled = liveClasses
    .filter((c) => new Date(c.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const scheduleTotalPages = Math.max(
    1,
    Math.ceil(allScheduled.length / SCHEDULE_PAGE_SIZE),
  );
  const scheduleSlice = allScheduled.slice(
    (schedulePage - 1) * SCHEDULE_PAGE_SIZE,
    schedulePage * SCHEDULE_PAGE_SIZE,
  );

  const isLive = (c) => {
    const start = new Date(c.dateTime);
    const end = new Date(start.getTime() + (c.duration || 60) * 60 * 1000);
    return now >= start && now <= end;
  };

  const joinClass = async (c) => {
    try {
      await api.post(`/live-classes/${c._id}/attendance`).catch(() => {});
      if (c.meetingId)
        window.open(`https://meet.jit.si/${c.meetingId}`, "_blank");
      else if (c.meetingLink) window.open(c.meetingLink, "_blank");
    } catch (e) {
      if (c.meetingLink) window.open(c.meetingLink, "_blank");
    }
  };

  const formatDisplayDate = (d) =>
    d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const shiftDate = (delta) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  // Calendar variables
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const monthName = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const examDates = useMemo(() => {
    const dates = new Set();
    liveClasses.forEach((e) => {
      const d = new Date(e.dateTime);
      if (d.getMonth() === month && d.getFullYear() === year)
        dates.add(d.getDate());
    });
    return dates;
  }, [liveClasses, month, year]);

  if (loading)
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
        style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
      >
        <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
        <p
          style={{
            color: C.text,
            fontSize: T.size.base,
            fontWeight: T.weight.semibold,
          }}
        >
          Loading Live Classes...
        </p>
      </div>
    );

  return (
    <div
      className="w-full min-h-screen p-6 space-y-6"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden shadow-base"
        style={{
          backgroundColor: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: R["2xl"],
          boxShadow: S.card,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 lg:p-8">
          <div className="space-y-2">
            <h1
              style={{
                fontSize: T.size["2xl"],
                fontWeight: T.weight.bold,
                color: C.heading,
              }}
            >
              Live Classes
            </h1>
            <p
              style={{
                fontSize: T.size.base,
                color: C.textMuted,
                fontWeight: T.weight.semibold,
                maxWidth: 480,
              }}
            >
              Join your live sessions, interact with instructors in real-time,
              and access past class recordings.
            </p>
          </div>
          <div
            className="hidden md:flex w-40 h-28 items-center justify-center shadow-inner"
            style={{ backgroundColor: C.innerBox, borderRadius: "10px" }}
          >
            <MdVideocam
              className="w-12 h-12 opacity-60"
              style={{ color: C.btnPrimary }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left: Calendar & Today's Classes (2 Cols) ─────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Today's Classes Container */}
          <div
            className="overflow-hidden shadow-base"
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: R["2xl"],
              boxShadow: S.card,
            }}
          >
            {/* Date Navigator Header */}
            <div
              className="flex flex-col base:flex-row items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: C.cardBorder, backgroundColor: C.innerBox }}
            >
              <h2
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.bold,
                  color: C.heading,
                }}
              >
                Schedule for the Day
              </h2>
              <div
                className="flex items-center gap-2 p-1"
                style={{
                  backgroundColor: C.surfaceWhite,
                  borderRadius: "10px",
                  border: `1px solid ${C.cardBorder}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => shiftDate(-1)}
                  className="p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center"
                  style={{
                    color: C.text,
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.innerBg;
                    e.currentTarget.style.color = C.heading;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = C.text;
                  }}
                >
                  <MdChevronLeft className="w-5 h-5" />
                </button>
                <span
                  style={{
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    minWidth: 180,
                    textAlign: "center",
                  }}
                >
                  {formatDisplayDate(selectedDate)}
                </span>
                <button
                  type="button"
                  onClick={() => shiftDate(1)}
                  className="p-1.5 transition-colors cursor-pointer border-none flex items-center justify-center"
                  style={{
                    color: C.text,
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.innerBg;
                    e.currentTarget.style.color = C.heading;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = C.text;
                  }}
                >
                  <MdChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Today's Class List */}
            <div className="p-5 space-y-4 custom-scrollbar">
              {todayClasses.length > 0 ? (
                todayClasses.map((c) => {
                  const classLive = isLive(c);
                  return (
                    <div
                      key={c._id}
                      className="flex flex-col base:flex-row base:items-center justify-between gap-4 p-5 transition-all border"
                      style={{
                        backgroundColor: C.innerBg,
                        borderColor: classLive ? C.btnPrimary : C.cardBorder,
                        boxShadow: classLive ? S.card : "none",
                        borderRadius: "10px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.surfaceWhite;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = C.innerBg;
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3
                            style={{
                              fontSize: T.size.md,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: 0,
                            }}
                          >
                            {c.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wider ${getAudienceDisplay(c).badgeClass}`}
                            style={{ fontWeight: T.weight.bold }}
                          >
                            {getAudienceDisplay(c).label}
                          </span>
                          {classLive && (
                            <span
                              className="px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider flex items-center gap-1.5 animate-pulse"
                              style={{
                                backgroundColor: C.dangerBg,
                                color: C.danger,
                                border: `1px solid ${C.dangerBorder}`,
                                fontWeight: T.weight.bold,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: C.danger }}
                              ></span>{" "}
                              LIVE NOW
                            </span>
                          )}
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-x-4 gap-y-1"
                          style={{
                            fontSize: T.size.xs,
                            fontWeight: T.weight.semibold,
                            color: C.textMuted,
                          }}
                        >
                          <span className="flex items-center gap-1.5">
                            <MdPerson size={14} />{" "}
                            {c.tutorId?.userId?.name || "Instructor"}
                          </span>
                          {c.courseId?.title && (
                            <span className="flex items-center gap-1.5">
                              <MdMenuBook size={14} /> {c.courseId.title}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <MdAccessTime size={14} /> {c.duration || 60} min
                          </span>
                          {c.scheduleDescription && (
                            <span className="flex items-center gap-1.5">
                              <MdRepeat size={14} /> {c.scheduleDescription}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-end base:w-auto w-full pt-2 base:pt-0 border-t base:border-none"
                        style={{ borderColor: C.cardBorder }}
                      >
                        <button
                          onClick={() => joinClass(c)}
                          className="flex items-center gap-1.5 px-6 h-10 text-white cursor-pointer border-none transition-opacity hover:opacity-90 shadow-base w-full base:w-auto justify-center"
                          style={{
                            background: classLive
                              ? `linear-gradient(135deg, ${C.danger}, #F87171)`
                              : C.gradientBtn,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            borderRadius: "10px",
                            fontFamily: T.fontFamily,
                          }}
                        >
                          {classLive ? (
                            <MdVideocam size={16} />
                          ) : (
                            <MdCalendarToday size={16} />
                          )}
                          {classLive ? "Join Now" : "Class Link"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="text-center py-12 flex flex-col items-center border border-dashed"
                  style={{ borderColor: C.cardBorder, borderRadius: "10px" }}
                >
                  <div
                    className="w-14 h-14 flex items-center justify-center mb-4"
                    style={{ backgroundColor: C.innerBg, borderRadius: "10px" }}
                  >
                    <MdCalendarToday
                      className="w-7 h-7"
                      style={{ color: C.btnPrimary, opacity: 0.5 }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: T.size.md,
                      fontWeight: T.weight.semibold,
                      color: C.heading,
                    }}
                  >
                    No classes scheduled
                  </p>
                  <p
                    style={{
                      fontSize: T.size.base,
                      color: C.textMuted,
                      fontWeight: T.weight.medium,
                    }}
                  >
                    Enjoy your free time or revise past topics.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Table (Upcoming) */}
          <div
            className="overflow-hidden shadow-base border"
            style={{
              backgroundColor: C.cardBg,
              borderColor: C.cardBorder,
              borderRadius: R["2xl"],
            }}
          >
            <div
              className="px-6 py-5 border-b"
              style={{ borderColor: C.cardBorder, backgroundColor: C.innerBox }}
            >
              <h2
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.bold,
                  color: C.heading,
                  margin: 0,
                }}
              >
                Full Schedule
              </h2>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table
                className="w-full text-left"
                style={{ borderCollapse: "collapse" }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${C.cardBorder}`,
                      backgroundColor: C.innerBox,
                    }}
                  >
                    {["Class Name", "Instructor", "Date & Time", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-4"
                          style={{
                            fontSize: "10px",
                            fontWeight: T.weight.bold,
                            color: C.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {scheduleSlice.length > 0 ? (
                    scheduleSlice.map((c) => (
                      <tr
                        key={c._id}
                        className="transition-colors hover:bg-slate-50"
                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                      >
                        <td className="px-6 py-4">
                          <p
                            style={{
                              fontSize: T.size.base,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              margin: "0 0 4px 0",
                            }}
                          >
                            {c.title}
                          </p>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wider ${getAudienceDisplay(c).badgeClass}`}
                            style={{ fontWeight: T.weight.bold }}
                          >
                            {getAudienceDisplay(c).label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.semibold,
                              color: C.textMuted,
                            }}
                          >
                            {c.tutorId?.userId?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            style={{
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                              marginBottom: "2px",
                            }}
                          >
                            {new Date(c.dateTime).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: T.weight.semibold,
                              color: C.textMuted,
                            }}
                          >
                            {new Date(c.dateTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="flex items-center justify-center gap-1.5 h-8 px-3 border-none cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: C.surfaceWhite,
                              color: C.btnPrimary,
                              fontSize: "10px",
                              fontWeight: T.weight.bold,
                              border: `1px solid ${C.cardBorder}`,
                              borderRadius: "8px",
                              fontFamily: T.fontFamily,
                            }}
                          >
                            <MdNotifications size={12} /> Remind Me
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center"
                        style={{
                          fontSize: T.size.base,
                          fontWeight: T.weight.semibold,
                          color: C.textMuted,
                        }}
                      >
                        No upcoming classes in the full schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {scheduleTotalPages > 1 && (
              <div
                className="flex items-center justify-center gap-2 px-6 py-4"
                style={{
                  borderTop: `1px solid ${C.cardBorder}`,
                  backgroundColor: C.innerBox,
                }}
              >
                <button
                  disabled={schedulePage <= 1}
                  onClick={() => setSchedulePage((p) => p - 1)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: C.surfaceWhite,
                    color: C.heading,
                    borderRadius: "8px",
                    border: `1px solid ${C.cardBorder}`,
                  }}
                >
                  <MdChevronLeft size={16} />
                </button>
                <span
                  style={{
                    fontSize: T.size.xs,
                    fontWeight: T.weight.semibold,
                    color: C.textMuted,
                  }}
                >
                  Page {schedulePage} of {scheduleTotalPages}
                </span>
                <button
                  disabled={schedulePage >= scheduleTotalPages}
                  onClick={() => setSchedulePage((p) => p + 1)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: C.surfaceWhite,
                    color: C.heading,
                    borderRadius: "8px",
                    border: `1px solid ${C.cardBorder}`,
                  }}
                >
                  <MdChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Mini Calendar & Past Classes (1 Col) ─────────────── */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <div
            className="p-6 shadow-base border"
            style={{
              backgroundColor: C.cardBg,
              borderColor: C.cardBorder,
              borderRadius: R["2xl"],
              boxShadow: S.card,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.bold,
                  color: C.heading,
                }}
              >
                {monthName}
              </h3>
              <div
                className="flex items-center gap-1 bg-white p-1 shadow-base border border-slate-100"
                style={{ borderRadius: "10px" }}
              >
                {[
                  { dir: -1, Icon: MdChevronLeft },
                  { dir: 1, Icon: MdChevronRight },
                ].map(({ dir, Icon }) => (
                  <button
                    key={dir}
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + dir);
                      setSelectedDate(newDate);
                    }}
                    className="w-7 h-7 flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent hover:bg-slate-100"
                    style={{ color: C.textMuted, borderRadius: "8px" }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 text-center mb-3">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  style={{
                    fontSize: "10px",
                    fontWeight: T.weight.bold,
                    textTransform: "uppercase",
                    color: C.textMuted,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === month &&
                  today.getFullYear() === year;
                const isSelected =
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;
                const hasExam = examDates.has(day);

                return (
                  <div
                    key={day}
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                    }}
                    className="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  >
                    <div
                      className="w-8 h-8 flex flex-col items-center justify-center relative"
                      style={
                        isSelected
                          ? {
                              backgroundColor: C.btnPrimary,
                              color: "white",
                              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
                              borderRadius: "8px",
                            }
                          : isToday
                            ? {
                                backgroundColor: C.innerBox,
                                color: C.btnPrimary,
                                border: `1px solid ${C.btnPrimary}`,
                                borderRadius: "8px",
                              }
                            : hasExam
                              ? {
                                  backgroundColor: "#EEF2FF",
                                  color: "#4F46E5",
                                  border: "1px dashed #A5B4FC",
                                  borderRadius: "8px",
                                }
                              : {
                                  backgroundColor: "transparent",
                                  color: C.heading,
                                  borderRadius: "8px",
                                }
                      }
                    >
                      <span
                        style={{
                          fontSize: T.size.base,
                          fontWeight: T.weight.semibold,
                        }}
                      >
                        {day}
                      </span>
                      {hasExam && (
                        <div
                          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? "white" : "#4F46E5",
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Classes / Recordings */}
          <div
            className="shadow-base border overflow-hidden"
            style={{
              backgroundColor: C.cardBg,
              borderColor: C.cardBorder,
              borderRadius: R["2xl"],
              boxShadow: S.card,
            }}
          >
            <div
              className="px-6 py-5 border-b"
              style={{ borderColor: C.cardBorder, backgroundColor: C.innerBox }}
            >
              <h2
                style={{
                  fontSize: T.size.md,
                  fontWeight: T.weight.bold,
                  color: C.heading,
                  margin: 0,
                }}
              >
                Past Recordings
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {pastClasses.length > 0 ? (
                pastClasses.slice(0, 4).map((c) => (
                  <div
                    key={c._id}
                    className="p-4 border transition-colors hover:bg-slate-50"
                    style={{
                      backgroundColor: C.innerBg,
                      borderColor: C.cardBorder,
                      borderRadius: "10px",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 pr-2">
                        <p
                          className="truncate"
                          style={{
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                            margin: "0 0 2px 0",
                          }}
                        >
                          {c.title}
                        </p>
                        <p
                          className="truncate"
                          style={{
                            fontSize: "10px",
                            fontWeight: T.weight.semibold,
                            color: C.textMuted,
                            margin: 0,
                          }}
                        >
                          {c.tutorId?.userId?.name || "Instructor"}
                        </p>
                      </div>
                    </div>
                    {c.recordingLink ? (
                      <button
                        onClick={() => window.open(c.recordingLink, "_blank")}
                        className="w-full flex items-center justify-center gap-1.5 h-9 border-none cursor-pointer transition-opacity hover:opacity-90 shadow-base"
                        style={{
                          backgroundColor: C.surfaceWhite,
                          color: C.btnPrimary,
                          fontSize: T.size.xs,
                          fontWeight: T.weight.bold,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: "10px",
                          fontFamily: T.fontFamily,
                        }}
                      >
                        <MdPlayCircleOutline size={14} /> Watch Recording
                      </button>
                    ) : (
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: T.weight.semibold,
                          color: C.textMuted,
                          textAlign: "center",
                          margin: 0,
                          padding: "8px 0",
                          fontStyle: "italic",
                        }}
                      >
                        No recording available
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p
                  className="text-center py-6"
                  style={{
                    fontSize: T.size.base,
                    fontWeight: T.weight.semibold,
                    color: C.textMuted,
                  }}
                >
                  No past classes.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
