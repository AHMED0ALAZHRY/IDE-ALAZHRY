import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Headphones, Video, MapPin, Star, Play, Pause, MessageCircle, ThumbsUp, Send, User as UserIcon, Heart } from 'lucide-react';
import { mockGuides, mockReviews as initialMockReviews } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useMonuments } from '../hooks/useMonuments';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc } from 'firebase/firestore';

export default function MonumentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { monuments, loading } = useMonuments();
  const monument = monuments.find(m => m.id === id);
  
  const [activeTab, setActiveTab] = useState<'info' | 'guide' | 'video'>('info');
  const [guideMode, setGuideMode] = useState<'audio' | 'live'>('audio');
  const [isPlaying, setIsPlaying] = useState(false);

  // Community State
  const [reviews, setReviews] = useState<any[]>(initialMockReviews[id || ''] || []);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);

  const [monumentGuides, setMonumentGuides] = useState<any[]>([]);
  const [bookingFormData, setBookingFormData] = useState({ date: '', time: '' });
  const [bookingGuideId, setBookingGuideId] = useState<string | null>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [selectedGuideForView, setSelectedGuideForView] = useState<any | null>(null);
  const [guideRatingForm, setGuideRatingForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (user && !isGuest && id) {
      const userRef = doc(db, 'users', user.uid);
      
      // Update history array by removing and re-adding at the end (handled by tracking logic, but for simplicity arrayUnion here, then unique tracking if needed, but arrayUnion just adds it if not exists. We can also just use arrayUnion and sort later).
      // Or we can just read first, then update.
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.favorites?.includes(id)) {
            setIsFavorited(true);
          }
          let newHistory = data.history || [];
          newHistory = newHistory.filter((h: string) => h !== id); // Remove if exists
          newHistory.push(id); // Add to end
          updateDoc(userRef, { history: newHistory }).catch(err => console.error(err));
        }
      }).catch(err => console.error("Error reading user data", err));
    }
  }, [user, isGuest, id]);

  useEffect(() => {
    // Fetch guides from DB (For simplicity, fetching all, but you can filter by availability or just assign to monument. For now we show all guides as available for booking in MVP)
    const unsub = onSnapshot(collection(db, 'guides'), (snapshot) => {
      setMonumentGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const toggleFavorite = async () => {
    if (isGuest || !user) {
      alert("الرجاء تسجيل الدخول لحفظ المعالم المفضلة");
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isFavorited) {
        await updateDoc(userRef, { favorites: arrayRemove(id) });
        setIsFavorited(false);
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(id) });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-white">
        <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!monument) {
    return <div className="p-6 text-center">المعلم غير موجود</div>;
  }

  const handleBooking = async (guideId: string, guideName: string) => {
    if (isGuest || !user) {
      alert("الرجاء تسجيل الدخول لحجز مرشد سياحي");
      return;
    }
    if (!bookingFormData.date || !bookingFormData.time) {
      alert("الرجاء تحديد تاريخ ووقت الجولة");
      return;
    }
    
    setIsSubmittingBooking(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        userName: user.displayName || 'مستخدم',
        userEmail: user.email,
        guideId: guideId,
        guideName: guideName,
        monumentId: id,
        monumentName: monument?.name,
        date: bookingFormData.date,
        time: bookingFormData.time,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Trigger Email Notification via Backend
      fetch('/api/send-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          userName: user.displayName || 'مستخدم',
          guideName: guideName,
          monumentName: monument?.name,
          date: bookingFormData.date,
          time: bookingFormData.time
        })
      }).catch(err => console.error("Email API Error:", err));

      setBookingGuideId(null);
      setShowBookingSuccess(true);
    } catch (e: any) {
      console.error(e);
      alert('خطأ أثناء الحجز: ' + e.message);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleSubmitReview = () => {
    if (!newReviewText.trim() || isGuest) return;
    
    const newReview = {
      id: Date.now().toString(),
      userName: user?.displayName || 'مستخدم',
      userPhoto: user?.photoURL || '',
      rating: newReviewRating,
      text: newReviewText,
      likes: 0,
      isLiked: false,
      createdAt: 'الآن',
      replies: []
    };
    
    setReviews([newReview, ...reviews]);
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const handleLikeReview = (reviewId: string) => {
    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked };
      }
      return r;
    }));
  };

  const handleLikeReply = (reviewId: string, replyId: string) => {
    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          replies: r.replies.map((rep: any) => {
            if (rep.id === replyId) {
              return { ...rep, likes: rep.isLiked ? rep.likes - 1 : rep.likes + 1, isLiked: !rep.isLiked };
            }
            return rep;
          })
        };
      }
      return r;
    }));
  };

  const handleSubmitReply = (reviewId: string) => {
    if (!replyText.trim() || isGuest) return;

    const newReply = {
      id: Date.now().toString(),
      userName: user?.displayName || 'مستخدم',
      userPhoto: user?.photoURL || '',
      text: replyText,
      likes: 0,
      isLiked: false,
      createdAt: 'الآن'
    };

    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, replies: [...r.replies, newReply] };
      }
      return r;
    }));

    setReplyText('');
    setReplyingTo(null);
  };

  const getVideoInfo = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (ytMatch && ytMatch[1]) {
      return { type: 'iframe', url: `https://www.youtube.com/embed/${ytMatch[1]}` };
    }

    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (driveMatch && driveMatch[1]) {
      return { type: 'iframe', url: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return { type: 'iframe', url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }

    // SharePoint / OneDrive / Microsoft Stream
    if (url.includes('sharepoint.com') && url.includes('_layouts/15/stream.aspx')) {
      return { type: 'iframe', url: url.replace('stream.aspx', 'embed.aspx') };
    }
    if (url.includes('sharepoint.com') && url.includes('_layouts/15/onedrive.aspx')) {
      return { type: 'iframe', url: url.replace('onedrive.aspx', 'embed.aspx') };
    }

    // Direct Video Files (.mp4, .webm, .ogg)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return { type: 'video', url: url };
    }

    // Generic fallback: Try iframe for everything else
    return { type: 'iframe', url: url };
  };

  return (
    <div className="min-h-screen bg-ivory-white pb-20">
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        <img src={monument.imageUrl} alt={monument.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
        >
          <ArrowRight size={24} />
        </button>

        <button 
          onClick={toggleFavorite}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
        >
          <Heart size={20} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
        </button>

        <div className="absolute bottom-4 right-4 left-4 text-white">
          <div className="inline-block bg-royal-gold text-xs font-bold px-3 py-1 rounded-full mb-2">
            {monument.type}
          </div>
          <h1 className="text-3xl font-bold mb-1">{monument.name}</h1>
          <div className="flex items-center text-gray-200 text-sm">
            <MapPin size={16} className="ml-1" />
            {monument.location}
          </div>
        </div>
      </div>

      {/* Action Buttons (Tabs) */}
      <div className="flex justify-between px-4 py-6 bg-white shadow-sm rounded-b-3xl relative z-10 -mt-4">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex flex-col items-center flex-1 ${activeTab === 'info' ? 'text-royal-gold' : 'text-gray-400'}`}
        >
          <div className={`p-3 rounded-full mb-1 ${activeTab === 'info' ? 'bg-royal-gold/10' : 'bg-gray-50'}`}>
            <Info size={24} />
          </div>
          <span className="text-xs font-bold">المعلومات</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center flex-1 ${activeTab === 'guide' ? 'text-royal-gold' : 'text-gray-400'}`}
        >
          <div className={`p-3 rounded-full mb-1 ${activeTab === 'guide' ? 'bg-royal-gold/10' : 'bg-gray-50'}`}>
            <Headphones size={24} />
          </div>
          <span className="text-xs font-bold">المرشد</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex flex-col items-center flex-1 ${activeTab === 'video' ? 'text-royal-gold' : 'text-gray-400'}`}
        >
          <div className={`p-3 rounded-full mb-1 ${activeTab === 'video' ? 'bg-royal-gold/10' : 'bg-gray-50'}`}>
            <Video size={24} />
          </div>
          <span className="text-xs font-bold">فيديو</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-nile-blue mb-4 border-b-2 border-royal-gold inline-block pb-1">نبذة تاريخية</h2>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
              {monument.description}
            </p>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Toggle Guide Mode */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setGuideMode('audio')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${guideMode === 'audio' ? 'bg-white text-nile-blue shadow-sm' : 'text-gray-500'}`}
              >
                مرشد صوتي مسجل
              </button>
              <button 
                onClick={() => setGuideMode('live')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${guideMode === 'live' ? 'bg-white text-nile-blue shadow-sm' : 'text-gray-500'}`}
              >
                حجز مرشد فعلي
              </button>
            </div>

            {guideMode === 'audio' ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="w-24 h-24 bg-nile-blue/5 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-royal-gold/30 rounded-full animate-pulse"></div>
                  <Headphones size={40} className="text-nile-blue" />
                </div>
                <h3 className="font-bold text-lg mb-2">استمع إلى قصة {monument.name}</h3>
                <p className="text-sm text-gray-500 mb-6">جولة صوتية غامرة تأخذك عبر الزمن</p>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-full bg-royal-gold text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-royal-gold-dark transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  {isPlaying ? 'إيقاف مؤقت' : 'تشغيل المقطع الصوتي'}
                </button>
                {/* Hidden audio element would go here */}
                {isPlaying && <audio src={monument.audioUrl} autoPlay loop className="hidden" />}
              </div>
            ) : (
              <div className="space-y-4">
                {monumentGuides.length > 0 ? (
                  monumentGuides.map(guide => (
                    <div key={guide.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl overflow-hidden">
                            {guide.imageUrl ? <img src={guide.imageUrl} className="w-full h-full object-cover" /> : '👤'}
                          </div>
                          <div>
                            <h4 className="font-bold text-nile-blue">{guide.name}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Star size={14} className="text-royal-gold ml-1 fill-royal-gold" />
                              {guide.rating} • {guide.languages && Array.isArray(guide.languages) ? guide.languages.join('، ') : guide.languages}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedGuideForView(guide)}
                            className="bg-gray-100 text-nile-blue hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            التفاصيل
                          </button>
                          <button 
                            onClick={() => setBookingGuideId(bookingGuideId === guide.id ? null : guide.id)}
                            className={`${bookingGuideId === guide.id ? 'bg-royal-gold text-white' : 'bg-nile-blue text-white hover:bg-nile-blue-light'} px-4 py-2 rounded-lg text-sm font-bold transition-colors`}
                          >
                            {bookingGuideId === guide.id ? 'إلغاء' : 'حجز'}
                          </button>
                        </div>
                      </div>
                      
                      {bookingGuideId === guide.id && (
                        <div className="mt-2 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ الجولة</label>
                              <input 
                                type="date" 
                                value={bookingFormData.date}
                                onChange={e => setBookingFormData({...bookingFormData, date: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-royal-gold outline-none" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">وقت الجولة (مقترح)</label>
                              <select 
                                value={bookingFormData.time}
                                onChange={e => setBookingFormData({...bookingFormData, time: e.target.value})}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-royal-gold outline-none" 
                              >
                                <option value="">اختر الوقت</option>
                                <option value="09:00 صباحاً">09:00 صباحاً</option>
                                <option value="11:00 صباحاً">11:00 صباحاً</option>
                                <option value="02:00 مساءً">02:00 مساءً</option>
                                <option value="04:00 مساءً">04:00 مساءً</option>
                              </select>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleBooking(guide.id, guide.name)}
                            disabled={isSubmittingBooking}
                            className="w-full bg-nile-blue text-white py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
                          >
                            {isSubmittingBooking ? 'جاري التأكيد...' : 'تأكيد الحجز'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد مرشدين متاحين حالياً لهذا المعلم
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Booking Success Modal */}
        {showBookingSuccess && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-nile-blue mb-2">تم تأكيد طلبك مبدئياً! 🌟</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                تم إرسال رسالة إلى بريدك الإلكتروني <span className="font-bold text-nile-blue" dir="ltr">{user?.email}</span> تحتوي على تفاصيل الجولة.<br/>أهلاً بك في رحلة عبر الزمن مع أثر، سيقوم المرشد بالتواصل معك قريباً لتأكيد الموعد النهائي.
              </p>
              <button 
                onClick={() => setShowBookingSuccess(false)}
                className="w-full bg-nile-blue text-white py-3 rounded-xl font-bold hover:bg-nile-blue-light transition-colors"
              >
                حسناً، شكراً
              </button>
            </div>
          </div>
        )}

        {/* Guide Details & Rating Modal */}
        {selectedGuideForView && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-in zoom-in duration-300 flex flex-col max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-nile-blue">بيانات المرشد</h3>
                <button onClick={() => setSelectedGuideForView(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl overflow-hidden">
                  {selectedGuideForView.imageUrl ? <img src={selectedGuideForView.imageUrl} className="w-full h-full object-cover" /> : '👤'}
                </div>
                <div>
                  <h4 className="font-bold text-nile-blue text-lg">{selectedGuideForView.name}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Star size={14} className="text-royal-gold ml-1 fill-royal-gold" />
                    {selectedGuideForView.rating}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">
                <p className="mb-2"><strong className="text-nile-blue">اللغات:</strong> {selectedGuideForView.languages && Array.isArray(selectedGuideForView.languages) ? selectedGuideForView.languages.join('، ') : selectedGuideForView.languages || 'العربية'}</p>
                <p><strong className="text-nile-blue">النبذة:</strong> {selectedGuideForView.description || 'مرشد سياحي معتمد بوزارة السياحة.'}</p>
              </div>

              <h4 className="font-bold text-nile-blue mb-2">إضافة تقييم للمرشد</h4>
              <div className="flex gap-2 mb-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setGuideRatingForm({...guideRatingForm, rating: star})}>
                    <Star 
                      size={28} 
                      className={star <= guideRatingForm.rating ? 'fill-royal-gold text-royal-gold' : 'text-gray-300'} 
                    />
                  </button>
                ))}
              </div>
              <textarea 
                placeholder="شاركنا رأيك في المرشد (اختياري)..."
                value={guideRatingForm.comment}
                onChange={(e) => setGuideRatingForm({...guideRatingForm, comment: e.target.value})}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-royal-gold outline-none resize-none mb-3"
                rows={3}
              />
              <button 
                onClick={() => {
                  alert("شكراً لك! تم إرسال تقييمك للمرشد بنجاح.");
                  setSelectedGuideForView(null);
                  setGuideRatingForm({ rating: 5, comment: '' });
                }}
                className="w-full bg-royal-gold text-white py-2 rounded-lg font-bold shadow-sm"
              >
                إرسال التقييم
              </button>
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative">
              {(() => {
                const videoInfo = getVideoInfo(monument.videoUrl);
                if (!videoInfo) return <div className="text-white flex items-center justify-center h-full">لا يوجد فيديو</div>;
                
                if (videoInfo.type === 'iframe') {
                  return (
                    <iframe
                      src={videoInfo.url}
                      title={monument.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  );
                } else {
                  return (
                    <video 
                      src={videoInfo.url} 
                      controls 
                      className="w-full h-full object-cover"
                      poster={monument.imageUrl}
                    ></video>
                  );
                }
              })()}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              شاهد جولة سينمائية لمعالم {monument.name}
            </p>
          </div>
        )}
      </div>

      {/* Community Section */}
      <div className="px-6 pb-10 mt-4 border-t border-gray-100 pt-8">
        <h2 className="text-xl font-bold text-nile-blue mb-6 flex items-center gap-2">
          <MessageCircle className="text-royal-gold" />
          مجتمع أثر
        </h2>

        {/* Add Review Form */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
          {isGuest ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">قم بتسجيل الدخول لمشاركة تجربتك</p>
              <button onClick={() => navigate('/login')} className="bg-royal-gold text-white px-6 py-2 rounded-xl font-bold text-sm">
                تسجيل الدخول
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewReviewRating(star)}>
                    <Star size={24} className={star <= newReviewRating ? "text-royal-gold fill-royal-gold" : "text-gray-300"} />
                  </button>
                ))}
              </div>
              <textarea
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="شاركنا تجربتك ورأيك في هذا المعلم..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold/50 resize-none h-24 mb-3"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSubmitReview}
                  disabled={!newReviewText.trim()}
                  className="bg-nile-blue text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  نشر التقييم
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {review.userPhoto ? (
                    <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <UserIcon size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-nile-blue text-sm">{review.userName}</h4>
                    <span className="text-xs text-gray-400">{review.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-royal-gold fill-royal-gold" />
                  <span className="text-sm font-bold text-gray-700">{review.rating}</span>
                </div>
              </div>

              {/* Review Body */}
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {review.text}
              </p>

              {/* Review Actions */}
              <div className="flex items-center gap-4 border-t border-gray-50 pt-3">
                <button 
                  onClick={() => handleLikeReview(review.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${review.isLiked ? 'text-nile-blue' : 'text-gray-500 hover:text-nile-blue'}`}
                >
                  <ThumbsUp size={16} className={review.isLiked ? 'fill-nile-blue' : ''} />
                  {review.likes} إعجاب
                </button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-nile-blue transition-colors"
                >
                  <MessageCircle size={16} />
                  رد ({review.replies.length})
                </button>
              </div>

              {/* Replies Section */}
              {(review.replies.length > 0 || replyingTo === review.id) && (
                <div className="mt-4 pl-4 pr-8 border-r-2 border-gray-100 space-y-4">
                  {/* Existing Replies */}
                  {review.replies.map((reply: any) => (
                    <div key={reply.id} className="bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        {reply.userPhoto ? (
                          <img src={reply.userPhoto} alt={reply.userName} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <UserIcon size={12} />
                          </div>
                        )}
                        <h5 className="font-bold text-nile-blue text-xs">{reply.userName}</h5>
                        <span className="text-[10px] text-gray-400">{reply.createdAt}</span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed mb-2">
                        {reply.text}
                      </p>
                      <button 
                        onClick={() => handleLikeReply(review.id, reply.id)}
                        className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${reply.isLiked ? 'text-nile-blue' : 'text-gray-400 hover:text-nile-blue'}`}
                      >
                        <ThumbsUp size={12} className={reply.isLiked ? 'fill-nile-blue' : ''} />
                        {reply.likes}
                      </button>
                    </div>
                  ))}

                  {/* Reply Input */}
                  {replyingTo === review.id && !isGuest && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-royal-gold"
                      />
                      <button 
                        onClick={() => handleSubmitReply(review.id)}
                        disabled={!replyText.trim()}
                        className="bg-royal-gold text-white px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-2xl border border-gray-100">
              لا توجد تقييمات بعد. كن أول من يشارك تجربته!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
