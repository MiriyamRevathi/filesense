import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ArrowRight, ShieldCheck, X, FolderSync, Sparkles } from 'lucide-react';
import { useFileContext } from '../../context/FileContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginUser } = useFileContext();
  const [email, setEmail] = useState('user@filesense.local');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(email || 'user@filesense.local');
    onClose();
  };

  const handleQuickLogin = () => {
    loginUser('user@filesense.local', 'Demo User');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#29243B]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E6E2EF] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#6E6782] hover:text-[#29243B] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
          aria-label="Close login dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8064E9] to-[#A38DF5] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#8064E9]/30">
            <Lock size={22} />
          </div>
          <h3 className="text-xl font-extrabold text-[#29243B] tracking-tight">
            Log In to Local Workspace
          </h3>
          <p className="text-xs text-[#6E6782] mt-1.5 max-w-xs mx-auto">
            Access your private IndexedDB organizer and duplicate cleaner dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#29243B] mb-1.5">
              Workspace Email / ID
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6782]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="user@filesense.local"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-sm text-[#29243B] placeholder:text-[#6E6782] focus:outline-hidden focus:border-[#8064E9] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#29243B]">
                Password / Access Key
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-[11px] text-[#8064E9] hover:underline cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6782]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-sm text-[#29243B] placeholder:text-[#6E6782] focus:outline-hidden focus:border-[#8064E9] focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[#6E6782]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-[#E6E2EF] text-[#8064E9] focus:ring-[#8064E9]"
              />
              <span>Remember local session</span>
            </label>
            <span className="text-[11px] text-[#8064E9] font-medium">Local Client-Side</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-bold text-sm shadow-md shadow-[#8064E9]/20 transition-all active:scale-95 cursor-pointer mt-2"
          >
            <span>Log In &amp; Open Dashboard</span>
            <ArrowRight size={16} />
          </button>

          {/* Quick Demo Login Option */}
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F7F5FF] hover:bg-[#EDE7FF] border border-[#E6E2EF] hover:border-[#8064E9] text-[#5B42C4] font-semibold text-xs transition-colors cursor-pointer"
          >
            <Sparkles size={14} className="text-[#8064E9]" />
            <span>One-Click Quick Login</span>
          </button>
        </form>

        {/* Security / Privacy Assurance */}
        <div className="mt-5 pt-4 border-t border-[#E6E2EF] flex items-center justify-center gap-2 text-[11px] text-[#6E6782]">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span>100% Client-Side. Credentials never leave this browser.</span>
        </div>
      </div>
    </div>
  );
};
