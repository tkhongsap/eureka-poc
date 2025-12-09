import React from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Keyboard, 
  ExternalLink,
  Mail,
  FileText,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const Help: React.FC = () => {
  const { t, language } = useLanguage();

  const helpSections = [
    {
      icon: BookOpen,
      titleEn: 'User Guide',
      titleTh: 'คู่มือการใช้งาน',
      descEn: 'Learn how to use Eureka CMMS effectively',
      descTh: 'เรียนรู้วิธีใช้งาน Eureka CMMS อย่างมีประสิทธิภาพ',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      available: true,
    },
    {
      icon: Video,
      titleEn: 'Video Tutorials',
      titleTh: 'วิดีโอสอนการใช้งาน',
      descEn: 'Watch step-by-step tutorial videos',
      descTh: 'ดูวิดีโอสอนการใช้งานทีละขั้นตอน',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      available: false,
    },
    {
      icon: MessageCircle,
      titleEn: 'FAQs',
      titleTh: 'คำถามที่พบบ่อย',
      descEn: 'Find answers to common questions',
      descTh: 'ค้นหาคำตอบสำหรับคำถามทั่วไป',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      available: false,
    },
    {
      icon: Mail,
      titleEn: 'Contact Support',
      titleTh: 'ติดต่อฝ่ายสนับสนุน',
      descEn: 'Get help from our support team',
      descTh: 'รับความช่วยเหลือจากทีมสนับสนุน',
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      available: true,
    },
  ];

  const keyboardShortcuts = [
    { keys: ['Ctrl/⌘', 'B'], descEn: 'Toggle sidebar', descTh: 'เปิด/ปิด Sidebar' },
    { keys: ['Ctrl/⌘', 'K'], descEn: 'Open search (coming soon)', descTh: 'เปิดค้นหา (เร็วๆ นี้)' },
  ];

  const releaseNotes = [
    {
      version: 'v0.1.0',
      date: '2025-12-09',
      notesEn: [
        'Initial release with Work Orders management',
        'Kanban board with drag-and-drop',
        'Work Request Portal for requesters',
        'Dashboard with KPIs and charts',
        'Multi-language support (EN/TH)',
      ],
      notesTh: [
        'เปิดตัวระบบจัดการใบงาน',
        'Kanban board พร้อม drag-and-drop',
        'ระบบแจ้งซ่อมสำหรับผู้แจ้ง',
        'Dashboard พร้อม KPIs และกราฟ',
        'รองรับหลายภาษา (EN/TH)',
      ],
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
          <HelpCircle className="text-teal-600" size={28} />
          {language === 'en' ? 'Help & Support' : 'ช่วยเหลือและสนับสนุน'}
        </h1>
        <p className="text-stone-500 mt-1">
          {language === 'en' 
            ? 'Find resources to help you get the most out of Eureka CMMS'
            : 'ค้นหาแหล่งข้อมูลเพื่อใช้งาน Eureka CMMS ได้อย่างเต็มประสิทธิภาพ'}
        </p>
      </div>

      {/* Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {helpSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden ${
                !section.available ? 'opacity-60' : 'hover:shadow-md cursor-pointer'
              } transition-all duration-200`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${section.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">
                        {language === 'en' ? section.titleEn : section.titleTh}
                      </h3>
                      {!section.available && (
                        <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                          {t('common.comingSoon')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                      {language === 'en' ? section.descEn : section.descTh}
                    </p>
                  </div>
                  {section.available && (
                    <ExternalLink size={16} className="text-stone-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Keyboard className="text-violet-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">
              {language === 'en' ? 'Keyboard Shortcuts' : 'ปุ่มลัด'}
            </h2>
            <p className="text-sm text-stone-500">
              {language === 'en' ? 'Quick access with keyboard' : 'เข้าถึงได้เร็วด้วยคีย์บอร์ด'}
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {keyboardShortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-stone-600">
                  {language === 'en' ? shortcut.descEn : shortcut.descTh}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIdx) => (
                    <React.Fragment key={keyIdx}>
                      <kbd className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-sm font-mono text-stone-700">
                        {key}
                      </kbd>
                      {keyIdx < shortcut.keys.length - 1 && (
                        <span className="text-stone-400 mx-1">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's New */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Sparkles className="text-emerald-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">
              {language === 'en' ? "What's New" : 'มีอะไรใหม่'}
            </h2>
            <p className="text-sm text-stone-500">
              {language === 'en' ? 'Latest updates and features' : 'อัปเดตและฟีเจอร์ล่าสุด'}
            </p>
          </div>
        </div>
        <div className="p-6">
          {releaseNotes.map((release, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold">
                  {release.version}
                </span>
                <span className="text-sm text-stone-500">{release.date}</span>
              </div>
              <ul className="space-y-2">
                {(language === 'en' ? release.notesEn : release.notesTh).map((note, noteIdx) => (
                  <li key={noteIdx} className="flex items-start gap-2 text-stone-600">
                    <span className="text-teal-500 mt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-stone-400">
        <p>Eureka CMMS v0.1.0 • © 2025 Eureka Platform</p>
      </div>
    </div>
  );
};

export default Help;
