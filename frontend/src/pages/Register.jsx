import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const result = await register(email, password, fullName);
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#050816] relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <Card className="w-full max-w-md space-y-8 p-8 sm:p-10 shadow-2xl bg-[#0f172a]/45 border border-white/5 relative z-10 transition-all duration-300 hover:border-indigo-500/15">

        {/* Title branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white border border-indigo-400/20 mb-4 glow-active shadow-lg shadow-indigo-500/10">
            <HeartPulse className="h-6.5 w-6.5" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Create Account
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-400 max-w-xs">
            Sign up to get started with on-device AI health analysis.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Full Name"
            icon={<User className="h-4 w-4" />}
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full pl-10.5 pr-4 py-2.5 premium-input text-xs font-medium"
          />

          <Input
            label="Email Address"
            icon={<Mail className="h-4 w-4" />}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full pl-10.5 pr-4 py-2.5 premium-input text-xs font-medium"
          />

          <Input
            label="Password"
            icon={<Lock className="h-4 w-4" />}
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full pl-10.5 pr-10 py-2.5 premium-input text-xs font-medium"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 mt-4 cursor-pointer hover:-translate-y-0.5"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-6 pt-5 border-t border-slate-800/80">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-indigo-400 hover:text-indigo-300 transition duration-150"
          >
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
