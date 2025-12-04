import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Clock, 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  Timer,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
  PieChart as PieChartIcon,
  Lock,
  RefreshCw,
  Users
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

// ============== Type Definitions ==============
interface StatusCounts {
  open: number;
  inProgress: number;
  pending: number;
  completed: number;
  closed: number;
}

interface AverageCompletionTime {
  hours: number;
  formattedText: string;
}

interface DailyWorkOrderPoint {
  date: string;
  dayName: string;
  created: number;
  completed: number;
}

interface PriorityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  other?: number;
}

interface WorkOrdersByAssignee {
  name: string;
  count: number;
}

interface DashboardStatsAPI {
  statusCounts: StatusCounts;
  averageCompletionTime: AverageCompletionTime | null;
  dailyWorkOrders: DailyWorkOrderPoint[];
  priorityDistribution: PriorityDistribution;
  overdueCount: number;
  workOrdersByAssignee: WorkOrdersByAssignee[];
}

// ============== Priority Colors ==============
const PRIORITY_COLORS = {
  critical: '#dc2626', // red-600
  high: '#f59e0b',     // amber-500
  medium: '#3b82f6',   // blue-500
  low: '#22c55e'       // green-500
};

// ============== Period Options ==============
type PeriodType = 1 | 7 | 14 | 30 | 90 | 180 | 365;

const periodOptions: { value: PeriodType; label: { th: string; en: string } }[] = [
  { value: 1, label: { th: 'วันนี้', en: 'Today' } },
  { value: 7, label: { th: '7 วัน', en: '7 Days' } },
  { value: 14, label: { th: '14 วัน', en: '14 Days' } },
  { value: 30, label: { th: '30 วัน', en: '30 Days' } },
  { value: 90, label: { th: '90 วัน', en: '90 Days' } },
  { value: 180, label: { th: '180 วัน', en: '180 Days' } },
  { value: 365, label: { th: '1 ปี', en: '1 Year' } },
];

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
  const [stats, setStats] = useState<DashboardStatsAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(7);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async (days: number = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/stats?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data: DashboardStatsAPI = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(selectedPeriod);
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardStats(selectedPeriod), 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  // Handle period change
  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
  };

  // Loading state
  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto mb-4 text-teal-600 animate-spin" />
          <p className="text-stone-600">{language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-stone-600 mb-4">{language === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load dashboard'}</p>
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {language === 'th' ? 'ลองใหม่' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // Use stats data
  const statusCounts = stats?.statusCounts || { open: 0, inProgress: 0, pending: 0, completed: 0, closed: 0 };
  const priorityDistribution = stats?.priorityDistribution || { critical: 0, high: 0, medium: 0, low: 0 };
  const avgCompletionTime = stats?.averageCompletionTime;
  const dailyWorkOrders = stats?.dailyWorkOrders || [];
  const overdueCount = stats?.overdueCount || 0;
  const workOrdersByAssignee = stats?.workOrdersByAssignee || [];

  const totalOrders = 
    statusCounts.open + 
    statusCounts.inProgress + 
    statusCounts.pending + 
    statusCounts.completed + 
    statusCounts.closed;

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatusCard
            title={language === 'th' ? 'เปิด' : 'Open'}
            value={statusCounts.open}
            icon={Clock}
            color="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-100"
          />
          <StatusCard
            title={language === 'th' ? 'กำลังดำเนินการ' : 'In Progress'}
            value={statusCounts.inProgress}
            icon={PlayCircle}
            color="text-amber-600"
            bgColor="bg-amber-50"
            borderColor="border-amber-100"
          />
          <StatusCard
            title={language === 'th' ? 'รอตรวจสอบ' : 'Pending'}
            value={statusCounts.pending}
            icon={PauseCircle}
            color="text-purple-600"
            bgColor="bg-purple-50"
            borderColor="border-purple-100"
          />
          <StatusCard
            title={language === 'th' ? 'เสร็จสิ้น' : 'Completed'}
            value={statusCounts.completed}
            icon={CheckCircle2}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            borderColor="border-emerald-100"
          />
          <StatusCard
            title={language === 'th' ? 'ปิดแล้ว' : 'Closed'}
            value={statusCounts.closed}
            icon={Lock}
            color="text-stone-600"
            bgColor="bg-stone-50"
            borderColor="border-stone-200"
          />
          <StatusCard
            title={language === 'th' ? 'เลยกำหนด' : 'Overdue'}
            value={overdueCount}
            icon={AlertCircle}
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
              { name: language === 'th' ? 'วิกฤต' : 'Critical', value: priorityDistribution.critical, color: PRIORITY_COLORS.critical },
              { name: language === 'th' ? 'สูง' : 'High', value: priorityDistribution.high, color: PRIORITY_COLORS.high },
              { name: language === 'th' ? 'ปานกลาง' : 'Medium', value: priorityDistribution.medium, color: PRIORITY_COLORS.medium },
              { name: language === 'th' ? 'ต่ำ' : 'Low', value: priorityDistribution.low, color: PRIORITY_COLORS.low },
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
              {avgCompletionTime ? avgCompletionTime.formattedText : '-'}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <Timer size={40} className="text-white" />
          </div>
        </div>
        {!avgCompletionTime && (
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Calendar size={20} />
            {language === 'th' ? 'แนวโน้มใบงาน' : 'Work Orders Trend'}
          </h3>
          
          {/* Period Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === option.value
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option.label[language]}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="h-80">
            {dailyWorkOrders.length > 0 && dailyWorkOrders.some(d => d.created > 0 || d.completed > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyWorkOrders} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="dayName" 
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
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.date;
                      }
                      return label;
                    }}
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

      {/* Work Orders by Assignee */}
      {workOrdersByAssignee.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Users size={20} />
            {language === 'th' ? 'ใบงานตามช่างเทคนิค' : 'Work Orders by Technician'}
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {workOrdersByAssignee.map((assignee) => (
                <div key={assignee.name} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <span className="text-sm text-stone-700 font-medium truncate">{assignee.name}</span>
                  <span className="text-lg font-bold text-teal-600 ml-2">{assignee.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
