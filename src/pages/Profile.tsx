import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Settings, Heart, Clock, ShieldAlert, ChevronLeft, MapPin, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, collection, query, where } from 'firebase/firestore';
import { useMonuments } from '../hooks/useMonuments';

export default function Profile() {
  const { user, isGuest, signOut } = useAuth();
  const navigate = useNavigate();
  const { monuments } = useMonuments();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [settingsMode, setSettingsMode] = useState(false);
  const [themeSetting, setThemeSetting] = useState('light');
  const [langSetting, setLangSetting] = useState('ar');
  const [notifSetting, setNotifSetting] = useState(true);

  const isPrimaryAdmin = user?.email?.toLowerCase() === 'alazhryahmd006@gmail.com';

  useEffect(() => {
    if (user?.email && !isPrimaryAdmin && !isGuest) {
      getDoc(doc(db, 'supervisors', user.email.toLowerCase()))
        .then(docSnap => {
          setIsSupervisor(docSnap.exists());
        })
        .catch(err => console.error("Error checking supervisor status:", err));
    }
  }, [user, isPrimaryAdmin, isGuest]);

  useEffect(() => {
    if (user && !isGuest) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          if (data.settings) {
            setThemeSetting(data.settings.theme || 'light');
            setLangSetting(data.settings.lang || 'ar');
            setNotifSetting(data.settings.notifications !== false);
          }
        }
      });
      
      const qBookings = query(collection(db, 'bookings'), where('userId', '==', user.uid));
      const unsubBookings = onSnapshot(qBookings, snapshot => {
        setUserBookings(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      });

      return () => {
        unsub();
        unsubBookings();
      };
    }
  }, [user, isGuest]);

  const isAdmin = isPrimaryAdmin || isSupervisor;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveSettings = async () => {
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          settings: {
            theme: themeSetting,
            notifications: notifSetting
          }
        });
        alert('تم حفظ الإعدادات بنجاح!');
        setSettingsMode(false);
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('حدث خطأ أثناء حفظ الإعدادات.');
      }
    }
  };

  const favoriteMonuments = monuments.filter(m => userData?.favorites?.includes(m.id));
  const visitHistory = monuments.filter(m => userData?.history?.includes(m.id)).reverse().slice(0, 10);

  return (
    <div className="min-h-screen bg-ivory-white pb-20">
      <div className="bg-nile-blue text-white p-6 pt-12 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <h1 className="text-2xl font-bold mb-6 text-center relative z-10">حسابي</h1>
        
        <div className="flex flex-col items-center relative z-10">
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
            {isAdmin && <span className="bg-royal-gold text-white text-xs px-2 py-1 rounded-full shadow-sm">إدارة</span>}
          </h2>
          {!isGuest && user?.email && (
            <p className="text-gray-300 text-sm mt-1">{user.email}</p>
          )}
        </div>
      </div>

      <div className="p-4 mt-4 space-y-4 max-w-2xl mx-auto">
        {isGuest && (
          <div className="bg-royal-gold/10 border border-royal-gold/30 p-5 rounded-2xl mb-6 shadow-sm">
            <h3 className="font-bold text-royal-gold-dark mb-2 text-lg">سجل الدخول للمزيد من الميزات</h3>
            <p className="text-sm text-gray-600 mb-4">احفظ معالمك المفضلة، احتفظ بسجل زياراتك، واحجز مرشدين سياحيين بكل سهولة.</p>
            <button 
              onClick={handleSignOut}
              className="w-full bg-royal-gold text-white py-3 rounded-xl font-bold shadow-md hover:bg-royal-gold-dark transition-colors"
            >
              تسجيل الدخول أو إنشاء حساب
            </button>
          </div>
        )}

        {isAdmin && (
          <div 
            onClick={() => navigate('/admin')}
            className="bg-nile-blue text-white p-5 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:bg-nile-blue-light transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={28} className="text-royal-gold" />
              <div>
                <h3 className="font-bold text-lg">لوحة تحكم الإدارة</h3>
                <p className="text-xs text-gray-300">إضافة وتعديل المعالم والتفاعلات</p>
              </div>
            </div>
            <ChevronLeft size={20} className="text-royal-gold" />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Favorites Section */}
          <div>
            <div 
              onClick={() => { setActiveSection(activeSection === 'favorites' ? null : 'favorites'); setSettingsMode(false); }}
              className="p-5 border-b border-gray-50 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <Heart size={20} className={activeSection === 'favorites' ? 'fill-current' : ''} />
                </div>
                <div>
                  <span className="font-bold block">المعالم المفضلة</span>
                  <span className="text-xs text-gray-400">{favoriteMonuments.length} معلم محفوظ</span>
                </div>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${activeSection === 'favorites' ? '-rotate-90' : ''}`} />
            </div>
            
            {activeSection === 'favorites' && (
              <div className="p-4 bg-gray-50/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                {isGuest ? (
                  <div className="text-center py-6 text-gray-500">قم بتسجيل الدخول لحفظ معالمك المفضلة</div>
                ) : favoriteMonuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart size={32} className="mx-auto text-gray-300 mb-2" />
                    لم تضف أي معالم للمفضلة بعد.<br/>
                    <button onClick={() => navigate('/')} className="text-royal-gold font-bold mt-2 text-sm">تصفح المعالم</button>
                  </div>
                ) : (
                  favoriteMonuments.map(monument => (
                    <div key={monument.id} onClick={() => navigate(`/monument/${monument.id}`)} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md hover:border-royal-gold/30 border border-transparent transition-all group">
                      <img src={monument.imageUrl} alt={monument.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-nile-blue text-sm group-hover:text-royal-gold transition-colors">{monument.name}</h4>
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <MapPin size={12} className="ml-1" />
                          {monument.location}
                        </div>
                      </div>
                      <ChevronLeft size={16} className="text-gray-300 group-hover:text-royal-gold" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bookings Section */}
          <div>
            <div 
              onClick={() => { setActiveSection(activeSection === 'bookings' ? null : 'bookings'); setSettingsMode(false); }}
              className="p-5 border-b border-gray-50 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="font-bold block">حجوزاتي</span>
                  <span className="text-xs text-gray-400">تتبع طلبات المرشدين السياحيين</span>
                </div>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${activeSection === 'bookings' ? '-rotate-90' : ''}`} />
            </div>

            {activeSection === 'bookings' && (
              <div className="p-4 bg-gray-50/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                {isGuest ? (
                  <div className="text-center py-6 text-gray-500">قم بتسجيل الدخول لمتابعة حجوزاتك</div>
                ) : userBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                    ليس لديك أي حجوزات حتى الآن.<br/>
                  </div>
                ) : (
                  userBookings.map((booking: any) => (
                    <div key={booking.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-nile-blue text-sm">{booking.monumentName || 'معلم سياحي'}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'accepted' ? 'مؤكد' : 'ملغي'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-col gap-1">
                        <span>المرشد: {booking.guideName}</span>
                        <span>الوقت: {booking.date} | {booking.time}</span>
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
              onClick={() => { setActiveSection(activeSection === 'history' ? null : 'history'); setSettingsMode(false); }}
              className="p-5 border-b border-gray-50 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-nile-blue/5 text-nile-blue flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="font-bold block">سجل الزيارات</span>
                  <span className="text-xs text-gray-400">آخر المعالم التي استكشفتها</span>
                </div>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${activeSection === 'history' ? '-rotate-90' : ''}`} />
            </div>

            {activeSection === 'history' && (
              <div className="p-4 bg-gray-50/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                {isGuest ? (
                  <div className="text-center py-6 text-gray-500">قم بتسجيل الدخول للاحتفاظ بسجل زياراتك</div>
                ) : visitHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Map size={32} className="mx-auto text-gray-300 mb-2" />
                    لم تقم بزيارة أي معلم بعد.<br/>
                    <button onClick={() => navigate('/map')} className="text-royal-gold font-bold mt-2 text-sm">استكشف الخريطة</button>
                  </div>
                ) : (
                  visitHistory.map(monument => (
                    <div key={monument.id} onClick={() => navigate(`/monument/${monument.id}`)} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md border border-transparent transition-all group">
                      <img src={monument.imageUrl} alt={monument.name} className="w-12 h-12 rounded-lg object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div className="flex-1">
                        <h4 className="font-bold text-nile-blue text-sm">{monument.name}</h4>
                        <div className="text-xs text-gray-400 mt-0.5">تم الاستكشاف مؤخراً</div>
                      </div>
                      <ChevronLeft size={16} className="text-gray-300" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div>
            <div 
              onClick={() => { setSettingsMode(!settingsMode); setActiveSection(null); }}
              className="p-5 flex items-center justify-between text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <span className="font-bold">الإعدادات والتفضيلات</span>
              </div>
              <ChevronLeft size={20} className={`text-gray-400 transition-transform ${settingsMode ? '-rotate-90' : ''}`} />
            </div>

            {settingsMode && !isGuest && (
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-bold text-nile-blue mb-4">تخصيص التطبيق</h3>
                
                <div className="space-y-4 mb-6">
                  {/* Personal Info Update */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-sm text-gray-800 mb-3 block">المعلومات الشخصية</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">رقم الهاتف للحجوزات</label>
                        <input 
                          type="tel"
                          placeholder="مثال: 01xxxxxxxxx"
                          value={userData?.settings?.phone || ''}
                          onChange={(e) => setUserData({ ...userData, settings: { ...userData?.settings, phone: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-royal-gold focus:border-royal-gold px-3 py-2 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">تلقي الإشعارات</h4>
                      <p className="text-xs text-gray-500 mt-1">تنبيهات حول المعالم الجديدة والردود</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={notifSetting} onChange={() => setNotifSetting(!notifSetting)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:translate-x-0 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-royal-gold"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">المظهر العام</h4>
                      <p className="text-xs text-gray-500 mt-1">لون الواجهة</p>
                    </div>
                    <select 
                      value={themeSetting}
                      onChange={(e) => {
                        setThemeSetting(e.target.value);
                        if (e.target.value === 'dark') {
                           document.documentElement.classList.add('dark');
                        } else {
                           document.documentElement.classList.remove('dark');
                        }
                      }}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-royal-gold focus:border-royal-gold px-3 py-1.5 outline-none font-bold"
                    >
                      <option value="light">فاتح</option>
                      <option value="dark">داكن</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">حجم الخط</h4>
                      <p className="text-xs text-gray-500 mt-1">لتسهيل القراءة</p>
                    </div>
                    <select 
                      value={userData?.settings?.fontSize || 'medium'}
                      onChange={(e) => setUserData({ ...userData, settings: { ...userData?.settings, fontSize: e.target.value } })}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-royal-gold focus:border-royal-gold px-3 py-1.5 outline-none font-bold"
                    >
                      <option value="small">صغير</option>
                      <option value="medium">متوسط</option>
                      <option value="large">كبير</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">لغة التطبيق</h4>
                      <p className="text-xs text-gray-500 mt-1">التطبيق حالياً باللغة العربية بصفة أساسية</p>
                    </div>
                    <select 
                      value={langSetting}
                      onChange={(e) => setLangSetting(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-royal-gold focus:border-royal-gold px-3 py-1.5 outline-none font-bold"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English (قريباً)</option>
                    </select>
                  </div>
                  
                </div>

                <button 
                  onClick={async () => {
                    if (user && !isGuest) {
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          settings: {
                            theme: themeSetting,
                            lang: langSetting,
                            notifications: notifSetting,
                            phone: userData?.settings?.phone || '',
                            fontSize: userData?.settings?.fontSize || 'medium'
                          }
                        });
                        alert('تم حفظ الإعدادات بنجاح!');
                        setSettingsMode(false);
                      } catch (error) {
                        console.error('Error saving settings:', error);
                        alert('حدث خطأ أثناء حفظ الإعدادات.');
                      }
                    }
                  }}
                  className="w-full bg-nile-blue text-white py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-nile-blue-light transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            )}
            
            {settingsMode && isGuest && (
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-gray-500 mb-2">الإعدادات متاحة للأعضاء فقط.</p>
                <button onClick={handleSignOut} className="text-royal-gold font-bold text-sm underline">تسجيل الدخول</button>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full mt-8 bg-white border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
        >
          <LogOut size={20} />
          {isGuest ? 'العودة لصفحة الدخول الرئيسية' : 'تسجيل الخروج من الحساب'}
        </button>
      </div>
    </div>
  );
}
