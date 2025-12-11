import React from 'react';
import { Calendar, Clock, Wrench, CheckSquare, AlertTriangle, Settings } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const PreventiveMaintenance: React.FC = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: Calendar,
      titleEn: 'PM Calendar',
      titleTh: 'ปฏิทิน PM',
      descEn: 'Schedule and manage preventive maintenance tasks with drag-and-drop calendar',
      descTh: 'จัดตารางและจัดการงาน PM ด้วยปฏิทินแบบลากวาง',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: Clock,
      titleEn: 'Time-Based PM',
      titleTh: 'PM ตามเวลา',
      descEn: 'Set up daily, weekly, monthly, or yearly maintenance schedules',
      descTh: 'ตั้งค่าตารางบำรุงรักษารายวัน รายสัปดาห์ รายเดือน หรือรายปี',
      color: 'bg-teal-50 text-teal-600 border-teal-200',
    },
    {
      icon: Wrench,
      titleEn: 'Meter-Based PM',
      titleTh: 'PM ตามมิเตอร์',
      descEn: 'Trigger maintenance based on equipment usage or meter readings',
      descTh: 'เรียกงานบำรุงรักษาตามการใช้งานอุปกรณ์หรือค่ามิเตอร์',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      icon: CheckSquare,
      titleEn: 'Digital Checklists',
      titleTh: 'เช็คลิสต์ดิจิทัล',
      descEn: 'Create and manage inspection checklists for PM tasks',
      descTh: 'สร้างและจัดการเช็คลิสต์ตรวจสอบสำหรับงาน PM',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      icon: AlertTriangle,
      titleEn: 'PM Compliance',
      titleTh: 'การปฏิบัติตาม PM',
      descEn: 'Track PM completion rates and compliance metrics',
      descTh: 'ติดตามอัตราการเสร็จสิ้นและตัวชี้วัดการปฏิบัติตาม PM',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: Settings,
      titleEn: 'Job Plans',
      titleTh: 'แผนงาน',
      descEn: 'Define standard procedures and job plans for maintenance tasks',
      descTh: 'กำหนดขั้นตอนมาตรฐานและแผนงานสำหรับงานบำรุงรักษา',
      color: 'bg-stone-50 text-stone-600 border-stone-200',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-xl">
            <Wrench className="text-teal-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {language === 'en' ? 'Preventive Maintenance' : 'การบำรุงรักษาเชิงป้องกัน'}
            </h1>
            <p className="text-stone-500">
              {language === 'en' 
                ? 'Schedule and manage preventive maintenance activities'
                : 'จัดตารางและจัดการกิจกรรมบำรุงรักษาเชิงป้องกัน'}
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Calendar size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              {language === 'en' ? 'Coming Soon in Phase 2' : 'เร็วๆ นี้ใน Phase 2'}
            </h2>
            <p className="text-white/90">
              {language === 'en' 
                ? 'Preventive Maintenance module is under development and will be available soon.'
                : 'โมดูลการบำรุงรักษาเชิงป้องกันอยู่ระหว่างการพัฒนาและจะพร้อมใช้งานเร็วๆ นี้'}
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <h3 className="text-lg font-semibold text-stone-800 mb-4">
        {language === 'en' ? 'Planned Features' : 'ฟีเจอร์ที่วางแผนไว้'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-stone-200 p-5 opacity-60"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feature.color} mb-4`}>
                <Icon size={24} />
              </div>
              <h4 className="font-semibold text-stone-800 mb-2">
                {language === 'en' ? feature.titleEn : feature.titleTh}
              </h4>
              <p className="text-sm text-stone-500">
                {language === 'en' ? feature.descEn : feature.descTh}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreventiveMaintenance;
