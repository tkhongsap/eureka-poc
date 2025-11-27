import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { KpiData } from '../types';

const data = [
  { name: 'Mon', wo: 40, completed: 24, downtime: 12 },
  { name: 'Tue', wo: 30, completed: 13, downtime: 20 },
  { name: 'Wed', wo: 20, completed: 58, downtime: 5 },
  { name: 'Thu', wo: 27, completed: 39, downtime: 8 },
  { name: 'Fri', wo: 18, completed: 48, downtime: 3 },
  { name: 'Sat', wo: 23, completed: 38, downtime: 10 },
  { name: 'Sun', wo: 34, completed: 43, downtime: 15 },
];

const KPICard: React.FC<{ title: string; value: string; trend: string; icon: any; color: string; gradient: string }> = ({ title, value, trend, icon: Icon, color, gradient }) => (
  <div className="group bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}>
        <Icon size={22} className={color} />
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trend.includes('+') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
        {trend} from last week
      </span>
    </div>
    <div className="text-stone-500 text-sm font-medium">{title}</div>
    <div className="text-3xl font-bold text-stone-900 mt-1">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">Operational Overview</h2>
          <p className="text-stone-500 mt-1">Real-time insights for Plant A</p>
        </div>
        <div className="text-sm text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg">
          Last updated: Just now
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Open Work Orders"
          value="24"
          trend="+12%"
          icon={Clock}
          color="text-teal-600"
          gradient="from-teal-50 to-teal-100/50"
        />
        <KPICard
          title="Critical Downtime"
          value="1.2 hr"
          trend="-5%"
          icon={AlertCircle}
          color="text-red-600"
          gradient="from-red-50 to-red-100/50"
        />
        <KPICard
          title="PM Compliance"
          value="94%"
          trend="+2%"
          icon={CheckCircle2}
          color="text-emerald-600"
          gradient="from-emerald-50 to-emerald-100/50"
        />
        <KPICard
          title="OEE Score"
          value="82%"
          trend="+4%"
          icon={Zap}
          color="text-violet-600"
          gradient="from-violet-50 to-violet-100/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-serif text-xl text-stone-900 mb-6">Work Order Throughput</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorWo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="wo" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorWo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-serif text-xl text-stone-900 mb-6">Downtime vs Response Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c'}} />
                <Tooltip
                  cursor={{fill: '#fafaf9'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="downtime" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
