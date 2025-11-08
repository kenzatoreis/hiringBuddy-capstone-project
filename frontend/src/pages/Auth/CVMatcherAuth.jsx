import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Briefcase, Calendar, GraduationCap, BookOpen, Award } from 'lucide-react';
import { registerUser, loginUser } from "../../api";
export default function CVMatcherAuth() {
  const [view, setView] = useState('login'); // login, register, forgot
  const [registerStep, setRegisterStep] = useState(1); // 1, 2, 3
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    dateOfBirth: '',
    major: '',
    minor: '',
    specialization: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async () => {
  setLoading(true);
  setMessage({ text: "", type: "" });
  try {
    if (view === "login") {
      const res = await loginUser(formData.email, formData.password);
      localStorage.setItem("token", res.data.access_token);
      console.log("TOKEN:", res.data.access_token);
      setMessage({ text: "Login successful!", type: "success" });
      setTimeout(() => (window.location.href = "/dashboard"), 1000);
    } else if (view === "register" && registerStep === 3) {
      const body = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        dob: formData.dateOfBirth,
        major: formData.major,
        minor: formData.minor,
        specialization: formData.specialization,
      };
      await registerUser(body);
      setMessage({ text: "Account created! Please login.", type: "success" });
      setTimeout(() => {
        setView("login");
        setRegisterStep(1);
      }, 1500);
    } else {
      setMessage({ text: "Password reset not implemented yet.", type: "info" });
    }
  } catch (err) {
    const msg = err.response?.data?.detail || "Something went wrong.";
    setMessage({ text: msg, type: "error" });
  } finally {
    setLoading(false);
  }
};
// Go to next registration step
const handleNextStep = () => {
  if (registerStep === 1 && (!formData.email || !formData.password || !formData.confirmPassword)) {
    setMessage({ text: 'Please fill in all fields', type: 'error' });
    return;
  }
  if (registerStep === 1 && formData.password !== formData.confirmPassword) {
    setMessage({ text: 'Passwords do not match', type: 'error' });
    return;
  }
  if (registerStep === 2 && (!formData.username || !formData.dateOfBirth)) {
    setMessage({ text: 'Please fill in all required fields', type: 'error' });
    return;
  }

  setMessage({ text: '', type: '' });
  setRegisterStep(registerStep + 1);
};

// Go to previous registration step
const handlePreviousStep = () => {
  setMessage({ text: '', type: '' });
  setRegisterStep(registerStep - 1);
};

  // Progress indicator component
  const ProgressIndicator = ({ currentStep }) => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-3 font-bold transition ${
              step === currentStep 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : step < currentStep
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
            </div>
            {idx < 2 && (
              <div className={`w-16 md:w-24 h-1 mx-2 transition ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-12 text-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold">CV Matcher</h1>
              </div>
              
              <h2 className="text-3xl font-bold mb-6">
                Find Your Perfect Job Match
              </h2>
              
              <p className="text-xl text-green-50 mb-8">
                Compare your CV against job descriptions and optimize your application with AI-powered insights.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Smart Matching</h3>
                    <p className="text-green-50">Get instant match scores and insights</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">CV Optimization</h3>
                    <p className="text-green-50">Edit and improve your CV instantly</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Missing Skills</h3>
                    <p className="text-green-50">Identify gaps in your qualifications</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur">
                <p className="text-sm text-green-50">
                  "This tool helped me land my dream job by showing exactly what skills I needed to highlight!"
                </p>
                <p className="text-sm font-semibold mt-2">- Sarah Johnson</p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {/* Header */}
              {view !== 'register' && (
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-4">
                    <Lock className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">
                    {view === 'login' && 'Welcome Back'}
                    {view === 'forgot' && 'Reset Password'}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {view === 'login' && 'Sign in to access your CV matcher'}
                    {view === 'forgot' && "We'll send you a reset link"}
                  </p>
                </div>
              )}

              {/* Register Header with Progress */}
              {view === 'register' && (
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                    <p className="text-gray-600">
                      {registerStep === 1 && "Let's get started"}
                      {registerStep === 2 && "Tell us about yourself"}
                      {registerStep === 3 && "Academic background"}
                    </p>
                  </div>
                  <ProgressIndicator currentStep={registerStep} />
                </div>
              )}

              {/* Alert Message */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border-2 border-green-200 text-green-800' 
                    : 'bg-red-50 border-2 border-red-200 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              {/* Login Form */}
              {view === 'login' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition text-gray-800"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition text-gray-800"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setView('forgot')}
                      className="text-purple-600 hover:text-purple-700 font-semibold transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setView('register')}
                    className="w-full border-2 border-purple-200 text-purple-600 py-4 rounded-xl text-lg font-bold hover:bg-purple-50 transition"
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Register Form - Step 1: Email & Password */}
              {view === 'register' && registerStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Work email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-600 hover:shadow-xl transition"
                  >
                    NEXT
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setView('login')}
                      className="text-gray-600 hover:text-gray-800 font-medium transition"
                    >
                      Already have an account? <span className="text-blue-500 font-semibold">Sign In</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Register Form - Step 2: Personal Info */}
              {view === 'register' && registerStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="johndoe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      BACK
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 bg-blue-500 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-600 hover:shadow-xl transition"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              )}

              {/* Register Form - Step 3: Academic Info */}
              {view === 'register' && registerStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Major <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minor (Optional)
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="minor"
                        value={formData.minor}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="e.g., AI/ML"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      BACK
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'CREATE ACCOUNT'}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Form */}
              {view === 'forgot' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition text-gray-800"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setView('login')}
                      className="text-purple-600 hover:text-purple-700 font-semibold transition"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}