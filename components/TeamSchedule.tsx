import React, { useEffect, useMemo, useState } from 'react';
import { TeamMember } from '../types';
import { Calendar, UserCircle, Briefcase, Clock, Phone } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { listUsers, UserItem } from '../services/apiService';

const TeamSchedule: React.FC = () => {
    const { t } = useLanguage();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const statusColors: Record<string, string> = {
        'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Busy': 'bg-amber-50 text-amber-700 border-amber-200',
        'Off-Shift': 'bg-stone-100 text-stone-500 border-stone-200',
        'On-Leave': 'bg-red-50 text-red-600 border-red-200',
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Available': return t('team.available');
            case 'Busy': return t('team.busy');
            case 'Off-Shift': return t('team.offShift');
            case 'On-Leave': return t('team.onLeave');
            default: return status;
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const users = await listUsers();
                const filtered = users.filter(u => (u.userRole || '').toLowerCase() !== 'requester');
                const mapped: TeamMember[] = filtered.map((u: UserItem) => ({
                    id: u.id,
                    name: u.name,
                    role: u.role || u.userRole,
                    status: (u.status?.charAt(0).toUpperCase() + u.status?.slice(1)) || 'Available',
                    skills: [],
                    avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.id || u.name || 'user')}`,
                }));
                setMembers(mapped);
            } catch (e) {
                setError('Failed to load team members');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const content = useMemo(() => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                </div>
            );
        }
        if (members.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                    <UserCircle size={48} className="mb-3" />
                    <p className="text-sm">No team members found</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {members.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">

                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-xl bg-stone-100 p-1 border border-stone-100 flex items-center justify-center overflow-hidden">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                ) : (
                                    <UserCircle size={60} className="text-stone-400" />
                                )}
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[member.status] || statusColors['Available']}`}>
                                {getStatusLabel(member.status)}
                            </span>
                        </div>

                        <h3 className="font-serif text-lg text-stone-900">{member.name}</h3>
                        <p className="text-sm text-teal-600 font-medium mb-4">{member.role}</p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <Briefcase size={14} />
                                <span>
                                    {member.currentTask ? `${t('team.workingOn')} ${member.currentTask}` : t('team.noActiveTask')}
                                </span>
                            </div>

                            {member.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {member.skills.map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-lg uppercase font-bold tracking-wider">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-xs text-stone-400 flex items-center gap-1">
                                <Clock size={12} /> {t('team.shift')}: 08:00 - 17:00
                            </div>
                            <button className="p-2 hover:bg-teal-50 rounded-xl text-stone-500 hover:text-teal-600 transition-colors duration-200">
                                <Phone size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [members, loading, error, statusColors, t]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-3xl text-stone-900">{t('team.teamAndShifts')}</h2>
                    <p className="text-stone-500 mt-1">{t('team.manageWorkforce')}</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2.5 border border-stone-200 bg-white rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 flex items-center gap-2 transition-all duration-200">
                        <Calendar size={16} /> {t('team.scheduleView')}
                    </button>
                    <button className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200">
                        + {t('team.addMember')}
                    </button>
                </div>
            </div>

            {content}
        </div>
    );
};

export default TeamSchedule;