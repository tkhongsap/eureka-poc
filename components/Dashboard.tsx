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

const KPICard: React.FC<{ title: string; value: string; trend: string; icon: any; color: string }> = ({ title, value, trend, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend} from last week
      </span>
    </div>
    <div className="text-slate-500 text-sm font-medium">{title}</div>
    <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
          <p className="text-slate-500 mt-1">Real-time insights for Plant A</p>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: Just now
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Open Work Orders" 
          value="24" 
          trend="+12%" 
          icon={Clock} 
          color="bg-blue-500" 
        />
        <KPICard 
          title="Critical Downtime" 
          value="1.2 hr" 
          trend="-5%" 
          icon={AlertCircle} 
          color="bg-red-500" 
        />
        <KPICard 
          title="PM Compliance" 
          value="94%" 
          trend="+2%" 
          icon={CheckCircle2} 
          color="bg-green-500" 
        />
        <KPICard 
          title="OEE Score" 
          value="82%" 
          trend="+4%" 
          icon={Zap} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Work Order Throughput</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorWo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="wo" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorWo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Downtime vs Response Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="downtime" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
