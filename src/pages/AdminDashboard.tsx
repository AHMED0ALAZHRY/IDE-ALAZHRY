import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { useMonuments } from '../hooks/useMonuments';
import { mockMonuments, mockGuides, mockReviews } from '../data/mockData';
import { Plus, Edit, Trash2, Save, X, Database, ArrowRight, MapPin, Users, MessageSquare, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { monuments, loading } = useMonuments();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'monuments' | 'guides' | 'moderation' | 'supervisors' | 'bookings'>('monuments');

  const isPrimaryAdmin = user?.email?.toLowerCase() === 'alazhryahmd006@gmail.com';
  console.log('CurrentUserEmail:', user?.email, 'isPrimaryAdmin:', isPrimaryAdmin);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [supervisorsList, setSupervisorsList] = useState<any[]>([]);
  const [newSupervisorEmail, setNewSupervisorEmail] = useState('');

  const [guidesList, setGuidesList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [isAddingGuide, setIsAddingGuide] = useState(false);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [guideFormData, setGuideFormData] = useState<any>({});

  useEffect(() => {
    if (!user?.email) {
      setCheckingAuth(false);
      return;
    }

    if (isPrimaryAdmin) {
      setIsSupervisor(true);
      setCheckingAuth(false);
      const unsub = onSnapshot(collection(db, 'supervisors'), 
        (snapshot) => {
          setSupervisorsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        (error) => {
          console.error("Snapshot error on supervisors:", error);
          alert("خطأ في جلب بيانات المشرفين: " + error.message);
        }
      );
      return () => unsub();
    } else {
      getDoc(doc(db, 'supervisors', user.email))
        .then(docSnap => {
          setIsSupervisor(docSnap.exists());
          setCheckingAuth(false);
        })
        .catch(err => {
          console.error("Error checking supervisor status:", err);
          setIsSupervisor(false);
          setCheckingAuth(false);
        });
    }
  }, [user, isPrimaryAdmin]);

  const isAdmin = isPrimaryAdmin || isSupervisor;

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubGuides = onSnapshot(collection(db, 'guides'), (snapshot) => {
      setGuidesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching guides:", error));

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setReviewsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching reviews:", error));

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      setBookingsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching bookings:", error));

    return () => {
      unsubGuides();
      unsubReviews();
      unsubBookings();
    };
  }, [isAdmin]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-ivory-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-royal-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ivory-white flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-2xl font-bold text-nile-blue mb-2">غير مصرح</h2>
          <p className="text-gray-600 mb-6">عذراً، هذه الصفحة مخصصة لمديري التطبيق فقط.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-nile-blue text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-nile-blue-light transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const handleAddSupervisor = async () => {
    const cleanEmail = newSupervisorEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      alert('الرجاء إدخال بريد إلكتروني صحيح');
      return;
    }
    try {
      await setDoc(doc(db, 'supervisors', cleanEmail), { 
        email: cleanEmail 
      });
      setNewSupervisorEmail('');
      alert('تم إضافة المشرف بنجاح');
    } catch (error: any) {
      console.error("Error adding supervisor:", error);
      alert('حدث خطأ أثناء الإضافة: ' + (error.message || ''));
    }
  };

  const handleDeleteSupervisor = async (email: string) => {
    if (window.confirm(`هل أنت متأكد من إزالة المشرف ${email}؟`)) {
      try {
        await deleteDoc(doc(db, 'supervisors', email));
        alert('تم إزالة المشرف');
      } catch (error: any) {
        console.error("Error removing supervisor:", error);
        alert('حدث خطأ أثناء الإزالة: ' + (error.message || ''));
      }
    }
  };

  const handleEdit = (monument: any) => {
    setEditingId(monument.id);
    setFormData(monument);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'فرعوني',
      location: 'القاهرة',
      description: '',
      imageUrl: '',
      audioUrl: '',
      videoUrl: '',
      latitude: 30.0444,
      longitude: 31.2357
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await addDoc(collection(db, 'monuments'), formData);
      } else if (editingId) {
        await updateDoc(doc(db, 'monuments', editingId), formData);
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
    } catch (e: any) {
      alert("Error updating booking status: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      try {
        await deleteDoc(doc(db, 'monuments', id));
        alert("تم الحذف بنجاح");
      } catch (error: any) {
        console.error("Error deleting document: ", error);
        alert("فشل الحذف، خطأ في الصلاحيات أو الاتصال: " + (error.message || ''));
      }
    }
  };

  const handleEditGuide = (guide: any) => {
    setEditingGuideId(guide.id);
    setGuideFormData({
      ...guide,
      languages: guide.languages ? guide.languages.join('، ') : ''
    });
    setIsAddingGuide(false);
  };

  const handleAddNewGuide = () => {
    setIsAddingGuide(true);
    setEditingGuideId(null);
    setGuideFormData({
      name: '',
      rating: 5,
      languages: '',
      imageUrl: '',
      description: '',
      phone: ''
    });
  };

  const handleCancelGuide = () => {
    setEditingGuideId(null);
    setIsAddingGuide(false);
    setGuideFormData({});
  };

  const handleSaveGuide = async () => {
    try {
      const formattedData = {
        ...guideFormData,
        languages: typeof guideFormData.languages === 'string' 
          ? guideFormData.languages.split('،').map((l: string) => l.trim()).filter(Boolean)
          : guideFormData.languages
      };

      if (isAddingGuide) {
        await addDoc(collection(db, 'guides'), formattedData);
      } else if (editingGuideId) {
        await updateDoc(doc(db, 'guides', editingGuideId), formattedData);
      }
      handleCancelGuide();
      alert("تم حفظ بيانات المرشد بنجاح");
    } catch (error: any) {
      console.error("Error saving guide: ", error);
      alert("حدث خطأ أثناء حفظ المرشد: " + (error.message || ''));
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المرشد؟')) {
      try {
        await deleteDoc(doc(db, 'guides', id));
        alert("تم حذف المرشد بنجاح");
      } catch (error: any) {
        console.error("Error deleting guide: ", error);
        alert("فشل الحذف: " + (error.message || ''));
      }
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('هل أنت متأكد من مسح هذا التفاعل؟')) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        alert("تم مسح التفاعل");
      } catch (error: any) {
        console.error("Error deleting review: ", error);
        alert("فشل مسح التفاعل: " + (error.message || ''));
      }
    }
  };

  const handleSeedData = async () => {
    if (window.confirm('هل تريد إضافة البيانات التجريبية إلى قاعدة البيانات؟ (سيتم إضافة المعالم الأساسية)')) {
      try {
        for (const monument of mockMonuments) {
          // Use the mock ID as the document ID for consistency
          await setDoc(doc(db, 'monuments', monument.id), monument);
        }
        alert('تم إضافة البيانات بنجاح!');
      } catch (error) {
        console.error("Error seeding data: ", error);
        alert('حدث خطأ أثناء إضافة البيانات');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-nile-blue text-white p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-2xl font-bold">لوحة تحكم الإدارة</h1>
        </div>
        <button 
          onClick={handleSeedData}
          className="flex items-center gap-2 bg-royal-gold hover:bg-royal-gold-dark px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Database size={16} />
          <span className="hidden sm:inline">إضافة بيانات تجريبية</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6 flex-wrap">
          <button 
            onClick={() => { setActiveTab('monuments'); handleCancel(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'monuments' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MapPin size={18} />
            المعالم
          </button>
          <button 
            onClick={() => { setActiveTab('guides'); handleCancel(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'guides' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={18} />
            المرشدين
          </button>
          <button 
            onClick={() => { setActiveTab('moderation'); handleCancel(); handleCancelGuide(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'moderation' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MessageSquare size={18} />
            التفاعلات
          </button>
          <button 
            onClick={() => { setActiveTab('bookings'); handleCancel(); handleCancelGuide(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'bookings' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Database size={18} />
            الحجوزات
          </button>
          {isPrimaryAdmin && (
            <button 
              onClick={() => { setActiveTab('supervisors'); handleCancel(); handleCancelGuide(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'supervisors' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ShieldAlert size={18} />
              المشرفين
            </button>
          )}
        </div>

        {activeTab === 'monuments' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إدارة المعالم الأثرية</h2>
              {!isAdding && !editingId && (
                <button 
                  onClick={handleAddNew}
                  className="flex items-center gap-2 bg-nile-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-nile-blue-light transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  إضافة معلم جديد
                </button>
              )}
            </div>

        {/* Form (Add/Edit) */}
        {(isAdding || editingId) && (
          <div className="bg-white p-6 rounded-2xl shadow-md mb-8 border border-gray-200 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-nile-blue mb-4 border-b pb-2">
              {isAdding ? 'إضافة معلم جديد' : 'تعديل المعلم'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المعلم</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <select 
                  value={formData.type || 'فرعوني'} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                >
                  <option value="فرعوني">فرعوني</option>
                  <option value="إسلامي">إسلامي</option>
                  <option value="قبطي">قبطي</option>
                  <option value="روماني">روماني</option>
                  <option value="ثقافي">ثقافي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                <input 
                  type="text" 
                  value={formData.location || ''} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة</label>
                <input 
                  type="text" 
                  value={formData.imageUrl || ''} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصوت (Audio)</label>
                <input 
                  type="text" 
                  value={formData.audioUrl || ''} 
                  onChange={e => setFormData({...formData, audioUrl: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الفيديو (Video)</label>
                <input 
                  type="text" 
                  value={formData.videoUrl || ''} 
                  onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">خط العرض (Latitude)</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.latitude || ''} 
                  onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">خط الطول (Longitude)</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.longitude || ''} 
                  onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button 
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <X size={18} />
                إلغاء
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-royal-gold text-white rounded-lg hover:bg-royal-gold-dark transition-colors font-bold shadow-sm"
              >
                <Save size={18} />
                حفظ المعلم
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">جاري تحميل البيانات...</div>
          ) : monuments.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <p className="mb-4">لا توجد معالم في قاعدة البيانات حالياً.</p>
              <button 
                onClick={handleSeedData}
                className="text-royal-gold font-bold underline"
              >
                اضغط هنا لإضافة البيانات التجريبية
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الصورة</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الاسم</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">النوع</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الموقع</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monuments.map((monument) => (
                    <tr key={monument.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img src={monument.imageUrl} alt={monument.name} className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-nile-blue">
                        {monument.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                          {monument.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {monument.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(monument)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(monument.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === 'guides' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">إدارة المرشدين السياحيين</h2>
              {!isAddingGuide && !editingGuideId && (
                <button 
                  onClick={handleAddNewGuide}
                  className="flex items-center gap-2 bg-nile-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-nile-blue-light transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  إضافة مرشد جديد
                </button>
              )}
            </div>

            {(isAddingGuide || editingGuideId) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-bold text-nile-blue mb-4 border-b pb-2">
                  {isAddingGuide ? 'إضافة مرشد جديد' : 'تعديل بيانات المرشد'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المرشد</label>
                    <input 
                      type="text" 
                      value={guideFormData.name || ''} 
                      onChange={e => setGuideFormData({...guideFormData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                    <input 
                      type="text" 
                      value={guideFormData.phone || ''} 
                      onChange={e => setGuideFormData({...guideFormData, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللغات (مفصول بينها بفاصلة أو "،")</label>
                    <input 
                      type="text" 
                      value={guideFormData.languages || ''} 
                      onChange={e => setGuideFormData({...guideFormData, languages: e.target.value})}
                      placeholder="عربي، إنجليزي، فرنسي"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">صورة المرشد (رابط URL)</label>
                    <input 
                      type="text" 
                      value={guideFormData.imageUrl || ''} 
                      onChange={e => setGuideFormData({...guideFormData, imageUrl: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التقييم الأصلي</label>
                    <input 
                      type="number" 
                      min="1" max="5" step="0.1"
                      value={guideFormData.rating || 5} 
                      onChange={e => setGuideFormData({...guideFormData, rating: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">نبذة عن المرشد</label>
                    <textarea 
                      value={guideFormData.description || ''} 
                      onChange={e => setGuideFormData({...guideFormData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-royal-gold focus:border-transparent h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button 
                    onClick={handleCancelGuide}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <X size={18} />
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSaveGuide}
                    className="flex items-center gap-2 px-4 py-2 bg-royal-gold text-white rounded-lg hover:bg-royal-gold-dark transition-colors font-bold shadow-sm"
                  >
                    <Save size={18} />
                    حفظ المرشد
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {guidesList.length === 0 ? (
                <div className="p-10 text-center text-gray-500">لا يوجد مرشدين مضافين حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">الاسم</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">التقييم</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">اللغات</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {guidesList.map((guide) => (
                        <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-nile-blue">
                            <div className="flex items-center gap-3">
                              {guide.imageUrl ? (
                                <img src={guide.imageUrl} alt={guide.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">{guide.name?.charAt(0)}</div>
                              )}
                              <span>{guide.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-royal-gold/10 text-royal-gold-dark px-2 py-1 rounded text-xs font-bold">
                              {guide.rating} ⭐
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                            {guide.languages && Array.isArray(guide.languages) ? guide.languages.join('، ') : guide.languages}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEditGuide(guide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleDeleteGuide(guide.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              إدارة التفاعلات
            </h2>
            <div className="space-y-4">
              {reviewsList.length === 0 ? (
                <div className="p-10 text-center text-gray-500">لا توجد تفاعلات مضافة بعد.</div>
              ) : (
                reviewsList.map(review => (
                  <div key={review.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-nile-blue">{review.userName || 'مستخدم'}</span>
                        {review.createdAt && (
                          <span className="text-xs text-gray-400">
                            {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('ar-EG') : review.createdAt}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeleteReview(review.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="حذف التفاعل">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.text}</p>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded">معلم ID: {review.monumentId || 'غير محدد'}</span>
                      {review.rating && <span>التقييم: {review.rating} ⭐</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Database className="text-nile-blue" size={24} />
              إدارة حجوزات المرشدين
            </h2>
            <div className="space-y-4">
              {bookingsList.length === 0 ? (
                <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Database size={32} className="mx-auto text-gray-300 mb-3" />
                  لا توجد طلبات حجز حتى الآن.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">المستخدم</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">المرشد / المعلم</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">تاريخ الجولة</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">الحالة</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookingsList.map(booking => (
                        <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-sm text-nile-blue">{booking.userName || 'غير معروف'}</div>
                            <div className="text-xs text-gray-500">{booking.userPhone || 'بدون رقم'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{booking.guideName || 'مرشد غير محدد'}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />
                              {booking.monumentName || booking.monumentId || 'غير محدد'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700" dir="ltr">
                            {booking.date && new Date(booking.date).toLocaleDateString('ar-EG')}
                            <br/>
                            <span className="text-xs text-gray-500">{booking.time}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'accepted' ? 'مؤكد' : 'ملغي'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {booking.status === 'pending' && (
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'accepted')} className="bg-nile-blue text-white px-3 py-1 rounded text-xs font-bold hover:bg-nile-blue-light transition-colors">
                                  قبول
                                </button>
                                <button onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')} className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-100 border border-red-200 transition-colors">
                                  رفض
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {isPrimaryAdmin && activeTab === 'supervisors' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShieldAlert className="text-royal-gold" size={24} />
                  نظام إدارة المشرفين
                </h2>
                <p className="text-sm text-gray-500 mt-1">يُمكن للمشرفين الدخول للوحة التحكم وإضافة أو تعديل المعالم الأثرية، ولكن لا يمكنهم رؤية أو إدارة هذه الصفحة الحالية.</p>
              </div>
            </div>

            <div className="mb-8 bg-gray-50/50 p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-nile-blue mb-4">إضافة مشرف جديد (بالبريد الإلكتروني للـ Gmail)</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  value={newSupervisorEmail}
                  onChange={e => setNewSupervisorEmail(e.target.value)}
                  placeholder="مثال: admin@gmail.com"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-royal-gold focus:border-transparent text-left"
                  dir="ltr"
                />
                <button 
                  onClick={handleAddSupervisor}
                  disabled={!newSupervisorEmail}
                  className="bg-nile-blue text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-nile-blue-light transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
                >
                  منح الصلاحية
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">المشرفين المعتمدين</h3>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{supervisorsList.length} مشرف</span>
              </div>
              
              {supervisorsList.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  لا يوجد أي مشرفين مُضافين في النظام.
                </div>
              ) : (
                <div className="grid gap-3">
                  {supervisorsList.map((sup) => {
                    const cleanEmail = sup.id || '';
                    if (!cleanEmail) return null;
                    return (
                      <div key={sup.id} className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl hover:border-royal-gold/50 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 text-nile-blue rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                            {cleanEmail.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-nile-blue text-base" dir="ltr">{cleanEmail}</div>
                            <div className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              مشرف معتمد
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteSupervisor(sup.id)}
                          className="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                          title="حذف المشرف"
                        >
                          <Trash2 size={18} />
                          <span className="hidden sm:inline">سحب الصلاحية</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
