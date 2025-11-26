import React from 'react';
import { TeamMember } from '../types';
import { Calendar, UserCircle, Briefcase, Clock, Phone } from 'lucide-react';

const MOCK_TEAM: TeamMember[] = [
    { id: 'T1', name: 'Alex Engineer', role: 'Site Supervisor', status: 'Available', skills: ['Leadership', 'Electrical'], avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'T2', name: 'John Doe', role: 'Senior Technician', status: 'Busy', currentTask: 'WO-2024-001', skills: ['Hydraulics', 'Mechanical'], avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: 'T3', name: 'Sarah Miller', role: 'Safety Officer', status: 'On-Leave', skills: ['Safety Audit', 'Compliance'], avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'T4', name: 'Mike Ross', role: 'Technician II', status: 'Available', skills: ['Electrical', 'PLC'], avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { id: 'T5', name: 'David Kim', role: 'Apprentice', status: 'Off-Shift', skills: ['General Maintenance'], avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
];

const statusColors = {
    'Available': 'bg-green-100 text-green-700 border-green-200',
    'Busy': 'bg-orange-100 text-orange-700 border-orange-200',
    'Off-Shift': 'bg-slate-100 text-slate-500 border-slate-200',
    'On-Leave': 'bg-red-50 text-red-600 border-red-200',
};

const TeamSchedule: React.FC = () => {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team & Shifts</h2>
                    <p className="text-slate-500">Manage workforce availability and assignments.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Calendar size={16} /> Schedule View
                    </button>
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm">
                        + Add Member
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MOCK_TEAM.map(member => (
                    <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 p-1 border border-slate-100">
                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full bg-white" />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColors[member.status]}`}>
                                {member.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                        <p className="text-sm text-brand-600 font-medium mb-4">{member.role}</p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Briefcase size={14} />
                                <span>
                                    {member.currentTask ? `Working on ${member.currentTask}` : 'No active task'}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                                {member.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded uppercase font-bold tracking-wider">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={12} /> Shift: 08:00 - 17:00
                            </div>
                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <Phone size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamSchedule;