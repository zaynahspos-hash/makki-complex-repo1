
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Store, Lock, Mail, Loader2, ArrowRight, UserPlus, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration State (Hidden by default)
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [secretClickCount, setSecretClickCount] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  const { login, signup, resetUserPassword, user } = useApp();
  const navigate = useNavigate();

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
       if (isRegistering) {
         await signup(email.trim(), password, displayName);
       } else {
         await login(email.trim(), password);
       }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Operation failed. Check connection.');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!resetEmail) return;
    setIsResetLoading(true);
    try {
      await resetUserPassword(resetEmail.trim());
      setIsForgotModalOpen(false);
      setResetEmail('');
    } catch (err: any) {
      // Error is handled in AppContext with showToast. 
      // We log here for debug but suppress the native alert to avoid bad UX.
      console.error("Forgot Password Error:", err);
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleLogoClick = () => {
    setSecretClickCount(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setIsRegistering(true);
        setError('Admin setup mode enabled.');
        return 0;
      }
      return newCount;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 transition-colors relative">
        <div className="text-center mb-8">
          <div className="relative inline-block cursor-pointer" onClick={handleLogoClick}>
            <img 
              src="https://res.cloudinary.com/dguw4vfjc/image/upload/v1771256298/makkicomplex_logo_zi2aux.webp" 
              alt="Plaza Logo" 
              className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-none object-cover select-none"
            />
            {isRegistering && (
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-1.5 rounded-full animate-bounce">
                <ShieldAlert size={16} />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRegistering ? 'Setup Admin Account' : 'Plaza Manager'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isRegistering ? 'Create your root administrative account' : 'Sign in to manage your property'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className={`text-sm p-3 rounded-lg text-center ${
              error === 'Admin setup mode enabled.' 
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}>
              {error}
            </div>
          )}

          {isRegistering && (
            <div className="animate-in slide-in-from-top-4 fade-in duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plaza / Admin Name</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  required={isRegistering}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g. Super Admin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="admin@plaza.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isRegistering && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer text-gray-600 dark:text-gray-400">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
                  <span>Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium ml-auto"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-white ${
              isRegistering 
              ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (isRegistering ? 'Create Admin Account' : 'Sign In')}
          </button>
          
          {isRegistering && (
             <button
               type="button"
               onClick={() => { setIsRegistering(false); setError(''); }}
               className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
             >
               Back to Login
             </button>
          )}
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your email to receive a password reset link.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                 <input 
                   type="email" 
                   required
                   className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="Enter email address"
                   value={resetEmail}
                   onChange={(e) => setResetEmail(e.target.value)}
                 />
                 <div className="flex gap-2 justify-end">
                    <button 
                      type="button" 
                      onClick={() => !isResetLoading && setIsForgotModalOpen(false)}
                      disabled={isResetLoading}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isResetLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                    >
                      {isResetLoading ? <Loader2 className="animate-spin" size={16}/> : <>Send Link <ArrowRight size={16} /></>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;