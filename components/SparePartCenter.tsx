import React from 'react';
import { Package, TrendingUp, Truck, BarChart3, RefreshCcw, Users } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const SparePartCenter: React.FC = () => {
  const { language } = useLanguage();

  const features = [
    {
      icon: Package,
      titleEn: 'Cross-Site Inventory',
      titleTh: 'สต็อกข้ามไซต์',
      descEn: 'View and manage inventory across all sites in one place',
      descTh: 'ดูและจัดการสต็อกของทุกไซต์ในที่เดียว',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      icon: Truck,
      titleEn: 'Bulk Purchasing',
      titleTh: 'สั่งซื้อรวม',
      descEn: 'Consolidate orders across sites for better pricing',
      descTh: 'รวมคำสั่งซื้อจากทุกไซต์เพื่อราคาที่ดีกว่า',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: TrendingUp,
      titleEn: 'Stock Optimization',
      titleTh: 'ปรับสต็อกให้เหมาะสม',
      descEn: 'AI-powered recommendations for optimal stock levels',
      descTh: 'คำแนะนำจาก AI สำหรับระดับสต็อกที่เหมาะสม',
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      icon: RefreshCcw,
      titleEn: 'Transfer Management',
      titleTh: 'จัดการการโอน',
      descEn: 'Transfer parts between sites to balance inventory',
      descTh: 'โอนอะไหล่ระหว่างไซต์เพื่อปรับสมดุลสต็อก',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      icon: BarChart3,
      titleEn: 'Demand Forecasting',
      titleTh: 'พยากรณ์ความต้องการ',
      descEn: 'Predict future parts demand based on historical data',
      descTh: 'พยากรณ์ความต้องการอะไหล่จากข้อมูลในอดีต',
      color: 'bg-teal-50 text-teal-600 border-teal-200',
    },
    {
      icon: Users,
      titleEn: 'Supplier Management',
      titleTh: 'จัดการซัพพลายเออร์',
      descEn: 'Track supplier performance and manage relationships',
      descTh: 'ติดตามประสิทธิภาพซัพพลายเออร์และจัดการความสัมพันธ์',
      color: 'bg-stone-50 text-stone-600 border-stone-200',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Package className="text-amber-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {language === 'en' ? 'Spare Part Center' : 'ศูนย์อะไหล่'}
            </h1>
            <p className="text-stone-500">
              {language === 'en' 
                ? 'Enterprise-level spare parts management across all sites'
                : 'การจัดการอะไหล่ระดับองค์กรสำหรับทุกไซต์'}
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Package size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              {language === 'en' ? 'Coming Soon in Phase 2' : 'เร็วๆ นี้ใน Phase 2'}
            </h2>
            <p className="text-white/90">
              {language === 'en' 
                ? 'Spare Part Center will enable cross-site inventory management and optimization.'
                : 'ศูนย์อะไหล่จะช่วยจัดการและปรับสต็อกข้ามไซต์ได้'}
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

export default SparePartCenter;
