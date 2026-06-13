"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdHourglassEmpty,
  MdAdd,
  MdClose,
  MdUpload,
  MdChevronRight,
  MdChevronLeft,
  MdMenuBook,
  MdVideocam,
  MdArticle,
  MdCheckCircle,
  MdRocketLaunch,
  MdDelete,
  MdArrowBack,
  MdWarning,
  MdQuiz,
  MdOutlineAssignment,
  MdHelpOutline,
} from "react-icons/md";
import api from "@/lib/axios";
import axios from 'axios';
import Link from "next/link";
import { toast } from "react-hot-toast";
import AudienceSelector from "@/components/shared/AudienceSelector";
import useInstitute from "@/hooks/useInstitute";
import FeatureGate from "@/components/FeatureGate";
import { C, T, S, R } from "@/constants/studentTokens";

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = (e) => {
  e.target.style.borderColor = C.btnPrimary;
  e.target.style.boxShadow = "0 0 0 3px rgba(117,115,232,0.10)";
};
const onBlurHandler = (e) => {
  e.target.style.borderColor = C.cardBorder;
  e.target.style.boxShadow = "none";
};

const baseInputStyle = {
  backgroundColor: C.innerBg,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: "10px",
  color: C.heading,
  fontFamily: T.fontFamily,
  fontSize: T.size.base,
  fontWeight: T.weight.medium,
  outline: "none",
  width: "100%",
  padding: "10px 16px",
  transition: "all 0.2s ease",
};

const createDefaultLessonForm = () => ({
  title: "",
  description: "",
  type: "video",
  videoUrl: "",
  duration: "",
  isFree: false,
  attachments: [],
  documents: [],
  quiz: { passingScore: 70, timeLimit: "", questions: [] },
});

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Course Info" },
  { num: 2, label: "Curriculum" },
  { num: 3, label: "Assignments" },
  { num: 4, label: "Publish" },
];

const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
};

const getVideoDuration = (file) => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    } catch {
      resolve(0);
    }
  });
};

