import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Settings, Heart, Clock, ShieldAlert, ChevronLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockMonuments } from '../data/mockData';

export default function Profile() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = user?.email === 'alazhryahmd006@gmail.com';

  // Mock data for favorites and history
  const favoriteMonuments = mockMonuments.slice(0, 2);
  const visitHistory = mockMonuments.slice(1, 4);

  return (
    <div className="min-h-screen bg-ivory-white pb-20">
      <div className="bg-nile-blue text-white p-6 pt-12 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">حسابي</h1>
        
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full p-1 mb-4 shadow-md">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <UserIcon size={40} />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isGuest ? 'زائر' : user?.displayName || 'مستخدم'}
            {isAdmin && <span className="bg-royal-gold text-white text-xs px-2 py-1 rounded-full">مدير</span>}
          </h2>
          {!isGuest && user?.email && (
            <p className="text-gray-300 text-sm mt-1">{user.email}</p>
          )}
        </div>
      </div>

      <div className="p-4 mt-4 space-y-4">
        {isGuest && (
          <div className="bg-royal-gold/10 border border-royal-gold/20 p-4 rounded-2xl mb-6">
            <h3 className="font-bold text-royal-gold-dark mb-2">سجل الدخول للمزيد من الميزات</h3>
            <p className="text-sm text-gray-600 mb-4">احفظ معالمك المفضلة، واحجز مرشدين سياحيين بسهولة.</p>
            <button 
              onClick={handleSignOut}
              className="w-full bg-royal-gold text-white py-2 rounded-xl font-bold text-sm"
            >
              تسجيل الدخول
            </button>
          </div>
        )}

        {isAdmin && (
          <div 
            onClick={() => navigate('/admin')}
            className="bg-nile-blue text-white p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-nile-blue-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} className="text-royal-gold" />
              <div>
                <h3 className="font-bold">لوحة تحكم الإدارة</h3>
                <p className="text-xs text-gray-300">إضافة وتعديل المعالم الأثرية</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Favorites Section */}
          <div>
            <div 
              onClick={() => setActiveSection(activeSection === 'favorites' ? null : 'favorites')}
              className="p-4 border-b border-gray-50 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-red-500" />
                <span className="font-medium">المعالم المفضلة</span>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${activeSection === 'favorites' ? '-rotate-90' : ''}`} />
            </div>
            
            {activeSection === 'favorites' && (
              <div className="p-4 bg-gray-50 space-y-3">
                {isGuest ? (
                  <p className="text-sm text-gray-500 text-center py-4">قم بتسجيل الدخول لحفظ معالمك المفضلة</p>
                ) : (
                  favoriteMonuments.map(monument => (
                    <div key={monument.id} onClick={() => navigate(`/monument/${monument.id}`)} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <img src={monument.imageUrl} alt={monument.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-nile-blue text-sm">{monument.name}</h4>
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <MapPin size={12} className="ml-1" />
                          {monument.location}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* History Section */}
          <div>
            <div 
              onClick={() => setActiveSection(activeSection === 'history' ? null : 'history')}
              className="p-4 border-b border-gray-50 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-nile-blue" />
                <span className="font-medium">سجل الزيارات</span>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${activeSection === 'history' ? '-rotate-90' : ''}`} />
            </div>

            {activeSection === 'history' && (
              <div className="p-4 bg-gray-50 space-y-3">
                {isGuest ? (
                  <p className="text-sm text-gray-500 text-center py-4">قم بتسجيل الدخول لحفظ سجل زياراتك</p>
                ) : (
                  visitHistory.map(monument => (
                    <div key={monument.id} onClick={() => navigate(`/monument/${monument.id}`)} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <img src={monument.imageUrl} alt={monument.name} className="w-16 h-16 rounded-lg object-cover grayscale hover:grayscale-0 transition-all" />
                      <div>
                        <h4 className="font-bold text-nile-blue text-sm">{monument.name}</h4>
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <Clock size={12} className="ml-1" />
                          آخر زيارة: منذ أسبوع
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="p-4 flex items-center gap-3 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            <Settings size={20} className="text-gray-500" />
            <span className="font-medium">الإعدادات</span>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full mt-6 bg-white border border-red-200 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut size={20} />
          {isGuest ? 'العودة لصفحة الدخول' : 'تسجيل الخروج'}
        </button>
      </div>
    </div>
  );
}
