export const mockMonuments = [
  {
    id: '1',
    name: 'أهرامات الجيزة',
    type: 'فرعوني',
    location: 'الجيزة',
    description: 'تعتبر أهرامات الجيزة من أهم المعالم الأثرية في العالم، وهي إحدى عجائب الدنيا السبع القديمة التي لا تزال باقية. بنيت كمقابر للفراعنة خوفو وخفرع ومنكاورع.',
    imageUrl: 'https://images.unsplash.com/photo-1600521605604-b347461eb001?auto=format&fit=crop&q=80&w=1000',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    latitude: 29.9792,
    longitude: 31.1342
  },
  {
    id: '2',
    name: 'جامع السلطان حسن',
    type: 'إسلامي',
    location: 'القاهرة',
    description: 'يعد مسجد ومدرسة السلطان حسن من أعظم الآثار الإسلامية في مصر والعالم، ويتميز بضخامة البناء ودقة الزخارف، بني في العصر المملوكي.',
    imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&q=80&w=1000',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    latitude: 30.0322,
    longitude: 31.2560
  },
  {
    id: '3',
    name: 'قلعة قايتباي',
    type: 'إسلامي',
    location: 'الإسكندرية',
    description: 'قلعة دفاعية بناها السلطان الأشرف أبو النصر قايتباي على أنقاض فنار الإسكندرية القديم لحماية المدينة من الهجمات البحرية.',
    imageUrl: 'https://images.unsplash.com/photo-1596306499300-0b7b1689b9f6?auto=format&fit=crop&q=80&w=1000',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    latitude: 31.2140,
    longitude: 29.8856
  },
  {
    id: '4',
    name: 'معبد الكرنك',
    type: 'فرعوني',
    location: 'الأقصر',
    description: 'أكبر مجمع ديني في العالم القديم، يضم مجموعة من المعابد والمقاصير والأعمدة الضخمة التي تعكس عظمة العمارة المصرية القديمة.',
    imageUrl: 'https://images.unsplash.com/photo-1533596665476-c22501042b36?auto=format&fit=crop&q=80&w=1000',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    latitude: 25.7188,
    longitude: 32.6573
  }
];

export const mockGuides = [
  {
    id: 'g1',
    name: 'أحمد محمود',
    rating: 4.8,
    languages: ['العربية', 'English', 'Français'],
    phone: '+201000000000',
    monumentId: '1'
  },
  {
    id: 'g2',
    name: 'سارة حسن',
    rating: 4.9,
    languages: ['العربية', 'English', 'Deutsch'],
    phone: '+201100000000',
    monumentId: '2'
  }
];

export const mockReviews: Record<string, any[]> = {
  '1': [
    {
      id: 'r1',
      userName: 'أحمد علي',
      userPhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
      rating: 5,
      text: 'مكان رائع جداً وتجربة لا تُنسى. أنصح الجميع بزيارته! المرشد الصوتي كان مفيداً للغاية.',
      likes: 12,
      isLiked: false,
      createdAt: 'منذ يومين',
      replies: [
        {
          id: 'rep1',
          userName: 'سارة محمد',
          userPhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
          text: 'هل كان المكان مزدحماً وقت زيارتك؟ أفكر في الذهاب غداً.',
          likes: 2,
          isLiked: false,
          createdAt: 'منذ يوم'
        }
      ]
    },
    {
      id: 'r2',
      userName: 'محمود حسن',
      userPhoto: '',
      rating: 4,
      text: 'عظمة التاريخ تتجلى هنا. التنظيم ممتاز ولكن الجو كان حاراً جداً.',
      likes: 5,
      isLiked: false,
      createdAt: 'منذ أسبوع',
      replies: []
    }
  ]
};
