import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, BarChart2, Users, ArrowRight, ShieldCheck, Activity, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-1.5 rounded-lg">
             <Wrench size={24} />
          </div>
          <span className="text-xl font-bold text-slate-800">Eureka <span className="text-brand-600">CMMS</span></span>
        </div>
        <div className="flex items-center gap-4">
           <Link to="/request" className="hidden md:block text-sm font-medium text-slate-600 hover:text-brand-600 transition">
             Submit Request
           </Link>
           <Link to="/login" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition shadow-sm">
             Login
           </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative bg-slate-900 text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700 text-brand-300 text-xs font-semibold mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
              v1.0 Pilot Release Available
           </div>
           <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
             Smart Maintenance for <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-teal-300">Modern Operations</span>
           </h1>
           <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
             Eureka CMMS helps multi-site organizations streamline work orders, track assets, and reduce downtime with an intuitive, cloud-first platform.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2">
                Launch Platform <ArrowRight size={20} />
              </Link>
              <Link to="/request" className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition border border-white/10 flex items-center justify-center gap-2 backdrop-blur-sm">
                Work Request Portal
              </Link>
           </div>
        </div>
      </header>

      {/* Stats/Trust Bar */}
      <div className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 text-slate-400 font-semibold uppercase text-sm tracking-wider">
           <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-500" /> Multi-Tenant</div>
           <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-500" /> Real-time Tracking</div>
           <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-500" /> Asset Intelligence</div>
           <div className="flex items-center gap-2"><CheckCircle size={16} className="text-brand-500" /> Mobile Ready</div>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto bg-slate-50">
        <div className="text-center mb-16">
           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to operate</h2>
           <p className="text-slate-500 max-w-2xl mx-auto text-lg">From request to resolution, Eureka handles the entire maintenance lifecycle across all your facilities.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
           <FeatureCard 
             icon={<Activity />} 
             title="Work Order Tracking" 
             desc="Create, assign, and track work orders in real-time. Monitor SLA compliance and technician performance."
           />
           <FeatureCard 
             icon={<ShieldCheck />} 
             title="Asset Management" 
             desc="Complete asset registry with hierarchy, history, and preventive maintenance scheduling."
           />
           <FeatureCard 
             icon={<BarChart2 />} 
             title="Smart Analytics" 
             desc="Gain insights into MTTR, MTBF, and costs with integrated dashboards and reporting."
           />
           <FeatureCard 
             icon={<Users />} 
             title="Multi-Site Ready" 
             desc="Manage multiple customers or sites from a single instance with strict data isolation."
           />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to optimize your workflow?</h2>
          <p className="text-slate-400 mb-10 text-lg">Join the pilot program and start managing your maintenance operations more effectively today.</p>
          <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition shadow-xl gap-2">
             Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-slate-400">
          <Wrench size={20} />
          <span className="font-bold text-slate-200">Eureka CMMS</span>
        </div>
        <p className="text-slate-600 text-sm">© 2023 Eureka Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;