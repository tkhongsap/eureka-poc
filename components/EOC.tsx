import React from 'react';
import { Building2, Map, Users, Radio, AlertOctagon, Globe } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const EOC: React.FC = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: Globe,
      titleEn: 'Multi-Site Dashboard',
      titleTh: 'แดชบอร์ดหลายไซต์',
      descEn: 'View and monitor all sites from a single dashboard',
      descTh: 'ดูและติดตามทุกไซต์จากแดชบอร์ดเดียว',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: AlertOctagon,
      titleEn: 'Critical Events',
      titleTh: 'เหตุการณ์วิกฤต',
      descEn: 'Monitor and respond to critical events across all locations',
      descTh: 'ติดตามและตอบสนองต่อเหตุการณ์วิกฤตในทุกพื้นที่',
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      icon: Users,
      titleEn: 'Cross-Site Dispatch',
      titleTh: 'ส่งช่างข้ามไซต์',
      descEn: 'Dispatch technicians between sites based on availability',
      descTh: 'ส่งช่างระหว่างไซต์ตามความพร้อม',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      icon: Map,
      titleEn: 'Live Map',
      titleTh: 'แผนที่สด',
      descEn: 'View real-time locations of sites and technicians',
      descTh: 'ดูตำแหน่งไซต์และช่างแบบเรียลไทม์',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      icon: Radio,
      titleEn: 'Communication Hub',
      titleTh: 'ศูนย์สื่อสาร',
      descEn: 'Centralized communication for all maintenance operations',
      descTh: 'การสื่อสารแบบรวมศูนย์สำหรับงานบำรุงรักษาทั้งหมด',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: Building2,
      titleEn: 'Resource Allocation',
      titleTh: 'จัดสรรทรัพยากร',
      descEn: 'Optimize resource allocation across multiple sites',
      descTh: 'จัดสรรทรัพยากรให้เหมาะสมระหว่างหลายไซต์',
      color: 'bg-teal-50 text-teal-600 border-teal-200',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Building2 className="text-indigo-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {language === 'en' ? 'Enterprise Operations Center' : 'ศูนย์ปฏิบัติการองค์กร'}
            </h1>
            <p className="text-stone-500">
              {language === 'en' 
                ? 'Centralized monitoring and control for enterprise operations'
                : 'การติดตามและควบคุมแบบรวมศูนย์สำหรับการดำเนินงานระดับองค์กร'}
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Building2 size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              {language === 'en' ? 'Coming Soon in Phase 2' : 'เร็วๆ นี้ใน Phase 2'}
            </h2>
            <p className="text-white/90">
              {language === 'en' 
                ? 'Enterprise Operations Center is under development for multi-site management.'
                : 'ศูนย์ปฏิบัติการองค์กรอยู่ระหว่างการพัฒนาสำหรับการจัดการหลายไซต์'}
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

export default EOC;
