import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Pyramid, MapPin } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleGuestSignIn = () => {
    signInAsGuest();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory-white p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-royal-gold opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-nile-blue opacity-10 rounded-full blur-3xl"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-md">
        <div className="w-32 h-32 bg-white rounded-3xl shadow-xl mb-6 overflow-hidden border-4 border-white">
          <img src="/logo.png" alt="شعار فكرة أثر" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-4xl font-bold text-nile-blue mb-2 text-center">فكرة أثر</h1>
        <p className="text-gray-600 mb-12 text-center">اكتشف تراث مصر الخالد بطريقة تفاعلية</p>

        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-800 py-4 px-6 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            تسجيل الدخول باستخدام جوجل
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">أو</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleGuestSignIn}
            className="w-full flex items-center justify-center gap-3 bg-nile-blue text-white py-4 px-6 rounded-xl shadow-md hover:bg-nile-blue-light transition-all font-semibold"
          >
            <MapPin size={20} />
            تصفح كزائر
          </button>
        </div>
      </div>
    </div>
  );
}
