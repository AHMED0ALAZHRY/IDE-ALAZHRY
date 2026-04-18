import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Headphones, Video, MapPin, Star, Play, Pause, MessageCircle, ThumbsUp, Send, User as UserIcon, Heart, Calendar, Clock, CheckCircle } from 'lucide-react';
import { mockGuides, mockReviews as initialMockReviews } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useMonuments } from '../hooks/useMonuments';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

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
    if (!id) return;
    const q = query(collection(db, 'reviews'), where('monumentId', '==', id));
    const unsub = onSnapshot(q, (snapshot) => {
      const dbReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      dbReviews.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      const formattedReviews = dbReviews.map(r => ({
        ...r,
        createdAt: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن',
        likes: r.likedBy?.length || 0,
        isLiked: user && !isGuest ? (r.likedBy || []).includes(user.uid) : false,
        replies: r.replies ? r.replies.map((reply: any) => ({
          ...reply,
          likes: reply.likedBy?.length || 0,
          isLiked: user && !isGuest ? (reply.likedBy || []).includes(user.uid) : false,
        })) : []
      }));

      // If there are real reviews, show them. Otherwise show mock data for presentation
      if (formattedReviews.length > 0) {
        setReviews(formattedReviews);
      } else {
        setReviews(initialMockReviews[id] || []);
      }
    });

    return () => unsub();
  }, [id, user, isGuest]);

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

  const handleSubmitReview = async () => {
    if (!newReviewText.trim() || isGuest || !user) return;
    
    try {
      await addDoc(collection(db, 'reviews'), {
        monumentId: id,
        userName: user.displayName || 'مستخدم',
        userPhoto: user.photoURL || '',
        userId: user.uid,
        rating: newReviewRating,
        text: newReviewText,
        likedBy: [],
        createdAt: serverTimestamp(),
        replies: []
      });
      setNewReviewText('');
      setNewReviewRating(5);
    } catch (e) {
      console.error("Error adding review", e);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (isGuest || !user) {
      alert("الرجاء تسجيل الدخول لتسجيل الإعجاب");
      return;
    }
    
    // Check if review is mock (not saving to db) or real
    // Mock reviews have string ID that is not a firestore ID, or we can just try/catch
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      if (review.isLiked) {
        await updateDoc(reviewRef, { likedBy: arrayRemove(user.uid) });
      } else {
        await updateDoc(reviewRef, { likedBy: arrayUnion(user.uid) });
      }
    } catch (e) {
      console.error("Error liking review: Is it a mock review?", e);
      // Fallback for mock reviews locally
      setReviews(reviews.map(r => {
        if (r.id === reviewId) {
          return { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked };
        }
        return r;
      }));
    }
  };

  const handleLikeReply = async (reviewId: string, replyId: string) => {
    if (isGuest || !user) return;

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewSnap = await getDoc(reviewRef);
      
      if (reviewSnap.exists()) {
        const reviewData = reviewSnap.data();
        const updatedReplies = reviewData.replies.map((rep: any) => {
          if (rep.id === replyId) {
            const likedBy = rep.likedBy || [];
            if (likedBy.includes(user.uid)) {
              return { ...rep, likedBy: likedBy.filter((uid: string) => uid !== user.uid) };
            } else {
              return { ...rep, likedBy: [...likedBy, user.uid] };
            }
          }
          return rep;
        });
        
        await updateDoc(reviewRef, { replies: updatedReplies });
      }
    } catch (e) {
      console.error(e);
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
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim() || isGuest || !user) return;

    const newReply = {
      id: Date.now().toString(),
      userName: user.displayName || 'مستخدم',
      userPhoto: user.photoURL || '',
      userId: user.uid,
      text: replyText,
      likedBy: [],
      createdAt: new Date().toLocaleDateString('ar-EG')
    };

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        replies: arrayUnion(newReply)
      });
      setReplyText('');
      setReplyingTo(null);
    } catch (e) {
      console.error(e);
      // Fallback for mock review locally
      setReviews(reviews.map(r => {
        if (r.id === reviewId) {
          return { ...r, replies: [...r.replies, newReply] };
        }
        return r;
      }));
      setReplyText('');
      setReplyingTo(null);
    }
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-ivory-white pb-20"
    >
      {/* Hero Image */}
      <div className="relative h-72 w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          src={monument.imageUrl} 
          alt={monument.name} 
          className="w-full h-full object-cover" 
        />
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
        {['info', 'guide', 'video'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`flex flex-col items-center flex-1 relative ${activeTab === tab ? 'text-royal-gold' : 'text-gray-400'}`}
          >
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-full mb-1 z-10 ${activeTab === tab ? 'text-royal-gold' : 'bg-gray-50'}`}
            >
              {tab === 'info' && <Info size={24} />}
              {tab === 'guide' && <Headphones size={24} />}
              {tab === 'video' && <Video size={24} />}
            </motion.div>
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabBadge"
                className="absolute top-0 w-12 h-12 bg-royal-gold/10 rounded-full z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="text-xs font-bold z-10 hover:text-nile-blue transition-colors">
              {tab === 'info' && 'المعلومات'}
              {tab === 'guide' && 'المرشد'}
              {tab === 'video' && 'فيديو'}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6">
        <AnimatePresence mode="wait">
        {activeTab === 'info' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-nile-blue mb-4 border-b-2 border-royal-gold inline-block pb-1">نبذة تاريخية</h2>
            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
              {monument.description}
            </p>
          </motion.div>
        )}

        {activeTab === 'guide' && (
          <motion.div 
            key="guide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Toggle Guide Mode */}
            <div className="relative flex bg-gray-100 p-1 rounded-xl mb-6 overflow-hidden">
              <button 
                onClick={() => setGuideMode('audio')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${guideMode === 'audio' ? 'text-nile-blue' : 'text-gray-500'}`}
              >
                مرشد صوتي مسجل
              </button>
              <button 
                onClick={() => setGuideMode('live')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10 ${guideMode === 'live' ? 'text-nile-blue' : 'text-gray-500'}`}
              >
                حجز مرشد فعلي
              </button>
              <motion.div 
                className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white rounded-lg shadow-sm z-0"
                initial={false}
                animate={{
                  left: guideMode === 'audio' ? 'auto' : '0.25rem',
                  right: guideMode === 'audio' ? '0.25rem' : 'auto'
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            </div>

            <AnimatePresence mode='wait'>
            {guideMode === 'audio' ? (
              <motion.div 
                key="audio"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center"
              >
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
              </motion.div>
            ) : (
              <motion.div 
                key="live"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {monumentGuides.length > 0 ? (
                  monumentGuides.map((guide, index) => (
                    <motion.div 
                      key={guide.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
                    >
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
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setBookingGuideId(bookingGuideId === guide.id ? null : guide.id)}
                            className={`${bookingGuideId === guide.id ? 'bg-royal-gold text-white' : 'bg-nile-blue text-white hover:bg-nile-blue-light'} px-4 py-2 rounded-lg text-sm font-bold transition-colors`}
                          >
                            {bookingGuideId === guide.id ? 'إلغاء' : 'حجز'}
                          </motion.button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {bookingGuideId === guide.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-3 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Calendar size={12}/> تاريخ الجولة</label>
                                  <input 
                                    type="date" 
                                    value={bookingFormData.date}
                                    onChange={e => setBookingFormData({...bookingFormData, date: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-royal-gold outline-none transition-shadow" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={12}/> وقت الجولة (مقترح)</label>
                                  <select 
                                    value={bookingFormData.time}
                                    onChange={e => setBookingFormData({...bookingFormData, time: e.target.value})}
                                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-royal-gold outline-none transition-shadow" 
                                  >
                                    <option value="">اختر الوقت</option>
                                    <option value="09:00 صباحاً">09:00 صباحاً</option>
                                    <option value="11:00 صباحاً">11:00 صباحاً</option>
                                    <option value="02:00 مساءً">02:00 مساءً</option>
                                    <option value="04:00 مساءً">04:00 مساءً</option>
                                  </select>
                                </div>
                              </div>
                              <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleBooking(guide.id, guide.name)}
                                disabled={isSubmittingBooking}
                                className="w-full bg-nile-blue text-white py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 relative overflow-hidden"
                              >
                                {isSubmittingBooking ? 'جاري التأكيد...' : 'تأكيد الحجز'}
                                {isSubmittingBooking && (
                                  <motion.div 
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                  />
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد مرشدين متاحين حالياً لهذا المعلم
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Booking Success Modal */}
        <AnimatePresence>
        {showBookingSuccess && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle size={32} />
              </motion.div>
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
            </motion.div>
          </div>
        )}
        </AnimatePresence>

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
          <motion.div 
            key="video"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Community Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="px-6 pb-10 mt-4 border-t border-gray-100 pt-8"
      >
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
            <motion.div layout>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    key={star} 
                    onClick={() => setNewReviewRating(star)}
                  >
                    <Star size={24} className={star <= newReviewRating ? "text-royal-gold fill-royal-gold transition-colors duration-300" : "text-gray-300 transition-colors duration-300"} />
                  </motion.button>
                ))}
              </div>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="شاركنا تجربتك ورأيك في هذا المعلم..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold/50 resize-none h-24 mb-3"
              />
              <div className="flex justify-end">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitReview}
                  disabled={!newReviewText.trim()}
                  className="bg-nile-blue text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  نشر التقييم
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Reviews List */}
        <motion.div layout className="space-y-6">
          <AnimatePresence mode="popLayout">
          {reviews.map((review, i) => (
            <motion.div 
              layout
              key={review.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i < 5 ? i * 0.1 : 0, type: "spring", bounce: 0.2 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
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
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleLikeReview(review.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${review.isLiked ? 'text-nile-blue' : 'text-gray-500 hover:text-nile-blue'}`}
                >
                  <ThumbsUp size={16} className={review.isLiked ? 'fill-nile-blue' : ''} />
                  {review.likes} إعجاب
                </motion.button>
                <button 
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-nile-blue transition-colors"
                >
                  <MessageCircle size={16} />
                  رد ({review.replies.length})
                </button>
              </div>

              {/* Replies Section */}
              <AnimatePresence>
              {(review.replies.length > 0 || replyingTo === review.id) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pl-4 pr-8 border-r-2 border-gray-100 space-y-4 pt-1">
                    {/* Existing Replies */}
                    <AnimatePresence mode="popLayout">
                    {review.replies.map((reply: any, i: number) => (
                      <motion.div 
                        layout 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={reply.id} 
                        className="bg-gray-50 p-3 rounded-xl"
                      >
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
                        <motion.button 
                          whileTap={{ scale: 0.8 }}
                          onClick={() => handleLikeReply(review.id, reply.id)}
                          className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${reply.isLiked ? 'text-nile-blue' : 'text-gray-400 hover:text-nile-blue'}`}
                        >
                          <ThumbsUp size={12} className={reply.isLiked ? 'fill-nile-blue' : ''} />
                          {reply.likes}
                        </motion.button>
                      </motion.div>
                    ))}
                    </AnimatePresence>

                    {/* Reply Input */}
                    <AnimatePresence>
                    {replyingTo === review.id && !isGuest && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 mt-2"
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب ردك هنا..."
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-royal-gold"
                        />
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSubmitReply(review.id)}
                          disabled={!replyText.trim()}
                          className="bg-royal-gold text-white px-3 py-2 rounded-lg disabled:opacity-50"
                        >
                          <Send size={14} />
                        </motion.button>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          ))}
          
          {reviews.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500 bg-white rounded-2xl border border-gray-100"
            >
              لا توجد تقييمات بعد. كن أول من يشارك تجربته!
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
