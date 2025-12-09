import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Package, 
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const Reports: React.FC = () => {
  const { language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportCategories = [
    {
      id: 'work-orders',
      icon: BarChart3,
      titleEn: 'Work Order Reports',
      titleTh: 'รายงานใบงาน',
      descEn: 'Analyze work order metrics, completion rates, and trends',
      descTh: 'วิเคราะห์ตัวชี้วัดใบงาน อัตราการเสร็จสิ้น และแนวโน้ม',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      reports: [
        { id: 'wo-summary', nameEn: 'Work Order Summary', nameTh: 'สรุปใบงาน', available: true },
        { id: 'wo-by-status', nameEn: 'Work Orders by Status', nameTh: 'ใบงานตามสถานะ', available: true },
        { id: 'wo-by-priority', nameEn: 'Work Orders by Priority', nameTh: 'ใบงานตามความสำคัญ', available: true },
        { id: 'wo-completion', nameEn: 'Completion Rate Analysis', nameTh: 'วิเคราะห์อัตราความสำเร็จ', available: false },
      ],
    },
    {
      id: 'performance',
      icon: TrendingUp,
      titleEn: 'Performance Reports',
      titleTh: 'รายงานประสิทธิภาพ',
      descEn: 'Track MTBF, MTTR, and OEE metrics',
      descTh: 'ติดตาม MTBF, MTTR และ OEE',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      reports: [
        { id: 'mtbf-mttr', nameEn: 'MTBF/MTTR Analysis', nameTh: 'วิเคราะห์ MTBF/MTTR', available: false },
        { id: 'oee', nameEn: 'OEE Dashboard', nameTh: 'แดชบอร์ด OEE', available: false },
        { id: 'downtime', nameEn: 'Downtime Analysis', nameTh: 'วิเคราะห์ Downtime', available: false },
      ],
    },
    {
      id: 'technician',
      icon: Users,
      titleEn: 'Technician Reports',
      titleTh: 'รายงานช่าง',
      descEn: 'Monitor technician workload and productivity',
      descTh: 'ติดตามภาระงานและผลิตภาพของช่าง',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      reports: [
        { id: 'tech-workload', nameEn: 'Technician Workload', nameTh: 'ภาระงานช่าง', available: true },
        { id: 'tech-performance', nameEn: 'Technician Performance', nameTh: 'ประสิทธิภาพช่าง', available: false },
        { id: 'labor-hours', nameEn: 'Labor Hours Report', nameTh: 'รายงานชั่วโมงแรงงาน', available: false },
      ],
    },
    {
      id: 'inventory',
      icon: Package,
      titleEn: 'Inventory Reports',
      titleTh: 'รายงานสินค้าคงคลัง',
      descEn: 'Track stock levels, usage, and costs',
      descTh: 'ติดตามระดับสต็อก การใช้งาน และต้นทุน',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      reports: [
        { id: 'stock-levels', nameEn: 'Stock Level Report', nameTh: 'รายงานระดับสต็อก', available: false },
        { id: 'parts-usage', nameEn: 'Parts Usage Report', nameTh: 'รายงานการใช้อะไหล่', available: false },
        { id: 'inventory-value', nameEn: 'Inventory Value', nameTh: 'มูลค่าสินค้าคงคลัง', available: false },
      ],
    },
    {
      id: 'compliance',
      icon: AlertTriangle,
      titleEn: 'Compliance Reports',
      titleTh: 'รายงานการปฏิบัติตามข้อกำหนด',
      descEn: 'PM compliance and audit trail reports',
      descTh: 'รายงาน PM และประวัติการตรวจสอบ',
      color: 'bg-red-50 text-red-600 border-red-200',
      reports: [
        { id: 'pm-compliance', nameEn: 'PM Compliance', nameTh: 'การปฏิบัติตาม PM', available: false },
        { id: 'audit-trail', nameEn: 'Audit Trail', nameTh: 'ประวัติการตรวจสอบ', available: false },
        { id: 'safety-report', nameEn: 'Safety Report', nameTh: 'รายงานความปลอดภัย', available: false },
      ],
    },
  ];

  const exportFormats = [
    { id: 'excel', icon: FileSpreadsheet, label: 'Excel', color: 'text-green-600' },
    { id: 'pdf', icon: FileText, label: 'PDF', color: 'text-red-600' },
    { id: 'print', icon: Printer, label: 'Print', color: 'text-stone-600' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
          <BarChart3 className="text-teal-600" size={28} />
          {language === 'en' ? 'Reports & Analytics' : 'รายงานและการวิเคราะห์'}
        </h1>
        <p className="text-stone-500 mt-1">
          {language === 'en' 
            ? 'Generate reports and analyze maintenance data'
            : 'สร้างรายงานและวิเคราะห์ข้อมูลการบำรุงรักษา'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">156</p>
              <p className="text-xs text-stone-500">{language === 'en' ? 'Total WOs (30d)' : 'ใบงานทั้งหมด (30 วัน)'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">87%</p>
              <p className="text-xs text-stone-500">{language === 'en' ? 'Completion Rate' : 'อัตราความสำเร็จ'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">4.2h</p>
              <p className="text-xs text-stone-500">{language === 'en' ? 'Avg. Resolution' : 'เวลาแก้ไขเฉลี่ย'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">3</p>
              <p className="text-xs text-stone-500">{language === 'en' ? 'Overdue WOs' : 'ใบงานเกินกำหนด'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="space-y-6">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${category.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900">
                    {language === 'en' ? category.titleEn : category.titleTh}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {language === 'en' ? category.descEn : category.descTh}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {category.reports.map((report) => (
                    <button
                      key={report.id}
                      disabled={!report.available}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        report.available
                          ? 'border-stone-200 hover:border-teal-300 hover:bg-teal-50 cursor-pointer'
                          : 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed'
                      } ${selectedReport === report.id ? 'border-teal-500 bg-teal-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-stone-800">
                          {language === 'en' ? report.nameEn : report.nameTh}
                        </span>
                        {!report.available && (
                          <span className="text-xs bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                            {language === 'en' ? 'Soon' : 'เร็วๆนี้'}
                          </span>
                        )}
                      </div>
                      {report.available && (
                        <div className="flex gap-2 mt-3">
                          {exportFormats.map((format) => {
                            const FormatIcon = format.icon;
                            return (
                              <button
                                key={format.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement export
                                }}
                                className={`p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-stone-200 transition-all ${format.color}`}
                                title={format.label}
                              >
                                <FormatIcon size={14} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Range Filter (for future use) */}
      <div className="mt-8 bg-stone-50 rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-stone-400" />
            <span className="text-stone-600">
              {language === 'en' ? 'Date Range:' : 'ช่วงวันที่:'}
            </span>
            <span className="font-medium text-stone-800">
              {language === 'en' ? 'Last 30 Days' : '30 วันที่ผ่านมา'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
              <Filter size={16} />
              {language === 'en' ? 'Filters' : 'ตัวกรอง'}
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center gap-2">
              <Download size={16} />
              {language === 'en' ? 'Export All' : 'ส่งออกทั้งหมด'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-sm text-stone-400">
        <p>
          {language === 'en' 
            ? 'More reports will be available in future updates'
            : 'รายงานเพิ่มเติมจะมาในอัปเดตถัดไป'}
        </p>
      </div>
    </div>
  );
};

export default Reports;
