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
    'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Busy': 'bg-amber-50 text-amber-700 border-amber-200',
    'Off-Shift': 'bg-stone-100 text-stone-500 border-stone-200',
    'On-Leave': 'bg-red-50 text-red-600 border-red-200',
};

const TeamSchedule: React.FC = () => {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-3xl text-stone-900">Team & Shifts</h2>
                    <p className="text-stone-500 mt-1">Manage workforce availability and assignments.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2.5 border border-stone-200 bg-white rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-2 transition-all duration-200">
                        <Calendar size={16} /> Schedule View
                    </button>
                    <button className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200">
                        + Add Member
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MOCK_TEAM.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-xl bg-stone-100 p-1 border border-stone-100">
                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-lg bg-white" />
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[member.status]}`}>
                                {member.status}
                            </span>
                        </div>

                        <h3 className="font-serif text-lg text-stone-900">{member.name}</h3>
                        <p className="text-sm text-teal-600 font-medium mb-4">{member.role}</p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <Briefcase size={14} />
                                <span>
                                    {member.currentTask ? `Working on ${member.currentTask}` : 'No active task'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {member.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-lg uppercase font-bold tracking-wider">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-xs text-stone-400 flex items-center gap-1">
                                <Clock size={12} /> Shift: 08:00 - 17:00
                            </div>
                            <button className="p-2 hover:bg-teal-50 rounded-xl text-stone-500 hover:text-teal-600 transition-colors duration-200">
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