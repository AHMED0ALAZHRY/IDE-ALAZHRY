import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useMonuments } from '../hooks/useMonuments';
import { mockMonuments, mockGuides, mockReviews } from '../data/mockData';
import { Plus, Edit, Trash2, Save, X, Database, ArrowRight, MapPin, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { monuments, loading } = useMonuments();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'monuments' | 'guides' | 'moderation'>('monuments');

  // Check if current user is admin based on email
  const isAdmin = user?.email === 'alazhryahmd006@gmail.com';

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

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      try {
        await deleteDoc(doc(db, 'monuments', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
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
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
          <button 
            onClick={() => { setActiveTab('monuments'); handleCancel(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'monuments' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MapPin size={18} />
            المعالم الأثرية
          </button>
          <button 
            onClick={() => { setActiveTab('guides'); handleCancel(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'guides' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={18} />
            المرشدين السياحيين
          </button>
          <button 
            onClick={() => { setActiveTab('moderation'); handleCancel(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'moderation' ? 'bg-nile-blue text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MessageSquare size={18} />
            إدارة المحتوى
          </button>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">إدارة المرشدين السياحيين</h2>
              <button className="flex items-center gap-2 bg-nile-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-nile-blue-light transition-colors shadow-sm">
                <Plus size={18} />
                إضافة مرشد جديد
              </button>
            </div>
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
                  {mockGuides.map((guide) => (
                    <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-nile-blue">
                        {guide.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-royal-gold/10 text-royal-gold-dark px-2 py-1 rounded text-xs font-bold">
                          {guide.rating} ⭐
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                        {guide.languages.join('، ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">إدارة المحتوى والتقييمات</h2>
            <div className="space-y-4">
              {Object.entries(mockReviews).map(([monumentId, reviews]) => (
                reviews.map(review => (
                  <div key={review.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-nile-blue">{review.userName}</span>
                        <span className="text-xs text-gray-400">{review.createdAt}</span>
                      </div>
                      <button className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="حذف التقييم">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.text}</p>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded">معلم ID: {monumentId}</span>
                      <span>التقييم: {review.rating} ⭐</span>
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
