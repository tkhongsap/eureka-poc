import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
  BarChart, Bar
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
  Users,
  FilePlus
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

// Active shape renderer for Pie chart hover effect with smooth pop out
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent
  } = props;

  return (
    <g>
      {/* Main sector - popped out */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15))',
          transition: 'all 0.3s ease-out'
        }}
      />
      {/* Center text */}
      <text 
        x={cx} 
        y={cy - 8} 
        textAnchor="middle" 
        fill="#333" 
        fontSize={14}
        fontWeight={600}
        style={{ transition: 'all 0.2s ease-out' }}
      >
        {payload.name}
      </text>
      <text 
        x={cx} 
        y={cy + 12} 
        textAnchor="middle" 
        fill="#666" 
        fontSize={12}
        style={{ transition: 'all 0.2s ease-out' }}
      >
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStatsAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(7);
  const selectedPeriodRef = React.useRef(selectedPeriod);
  const [activePriorityIndex, setActivePriorityIndex] = useState<number>(0);

  // Keep ref in sync with state
  React.useEffect(() => {
    selectedPeriodRef.current = selectedPeriod;
  }, [selectedPeriod]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActivePriorityIndex(index);
  }, []);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async (days?: number) => {
    const daysToFetch = days ?? selectedPeriodRef.current;
    try {
      // Only show loading on initial load, not on period change
      if (!stats) {
        setLoading(true);
      }
      setError(null);
      const response = await fetch(`/api/dashboard/stats?days=${daysToFetch}`);
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
    // Refresh every 30 seconds using ref for latest value
    const interval = setInterval(() => fetchDashboardStats(), 30000);
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
          <p className="text-stone-600">{t('dashboard.loading')}</p>
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
          <p className="text-stone-600 mb-4">{t('dashboard.loadFailed')}</p>
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            {t('dashboard.retry')}
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
            {t('dashboard.title')}
          </h2>
          <p className="text-stone-500 mt-1">
            {t('dashboard.subtitle')}
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
            {t('dashboard.woStatus')}
          </h3>
          <div className="flex items-center gap-3 bg-stone-100 px-4 py-2 rounded-xl">
            <TrendingUp size={20} className="text-stone-600" />
            <div>
              <p className="text-xs text-stone-500">
                {t('dashboard.total')}
              </p>
              <p className="text-xl font-bold text-stone-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatusCard
            title={t('status.open')}
            value={statusCounts.open}
            icon={FilePlus}
            color="text-blue-600"
            bgColor="bg-blue-100"
            borderColor="border-blue-200"
          />
          <StatusCard
            title={t('status.inProgress')}
            value={statusCounts.inProgress}
            icon={PlayCircle}
            color="text-orange-600"
            bgColor="bg-orange-100"
            borderColor="border-orange-200"
          />
          <StatusCard
            title={t('status.pending')}
            value={statusCounts.pending}
            icon={Clock}
            color="text-violet-600"
            bgColor="bg-violet-100"
            borderColor="border-violet-200"
          />
          <StatusCard
            title={t('dashboard.overdue')}
            value={overdueCount}
            icon={AlertCircle}
            color="text-red-600"
            bgColor="bg-red-100"
            borderColor="border-red-200"
          />
          {/* Average Completion Time Card */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl border border-teal-400 shadow-sm flex items-center">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-teal-100 text-xs font-medium mb-1">
                  {t('dashboard.averageTime')}
                </p>
                <p className="text-2xl font-bold text-white">
                  {avgCompletionTime ? avgCompletionTime.formattedText : '-'}
                </p>
              </div>
              <Timer size={24} className="text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Distribution & Work Orders Trend - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Priority Pie Chart - Left Side (1/5) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <PieChartIcon size={20} />
            {t('dashboard.priorityDistribution')}
          </h3>
          {(() => {
            const priorityData = [
              { name: t('priority.critical'), value: priorityDistribution.critical, color: PRIORITY_COLORS.critical },
              { name: t('priority.high'), value: priorityDistribution.high, color: PRIORITY_COLORS.high },
              { name: t('priority.medium'), value: priorityDistribution.medium, color: PRIORITY_COLORS.medium },
              { name: t('priority.low'), value: priorityDistribution.low, color: PRIORITY_COLORS.low },
            ];
            const totalPriority = priorityData.reduce((sum, item) => sum + item.value, 0);
            
            return totalPriority > 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-52 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activePriorityIndex}
                        activeShape={renderActiveShape}
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                        animationBegin={0}
                        animationDuration={400}
                        animationEasing="ease-out"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease-out',
                              filter: activePriorityIndex === index ? 'brightness(1.1)' : 'brightness(1)'
                            }} 
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-4">
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
                  {t('dashboard.noDataYet')}
                </p>
                <p className="text-xs mt-1">
                  {t('dashboard.createWOToSee')}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Work Orders Trend Chart - Right Side (4/5) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <Calendar size={20} />
              {t('dashboard.woTrend')}
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
          
          <div className="h-80">
            {dailyWorkOrders.length > 0 && dailyWorkOrders.some(d => d.created > 0 || d.completed > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                {selectedPeriod === 1 ? (
                  /* Bar Chart for Today */
                  <BarChart 
                    key={`bar-chart-${dailyWorkOrders.length}`} 
                    data={dailyWorkOrders} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
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
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-stone-600">
                          {value === 'created' 
                            ? t('dashboard.created')
                            : t('dashboard.completed')
                          }
                        </span>
                      )}
                    />
                    <Bar 
                      dataKey="created" 
                      fill="#0d9488" 
                      radius={[4, 4, 0, 0]}
                      name="created"
                    />
                    <Bar 
                      dataKey="completed" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                      name="completed"
                    />
                  </BarChart>
                ) : (
                  /* Line Chart for other periods */
                  <LineChart key={`chart-${selectedPeriod}-${dailyWorkOrders.length}`} data={dailyWorkOrders} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      tickLine={false}
                      axisLine={{ stroke: '#d6d3d1' }}
                      interval={selectedPeriod <= 7 ? 0 : selectedPeriod <= 14 ? 1 : selectedPeriod <= 30 ? 4 : selectedPeriod <= 90 ? 13 : selectedPeriod <= 180 ? 29 : 59}
                      angle={selectedPeriod > 7 ? -45 : 0}
                      textAnchor={selectedPeriod > 7 ? 'end' : 'middle'}
                      height={selectedPeriod > 7 ? 50 : 30}
                      tickFormatter={(value) => {
                        if (selectedPeriod <= 7) return value;
                        const d = new Date(value);
                        if (selectedPeriod <= 30) return `${d.getDate()}/${d.getMonth() + 1}`;
                        // For longer periods, show month name
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${d.getDate()} ${months[d.getMonth()]}`;
                      }}
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
                            ? t('dashboard.created')
                            : t('dashboard.completed')
                          }
                        </span>
                      )}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="created" 
                      stroke="#0d9488" 
                      strokeWidth={selectedPeriod > 30 ? 1.5 : 2}
                      dot={selectedPeriod <= 30 ? { fill: '#0d9488', strokeWidth: 2, r: 3 } : false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      name="created"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#8b5cf6" 
                      strokeWidth={selectedPeriod > 30 ? 1.5 : 2}
                      dot={selectedPeriod <= 30 ? { fill: '#8b5cf6', strokeWidth: 2, r: 3 } : false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      name="completed"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <BarChart3 size={48} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {t('dashboard.noDataYet')}
                </p>
                <p className="text-xs mt-1">
                  {t('dashboard.createWOToSee')}
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
            {t('dashboard.woByTechnician')}
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
