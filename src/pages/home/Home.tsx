import React, { useState, useEffect, useRef } from 'react';
import { splitText, createTimeline, stagger } from 'animejs';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { SmartBuilding3D } from '../../components/home/SmartBuilding3D';
import slide1 from '../../assets/images/slide1.png';
import slide2 from '../../assets/images/slide2.png';
import slide3 from '../../assets/images/slide3.png';
import slide4 from '../../assets/images/slide4.png';
import project1 from '../../assets/project/1.webp';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Mail,
  Lightbulb,
  ArrowUpRight,
  Settings,
  Cpu,
  Wrench,
  MapPin,
  Calendar,
  User,
  Phone,
  Send,
  Check
} from 'lucide-react';

const BRAND_LOGOS = [
  {
    name: 'Schneider Electric',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 175 36" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6C8.5 6 4 10.5 4 16s4.5 10 10 10 10-4.5 10-10S19.5 6 14 6zm1.5 14.5c-3.5 0-6-2-6-5.2 0-3.2 2.3-5.2 5.6-5.2 3.2 0 5.4 1.8 5.7 4.5h-2.3c-.2-1.5-1.5-2.5-3.4-2.5-2 0-3.4 1.4-3.4 3.2 0 1.9 1.4 3.3 3.5 3.3 1.8 0 3-.9 3.4-2.4h2.3c-.4 2.7-2.6 4.3-5.4 4.3z" fill="#009E4D" />
        <path d="M26 12h-2.5l2.4-7h2.2l-2.1 7z" fill="#3DCD58" />
        <text x="32" y="19" fill="#1e293b" fontFamily="Arial, Helvetica, sans-serif" fontSize="13.5" fontWeight="700" letterSpacing="-0.3">Schneider</text>
        <text x="32" y="29" fill="#009E4D" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="600" letterSpacing="0.6">Electric</text>
      </svg>
    )
  },
  {
    name: 'Siemens',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 130 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="24" fill="#00646E" fontFamily="Arial Black, Impact, sans-serif" fontSize="22" fontWeight="900" letterSpacing="2">SIEMENS</text>
      </svg>
    )
  },
  {
    name: 'Honeywell',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 145 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="23" fill="#EE3124" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="21" fontWeight="900" letterSpacing="-0.5">Honeywell</text>
      </svg>
    )
  },
  {
    name: 'Johnson Controls',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 185 36" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="13" fill="#00539B" />
        <path d="M12 23c2.5-.8 5-3.3 5-6.6s-1.7-4.2-4.2-4.2" stroke="#FFD100" strokeWidth="2.8" strokeLinecap="round" />
        <text x="36" y="17" fill="#00539B" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800">Johnson</text>
        <text x="36" y="29" fill="#5C768D" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700">Controls</text>
      </svg>
    )
  },
  {
    name: 'Belimo',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 135 34" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="17" r="14" fill="#F26522" />
        <path d="M11 10h5.5c2 0 3.5 1 3.5 2.8 0 1.2-.8 2.1-1.8 2.4 1.3.3 2.3 1.3 2.3 2.8 0 2-1.6 3-3.8 3H11V10zm3.2 4.4h2.2c.8 0 1.3-.4 1.3-1s-.5-1-1.3-1h-2.2v2zm0 4.6h2.4c.9 0 1.5-.4 1.5-1.1s-.6-1.1-1.5-1.1h-2.4v2.2z" fill="#ffffff" />
        <text x="36" y="23" fill="#F26522" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="18" fontWeight="900" letterSpacing="1.2">BELIMO</text>
      </svg>
    )
  },
  {
    name: 'Danfoss',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 135 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="2" width="28" height="28" rx="6" fill="#ED1C24" />
        <path d="M7 8h7c4 0 7 3 7 7s-3 7-7 7H7V8zm4 3.5v7h3c2 0 3.5-1.5 3.5-3.5s-1.5-3.5-3.5-3.5h-3z" fill="#ffffff" />
        <text x="34" y="23" fill="#ED1C24" fontFamily="Impact, Arial Black, sans-serif" fontSize="21" fontWeight="900" fontStyle="italic" letterSpacing="0.5">Danfoss</text>
      </svg>
    )
  },
  {
    name: 'ABB',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 110 34" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="25" fill="#FF000F" fontFamily="Arial Black, Impact, sans-serif" fontSize="26" fontWeight="900" letterSpacing="2">ABB</text>
      </svg>
    )
  },
  {
    name: 'Daikin',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 140 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="4,24 16,6 28,24" fill="#0096D6" />
        <polygon points="12,24 16,14 20,24" fill="#ffffff" />
        <text x="34" y="23" fill="#0096D6" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="19" fontWeight="900" letterSpacing="1">DAIKIN</text>
      </svg>
    )
  },
  {
    name: 'Mitsubishi Electric',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 185 36" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="#E60012">
          <polygon points="12,6 18,16 12,26 6,16" />
          <polygon points="18,16 24,26 18,36 12,26" />
          <polygon points="6,16 12,26 6,36 0,26" />
        </g>
        <text x="28" y="17" fill="#1A202C" fontFamily="Arial, Helvetica, sans-serif" fontSize="10.5" fontWeight="900" letterSpacing="0.2">MITSUBISHI</text>
        <text x="28" y="28" fill="#E60012" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fontWeight="800" letterSpacing="0.8">ELECTRIC</text>
      </svg>
    )
  },
  {
    name: 'Legrand',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 130 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="22" height="22" rx="4" fill="#E2001A" />
        <path d="M8 10v12h9v-3.5h-5.5V10H8z" fill="#ffffff" />
        <text x="29" y="23" fill="#222222" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="19" fontWeight="900" letterSpacing="-0.5">legrand</text>
      </svg>
    )
  },
  {
    name: 'Panasonic',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 145 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="23" fill="#004098" fontFamily="Helvetica, Arial, sans-serif" fontSize="20" fontWeight="900" letterSpacing="0.5">Panasonic</text>
      </svg>
    )
  },
  {
    name: 'Beckhoff',
    logo: (
      <svg className="brand-logo-svg" viewBox="0 0 140 32" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="23" fill="#EE1C25" fontFamily="Arial Black, Impact, sans-serif" fontSize="18" fontWeight="900" letterSpacing="1.2">BECKHOFF</text>
      </svg>
    )
  }
];

