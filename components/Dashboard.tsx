import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Zap, BarChart3 } from 'lucide-react';
import { KpiData } from '../types';
import { useLanguage } from '../lib/i18n';

// Empty data for charts - will be populated from real data later
const emptyChartData = [
  { name: 'Mon', wo: 0, completed: 0, downtime: 0 },
  { name: 'Tue', wo: 0, completed: 0, downtime: 0 },
  { name: 'Wed', wo: 0, completed: 0, downtime: 0 },
  { name: 'Thu', wo: 0, completed: 0, downtime: 0 },
  { name: 'Fri', wo: 0, completed: 0, downtime: 0 },
  { name: 'Sat', wo: 0, completed: 0, downtime: 0 },
  { name: 'Sun', wo: 0, completed: 0, downtime: 0 },
];

const KPICard: React.FC<{ title: string; value: string; trend: string; trendLabel: string; icon: any; color: string; gradient: string }> = ({ title, value, trend, trendLabel, icon: Icon, color, gradient }) => (
  <div className="group bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}>
        <Icon size={22} className={color} />
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
        {trend} {trendLabel}
      </span>
    </div>
    <div className="text-stone-500 text-sm font-medium">{title}</div>
    <div className="text-3xl font-bold text-stone-900 mt-1">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">{t('dashboard.operationalOverview')}</h2>
          <p className="text-stone-500 mt-1">{t('dashboard.realTimeInsights')}</p>
        </div>
        <div className="text-sm text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg">
          {t('dashboard.lastUpdated')}: {t('dashboard.justNow')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t('dashboard.openWorkOrders')}
          value="0"
          trend="-"
          trendLabel={t('dashboard.fromLastWeek')}
          icon={Clock}
          color="text-teal-600"
          gradient="from-teal-50 to-teal-100/50"
        />
        <KPICard
          title={t('dashboard.criticalDowntime')}
          value="0 hr"
          trend="-"
          trendLabel={t('dashboard.fromLastWeek')}
          icon={AlertCircle}
          color="text-red-600"
          gradient="from-red-50 to-red-100/50"
        />
        <KPICard
          title={t('dashboard.pmCompliance')}
          value="-%"
          trend="-"
          trendLabel={t('dashboard.fromLastWeek')}
          icon={CheckCircle2}
          color="text-emerald-600"
          gradient="from-emerald-50 to-emerald-100/50"
        />
        <KPICard
          title={t('dashboard.oeeScore')}
          value="-%"
          trend="-"
          trendLabel={t('dashboard.fromLastWeek')}
          icon={Zap}
          color="text-violet-600"
          gradient="from-violet-50 to-violet-100/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-serif text-xl text-stone-900 mb-6">{t('dashboard.workOrderThroughput')}</h3>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-stone-400">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No data available yet</p>
              <p className="text-xs mt-1">Data will appear when work orders are created</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-serif text-xl text-stone-900 mb-6">{t('dashboard.downtimeVsResponse')}</h3>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-stone-400">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No data available yet</p>
              <p className="text-xs mt-1">Data will appear when work orders are completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