// ─── Step Bar ─────────────────────────────────────────────────────────────────
function StepBar({ current = 1 }) {
  return (
    <div
      className="flex items-center flex-wrap gap-y-2 p-4 mb-5"
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: R["2xl"],
        boxShadow: S.card,
      }}
    >
      {STEPS.map((step, i) => {
        const isActive = step.num === current;
        const isDone = step.num < current;
        return (
          <div key={step.num} className="flex items-center">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                backgroundColor: isActive ? C.innerBg : "transparent",
                borderRadius: "10px",
                boxShadow: isActive ? S.active : "none",
              }}
            >
              {/* Step Number / Done Icon */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "8px",
                  backgroundColor: isActive
                    ? C.btnPrimary
                    : isDone
                      ? C.successBg
                      : C.innerBg,
                  color: isActive ? "#fff" : isDone ? C.success : C.text,
                  fontFamily: T.fontFamily,
                  fontSize: T.size.xs,
                  fontWeight: T.weight.bold,
                }}
              >
                {isDone ? (
                  <MdCheckCircle style={{ width: 14, height: 14 }} />
                ) : (
                  step.num
                )}
              </div>
              <span
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: isActive ? T.weight.bold : T.weight.medium,
                  color: isActive ? C.btnPrimary : C.text,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <MdChevronRight
                style={{
                  width: 16,
                  height: 16,
                  color: C.text,
                  margin: "0 4px",
                  opacity: 0.4,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Thumbnail Upload ─────────────────────────────────────────────────────────
function ThumbnailUpload({ value, onFileSelect, uploading }) {
  return (
    <div className="space-y-2">
      <label
        style={{
          display: "block",
          fontFamily: T.fontFamily,
          fontSize: T.size.xs,
          fontWeight: T.weight.bold,
          color: C.text,
          textTransform: "uppercase",
          letterSpacing: T.tracking.wider,
        }}
      >
        Course Thumbnail (Recommended 800x450)
      </label>
      <div className="flex gap-4 items-stretch h-36">
        {/* Upload area */}
        <div
          className="flex-1 border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
          style={{
            borderColor: C.btnPrimary,
            backgroundColor: C.innerBg,
            borderRadius: "10px",
          }}
        >
          <input
            type="file"
            className="hidden"
            accept="image/*"
            id="thumb-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
              e.target.value = "";
            }}
          />
          <label
            htmlFor="thumb-upload"
            className="flex flex-col items-center cursor-pointer w-full h-full justify-center"
          >
            <div
              className="flex items-center justify-center mb-2"
              style={{
                width: 40,
                height: 40,
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: "10px",
              }}
            >
              <MdUpload
                style={{ width: 18, height: 18, color: C.btnPrimary }}
              />
            </div>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.base,
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: 0,
              }}
            >
              {uploading ? "Uploading..." : "Browse files"}
            </p>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.xs,
                color: C.text,
                margin: 0,
              }}
            >
              JPG, PNG, GIF
            </p>
          </label>
        </div>

        {/* Preview */}
        <div
          className="w-48 flex items-center justify-center overflow-hidden shrink-0"
          style={{
            backgroundColor: C.innerBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: "10px",
          }}
        >
          {value ? (
            <img
              src={value}
              alt="thumb"
              className="w-full h-full object-cover"
            />
          ) : (
            <MdMenuBook
              style={{ width: 28, height: 28, color: C.text, opacity: 0.3 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List Field Section ───────────────────────────────────────────────────────
function ListFieldSection({
  title,
  desc,
  items,
  onAdd,
  onRemove,
  onChange,
  placeholder,
}) {
  return (
    <div className="space-y-3">
      <div>
        <p
          style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.base,
            fontWeight: T.weight.bold,
            color: C.heading,
            margin: "0 0 2px 0",
          }}
        >
          {title}
        </p>
        {desc && (
          <p
            style={{
              fontFamily: T.fontFamily,
              fontSize: T.size.xs,
              fontWeight: T.weight.medium,
              color: C.text,
              margin: 0,
            }}
          >
            {desc}
          </p>
        )}
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={item}
            placeholder={`${placeholder} ${idx + 1}`}
            onChange={(e) => onChange(idx, e.target.value)}
            style={baseInputStyle}
            onFocus={onFocusHandler}
            onBlur={onBlurHandler}
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80"
              style={{
                width: 40,
                height: 40,
                backgroundColor: C.dangerBg,
                borderRadius: "10px",
              }}
            >
              <MdClose style={{ width: 16, height: 16, color: C.danger }} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 h-10 border-2 border-dashed cursor-pointer transition-opacity hover:opacity-80"
        style={{
          backgroundColor: C.innerBg,
          borderColor: C.btnPrimary,
          color: C.btnPrimary,
          borderRadius: "10px",
          fontFamily: T.fontFamily,
          fontSize: T.size.base,
          fontWeight: T.weight.bold,
        }}
      >
        <MdAdd style={{ width: 16, height: 16 }} /> Add Item
      </button>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────
const BackBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
    style={{
      fontFamily: T.fontFamily,
      color: C.text,
      fontSize: T.size.base,
      fontWeight: T.weight.bold,
    }}
  >
    <MdChevronLeft style={{ width: 18, height: 18 }} /> Back
  </button>
);

const NextBtn = ({ onClick, label = "Next", disabled = false }) => (
  <button
    type={onClick ? "button" : "submit"}
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
    style={{
      background: C.gradientBtn,
      color: "#ffffff",
      borderRadius: "10px",
      boxShadow: S.btn,
      fontFamily: T.fontFamily,
      fontSize: T.size.base,
      fontWeight: T.weight.bold,
    }}
  >
    {label} <MdChevronRight style={{ width: 18, height: 18 }} />
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateCoursePage() {
  const router = useRouter();
  const { institute } = useInstitute();

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [categories, setCategories] = useState([]);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    level: "beginner",
    category: "",
    thumbnail: "",
    language: "English",
    duration: 0,
    visibility: "institute",
    audience: {
      scope: "institute",
      instituteId: null,
      batchIds: [],
      studentIds: [],
    },
    whatYouWillLearn: [""],
    requirements: [""],
  });

  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [modals, setModals] = useState({
    module: false,
    lesson: false,
    assignment: false,
  });
  const [activeModuleId, setActiveModuleId] = useState(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForm, setLessonForm] = useState(createDefaultLessonForm);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    totalMarks: 100,
  });
  const [assignmentFiles, setAssignmentFiles] = useState([]);
  const [uploadType, setUploadType] = useState(null); // null, 'hls', 'standard'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showHlsInfo, setShowHlsInfo] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCourseData((prev) => {
      const nextAudience = {
        ...prev.audience,
        instituteId: prev.audience?.instituteId || institute?._id || null,
      };
      return {
        ...prev,
        audience: nextAudience,
        visibility: nextAudience.scope === "global" ? "public" : "institute",
      };
    });
  }, [institute?._id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res?.data?.success)
        setCategories(res.data.categories || res.data.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCourseData((prev) => ({ ...prev, thumbnail: previewUrl }));
    setIsUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data?.imageUrl || res.data?.url;
      if (!uploadedUrl) throw new Error("Upload response missing image URL");
      setCourseData((prev) => ({ ...prev, thumbnail: uploadedUrl }));
      toast.success("Thumbnail uploaded");
    } catch (error) {
      setCourseData((prev) => ({ ...prev, thumbnail: "" }));
      toast.error(
        error?.response?.data?.message || "Failed to upload thumbnail",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploadingThumbnail(false);
    }
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (isUploadingThumbnail)
      return toast.error("Please wait for thumbnail upload to finish");
    if (
      !courseData.title ||
      !courseData.description ||
      !courseData.category ||
      !courseData.price
    )
      return toast.error("Please fill in all required fields");
    setLoading(true);
    try {
      const payload = {
        title: courseData.title,
        description: courseData.description,
        price: Number(courseData.price),
        level: courseData.level,
        categoryId: courseData.category,
        thumbnail: courseData.thumbnail,
        language: courseData.language,
        duration: Number(courseData.duration),
        visibility:
          courseData.audience?.scope === "global" ? "public" : "institute",
        audience: {
          ...courseData.audience,
          instituteId:
            courseData.audience?.instituteId || institute?._id || null,
        },
        scope: courseData.audience?.scope,
        whatYouWillLearn: courseData.whatYouWillLearn.filter(
          (i) => i.trim() !== "",
        ),
        requirements: courseData.requirements.filter((i) => i.trim() !== ""),
        status: "draft",
      };
      if (courseId) {
        await api.patch(`/courses/${courseId}`, payload);
        toast.success("Course info updated!");
        setStep(2);
      } else {
        const res = await api.post("/courses", payload);
        if (res?.data?.success) {
          setCourseId(res.data.course._id);
          toast.success("Course draft created! Now add curriculum.");
          setStep(2);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save course info");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setLoading(true);
    try {
      const updatedModules = [...modules, { title: moduleTitle }];
      await api.patch(`/courses/${courseId}`, { modules: updatedModules });
      const res = await api.get(`/courses/${courseId}`);
      if (res?.data?.success) setModules(res.data.course.modules);
      setModals({ ...modals, module: false });
      setModuleTitle("");
      toast.success("Module added");
    } catch {
      toast.error("Failed to add module");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title || !activeModuleId) return;
    setLoading(true);
    try {
      let attachments = Array.isArray(lessonForm.attachments)
        ? lessonForm.attachments
        : [];
      const content = { attachments };
      if (lessonForm.type === "video") {
        content.videoUrl = lessonForm.videoUrl;
        content.duration = Number(lessonForm.duration) * 60;
      } else if (lessonForm.type === "document") {
        content.documents = lessonForm.documents;
        content.duration = Number(lessonForm.duration) * 60 || 0;
      } else if (lessonForm.type === "quiz") {
        content.quiz = {
          ...lessonForm.quiz,
          timeLimit: lessonForm.quiz.timeLimit
            ? Number(lessonForm.quiz.timeLimit)
            : null,
        };
        content.duration = Number(lessonForm.duration) * 60 || 0;
      }
      const payload = {
        courseId,
        moduleId: activeModuleId,
        title: lessonForm.title,
        description: lessonForm.description,
        type: lessonForm.type,
        content,
        isFree: lessonForm.isFree,
      };
      const res = await api.post("/lessons", payload);
      if (res?.data?.success) {
        setLessons((prev) => [...prev, res.data.lesson]);
        setModals({ ...modals, lesson: false });
        setLessonForm(createDefaultLessonForm());
        toast.success("Lesson added");
      }
    } catch {
      toast.error("Failed to add lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/upload/file", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success || res.data?.fileUrl) {
        setLessonForm((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              name: res.data.name || file.name,
              url: res.data.fileUrl || res.data.url,
              type: res.data.type || file.type,
            },
          ],
        }));
        toast.success("File uploaded");
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      e.target.value = "";
    }
  };

  const handleLessonDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/upload/file", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success || res.data?.fileUrl) {
        setLessonForm((prev) => ({
          ...prev,
          documents: [
            ...prev.documents,
            {
              name: res.data.name || file.name,
              url: res.data.fileUrl || res.data.url,
              type: res.data.type || file.type,
            },
          ],
        }));
        toast.success("Document uploaded");
      }
    } catch {
      toast.error("Failed to upload document");
    } finally {
      e.target.value = "";
    }
  };

  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resolveUrl = (raw) => {
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
        .replace(/\/api\/?$/, "")
        .replace(/\/+$/, "");
      return base ? `${base}${raw.startsWith("/") ? "" : "/"}${raw}` : raw;
    };
    
    // Auto-detect duration
    const durSecs = await getVideoDuration(file);
    const durMins = Math.round(durSecs / 60) || 1;
    
    setUploadType("hls");
    setUploadProgress(0);
    const isPersonal = courseData.audience?.scope === "global" || !courseData.audience?.instituteId;
    
    try {
      // Get Cloudinary upload signature from backend for HLS type
      const sigRes = await api.post('/upload/cloudinary-signature', {
        type: 'hls',
        isPersonal
      });
      if (!sigRes.data.success) {
        throw new Error('Failed to obtain HLS upload signature');
      }
      const { signature, timestamp, cloudName, apiKey, folder, eager, eager_async } = sigRes.data;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp);
      fd.append('signature', signature);
      fd.append('folder', folder);
      fd.append('eager', eager);
      fd.append('eager_async', eager_async ? 'true' : 'false');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      
      const res = await axios.post(uploadUrl, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.data?.public_id) {
        const playlistUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/${res.data.public_id}.m3u8`;
        setLessonForm((prev) => ({
          ...prev,
          videoUrl: resolveUrl(playlistUrl),
          duration: durMins.toString(),
        }));
        toast.success("Video uploaded directly to Cloudinary and is processing for HLS! 🚀");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "";
      toast.error(msg || "Failed to upload video");
    } finally {
      setUploadType(null);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleLessonVideoUploadStandard = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Auto-detect duration
    const durSecs = await getVideoDuration(file);
    const durMins = Math.round(durSecs / 60) || 1;
    
    setUploadType("standard");
    setUploadProgress(0);
    try {
      // Get Cloudinary upload signature from our backend
      const sigRes = await api.post('/upload/cloudinary-signature');
      if (!sigRes.data.success) {
        throw new Error('Failed to obtain upload signature');
      }
      const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp);
      fd.append('signature', signature);
      fd.append('folder', folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const res = await axios.post(uploadUrl, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.data?.secure_url || res.data?.url) {
        const fileUrl = res.data.secure_url || res.data.url;
        setLessonForm((prev) => ({
          ...prev,
          videoUrl: fileUrl,
          duration: durMins.toString(),
        }));
        toast.success("Video uploaded (standard mode).");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "";
      toast.error(msg || "Failed to upload standard video");
    } finally {
      setUploadType(null);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) return;
    setLoading(true);
    try {
      const uploadedAttachments = [];
      if (assignmentFiles.length > 0) {
        for (const file of assignmentFiles) {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/upload/file", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (res.data?.fileUrl || res.data?.url) {
            uploadedAttachments.push({
              name: res.data.name || file.name,
              url: res.data.fileUrl || res.data.url,
              type: res.data.type || file.type,
            });
          }
        }
      }
      const payload = {
        courseId,
        title: assignmentForm.title,
        description: assignmentForm.description,
        totalMarks: Number(assignmentForm.totalMarks),
        status: "published",
        attachments: uploadedAttachments,
        audience: {
          scope: courseData.audience?.scope,
          instituteId: institute?._id || null,
        },
      };
      const res = await api.post("/assignments", payload);
      if (res?.data?.success) {
        setAssignments((prev) => [...prev, res.data.assignment]);
        setModals({ ...modals, assignment: false });
        setAssignmentForm({ title: "", description: "", totalMarks: 100 });
        setAssignmentFiles([]);
        toast.success("Assignment added with attachments!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is too large (Max 20MB)`);
        return false;
      }
      return true;
    });
    setAssignmentFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };
  const removeAssignmentFile = (idx) =>
    setAssignmentFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Step 4 ────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/courses/${courseId}`, {
        status: "published",
      });
      if (res?.data?.success) {
        toast.success("Course Published Successfully! 🎉");
        router.push("/tutor/courses");
      }
    } catch {
      toast.error("Failed to publish course");
    } finally {
      setLoading(false);
    }
  };

  // ── List helpers ──────────────────────────────────────────────────────────
  const learnList = {
    onChange: (idx, val) =>
      setCourseData((prev) => {
        const u = [...prev.whatYouWillLearn];
        u[idx] = val;
        return { ...prev, whatYouWillLearn: u };
      }),
    add: () =>
      setCourseData((prev) => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, ""],
      })),
    remove: (idx) =>
      setCourseData((prev) => ({
        ...prev,
        whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== idx),
      })),
  };
  const reqList = {
    onChange: (idx, val) =>
      setCourseData((prev) => {
        const u = [...prev.requirements];
        u[idx] = val;
        return { ...prev, requirements: u };
      }),
    add: () =>
      setCourseData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, ""],
      })),
    remove: (idx) =>
      setCourseData((prev) => ({
        ...prev,
        requirements: prev.requirements.filter((_, i) => i !== idx),
      })),
  };

  // ── Shared modal card style ───────────────────────────────────────────────
  const modalCard = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    boxShadow: S.cardHover,
    borderRadius: R["2xl"],
  };

  const sectionCard = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    boxShadow: S.card,
    borderRadius: R["2xl"],
  };

  return (
    <div
      className="w-full min-h-screen pb-24"
      style={{
        backgroundColor: C.pageBg,
        fontFamily: T.fontFamily,
        color: C.text,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-5 p-6">
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 p-5" style={sectionCard}>
          <Link href="/tutor/courses">
            <button
              className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
              style={{
                width: 40,
                height: 40,
                backgroundColor: C.innerBg,
                borderRadius: "10px",
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <MdArrowBack
                style={{ width: 18, height: 18, color: C.heading }}
              />
            </button>
          </Link>
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
          >
            <MdMenuBook style={{ width: 20, height: 20, color: C.iconColor }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size["2xl"],
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 2px 0",
                lineHeight: T.leading.tight,
              }}
            >
              Course Wizard
            </h1>
            <p
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.base,
                fontWeight: T.weight.medium,
                color: C.text,
                margin: 0,
              }}
            >
              Create and structure your entire course in one place.
            </p>
          </div>
        </div>

        <StepBar current={step} />

        {/* ══════════════════════════════════════════════════════════
                    STEP 1: COURSE INFO
                ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <form
            onSubmit={handleStep1Submit}
            className="p-6 space-y-6"
            style={sectionCard}
          >
            {/* Title */}
            <div className="space-y-2">
              <label
                style={{
                  display: "block",
                  fontFamily: T.fontFamily,
                  fontSize: T.size.xs,
                  fontWeight: T.weight.bold,
                  color: C.text,
                  textTransform: "uppercase",
                  letterSpacing: T.tracking.wider,
                }}
              >
                Course Title *
              </label>
              <input
                name="title"
                required
                value={courseData.title}
                onChange={handleDataChange}
                placeholder="e.g. Master React in 30 Days"
                style={baseInputStyle}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={courseData.category}
                  onChange={handleDataChange}
                  style={baseInputStyle}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Price (₹) *
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  required
                  value={courseData.price}
                  onChange={handleDataChange}
                  placeholder="0.00"
                  style={baseInputStyle}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                style={{
                  display: "block",
                  fontFamily: T.fontFamily,
                  fontSize: T.size.xs,
                  fontWeight: T.weight.bold,
                  color: C.text,
                  textTransform: "uppercase",
                  letterSpacing: T.tracking.wider,
                }}
              >
                Course Summary *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={courseData.description}
                onChange={handleDataChange}
                placeholder="Provide a brief summary for your course..."
                style={{
                  ...baseInputStyle,
                  resize: "vertical",
                  minHeight: "100px",
                }}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />
            </div>

            <ThumbnailUpload
              value={courseData.thumbnail}
              onFileSelect={handleThumbnailUpload}
              uploading={isUploadingThumbnail}
            />

            {/* Level + Language + Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Difficulty Level
                </label>
                <select
                  name="level"
                  value={courseData.level}
                  onChange={handleDataChange}
                  style={baseInputStyle}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Language
                </label>
                <input
                  name="language"
                  value={courseData.language}
                  onChange={handleDataChange}
                  placeholder="English"
                  style={baseInputStyle}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                />
              </div>
              <div className="space-y-2">
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                  }}
                >
                  Duration (mins)
                </label>
                <input
                  name="duration"
                  type="number"
                  min="0"
                  value={courseData.duration}
                  onChange={handleDataChange}
                  placeholder="0"
                  style={baseInputStyle}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                />
              </div>
            </div>

            {/* What You'll Learn */}
            <div
              className="pt-5"
              style={{ borderTop: `1px solid ${C.cardBorder}` }}
            >
              <ListFieldSection
                title="What Students Will Learn"
                items={courseData.whatYouWillLearn}
                onAdd={learnList.add}
                onRemove={learnList.remove}
                onChange={learnList.onChange}
                placeholder="Learning outcome"
              />
            </div>

            {/* Requirements */}
            <div
              className="pt-5"
              style={{ borderTop: `1px solid ${C.cardBorder}` }}
            >
              <ListFieldSection
                title="Prerequisites & Requirements"
                items={courseData.requirements}
                onAdd={reqList.add}
                onRemove={reqList.remove}
                onChange={reqList.onChange}
                placeholder="Requirement"
              />
            </div>
            <div
              className="pt-5"
              style={{ borderTop: `1px solid ${C.cardBorder}` }}
            >
              <label
                style={{
                  display: "block",
                  fontFamily: T.fontFamily,
                  fontSize: T.size.xs,
                  fontWeight: T.weight.bold,
                  color: C.text,
                  textTransform: "uppercase",
                  letterSpacing: T.tracking.wider,
                  marginBottom: "12px",
                }}
              >
                Course Visibility & Access *
              </label>
              <AudienceSelector
                value={courseData.audience}
                onChange={(newAudience) =>
                  setCourseData((prev) => ({ ...prev, audience: newAudience }))
                }
                hideBatchOption={true}  
              />
            </div>
            {/* Submit */}
            <div
              className="flex justify-end pt-4"
              style={{ borderTop: `1px solid ${C.cardBorder}` }}
            >
              <button
                type="submit"
                disabled={loading || isUploadingThumbnail}
                className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  background: C.gradientBtn,
                  color: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: S.btn,
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                }}
              >
                {loading || isUploadingThumbnail ? (
                  <>
                    <MdHourglassEmpty
                      style={{ width: 16, height: 16 }}
                      className="animate-spin"
                    />{" "}
                    Saving…
                  </>
                ) : (
                  <>
                    Save & Next{" "}
                    <MdChevronRight style={{ width: 18, height: 18 }} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════
                    STEP 2: CURRICULUM
                ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Header card */}
            <div
              className="p-5 flex items-center justify-between"
              style={sectionCard}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                >
                  <MdMenuBook
                    style={{ width: 20, height: 20, color: C.iconColor }}
                  />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xl,
                      fontWeight: T.weight.semibold,
                      color: C.heading,
                      margin: "0 0 2px 0",
                    }}
                  >
                    Build Curriculum
                  </h2>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    Organize your course into modules and lessons.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModals({ ...modals, module: true })}
                className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: C.btnPrimary,
                  color: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: S.btn,
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                }}
              >
                <MdAdd style={{ width: 18, height: 18 }} /> Add Module
              </button>
            </div>

            {/* Empty */}
            {modules.length === 0 ? (
              <div
                className="text-center py-16 border-2 border-dashed"
                style={{
                  backgroundColor: C.cardBg,
                  borderColor: C.cardBorder,
                  borderRadius: R["2xl"],
                }}
              >
                <MdMenuBook
                  style={{
                    width: 36,
                    height: 36,
                    color: C.text,
                    opacity: 0.25,
                    margin: "0 auto 12px",
                  }}
                />
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.lg,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    margin: "0 0 4px 0",
                  }}
                >
                  No Modules Yet
                </p>
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  Start by adding your first module.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((mod, idx) => {
                  const modLessons = lessons.filter(
                    (l) => l.moduleId === mod._id,
                  );
                  return (
                    <div
                      key={mod._id}
                      className="overflow-hidden"
                      style={sectionCard}
                    >
                      {/* Module header */}
                      <div
                        className="p-4 flex items-center justify-between"
                        style={{
                          backgroundColor: C.innerBg,
                          borderBottom: `1px solid ${C.cardBorder}`,
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.md,
                            fontWeight: T.weight.semibold,
                            color: C.heading,
                            margin: 0,
                          }}
                        >
                          Module {idx + 1}: {mod.title}
                        </h3>
                        <button
                          onClick={() => {
                            setActiveModuleId(mod._id);
                            setLessonForm(createDefaultLessonForm());
                            setModals({ ...modals, lesson: true });
                          }}
                          className="flex items-center justify-center gap-1.5 h-8 px-3 cursor-pointer border-none transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: C.cardBg,
                            color: C.btnPrimary,
                            borderRadius: "10px",
                            border: `1px solid ${C.cardBorder}`,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                          }}
                        >
                          <MdAdd style={{ width: 14, height: 14 }} /> Add Lesson
                        </button>
                      </div>
                      {/* Lessons */}
                      <div className="p-4 space-y-2">
                        {modLessons.length === 0 ? (
                          <p
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              color: C.text,
                              margin: 0,
                              fontStyle: "italic",
                            }}
                          >
                            No lessons in this module.
                          </p>
                        ) : (
                          modLessons.map((les, lIdx) => (
                            <div
                              key={les._id}
                              className="flex items-center gap-3 p-3"
                              style={{
                                backgroundColor: C.innerBg,
                                borderRadius: "10px",
                                border: `1px solid ${C.cardBorder}`,
                              }}
                            >
                              <MdVideocam
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: C.btnPrimary,
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
                                {lIdx + 1}. {les.title}
                              </span>
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontFamily: T.fontFamily,
                                  fontSize: T.size.xs,
                                  backgroundColor: C.cardBg,
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  color: C.text,
                                  fontWeight: T.weight.semibold,
                                  border: `1px solid ${C.cardBorder}`,
                                }}
                              >
                                {les.type}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <BackBtn onClick={() => setStep(1)} />
              <NextBtn onClick={() => setStep(3)} label="Next: Assignments" />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
                    STEP 3: ASSIGNMENTS
                ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Header card */}
            <div
              className="p-5 flex items-center justify-between"
              style={sectionCard}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                >
                  <MdOutlineAssignment
                    style={{ width: 20, height: 20, color: C.iconColor }}
                  />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xl,
                      fontWeight: T.weight.semibold,
                      color: C.heading,
                      margin: "0 0 2px 0",
                    }}
                  >
                    Course Assignments
                  </h2>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    Add assignments to test student knowledge.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModals({ ...modals, assignment: true })}
                className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: C.btnPrimary,
                  color: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: S.btn,
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  fontWeight: T.weight.bold,
                }}
              >
                <MdAdd style={{ width: 18, height: 18 }} /> Add Assignment
              </button>
            </div>

            {/* Empty */}
            {assignments.length === 0 ? (
              <div
                className="text-center py-16 border-2 border-dashed"
                style={{
                  backgroundColor: C.cardBg,
                  borderColor: C.cardBorder,
                  borderRadius: R["2xl"],
                }}
              >
                <MdArticle
                  style={{
                    width: 36,
                    height: 36,
                    color: C.text,
                    opacity: 0.25,
                    margin: "0 auto 12px",
                  }}
                />
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.lg,
                    fontWeight: T.weight.bold,
                    color: C.heading,
                    margin: "0 0 4px 0",
                  }}
                >
                  No Assignments Yet
                </p>
                <p
                  style={{
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  Optional: Add assignments or skip to publish.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assign) => (
                  <div
                    key={assign._id}
                    className="p-4 flex items-center gap-4"
                    style={{ ...sectionCard }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: C.innerBg,
                        borderRadius: "10px",
                      }}
                    >
                      <MdArticle
                        style={{ width: 18, height: 18, color: C.btnPrimary }}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.md,
                          fontWeight: T.weight.semibold,
                          color: C.heading,
                          margin: "0 0 2px 0",
                        }}
                      >
                        {assign.title}
                      </p>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          color: C.text,
                          margin: 0,
                        }}
                      >
                        {assign.totalMarks} Points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <BackBtn onClick={() => setStep(2)} />
              <NextBtn onClick={() => setStep(4)} label="Next: Publish" />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
                    STEP 4: PUBLISH
                ══════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="p-10 text-center" style={sectionCard}>
              {/* Rocket Icon */}
              <div
                className="flex items-center justify-center mx-auto mb-6"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: C.successBg,
                  borderRadius: R.full,
                  border: `4px solid ${C.cardBg}`,
                  boxShadow: S.card,
                }}
              >
                <MdRocketLaunch
                  style={{ width: 36, height: 36, color: C.success }}
                />
              </div>

              <h2
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size["2xl"],
                  fontWeight: T.weight.bold,
                  color: C.heading,
                  margin: "0 0 8px 0",
                }}
              >
                You're almost there!
              </h2>
              <p
                style={{
                  fontFamily: T.fontFamily,
                  fontSize: T.size.base,
                  color: C.text,
                  margin: "0 auto 24px",
                  maxWidth: 400,
                  lineHeight: T.leading.relaxed,
                }}
              >
                Your course draft is saved. Review your curriculum and publish
                it when you're ready to go live.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                {[
                  { label: "Modules", value: modules.length },
                  { label: "Lessons", value: lessons.length },
                  { label: "Assignments", value: assignments.length },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="p-4"
                    style={{
                      backgroundColor: C.innerBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderRadius: "10px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size.xs,
                        fontWeight: T.weight.bold,
                        color: C.text,
                        textTransform: "uppercase",
                        letterSpacing: T.tracking.wider,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: T.fontFamily,
                        fontSize: T.size["2xl"],
                        fontWeight: T.weight.bold,
                        color: C.heading,
                        margin: 0,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                <BackBtn onClick={() => setStep(3)} />
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 h-12 px-10 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: C.success,
                    color: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: `0 4px 14px ${C.success}40`,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  {loading ? (
                    <>
                      <MdHourglassEmpty
                        style={{ width: 18, height: 18 }}
                        className="animate-spin"
                      />{" "}
                      Publishing…
                    </>
                  ) : (
                    <>
                      <MdRocketLaunch style={{ width: 18, height: 18 }} />{" "}
                      Publish Course
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════════════════════ */}

      {/* Add Module Modal */}
      {modals.module && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(21,22,86,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="w-full max-w-md p-6" style={modalCard}>
            <h3
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.lg,
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 16px 0",
              }}
            >
              Add Module
            </h3>
            <form onSubmit={handleAddModule} className="space-y-4">
              <input
                type="text"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                required
                placeholder="Module Title (e.g. Basics of React)"
                style={baseInputStyle}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                autoFocus
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModals({ ...modals, module: false })}
                  className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70"
                  style={{
                    fontFamily: T.fontFamily,
                    color: C.text,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !moduleTitle}
                  className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: C.gradientBtn,
                    color: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: S.btn,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  {loading ? (
                    <MdHourglassEmpty
                      style={{ width: 16, height: 16 }}
                      className="animate-spin"
                    />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {modals.lesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(21,22,86,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            style={modalCard}
          >
            <h3
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.lg,
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 16px 0",
              }}
            >
              Add Lesson
            </h3>
            <form onSubmit={handleAddLesson} className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {["video", "document", "quiz"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLessonForm((prev) => ({ ...prev, type }))}
                    className="py-2.5 capitalize cursor-pointer transition-all"
                    style={
                      lessonForm.type === type
                        ? {
                            borderRadius: "10px",
                            border: `2px solid ${C.btnPrimary}`,
                            backgroundColor: C.innerBg,
                            color: C.btnPrimary,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                          }
                        : {
                            borderRadius: "10px",
                            border: `2px solid ${C.cardBorder}`,
                            backgroundColor: C.cardBg,
                            color: C.text,
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.medium,
                          }
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                placeholder="Lesson Title"
                style={baseInputStyle}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                autoFocus
              />
              <textarea
                rows={3}
                value={lessonForm.description}
                onChange={(e) =>
                  setLessonForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Briefly describe what students will learn..."
                style={{ ...baseInputStyle, resize: "none" }}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />

              {/* Attachments */}
              <div
                className="border-t pt-4"
                style={{ borderColor: C.cardBorder }}
              >
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                    marginBottom: 8,
                  }}
                >
                  Resources & Attachments
                </label>
                {lessonForm.attachments.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {lessonForm.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: "10px",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MdArticle
                            style={{
                              width: 14,
                              height: 14,
                              color: C.btnPrimary,
                              flexShrink: 0,
                            }}
                          />
                          <div className="min-w-0">
                            <p
                              className="truncate m-0"
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: C.heading,
                              }}
                            >
                              {file.name}
                            </p>
                            <p
                              className="m-0"
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                color: C.text,
                                textTransform: "uppercase",
                              }}
                            >
                              {file.type?.split("/")[1] || "File"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setLessonForm((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "8px",
                            backgroundColor: C.dangerBg,
                            color: C.danger,
                          }}
                        >
                          <MdClose style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleLessonFileUpload}
                  className="hidden"
                  id="tutor-lesson-resource-upload"
                />
                <label
                  htmlFor="tutor-lesson-resource-upload"
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed cursor-pointer transition-all"
                  style={{
                    borderColor: C.btnPrimary,
                    color: C.btnPrimary,
                    backgroundColor: C.innerBg,
                    borderRadius: "10px",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.semibold,
                  }}
                >
                  <MdAdd style={{ width: 14, height: 14 }} /> Upload Resource
                </label>
              </div>

              {/* Video */}
              {lessonForm.type === "video" && (
                <div className="space-y-3">
                  {lessonForm.videoUrl ? (
                    <div className="space-y-3 p-4 rounded-xl border" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                            <MdVideocam style={{ width: 18, height: 18 }} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="m-0 font-bold" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading }}>
                              {lessonForm.videoUrl.includes('.m3u8') 
                                ? '🔒 Secure HLS Playlist' 
                                : getYouTubeId(lessonForm.videoUrl) 
                                  ? '📺 YouTube Video Link' 
                                  : '📹 Standard Video File'}
                            </h5>
                            <p className="m-0 text-[10px] text-gray-400 truncate" style={{ maxWidth: '280px' }} title={lessonForm.videoUrl}>
                              {lessonForm.videoUrl}
                            </p>
                          </div>
                        </div>
                        <button type="button" 
                          onClick={() => setLessonForm(prev => ({ ...prev, videoUrl: '' }))}
                          className="flex items-center justify-center border-none cursor-pointer transition-colors p-1.5 shrink-0"
                          style={{ borderRadius: '8px', backgroundColor: C.dangerBg, color: C.danger }}
                        >
                          <MdDelete style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                      
                      {lessonForm.videoUrl.includes('.m3u8') ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-lg bg-gray-50/50">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                            <MdCheckCircle style={{ width: 16, height: 16 }} />
                          </div>
                          <p className="m-0 font-bold text-[11px] text-emerald-700">AES-128 HLS Transcoding Active</p>
                          <p className="m-0 text-[9px] text-gray-400">Stream will play securely in student portal player.</p>
                        </div>
                      ) : getYouTubeId(lessonForm.videoUrl) ? (
                        <div className="rounded-lg overflow-hidden border" style={{ height: '140px' }}>
                          <iframe 
                            src={`https://www.youtube.com/embed/${getYouTubeId(lessonForm.videoUrl)}`} 
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
                            allowFullScreen 
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-lg overflow-hidden border">
                            <video src={lessonForm.videoUrl && lessonForm.videoUrl.includes('/uploads/') && typeof window !== 'undefined' ? `${lessonForm.videoUrl}${lessonForm.videoUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(localStorage.getItem('token') || '')}` : lessonForm.videoUrl} controls 
                              onLoadedMetadata={(e) => {
                                const secs = e.target.duration;
                                if (secs) {
                                  const mins = Math.round(secs / 60) || 1;
                                  setLessonForm(prev => ({ ...prev, duration: mins.toString() }));
                                }
                              }}
                              style={{ width: '100%', maxHeight: '140px', display: 'block' }} />
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-emerald-50/30" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <MdCheckCircle style={{ width: 14, height: 14, color: '#10B981' }} />
                            <div>
                              <p className="m-0 font-bold text-[10px]" style={{ color: '#047857', fontFamily: T.fontFamily }}>Standard Video Active</p>
                              <p className="m-0 text-[8px] text-gray-400" style={{ fontFamily: T.fontFamily }}>Standard direct loading enabled for this lesson.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* HLS Video Upload Option (Gated) */}
                        <div>
                          <input type="file" onChange={handleLessonVideoUpload} accept="video/mp4,video/x-m4v,video/*"
                            className="hidden" id="video-upload-hls" disabled={uploadType !== null} />
                          <FeatureGate featureName="hlsStreaming" mode="lock" isPersonal={courseData.audience?.scope === "global" || !courseData.audience?.instituteId}>
                            <label htmlFor="video-upload-hls"
                              className={`flex items-center justify-center gap-2 w-full border-2 border-dashed ${uploadType !== null ? 'cursor-wait' : 'cursor-pointer'} transition-all`}
                              style={{ 
                                position: 'relative',
                                overflow: 'hidden',
                                padding: '12px 0', 
                                borderColor: C.btnPrimary, 
                                color: C.btnPrimary, 
                                backgroundColor: (C.btnViewAllBg || '#EEF2F6'), 
                                fontFamily: T.fontFamily, 
                                fontSize: T.size.sm, 
                                fontWeight: T.weight.semibold, 
                                borderRadius: '10px' 
                              }}>
                              {uploadType === 'hls' && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  width: `${uploadProgress}%`,
                                  backgroundColor: `${C.btnPrimary}25`,
                                  zIndex: 0,
                                  transition: 'width 0.1s ease-out',
                                }} />
                              )}
                              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {uploadType === 'hls'
                                  ? <><div className="rounded-full border-2 animate-spin" style={{ width: 14, height: 14, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} /> Uploading {uploadProgress}%</>
                                  : <><MdVideocam style={{ width: 16, height: 16 }} /> Secure HLS Video</>}
                              </span>
                            </label>
                          </FeatureGate>
                          <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.text, marginTop: '4px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            Encrypted streaming (Premium)
                            <span onClick={() => setShowHlsInfo(true)} style={{ color: C.btnPrimary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} title="What is HLS Security?">
                              <MdHelpOutline style={{ width: 12, height: 12 }} />
                            </span>
                          </p>
                        </div>

                        {/* Standard Video Upload Option (Always Unlocked) */}
                        <div>
                          <input type="file" onChange={handleLessonVideoUploadStandard} accept="video/mp4,video/x-m4v,video/*"
                            className="hidden" id="video-upload-standard" disabled={uploadType !== null} />
                          <label htmlFor="video-upload-standard"
                            className={`flex items-center justify-center gap-2 w-full border-2 border-dashed ${uploadType !== null ? 'cursor-wait' : 'cursor-pointer'} transition-all`}
                            style={{ 
                              position: 'relative',
                              overflow: 'hidden',
                              padding: '12px 0', 
                              borderColor: uploadType === 'standard' ? C.btnPrimary : C.cardBorder, 
                              color: uploadType === 'standard' ? C.btnPrimary : C.heading, 
                              backgroundColor: C.innerBg, 
                              fontFamily: T.fontFamily, 
                              fontSize: T.size.sm, 
                              fontWeight: T.weight.semibold, 
                              borderRadius: '10px' 
                            }}>
                            {uploadType === 'standard' && (
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: `${uploadProgress}%`,
                                backgroundColor: `${C.btnPrimary}25`,
                                zIndex: 0,
                                transition: 'width 0.1s ease-out',
                              }} />
                            )}
                            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {uploadType === 'standard'
                                ? <><div className="rounded-full border-2 animate-spin" style={{ width: 14, height: 14, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} /> Uploading {uploadProgress}%</>
                                : <><MdVideocam style={{ width: 16, height: 16, color: C.text }} /> Standard Video</>}
                            </span>
                          </label>
                          <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.text, marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                            Direct MP4 load (Free)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3"
                        style={{ color: C.text, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <div style={{ height: 1, flex: 1, backgroundColor: C.cardBorder }} />
                        or paste URL
                        <div style={{ height: 1, flex: 1, backgroundColor: C.cardBorder }} />
                      </div>

                      <input type="url" value={lessonForm.videoUrl}
                        onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://example.com/video.mp4"
                        style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                      <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, margin: 0 }}>
                        Direct video link or YouTube URL
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Document */}
              {lessonForm.type === "document" && (
                <div className="space-y-3">
                  {lessonForm.documents.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {lessonForm.documents.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5"
                          style={{
                            backgroundColor: C.innerBg,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: "10px",
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MdArticle
                              style={{
                                width: 14,
                                height: 14,
                                color: C.warning,
                                flexShrink: 0,
                              }}
                            />
                            <p
                              className="truncate m-0"
                              style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: C.heading,
                              }}
                            >
                              {file.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLessonForm((prev) => ({
                                ...prev,
                                documents: prev.documents.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "8px",
                              backgroundColor: C.dangerBg,
                              color: C.danger,
                            }}
                          >
                            <MdClose style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleLessonDocumentUpload}
                    className="hidden"
                    id="tutor-lesson-doc-upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                  <label
                    htmlFor="tutor-lesson-doc-upload"
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      borderColor: C.warningBorder,
                      backgroundColor: C.warningBg,
                      color: C.warning,
                      borderRadius: "10px",
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.semibold,
                    }}
                  >
                    <MdUpload style={{ width: 14, height: 14 }} /> Upload
                    Document
                  </label>
                </div>
              )}

              {/* Quiz */}
              {lessonForm.type === "quiz" && (
                <div
                  className="p-4 text-center"
                  style={{
                    backgroundColor: C.innerBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: "10px",
                  }}
                >
                  <MdWarning
                    style={{
                      width: 20,
                      height: 20,
                      color: C.btnPrimary,
                      margin: "0 auto 8px",
                    }}
                  />
                  <h4
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.base,
                      fontWeight: T.weight.bold,
                      color: C.heading,
                      margin: 0,
                    }}
                  >
                    Quiz Builder
                  </h4>
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      color: C.text,
                      margin: "4px 0 14px 0",
                    }}
                  >
                    Questions are managed in the Quiz Builder after creation.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      {
                        label: "Passing Score (%)",
                        key: "passingScore",
                        placeholder: "70",
                      },
                      {
                        label: "Time Limit (mins)",
                        key: "timeLimit",
                        placeholder: "No limit",
                      },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label
                          style={{
                            display: "block",
                            fontFamily: T.fontFamily,
                            fontSize: T.size.xs,
                            fontWeight: T.weight.bold,
                            color: C.text,
                            textTransform: "uppercase",
                            letterSpacing: T.tracking.wider,
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          type="number"
                          placeholder={placeholder}
                          value={lessonForm.quiz?.[key] || ""}
                          onChange={(e) =>
                            setLessonForm((prev) => ({
                              ...prev,
                              quiz: { ...prev.quiz, [key]: e.target.value },
                            }))
                          }
                          style={{ ...baseInputStyle, padding: "8px 12px" }}
                          onFocus={onFocusHandler}
                          onBlur={onBlurHandler}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration + Free preview */}
              {lessonForm.type !== "quiz" && (
                <>
                  {lessonForm.type !== "video" && (
                    <input
                      type="number"
                      value={lessonForm.duration}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="Duration (minutes)"
                      style={baseInputStyle}
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                    />
                  )}
                  <label
                    className="flex items-center gap-3 p-3.5 cursor-pointer"
                    style={{ backgroundColor: C.innerBg, borderRadius: "10px" }}
                  >
                    <input
                      type="checkbox"
                      checked={lessonForm.isFree}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          isFree: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded"
                      style={{ accentColor: C.btnPrimary }}
                    />
                    <div>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.base,
                          fontWeight: T.weight.bold,
                          color: C.heading,
                          margin: 0,
                        }}
                      >
                        Free preview lesson
                      </p>
                      <p
                        style={{
                          fontFamily: T.fontFamily,
                          fontSize: T.size.xs,
                          color: C.text,
                          margin: 0,
                        }}
                      >
                        Students can watch this without enrolling
                      </p>
                    </div>
                  </label>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModals({ ...modals, lesson: false })}
                  className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70"
                  style={{
                    fontFamily: T.fontFamily,
                    color: C.text,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !lessonForm.title}
                  className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: C.gradientBtn,
                    color: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: S.btn,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  {loading ? (
                    <MdHourglassEmpty
                      style={{ width: 16, height: 16 }}
                      className="animate-spin"
                    />
                  ) : (
                    "Add Lesson"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {modals.assignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(21,22,86,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            style={modalCard}
          >
            <h3
              style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.lg,
                fontWeight: T.weight.bold,
                color: C.heading,
                margin: "0 0 16px 0",
              }}
            >
              Add Assignment
            </h3>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <input
                type="text"
                value={assignmentForm.title}
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    title: e.target.value,
                  })
                }
                required
                placeholder="Assignment Title"
                style={baseInputStyle}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                autoFocus
              />
              <textarea
                rows={3}
                value={assignmentForm.description}
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description & instructions..."
                style={{ ...baseInputStyle, resize: "none" }}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />
              <input
                type="number"
                value={assignmentForm.totalMarks}
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    totalMarks: e.target.value,
                  })
                }
                required
                placeholder="Total Marks"
                style={baseInputStyle}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
              />

              {/* File upload zone */}
              <div
                className="border-t pt-4"
                style={{ borderColor: C.cardBorder }}
              >
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                    color: C.text,
                    textTransform: "uppercase",
                    letterSpacing: T.tracking.wider,
                    marginBottom: 8,
                  }}
                >
                  Attach Reference Files
                </label>
                <div
                  className="border-2 border-dashed p-6 text-center cursor-pointer mb-4 transition-colors"
                  style={{
                    borderColor: C.cardBorder,
                    backgroundColor: C.innerBg,
                    borderRadius: "10px",
                  }}
                  onClick={() =>
                    document.getElementById("tutor-assignment-upload").click()
                  }
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={handleAssignmentFileUpload}
                    className="hidden"
                    id="tutor-assignment-upload"
                  />
                  <MdUpload
                    style={{
                      width: 24,
                      height: 24,
                      color: C.btnPrimary,
                      margin: "0 auto 8px",
                    }}
                  />
                  <p
                    style={{
                      fontFamily: T.fontFamily,
                      fontSize: T.size.xs,
                      fontWeight: T.weight.bold,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    Click to attach PDFs or Documents
                  </p>
                </div>
                {assignmentFiles.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {assignmentFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5"
                        style={{
                          backgroundColor: C.innerBg,
                          border: `1px solid ${C.cardBorder}`,
                          borderRadius: "10px",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MdArticle
                            style={{
                              width: 14,
                              height: 14,
                              color: C.btnPrimary,
                              flexShrink: 0,
                            }}
                          />
                          <p
                            className="truncate m-0"
                            style={{
                              fontFamily: T.fontFamily,
                              fontSize: T.size.xs,
                              fontWeight: T.weight.bold,
                              color: C.heading,
                            }}
                          >
                            {f.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAssignmentFile(i);
                          }}
                          className="flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "8px",
                            backgroundColor: C.dangerBg,
                            color: C.danger,
                          }}
                        >
                          <MdClose style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModals({ ...modals, assignment: false })}
                  className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70"
                  style={{
                    fontFamily: T.fontFamily,
                    color: C.text,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !assignmentForm.title}
                  className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: C.gradientBtn,
                    color: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: S.btn,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.base,
                    fontWeight: T.weight.bold,
                  }}
                >
                  {loading ? (
                    <MdHourglassEmpty
                      style={{ width: 16, height: 16 }}
                      className="animate-spin"
                    />
                  ) : (
                    "Save Assignment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ℹ️ HLS Comparison Modal */}
      {showHlsInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: `1px solid ${C.cardBorder}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '550px',
            width: '100%',
            overflow: 'hidden',
            fontFamily: T.fontFamily,
            animation: 'in 0.2s ease-out',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px',
              background: 'linear-gradient(135deg, #1e1b4b, #3b0764)',
              color: '#ffffff',
              position: 'relative',
            }}>
              <h3 style={{ margin: 0, fontSize: T.size.lg, fontWeight: T.weight.extrabold, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔒 Secure HLS Streaming vs Standard MP4
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: T.size.xs, opacity: 0.8, fontWeight: T.weight.medium }}>
                Why top academies use HLS to protect their content
              </p>
              <button onClick={() => setShowHlsInfo(false)} style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
              }}>
                <MdClose style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: T.size.sm, color: C.text, lineHeight: 1.6, marginBottom: '20px' }}>
                <strong>HLS (HTTP Live Streaming)</strong> with AES-128 Encryption splits your video into tiny encrypted chunks, blocking students from downloading and leaking your paid courses on social media.
              </div>

              {/* Comparison Table */}
              <div style={{
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '16px',
                overflow: 'hidden',
                fontSize: T.size.xs,
                marginBottom: '24px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', backgroundColor: C.innerBg, fontWeight: 'bold', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}`, color: C.heading }}>
                  <div>Feature</div>
                  <div style={{ color: C.text }}>Standard MP4</div>
                  <div style={{ color: C.btnPrimary }}>Secure HLS</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ fontWeight: 'bold', color: C.heading }}>Anti-Piracy (IDM Block)</div>
                  <div style={{ color: C.danger || '#EF4444' }}>❌ Easy Download</div>
                  <div style={{ color: '#10B981', fontWeight: 'bold' }}>✅ Fully Blocked</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ fontWeight: 'bold', color: C.heading }}>Adapt Bitrate (No Buffering)</div>
                  <div style={{ color: C.text }}>❌ High buffering</div>
                  <div style={{ color: '#10B981', fontWeight: 'bold' }}>✅ Smooth adjust</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ fontWeight: 'bold', color: C.heading }}>Link Sharing Block</div>
                  <div style={{ color: C.text }}>❌ Publicly shared</div>
                  <div style={{ color: '#10B981', fontWeight: 'bold' }}>✅ JWT Gated key</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '12px 16px' }}>
                  <div style={{ fontWeight: 'bold', color: C.heading }}>Loading Time</div>
                  <div style={{ color: C.text }}>Slow (Full load)</div>
                  <div style={{ color: '#10B981', fontWeight: 'bold' }}>⚡ Instant (5s chunks)</div>
                </div>
              </div>

              {/* Action / Upgrade Callout */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F5F3FF',
                border: '1px solid #DDD6FE',
                borderRadius: '16px',
                padding: '16px',
              }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: T.size.xs, color: '#4C1D95' }}>Protect your content today</p>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#6D28D9' }}>Upgrade your subscription to unlock industry standard HLS protection.</p>
                </div>
                <button onClick={() => setShowHlsInfo(false)} style={{
                  backgroundColor: '#7C3AED',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: S.btn,
                }}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
