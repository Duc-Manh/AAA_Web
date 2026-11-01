import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hiệu ứng cuộn tiêu đề tab trình duyệt (được chuyển vào bundle để tuân thủ CSP không dùng inline script)
if (typeof window !== 'undefined') {
  const baseTitle = '3AHOME VIỆT NAM | Giải Pháp Smart Home, BMS và Tự Động Hoá';
  const spacer = '  —  ';
  const marqueeText = baseTitle + spacer;
  let charIndex = 0;

  setInterval(() => {
    document.title = marqueeText.substring(charIndex) + marqueeText.substring(0, charIndex);
    charIndex = (charIndex + 1) % marqueeText.length;
  }, 240);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
