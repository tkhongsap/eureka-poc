import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Clock, 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  XCircle,
  Timer,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

// ============== Type Definitions ==============
interface StatusCounts {
  open: number;
  inProgress: number;
  pending: number;
  completed: number;
  canceled: number;
}

type PeriodType = 'today' | '7days' | '30days' | '120days' | '180days' | '1year';

interface ChartDataPoint {
  date: string;
  created: number;
  completed: number;
}

interface PriorityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface DashboardStats {
  statusCounts: StatusCounts;
  priorityCounts: PriorityCounts;
  avgCompletionTime: number | null; // in hours
  chartData: Record<PeriodType, ChartDataPoint[]>;
}

// ============== Generate Empty Chart Data ==============
const generateEmptyChartData = (days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // For today - show hourly data
  if (days === 1) {
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    hours.forEach(hour => {
      data.push({
        date: hour,
        created: 0,
        completed: 0
      });
    });
  } else if (days <= 7) {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        created: 0,
        completed: 0
      });
    }
  } else if (days <= 30) {
    // Group by 3 days
    for (let i = Math.floor(days / 3) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 3));
      data.push({
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        created: 0,
        completed: 0
      });
    }
  } else if (days <= 120) {
    // Group by week
    for (let i = Math.floor(days / 7) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      data.push({
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        created: 0,
        completed: 0
      });
    }
  } else {
    // Group by month
    for (let i = Math.floor(days / 30) - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
        created: 0,
        completed: 0
      });
    }
  }
  
  return data;
};

// ============== Priority Colors ==============
const PRIORITY_COLORS = {
  critical: '#dc2626', // red-600
  high: '#f59e0b',     // amber-500
  medium: '#3b82f6',   // blue-500
  low: '#22c55e'       // green-500
};

// ============== Empty Stats (Will be replaced with API data) ==============
const emptyStats: DashboardStats = {
  statusCounts: {
    open: 0,
    inProgress: 0,
    pending: 0,
    completed: 0,
    canceled: 0
  },
  priorityCounts: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  avgCompletionTime: null,
  chartData: {
    'today': generateEmptyChartData(1),
    '7days': generateEmptyChartData(7),
    '30days': generateEmptyChartData(30),
    '120days': generateEmptyChartData(120),
    '180days': generateEmptyChartData(180),
    '1year': generateEmptyChartData(365)
  }
};

