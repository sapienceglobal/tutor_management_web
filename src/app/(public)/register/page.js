"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "student",
    inviteToken: "",
    registrationType: "independent",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get("invite");
    const email = urlParams.get("email");
    const name = urlParams.get("name");
    const role = urlParams.get("role");
    const otpRequiredParam = urlParams.get("otpRequired");

    if (inviteToken) {
      setFormData((prev) => ({
        ...prev,
        inviteToken,
        registrationType: "invite",
      }));

      if (email) setFormData((prev) => ({ ...prev, email }));
      if (name) setFormData((prev) => ({ ...prev, name }));
      if (role) setFormData((prev) => ({ ...prev, role }));
      if (otpRequiredParam === "true") setOtpRequired(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleRegistrationTypeSelect = (type) => {
    setFormData({ ...formData, registrationType: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.registrationType === "invite" && !formData.inviteToken) {
      setError("Invite token is required for invite-based registration.");
      return;
    }

    if (otpRequired) {
      await sendOtpForRegistration();
      return;
    }

    await performRegistration();
  };

  const sendOtpForRegistration = async () => {
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await api.post("/auth/send-otp", {
        email: formData.email,
        purpose: "invite-registration",
      });

      if (res.data?.success) {
        setShowOtpModal(true);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await api.post("/auth/verify-otp-and-register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        inviteToken: formData.inviteToken,
        otp: otp,
      });

      if (res.data?.success) {
        const { token, user } = res.data;

        Cookies.set("token", token, { expires: 7 });
        Cookies.set("user_role", user.role, { expires: 7 });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setShowOtpModal(false);
        setOtp("");
        await acceptInviteAndRedirect(user.role);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  const acceptInviteAndRedirect = async (role) => {
    if (role === "tutor") {
      router.push("/tutor/dashboard");
    } else {
      router.push("/student/dashboard");
    }
  };

  const performRegistration = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { confirmPassword, ...payload } = formData;
      let finalPayload;

      if (formData.registrationType === "independent") {
        finalPayload = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
          role: payload.role,
          registrationType: "independent",
        };
      } else {
        finalPayload = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
          role: payload.role,
          registrationType: "invite",
          inviteToken: payload.inviteToken,
        };
      }

      const response = await api.post("/auth/register", finalPayload);
      const { token, user } = response.data;

      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user_role", user.role, { expires: 7 });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "tutor") {
        router.push("/tutor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-500/20 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-5xl p-4 lg:p-8">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[600px]">
          
          {/* Left Brand */}
          <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-wide">Sapience LMS</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight mb-5">
                Start your learning journey today.
              </h2>
              <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
                Join thousands of students and expert tutors in a community dedicated to academic excellence.
              </p>
            </div>

            <div className="relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-teal-300">10k+</div>
                    <div className="text-sm text-indigo-100 mt-1">Active Students</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-300">500+</div>
                    <div className="text-sm text-indigo-100 mt-1">Expert Tutors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form - Compacted Spacing to avoid Scrollbar */}
          <div className="p-6 lg:px-12 lg:py-8 flex flex-col justify-center bg-[#f3f3f3]">
            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-1.5">Create Account</h1>
                <p className="text-slate-500 text-sm">Join our community of learners and educators.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50/80 p-3 text-sm font-medium text-red-600 border border-red-100">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Custom Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-bold ml-1">Account Type</Label>
                    <div className="flex bg-white/50 p-1 rounded-xl h-11 border border-slate-200" style={{ boxShadow: "rgba(149,157,165,0.18) 0px 8px 24px" }}>
                      <button type="button" onClick={() => handleRegistrationTypeSelect('independent')} className={cn("flex-1 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all", formData.registrationType === 'independent' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 font-medium hover:text-slate-700")}>
                        <User className="h-4 w-4" /> Normal
                      </button>
                      <button type="button" onClick={() => handleRegistrationTypeSelect('invite')} className={cn("flex-1 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all", formData.registrationType === 'invite' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 font-medium hover:text-slate-700")}>
                        <Building2 className="h-4 w-4" /> Invite
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-bold ml-1">I want to...</Label>
                    <div className="flex bg-white/50 p-1 rounded-xl h-11 border border-slate-200" style={{ boxShadow: "rgba(149,157,165,0.18) 0px 8px 24px" }}>
                      <button type="button" onClick={() => handleRoleSelect('student')} className={cn("flex-1 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all", formData.role === 'student' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 font-medium hover:text-slate-700")}>
                        <GraduationCap className="h-4 w-4" /> Learn
                      </button>
                      <button type="button" onClick={() => handleRoleSelect('tutor')} className={cn("flex-1 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-all", formData.role === 'tutor' ? "bg-white text-indigo-600 shadow-sm font-bold" : "text-slate-500 font-medium hover:text-slate-700")}>
                        <Briefcase className="h-4 w-4" /> Teach
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-slate-700 font-bold ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input id="name" name="name" placeholder="John Doe" required className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm" style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} value={formData.name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-slate-700 font-bold ml-1">Phone</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input id="phone" name="phone" placeholder="+1 234..." type="tel" required className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm" style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input id="email" name="email" placeholder="name@example.com" type="email" required 
                      className={cn("pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm", formData.registrationType === 'invite' && formData.email ? "bg-gray-100 cursor-not-allowed text-gray-500" : "")} 
                      style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} 
                      value={formData.email} onChange={handleChange} disabled={formData.registrationType === 'invite' && !!formData.email} />
                  </div>
                </div>

                {/* Animated Invite Token Field */}
                <AnimatePresence>
                  {formData.registrationType === 'invite' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pb-1">
                        <Label htmlFor="inviteToken" className="text-slate-700 font-bold ml-1">Institute Invite Token <span className="text-red-500">*</span></Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <Input id="inviteToken" name="inviteToken" placeholder="Paste your token here..." required 
                            className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm" 
                            style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} 
                            value={formData.inviteToken} onChange={handleChange} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 font-bold ml-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input id="password" name="password" placeholder="••••••••" type="password" required className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm" style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} value={formData.password} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-bold ml-1">Confirm</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input id="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password" required className="pl-11 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl text-sm" style={{ boxShadow: "rgba(149,157,165,0.08) 0px 4px 12px" }} value={formData.confirmPassword} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otpSending}
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-5"
                  style={{ boxShadow: "rgba(149,157,165,0.18) 0px 8px 24px" }}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                  ) : otpSending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending OTP...</>
                  ) : otpRequired ? (
                    <>Verify Email <ArrowRight className="ml-2 h-5 w-5" /></>
                  ) : (
                    <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <a href="/login" className="font-bold text-indigo-600 hover:underline">Sign in</a>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Verify Email</h3>
              <p className="text-sm text-slate-500">We've sent a code to <br/><strong className="text-slate-700">{formData.email}</strong></p>
            </div>

            <div className="space-y-4">
              {otpError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{otpError}</p>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center text-2xl font-mono tracking-[0.5em] font-bold text-slate-800 transition-all outline-none"
                  placeholder="••••••"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOtpAndRegister}
                  disabled={otpVerifying || otp.length !== 6}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-indigo-200"
                >
                  {otpVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                </button>
              </div>

              <button
                onClick={sendOtpForRegistration}
                disabled={otpSending}
                className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 mt-4"
              >
                {otpSending ? "Resending..." : "Resend Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}