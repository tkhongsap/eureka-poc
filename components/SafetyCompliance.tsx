import React from 'react';
import { Shield, FileCheck, Lock, AlertTriangle, ClipboardCheck, History } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const SafetyCompliance: React.FC = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: FileCheck,
      titleEn: 'Work Permits',
      titleTh: 'ใบอนุญาตทำงาน',
      descEn: 'Manage and track work permits for hazardous tasks',
      descTh: 'จัดการและติดตามใบอนุญาตทำงานสำหรับงานอันตราย',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: Lock,
      titleEn: 'LOTO Procedures',
      titleTh: 'ขั้นตอน LOTO',
      descEn: 'Lockout/Tagout procedures for equipment isolation',
      descTh: 'ขั้นตอนการล็อกเอาท์/แท็กเอาท์สำหรับแยกอุปกรณ์',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      icon: ClipboardCheck,
      titleEn: 'Safety Checklists',
      titleTh: 'เช็คลิสต์ความปลอดภัย',
      descEn: 'Digital safety checklists for pre-work inspections',
      descTh: 'เช็คลิสต์ความปลอดภัยดิจิทัลสำหรับตรวจสอบก่อนทำงาน',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      icon: AlertTriangle,
      titleEn: 'Incident Reports',
      titleTh: 'รายงานเหตุการณ์',
      descEn: 'Report and investigate safety incidents',
      descTh: 'รายงานและสอบสวนเหตุการณ์ด้านความปลอดภัย',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: History,
      titleEn: 'Audit Trail',
      titleTh: 'บันทึกการตรวจสอบ',
      descEn: 'Complete audit trail for compliance verification',
      descTh: 'บันทึกการตรวจสอบครบถ้วนสำหรับยืนยันการปฏิบัติตาม',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      icon: Shield,
      titleEn: 'Compliance Reports',
      titleTh: 'รายงานการปฏิบัติตาม',
      descEn: 'Generate reports for ISO, FDA, OSHA compliance',
      descTh: 'สร้างรายงานการปฏิบัติตาม ISO, FDA, OSHA',
      color: 'bg-teal-50 text-teal-600 border-teal-200',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-xl">
            <Shield className="text-red-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {language === 'en' ? 'Safety & Compliance' : 'ความปลอดภัยและการปฏิบัติตาม'}
            </h1>
            <p className="text-stone-500">
              {language === 'en' 
                ? 'Manage safety procedures and ensure regulatory compliance'
                : 'จัดการขั้นตอนความปลอดภัยและดูแลการปฏิบัติตามกฎระเบียบ'}
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              {language === 'en' ? 'Coming Soon in Phase 2' : 'เร็วๆ นี้ใน Phase 2'}
            </h2>
            <p className="text-white/90">
              {language === 'en' 
                ? 'Safety & Compliance module will help manage permits, LOTO, and safety procedures.'
                : 'โมดูลความปลอดภัยและการปฏิบัติตามจะช่วยจัดการใบอนุญาต LOTO และขั้นตอนความปลอดภัย'}
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

export default SafetyCompliance;
