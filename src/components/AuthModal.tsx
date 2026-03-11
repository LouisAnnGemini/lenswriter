import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useSupabase();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-stone-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-stone-500">
            {isLogin ? 'Sign in to sync your stories' : 'Join our community of writers'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transform active:scale-[0.98] transition-all shadow-lg shadow-emerald-200"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-stone-100"></div>
          <span className="px-4 text-stone-400 text-xs font-medium uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 border-t border-stone-100"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          className="w-full border border-stone-200 py-3 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 flex items-center justify-center space-x-3 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Google Account</span>
        </button>

        <p className="mt-8 text-center text-sm text-stone-500">
          {isLogin ? "New to LensWriter? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-emerald-600 font-bold hover:underline decoration-2 underline-offset-4"
          >
            {isLogin ? 'Create an account' : 'Sign in here'}
          </button>
        </p>
      </div>
    </div>,
    document.body
  );
};
