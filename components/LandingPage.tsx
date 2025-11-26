import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle,
  Building2
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20 group-hover:shadow-teal-600/30 transition-shadow duration-300">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-stone-900">
                  Eureka
                </span>
                <span className="text-xl font-semibold text-teal-600 ml-1">
                  CMMS
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-10">
              <a
                href="#features"
                className="relative text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-500 group-hover:w-full transition-all duration-300" />
              </a>
              <Link
                to="/request"
                className="relative text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors group"
              >
                Submit Request
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-500 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>

            {/* CTA */}
            <Link
              to="/login"
              className="px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-stone-50 to-stone-100/50" />

        {/* Decorative gradient orb */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-amber-100/30 to-orange-50/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium mb-10 border border-teal-100">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            Now in Pilot
          </div>

          {/* Headline - Serif for elegance */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-stone-900 mb-8 leading-[1.1] tracking-tight">
            Maintenance Management
            <br />
            <span className="text-teal-600">Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-stone-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Streamline work orders, track assets, and reduce downtime across all your facilities with one intuitive platform.
          </p>

          {/* Two Clear CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/request"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-stone-200 text-stone-700 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Submit a Request
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-10 px-6 bg-white border-y border-stone-200/60">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-16">
            {[
              'Multi-site ready',
              'Real-time tracking',
              'Asset management',
              'Mobile friendly'
            ].map((item, index) => (
              <React.Fragment key={item}>
                <div className="flex items-center gap-2.5 text-stone-600">
                  <CheckCircle size={18} className="text-teal-500" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
                {index < 3 && (
                  <div className="hidden md:block w-px h-4 bg-stone-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-900 mb-5">
              Everything you need
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              From request to resolution, Eureka handles the entire maintenance lifecycle.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Activity size={24} />}
              iconColor="text-teal-600"
              iconBg="from-teal-50 to-teal-100/50"
              title="Work Order Tracking"
              description="Create, assign, and track work orders in real-time. Monitor SLA compliance and team performance with precision."
            />
            <FeatureCard
              icon={<ShieldCheck size={24} />}
              iconColor="text-emerald-600"
              iconBg="from-emerald-50 to-emerald-100/50"
              title="Asset Management"
              description="Complete asset registry with maintenance history, documentation, and preventive scheduling built-in."
            />
            <FeatureCard
              icon={<BarChart2 size={24} />}
              iconColor="text-violet-600"
              iconBg="from-violet-50 to-violet-100/50"
              title="Smart Analytics"
              description="Gain actionable insights into costs, performance trends, and efficiency with integrated dashboards."
            />
            <FeatureCard
              icon={<Building2 size={24} />}
              iconColor="text-amber-600"
              iconBg="from-amber-50 to-amber-100/50"
              title="Multi-Site Support"
              description="Manage multiple facilities from one central platform with role-based access and data isolation."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-white" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-100/40 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-stone-900 mb-5">
            Ready to get started?
          </h2>
          <p className="text-lg text-stone-600 mb-10 leading-relaxed">
            Join the pilot program and start managing your operations more effectively today.
          </p>
          <Link
            to="/dashboard"
            className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-teal-600 text-white text-lg font-semibold rounded-xl hover:bg-teal-700 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30"
          >
            Get Started Free
            <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 px-6 bg-white border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-semibold text-stone-900">Eureka CMMS</span>
          </div>
          <p className="text-sm text-stone-500">
            © 2024 Eureka Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Refined Feature Card Component
const FeatureCard = ({
  icon,
  iconColor,
  iconBg,
  title,
  description
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) => (
  <div className="group relative p-8 bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    {/* Accent border on hover */}
    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    <div className={`w-14 h-14 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
      <div className={iconColor}>
        {icon}
      </div>
    </div>
    <h3 className="font-serif text-xl text-stone-900 mb-3">{title}</h3>
    <p className="text-stone-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