// ============== Components ==============
const StatusCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = ({ title, value, icon: Icon, color, bgColor, borderColor }) => (
  <div className={`bg-white p-5 rounded-xl border ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-stone-500 text-sm font-medium mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7days');
  
  // TODO: Replace with actual API call
  const stats: DashboardStats = emptyStats;

  const periodOptions: { value: PeriodType; label: { th: string; en: string } }[] = [
    { value: 'today', label: { th: 'วันนี้', en: 'Today' } },
    { value: '7days', label: { th: '7 วัน', en: '7 Days' } },
    { value: '30days', label: { th: '30 วัน', en: '30 Days' } },
    { value: '120days', label: { th: '120 วัน', en: '120 Days' } },
    { value: '180days', label: { th: '180 วัน', en: '180 Days' } },
    { value: '1year', label: { th: '1 ปี', en: '1 Year' } },
  ];

  const formatDuration = (hours: number | null): string => {
    if (hours === null) return '-';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} ${language === 'th' ? 'นาที' : 'min'}`;
    }
    if (hours < 24) {
      return `${hours.toFixed(1)} ${language === 'th' ? 'ชม.' : 'hr'}`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} ${language === 'th' ? 'วัน' : 'd'} ${remainingHours} ${language === 'th' ? 'ชม.' : 'hr'}`;
  };

  const totalOrders = 
    stats.statusCounts.open + 
    stats.statusCounts.inProgress + 
    stats.statusCounts.pending + 
    stats.statusCounts.completed + 
    stats.statusCounts.canceled;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">
            {language === 'th' ? 'แดชบอร์ด' : 'Dashboard'}
          </h2>
          <p className="text-stone-500 mt-1">
            {language === 'th' ? 'ภาพรวมสถานะใบงานและประสิทธิภาพ' : 'Work order status and performance overview'}
          </p>
        </div>
        <div className="text-sm text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg">
          {t('dashboard.lastUpdated')}: {t('dashboard.justNow')}
        </div>
      </div>

      {/* Work Order Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <BarChart3 size={20} />
            {language === 'th' ? 'สถานะใบงาน' : 'Work Order Status'}
          </h3>
          <div className="flex items-center gap-3 bg-stone-100 px-4 py-2 rounded-xl">
            <TrendingUp size={20} className="text-stone-600" />
            <div>
              <p className="text-xs text-stone-500">
                {language === 'th' ? 'ใบงานทั้งหมด' : 'Total'}
              </p>
              <p className="text-xl font-bold text-stone-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatusCard
            title={language === 'th' ? 'เปิด' : 'Open'}
            value={stats.statusCounts.open}
            icon={Clock}
            color="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-100"
          />
          <StatusCard
            title={language === 'th' ? 'กำลังดำเนินการ' : 'In Progress'}
            value={stats.statusCounts.inProgress}
            icon={PlayCircle}
            color="text-amber-600"
            bgColor="bg-amber-50"
            borderColor="border-amber-100"
          />
          <StatusCard
            title={language === 'th' ? 'รอดำเนินการ' : 'Pending'}
            value={stats.statusCounts.pending}
            icon={PauseCircle}
            color="text-purple-600"
            bgColor="bg-purple-50"
            borderColor="border-purple-100"
          />
          <StatusCard
            title={language === 'th' ? 'เสร็จสิ้น' : 'Completed'}
            value={stats.statusCounts.completed}
            icon={CheckCircle2}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            borderColor="border-emerald-100"
          />
          <StatusCard
            title={language === 'th' ? 'ยกเลิก' : 'Canceled'}
            value={stats.statusCounts.canceled}
            icon={XCircle}
            color="text-red-600"
            bgColor="bg-red-50"
            borderColor="border-red-100"
          />
        </div>
      </div>

      {/* Priority Distribution and Average Completion Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <PieChartIcon size={20} />
            {language === 'th' ? 'สัดส่วนตามความสำคัญ' : 'Priority Distribution'}
          </h3>
          {(() => {
            const priorityData = [
              { name: language === 'th' ? 'วิกฤต' : 'Critical', value: stats.priorityCounts.critical, color: PRIORITY_COLORS.critical },
              { name: language === 'th' ? 'สูง' : 'High', value: stats.priorityCounts.high, color: PRIORITY_COLORS.high },
              { name: language === 'th' ? 'ปานกลาง' : 'Medium', value: stats.priorityCounts.medium, color: PRIORITY_COLORS.medium },
              { name: language === 'th' ? 'ต่ำ' : 'Low', value: stats.priorityCounts.low, color: PRIORITY_COLORS.low },
            ];
            const totalPriority = priorityData.reduce((sum, item) => sum + item.value, 0);
            
            return totalPriority > 0 ? (
              <div className="flex items-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} (${((value / totalPriority) * 100).toFixed(1)}%)`, '']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 ml-4">
                  {priorityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-stone-600">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-stone-900">{item.value}</span>
                        <span className="text-xs text-stone-400 ml-1">
                          ({totalPriority > 0 ? ((item.value / totalPriority) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-stone-400">
                <PieChartIcon size={48} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {language === 'th' ? 'ยังไม่มีข้อมูล' : 'No data available yet'}
                </p>
                <p className="text-xs mt-1">
                  {language === 'th' 
                    ? 'กราฟจะแสดงเมื่อมีใบงานในระบบ' 
                    : 'Chart will appear when work orders are created'}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Average Completion Time */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm font-medium mb-1">
              {language === 'th' ? 'ระยะเวลาเฉลี่ยในการทำงาน' : 'Average Completion Time'}
            </p>
            <p className="text-white/70 text-xs mb-3">
              {language === 'th' ? '(จากเปิดงาน ถึง เสร็จสิ้น)' : '(From Open to Completed)'}
            </p>
            <p className="text-4xl font-bold">
              {formatDuration(stats.avgCompletionTime)}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <Timer size={40} className="text-white" />
          </div>
        </div>
        {stats.avgCompletionTime === null && (
          <p className="text-teal-100 text-sm mt-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {language === 'th' 
              ? 'ยังไม่มีข้อมูล - จะคำนวณเมื่อมีใบงานที่เสร็จสิ้น' 
              : 'No data yet - will calculate when work orders are completed'}
          </p>
        )}
        </div>
      </div>

      {/* Work Orders Trend Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Calendar size={20} />
            {language === 'th' ? 'แนวโน้มใบงานตามช่วงเวลา' : 'Work Orders Trend'}
          </h3>
          <div className="flex gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedPeriod === option.value
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {language === 'th' ? option.label.th : option.label.en}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="h-80">
            {stats.chartData[selectedPeriod].some(d => d.created > 0 || d.completed > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData[selectedPeriod]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#78716c' }}
                    tickLine={false}
                    axisLine={{ stroke: '#d6d3d1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#78716c' }}
                    tickLine={false}
                    axisLine={{ stroke: '#d6d3d1' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-stone-600">
                        {value === 'created' 
                          ? (language === 'th' ? 'สร้างใหม่' : 'Created')
                          : (language === 'th' ? 'เสร็จสิ้น' : 'Completed')
                        }
                      </span>
                    )}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#0d9488" 
                    strokeWidth={2}
                    dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <BarChart3 size={48} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {language === 'th' ? 'ยังไม่มีข้อมูล' : 'No data available yet'}
                </p>
                <p className="text-xs mt-1">
                  {language === 'th' 
                    ? 'กราฟจะแสดงเมื่อมีใบงานในระบบ' 
                    : 'Chart will appear when work orders are created'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