export interface HeroProjectItem {
  id: string | number;
  name: string;
  title: string;
  category: string;
  type: string;
  image: string;
  description: string;
  content: string;
  location: string;
  place: string;
  time: string;
  start: string;
}

const formatProjectImage = (imgPath?: string | null) => {
  if (!imgPath) return project1;
  if (imgPath.startsWith('data:image') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return imgPath;
  }
  let cleanPath = imgPath.replace(/\\/g, '/');
  if (cleanPath.startsWith('/AAA_Backend/')) {
    cleanPath = cleanPath.replace('/AAA_Backend/', '/');
  } else if (cleanPath.startsWith('AAA_Backend/')) {
    cleanPath = cleanPath.replace('AAA_Backend/', '/');
  }
  return cleanPath;
};

export interface HomeNewsItem {
  id: string | number;
  topic: string;
  category: string;
  title: string;
  content: string;
  summary: string;
  time: string;
  date: string;
  image: string;
}

const formatNewsDate = (timeStr?: string) => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return timeStr;
  }
};

const formatNewsImage = (imgPath?: string | null) => {
  if (!imgPath) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80';
  if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return imgPath;
  }
  let cleanPath = imgPath.replace(/\\/g, '/');
  if (cleanPath.startsWith('/AAA_Backend/')) {
    cleanPath = cleanPath.replace('/AAA_Backend/', '/');
  } else if (cleanPath.startsWith('AAA_Backend/')) {
    cleanPath = cleanPath.replace('AAA_Backend/', '/');
  }
  const filename = cleanPath.split('/').pop();
  return `/uploads/news/${filename}`;
};

interface AnimatedStatNumberProps {
  target: number;
  suffix?: string;
  overshoot?: number;
}

const AnimatedStatNumber: React.FC<AnimatedStatNumberProps> = ({ target, suffix = '', overshoot }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const maxVal = overshoot ?? (target > 5 ? target + Math.round(target * 0.15) : target + 1);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const duration = 1800; // Hoạt động 1 lần trong 1.8s khi tải/refresh trang

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < duration) {
        const t = elapsed / duration;
        if (t < 0.7) {
          // Giai đoạn tăng lên: từ 0 lên maxVal (vượt nhẹ con số mục tiêu)
          const subT = t / 0.7;
          const easeOut = 1 - Math.pow(1 - subT, 3);
          const current = Math.round(easeOut * maxVal);
          setDisplayValue(current);
        } else {
          // Giai đoạn giảm xuống: từ maxVal giảm dần về đúng con số mục tiêu
          const subT = (t - 0.7) / 0.3;
          const easeInOut = subT < 0.5 ? 2 * subT * subT : 1 - Math.pow(-2 * subT + 2, 2) / 2;
          const current = Math.round(maxVal - easeInOut * (maxVal - target));
          setDisplayValue(current);
        }
        animId = requestAnimationFrame(step);
      } else {
        // Đã đạt mục tiêu: dừng lại cố định vĩnh viễn ở con số chính xác
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, maxVal]);

  return (
    <span className="stat-number-text">
      {displayValue}{suffix}
    </span>
  );
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 45,
  deleteSpeed = 22,
  pauseDuration = 3500,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length + 1));
        }, speed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length - 1));
        }, deleteSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
        }, 500);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, hasStarted, text, speed, deleteSpeed, pauseDuration]);

  const renderFormattedText = (current: string) => {
    const target3A = current.indexOf('3A');

    if (target3A === -1) {
      if (current.endsWith('3')) {
        return (
          <>
            <span>{current.slice(0, -1)}</span>
            <span className="brand-name-green" style={{ fontWeight: 700 }}>3</span>
          </>
        );
      }
      return <span>{current}</span>;
    }

    const before3A = current.slice(0, target3A);
    const afterBefore3A = current.slice(target3A);

    const part3A = afterBefore3A.slice(0, 2);
    const after3A = afterBefore3A.slice(2);

    const partHOME = after3A.slice(0, 4);
    const afterHOME = after3A.slice(4);

    return (
      <>
        <span>{before3A}</span>
        {part3A && <span className="brand-name-green" style={{ fontWeight: 700 }}>{part3A}</span>}
        {partHOME && <span className="brand-name-blue" style={{ fontWeight: 700 }}>{partHOME}</span>}
        {afterHOME && <span>{afterHOME}</span>}
      </>
    );
  };

  return (
    <p ref={containerRef} className="typewriter-p">
      {renderFormattedText(displayText)}
      <span className="typewriter-cursor">|</span>
    </p>
  );
};

export const Home: React.FC = () => {
  // State for consultation request form
  const [consultForm, setConsultForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    demandType: 'Tư vấn giải pháp',
    content: ''
  });
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vanta.NET 3D animated background ref
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    const initVanta = () => {
      const w = window as any;
      if (w.VANTA && w.VANTA.NET && vantaRef.current && !vantaEffect.current) {
        try {
          vantaEffect.current = w.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x2563eb, // var(--color-primary)
            backgroundColor: 0xffffff,
            backgroundAlpha: 0.0,
            points: 10.0,
            maxDistance: 22.0,
            spacing: 17.0
          });
        } catch (err) {
          console.error('Error initializing Vanta.NET:', err);
        }
      }
    };

    if ((window as any).VANTA && (window as any).VANTA.NET) {
      initVanta();
    } else {
      const timer = setInterval(() => {
        if ((window as any).VANTA && (window as any).VANTA.NET) {
          initVanta();
          clearInterval(timer);
        }
      }, 150);
      return () => clearInterval(timer);
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConsultForm((prev) => ({ ...prev, content: e.target.value }));
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.max(100, target.scrollHeight)}px`;
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultForm.fullName.trim() || !consultForm.phone.trim() || !consultForm.email.trim()) return;
    setIsSubmitting(true);

    try {
      // Lưu vào CSDL 3AHOME qua Backend API (Backend tự động gửi email qua Gmail SMTP tới 3ahomeadmin@gmail.com & son.lm@3ahome.vn)
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: consultForm.fullName.trim(),
          email: consultForm.email.trim(),
          phone: consultForm.phone.trim(),
          type: consultForm.demandType,
          content: consultForm.content.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi phản hồi từ máy chủ: ' + res.status);
      }
    } catch (err) {
      console.warn('Lỗi khi gửi tư vấn tới API, sao lưu dự phòng:', err);
      try {
        const backup = JSON.parse(localStorage.getItem('3ahome_consult_db') || '[]');
        backup.push({
          id: Date.now(),
          time: new Date().toISOString(),
          full_name: consultForm.fullName.trim(),
          email: consultForm.email.trim(),
          phone: consultForm.phone.trim(),
          type: consultForm.demandType,
          content: consultForm.content.trim(),
          status: 1
        });
        localStorage.setItem('3ahome_consult_db', JSON.stringify(backup));
      } catch {
        // ignore
      }
    } finally {
      setIsSubmitting(false);
      setConsultSubmitted(true);
    }
  };

  // State danh sách dự án nạp động từ bảng project database 3ahome
  const [heroProjects, setHeroProjects] = useState<HeroProjectItem[]>([]);
  const [heroProjIdx, setHeroProjIdx] = useState(0);
  const [isHeroFading, setIsHeroFading] = useState(false);

  // Nạp danh sách dự án từ bảng project database 3ahome
  useEffect(() => {
    const fetchProjectsFromDb = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Lọc các dự án hiển thị (status === 1: Đăng bài)
          const visible = data.data.filter((item: any) => Number(item.status) === 1);
          const mapped: HeroProjectItem[] = visible.map((p: any) => ({
            id: p.id,
            name: p.title || '',
            title: p.title || '',
            category: p.type || '',
            type: p.type || '',
            image: formatProjectImage(p.image),
            description: p.content || '',
            content: p.content || '',
            location: p.place || '',
            place: p.place || '',
            time: p.start || p.year || '',
            start: p.start || p.year || ''
          }));
          setHeroProjects(mapped);
        }
      } catch (err) {
        console.error('Lỗi nạp dự án database 3ahome:', err);
      }
    };
    fetchProjectsFromDb();
  }, []);

  const handleNextHeroProject = () => {
    const count = heroProjects.length > 0 ? heroProjects.length : 1;
    setIsHeroFading(true);
    setTimeout(() => {
      setHeroProjIdx((prev) => (prev + 1) % count);
      setIsHeroFading(false);
    }, 220);
  };

  useEffect(() => {
    if (heroProjects.length <= 1) return;
    const interval = setInterval(() => {
      handleNextHeroProject();
    }, 4500);
    return () => clearInterval(interval);
  }, [heroProjIdx, heroProjects.length]);

  const DEFAULT_HERO_PROJECT: HeroProjectItem = {
    id: 'default',
    name: 'Dự án Smart Home & BMS 3AHOME',
    title: 'Dự án Smart Home & BMS 3AHOME',
    category: 'Công trình tiêu biểu',
    type: 'Công trình tiêu biểu',
    image: project1,
    description: 'Giải pháp toà nhà thông minh, điều khiển trung tâm BMS và quản lý năng lượng toàn diện.',
    content: 'Giải pháp toà nhà thông minh, điều khiển trung tâm BMS và quản lý năng lượng toàn diện.',
    location: 'Việt Nam',
    place: 'Việt Nam',
    time: '2025 - 2026',
    start: '2025 - 2026'
  };

  const DEFAULT_NEWS_ITEM: HomeNewsItem = {
    id: 'default-news',
    topic: 'Tin tức',
    category: 'Tin tức',
    title: 'Giải pháp công nghệ toà nhà thông minh và BMS thế hệ mới 3AHOME',
    content: 'Cập nhật xu hướng công nghệ, thiết bị điều khiển thông minh và các hoạt động triển khai nổi bật của 3AHOME.',
    summary: 'Cập nhật xu hướng công nghệ, thiết bị điều khiển thông minh và các hoạt động triển khai nổi bật của 3AHOME.',
    time: 'Mới cập nhật',
    date: 'Mới cập nhật',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
  };

  const currentHeroProject = (heroProjects && heroProjects.length > 0 && heroProjects[heroProjIdx]) || (heroProjects && heroProjects[0]) || DEFAULT_HERO_PROJECT;

  // Nạp tin tức từ bảng news database 3ahome
  const [dbNews, setDbNews] = useState<HomeNewsItem[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const visible = data.data.filter((item: any) => Number(item.status) === 1);
          // Sắp xếp theo cột time mới nhất lên đầu
          visible.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
          const mapped: HomeNewsItem[] = visible.map((item: any) => ({
            id: item.id,
            topic: item.topic || 'Tin tức',
            category: item.topic || 'Tin tức',
            title: item.title,
            content: item.content,
            summary: item.content,
            time: formatNewsDate(item.time),
            date: formatNewsDate(item.time),
            image: formatNewsImage(item.image)
          }));
          setDbNews(mapped);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải tin tức database 3ahome:', err);
      });
  }, []);

  // Hàng trong bảng news có time mới nhất
  const latestNewsItem: HomeNewsItem = (dbNews && dbNews.length > 0 && dbNews[0]) ? dbNews[0] : DEFAULT_NEWS_ITEM;

  // Các hàng còn lại trong bảng news
  const sidebarNewsItems: HomeNewsItem[] = (dbNews && dbNews.length > 1) ? dbNews.slice(1).filter(Boolean) : [];

  // SplitText effect for BMS Smart Building section header - triggers once on view/refresh
  const bmsHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = bmsHeaderRef.current;
    if (!container) return;

    let tl: any = null;
    let splitH2: any = null;
    let splitP: any = null;
    let hasAnimated = false;

    const playRevealAnimation = () => {
      if (hasAnimated) return;
      hasAnimated = true;

      const h2 = container.querySelector('h2');
      const p = container.querySelector('p');
      if (!h2 || !p) return;

      // Split text with Anime.js v4 splitText
      splitH2 = splitText(h2, {
        words: { wrap: 'clip' },
        chars: true,
      });

      splitP = splitText(p, {
        words: { wrap: 'clip' },
        chars: true,
      });

      const words = [...splitH2.words, ...splitP.words];

      // Single entrance timeline, no looping, stays permanently displayed
      tl = createTimeline({
        loop: false,
        defaults: { ease: 'inOut(3)', duration: 650 },
      })
        .add(
          words,
          {
            y: [(el: any) => (+el.dataset.line % 2 ? '100%' : '-100%'), '0%'],
          },
          stagger(100)
        )
        .init();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            playRevealAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (tl) tl.revert();
      if (splitH2) splitH2.revert();
      if (splitP) splitP.revert();
    };
  }, []);

  return (
    <div className="landing-page-root">
      {/* 1. TOP NAVIGATION BAR */}
      <Header />

      {/* ===================================================================
          2. HERO SECTION
         =================================================================== */}
      <section className="hero-saas-section">
        <div className="hero-saas-container">
          {/* Left Text Column */}
          <div className="hero-text-col">
            <div className="hero-pill-badge">
              <Sparkles size={14} />
              <span>Giải pháp thông minh cho mọi công trình</span>
            </div>

            <h1 className="hero-saas-title">
              Công ty TNHH Công nghệ thông minh <br />
              <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME</span> Việt Nam
            </h1>

            <p className="hero-saas-subtitle">
              là nhà cung cấp giải pháp và thiết bị trong lĩnh vực tự động hoá, điều khiển cho các công trình xây dựng và công nghiệp tại Việt Nam.
            </p>

            <div className="hero-btn-row">
              <a href="#trial" className="btn-hero-primary-saas">
                <span>Hồ sơ năng lực</span>
              </a>
              <a href="#project" className="btn-hero-outline-saas">
                <span>Dự án tham gia</span>
              </a>
            </div>
          </div>

          {/* Right Visual Column (Portrait with Floating Glass Card) */}
          <div className="hero-image-col">
            <div className="hero-portrait-frame">
              <img
                src={formatProjectImage(currentHeroProject?.image || project1)}
                alt={currentHeroProject?.title || currentHeroProject?.name || ''}
                className={`hero-main-photo ${isHeroFading ? 'fading' : ''}`}
                onError={(e) => {
                  e.currentTarget.src = project1;
                }}
              />

              {/* Floating Glass Banner Preview Card */}
              <div className="floating-consent-widget">
                {/* Khung tên đè lên cạnh trên bên trái */}
                <div className="widget-top-badge">
                  <span>Dự án tiêu biểu</span>
                </div>

                <div className={`widget-content ${isHeroFading ? 'fading' : ''}`}>
                  <div className="widget-header">
                    <div className="widget-brand">
                      <strong>{currentHeroProject?.title || currentHeroProject?.name || ''}</strong>
                    </div>
                  </div>
                  <p className="widget-text">
                    {currentHeroProject?.content || currentHeroProject?.description || ''}
                  </p>
                  <div className="widget-bottom-row">
                    <div className="widget-category-preview">
                      <div className="cat-chip active">{currentHeroProject?.place || currentHeroProject?.location || ''}</div>
                      <div className="cat-chip active">{currentHeroProject?.start || currentHeroProject?.time || ''}</div>
                    </div>
                    <div className="widget-actions">
                      <button
                        type="button"
                        className="widget-btn-arrow"
                        onClick={handleNextHeroProject}
                        title="Dự án tiếp theo"
                        aria-label="Xem chi tiết dự án"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. METRICS / STATS BAR
         =================================================================== */}
      <section className="stats-bar-section">
        <div className="stats-bar-container">
          <div className="stat-metric-cell">
            <AnimatedStatNumber target={6} suffix="+" overshoot={8} />
            <span className="stat-label-text">Năm kinh nghiệm</span>
          </div>
          <div className="stat-metric-cell">
            <AnimatedStatNumber target={50} suffix="+" overshoot={58} />
            <span className="stat-label-text">Dự án hoàn thành</span>
          </div>
          <div className="stat-metric-cell">
            <AnimatedStatNumber target={2} suffix="" overshoot={3} />
            <span className="stat-label-text">Đối tác quốc tế</span>
          </div>
          <div className="stat-metric-cell">
            <AnimatedStatNumber target={100} suffix="%" overshoot={108} />
            <span className="stat-label-text">Khách hàng hài lòng</span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. CAM KẾT MANG LẠI GIÁ TRỊ THỰC
         =================================================================== */}
      <section id="features" className="commitments-section">
        <div className="section-header-centered">
          <h2>
            <span className="brand-name-green">3A</span><span className="brand-name-blue">HOME luôn là đối tác tin cậy</span>
          </h2>
        </div>

        <div className="commitments-frames-grid">
          <div className="commitment-frame-box">
            <h4 className="commitment-title">Tối ưu chi phí</h4>
            <div className="commitment-img-wrap">
              <img src={slide1} alt="Tối ưu chi phí - 3AHOME" className="commitment-img" />
            </div>
            <p className="commitment-desc">
              Giải pháp tối ưu chi phí đầu tư và vận hành dài hạn. Tiết kiệm đến 30% năng lượng.
            </p>
          </div>

          <div className="commitment-frame-box">
            <h4 className="commitment-title">Dễ mở rộng nâng cấp</h4>
            <div className="commitment-img-wrap">
              <img src={slide2} alt="Dễ mở rộng nâng cấp - 3AHOME" className="commitment-img" />
            </div>
            <p className="commitment-desc">
              Khả năng mở rộng linh hoạt với giao thức BACnet/Modbus, tích hợp đa hãng.
            </p>
          </div>

          <div className="commitment-frame-box">
            <h4 className="commitment-title">Đội ngũ chuyên nghiệp</h4>
            <div className="commitment-img-wrap">
              <img src={slide3} alt="Đội ngũ chuyên nghiệp - 3AHOME" className="commitment-img" />
            </div>
            <p className="commitment-desc">
              Kỹ sư giàu kinh nghiệm về tự động hoá, BMS được chứng nhận quốc tế.
            </p>
          </div>

          <div className="commitment-frame-box">
            <h4 className="commitment-title">Hỗ trợ 24/7</h4>
            <div className="commitment-img-wrap">
              <img src={slide4} alt="Hỗ trợ 24.7 - 3AHOME" className="commitment-img" />
            </div>
            <p className="commitment-desc">
              Dịch vụ hỗ trợ kỹ thuật 24/7, xử lý sự cố nhanh chóng và bảo dưỡng định kỳ trọn đời.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. SECTION 3: DARK NAVY CONTRAST BANNER
         =================================================================== */}
      <section className="dark-contrast-section">
        <div ref={vantaRef} className="dark-card-wrapper">
          {/* 4 Corner Tech Borders */}
          <span className="card-corner corner-top-left" aria-hidden="true" />
          <span className="card-corner corner-top-right" aria-hidden="true" />
          <span className="card-corner corner-bottom-left" aria-hidden="true" />
          <span className="card-corner corner-bottom-right" aria-hidden="true" />

          <div className="dark-section-header">
            <h2>Giải pháp thông minh cho mọi công trình</h2>
            <p>Đáp ứng đa dạng mọi nhu cầu</p>
          </div>

          <div className="dark-features-grid">
            <div className="dark-feature-box">
              <div className="dark-feature-top">
                <div className="dark-feature-icon">
                  <Lightbulb size={22} />
                </div>
                <ArrowUpRight size={20} className="feature-arrow-icon" />
              </div>
              <h4>Tư vấn giải pháp</h4>
              <p>Tư vấn giải pháp tự động hoá và BMS từ giai đoạn thiết kế.</p>
            </div>

            <div className="dark-feature-box">
              <div className="dark-feature-top">
                <div className="dark-feature-icon">
                  <Cpu size={22} />
                </div>
                <ArrowUpRight size={20} className="feature-arrow-icon" />
              </div>
              <h4>Cung cấp thiết bị BMS</h4>
              <p>Cung cấp thiết bị hệ thống chính hãng.</p>
            </div>

            <div className="dark-feature-box">
              <div className="dark-feature-top">
                <div className="dark-feature-icon">
                  <Wrench size={22} />
                </div>
                <ArrowUpRight size={20} className="feature-arrow-icon" />
              </div>
              <h4>Lắp đặt và Tích hợp</h4>
              <p>Lắp đặt, lập trình, tích hợp và commissioning hệ thống.</p>
            </div>

            <div className="dark-feature-box">
              <div className="dark-feature-top">
                <div className="dark-feature-icon">
                  <ShieldCheck size={22} />
                </div>
                <ArrowUpRight size={20} className="feature-arrow-icon" />
              </div>
              <h4>Bảo hành và Hỗ trợ</h4>
              <p>Dịch vụ bảo hành, bảo trì và hỗ trợ kỹ thuật nhanh chóng.</p>
            </div>

            <div className="dark-feature-box">
              <div className="dark-feature-top">
                <div className="dark-feature-icon">
                  <Settings size={22} />
                </div>
                <ArrowUpRight size={20} className="feature-arrow-icon" />
              </div>
              <h4>Van điều khiển HVAC</h4>
              <p>Cung cấp van cầu, van bi, van bướm với chứng chỉ EN331.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================
          BRAND LOGOS MARQUEE SECTION (RIGHT TO LEFT)
         =================================================================== */}
      <section className="brand-marquee-section">
        <div className="brand-marquee-wrapper">
          <div className="brand-marquee-frame">
            <div className="brand-marquee-track">
              {BRAND_LOGOS.map((brand, idx) => (
                <div key={`brand-1-${idx}`} className="brand-logo-item" title={brand.name}>
                  {brand.logo}
                </div>
              ))}
              {BRAND_LOGOS.map((brand, idx) => (
                <div key={`brand-2-${idx}`} className="brand-logo-item" title={brand.name}>
                  {brand.logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. SECTION 4: 3D HIGH-RISE SMART BUILDING
         =================================================================== */}
      <section className="features-grid-section">
        <div className="section-header-centered" ref={bmsHeaderRef}>
          <h2 className="brand-name-blue" style={{ color: '#105ca8' }}>Hệ thống quản lý toà nhà thông minh</h2>
          <p>Cung cấp đầy đủ phần mềm đến thiết bị điều khiển và cảm biến.</p>
        </div>

        <div className="bms-building-outer-container">
          <SmartBuilding3D />
        </div>
      </section>

      {/* ===================================================================
          7. SECTION 5: DỰ ÁN ĐÃ TRIỂN KHAI
         =================================================================== */}
      <section id="project" className="projects-showcase-section">
        <div className="section-header-centered">
          <h2 className="gradient-flow-title">Dự án đã tham gia</h2>
          <p>3AHOME tự hào đồng hành cùng các công trình biểu tượng, toà nhà văn phòng và khu công nghiệp trên toàn quốc.</p>
        </div>

        <div className="projects-carousel-outer">
          {heroProjects.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Đang tải danh sách dự án...
            </div>
          ) : (
            <div className={`projects-carousel-track ${heroProjects.length > 3 ? 'auto-scroll-active' : ''}`}>
              {(heroProjects.length > 3 ? [...heroProjects, ...heroProjects] : heroProjects).filter(Boolean).map((project, idx) => (
                <div key={`${project.id}-${idx}`} className="project-card-container">
                  {/* Khung con 1 (khung trên): Chứa hình ảnh dự án */}
                  <div className="project-sub-image-box">
                    <img
                      src={formatProjectImage(project?.image || project1)}
                      alt={project?.title || project?.name || ''}
                      className="project-img-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = project1;
                      }}
                    />
                    <span className="project-category-badge">{project?.type || project?.category || ''}</span>
                  </div>

                  {/* Khung con 2 (khung giữa): Tên dự án & mô tả dự án */}
                  <div className="project-sub-content-box">
                    <h3 className="project-title-text">{project?.title || project?.name || ''}</h3>
                    <p className="project-desc-text">{project?.content || project?.description || ''}</p>
                  </div>

                  {/* Khung con 3 (khung dưới): Địa điểm & thời gian */}
                  <div className="project-sub-meta-box">
                    <div className="project-meta-pill location-pill">
                      <MapPin size={14} className="meta-icon" />
                      <span>{project?.place || project?.location || ''}</span>
                    </div>
                    <div className="project-meta-pill time-pill">
                      <Calendar size={14} className="meta-icon" />
                      <span>{project?.start || project?.time || ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          8. SECTION 6: KHỐI TIN TỨC & SỰ KIỆN
         =================================================================== */}
      <section id="news" className="news-showcase-section">
        <div className="news-showcase-container">
          <div className="section-header-centered">
            <h2 className="gradient-flow-title">Tin tức và Sự kiện</h2>
            <TypewriterText text="Cập nhật xu hướng công nghệ và các hoạt động nổi bật từ 3AHOME." />
          </div>

          <div className="news-two-col-layout">
            {/* Khung bên trái: Tin mới nhất */}
            <div className="news-col-left">
              {latestNewsItem ? (
                <article className="news-latest-card">
                  <div className="latest-card-img-wrap">
                    <img
                      src={latestNewsItem?.image || DEFAULT_NEWS_ITEM.image}
                      alt={latestNewsItem?.title || ''}
                      className="latest-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80';
                      }}
                    />
                    <span className="latest-card-badge">{latestNewsItem?.topic || 'Tin tức'}</span>
                    <span className="latest-tag-pill">TIN MỚI NHẤT</span>
                  </div>

                  <div className="latest-card-content">
                    <div className="news-card-meta">
                      <span className="meta-date">
                        <Calendar size={14} className="meta-icon" />
                        {latestNewsItem?.time || ''}
                      </span>
                    </div>

                    <h3 className="latest-card-title">
                      <a href="#news">{latestNewsItem?.title || ''}</a>
                    </h3>

                    <p className="latest-card-summary">{latestNewsItem?.content || ''}</p>

                    <div className="latest-card-footer">
                      <a href="#news" className="news-detail-btn">
                        <span>Đọc tiếp</span>
                        <ArrowRight size={15} />
                      </a>
                    </div>
                  </div>
                </article>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải tin tức...
                </div>
              )}
            </div>

            {/* Khung bên phải: Các khung con xếp thành cột (nếu > 3 tin sẽ xuất hiện thanh cuộn dọc) */}
            <div className={`news-col-right ${sidebarNewsItems.length > 3 ? 'has-scrollbar' : ''}`}>
              {sidebarNewsItems.map((item) => (
                <article key={item?.id} className="news-item-card">
                  <div className="news-item-img-wrap">
                    <img
                      src={item?.image || DEFAULT_NEWS_ITEM.image}
                      alt={item?.title || ''}
                      className="news-item-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  <div className="news-item-info">
                    <div className="news-card-meta">
                      <span className="item-category-tag">{item?.topic || ''}</span>
                      <span className="meta-date">
                        <Calendar size={13} className="meta-icon" />
                        {item?.time || ''}
                      </span>
                    </div>

                    <h4 className="news-item-title">
                      <a href="#news">{item?.title || ''}</a>
                    </h4>

                    <p className="news-item-summary">{item?.content || ''}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ===================================================================
          10. SECTION 7: KHUNG ĐĂNG KÝ NHẬN TƯ VẤN MIỄN PHÍ
         =================================================================== */}
      <section id="trial" className="cta-banner-section consult-section">
        <div className="cta-banner-card consult-card-wrap">
          <div className="cta-card-content consult-header">
            <h2>Đăng ký nhận tư vấn miễn phí</h2>
            <p>
              Hãy chia sẻ thông tin dự án của Quý khách. Đội ngũ kỹ sư giàu kinh nghiệm của{' '}
              <strong>
                <span className="brand-name-green" style={{ color: '#0b8645' }}>3A</span>
                <span className="brand-name-blue" style={{ color: '#105ca8' }}>HOME</span>
              </strong>{' '}
              sẽ trực tiếp khảo sát và gửi phương án báo giá tối ưu nhất.
            </p>
          </div>

          <div className="consult-form-container">
            {consultSubmitted ? (
              <div className="consult-success-panel">
                <div className="consult-success-check">
                  <Check size={36} strokeWidth={2.5} />
                </div>
                <h3>Gửi yêu cầu tư vấn thành công!</h3>
                <p>
                  Cảm ơn Quý khách <strong>{consultForm.fullName}</strong> đã quan tâm đến giải pháp của{' '}
                  <strong>
                    <span className="brand-name-green" style={{ color: '#0b8645' }}>3A</span>
                    <span className="brand-name-blue" style={{ color: '#105ca8' }}>HOME</span>
                  </strong>.
                  Chúng tôi đã tiếp nhận yêu cầu <strong>"{consultForm.demandType}"</strong> và{' '}
                  <strong>
                    <span className="brand-name-green" style={{ color: '#0b8645' }}>3A</span>
                    <span className="brand-name-blue" style={{ color: '#105ca8' }}>HOME</span>
                  </strong>{' '}
                  sẽ chủ động liên hệ qua số điện thoại <strong>{consultForm.phone}</strong> trong thời gian sớm nhất.
                </p>
                <button
                  type="button"
                  className="btn-consult-reset"
                  onClick={() => {
                    setConsultSubmitted(false);
                    setConsultForm({
                      fullName: '',
                      email: '',
                      phone: '',
                      demandType: 'Tư vấn giải pháp',
                      content: ''
                    });
                    if (contentTextareaRef.current) {
                      contentTextareaRef.current.style.height = 'auto';
                    }
                  }}
                >
                  Gửi thêm yêu cầu khác
                </button>
              </div>
            ) : (
              <form className="consult-main-form" onSubmit={handleConsultSubmit}>
                {/* Hàng 1: 3 ô nhập Họ và tên, Email, Số điện thoại */}
                <div className="consult-grid-3">
                  <div className="consult-field-item">
                    <label htmlFor="consult-name" className="consult-input-label">
                      Họ và tên <span className="label-req">*</span>
                    </label>
                    <div className="consult-input-wrapper">
                      <User size={18} className="consult-icon" />
                      <input
                        id="consult-name"
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={consultForm.fullName}
                        onChange={(e) => setConsultForm({ ...consultForm, fullName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="consult-field-item">
                    <label htmlFor="consult-email" className="consult-input-label">
                      Email <span className="label-req">*</span>
                    </label>
                    <div className="consult-input-wrapper">
                      <Mail size={18} className="consult-icon" />
                      <input
                        id="consult-email"
                        type="email"
                        required
                        placeholder="email@congty.com"
                        value={consultForm.email}
                        onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="consult-field-item">
                    <label htmlFor="consult-phone" className="consult-input-label">
                      Số điện thoại <span className="label-req">*</span>
                    </label>
                    <div className="consult-input-wrapper">
                      <Phone size={18} className="consult-icon" />
                      <input
                        id="consult-phone"
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={consultForm.phone}
                        onChange={(e) => setConsultForm({ ...consultForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Hàng 2: Chọn loại nhu cầu */}
                <div className="consult-demand-block">
                  <label className="consult-input-label">Chọn loại nhu cầu:</label>
                  <div className="consult-demand-options">
                    {[
                      'Tư vấn giải pháp',
                      'Báo giá sản phẩm',
                      'Triển khai dự án',
                      'Bảo trì và Hỗ trợ'
                    ].map((type) => {
                      const isSelected = consultForm.demandType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`demand-option-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => setConsultForm({ ...consultForm, demandType: type })}
                        >
                          <span className={`demand-check-circle ${isSelected ? 'selected' : ''}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hàng 3: Ô nhập nội dung */}
                <div className="consult-textarea-block">
                  <label htmlFor="consult-content" className="consult-input-label">
                    Nội dung yêu cầu
                  </label>
                  <div className="consult-textarea-wrapper">
                    <textarea
                      ref={contentTextareaRef}
                      id="consult-content"
                      rows={4}
                      placeholder="Mô tả sơ lược về công trình, quy mô, yêu cầu kỹ thuật hoặc câu hỏi Quý khách cần giải đáp..."
                      value={consultForm.content}
                      onChange={handleContentChange}
                      style={{ overflowY: 'hidden', resize: 'none' }}
                    />
                  </div>
                </div>

                {/* Hàng 4: Nút gửi Yêu cầu & Cam kết */}
                <div className="consult-submit-row">
                  <button type="submit" className="btn-consult-submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span>Đang gửi thông tin...</span>
                    ) : (
                      <>
                        <span>Gửi Yêu cầu</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </div>

                <div className="consult-guarantees-bar">
                  <span>✓ Khảo sát và tư vấn hoàn toàn miễn phí</span>
                  <span>✓ Gửi báo giá chi tiết</span>
                  <span>✓ Bảo mật 100% thông tin dự án</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================
          11. FOOTER
         =================================================================== */}
      <Footer />
    </div>
  );
};

export default Home;
