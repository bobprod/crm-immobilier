import React, { useEffect, useRef, useState } from 'react';
import { Home, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
}

interface StatsSectionProps {
  stats?: {
    totalPublishedProperties?: number;
    totalAgents?: number;
    totalLeads?: number;
    totalViews?: number;
  };
  primaryColor?: string;
}

const useCountUp = (target: number, duration = 1500, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

const StatCard: React.FC<{ item: StatItem; primaryColor?: string; animate: boolean }> = ({
  item,
  primaryColor,
  animate,
}) => {
  const count = useCountUp(item.value, 1200, animate);
  return (
    <div className="text-center">
      {item.icon && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            backgroundColor: `${primaryColor || '#1e40af'}15`,
            color: primaryColor || '#1e40af',
          }}
        >
          {item.icon}
        </div>
      )}
      <p className="text-3xl font-bold" style={{ color: primaryColor || '#1e40af' }}>
        {count}
        {item.suffix}
      </p>
      <p className="text-sm text-gray-600 mt-1">{item.label}</p>
    </div>
  );
};

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, primaryColor }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const items: StatItem[] = [
    {
      value: stats?.totalPublishedProperties || 0,
      label: 'Biens disponibles',
      suffix: '+',
      icon: <Home className="w-5 h-5" />,
    },
    {
      value: stats?.totalAgents || 0,
      label: 'Agents experts',
      icon: <Users className="w-5 h-5" />,
    },
    {
      value: stats?.totalLeads || 0,
      label: 'Clients satisfaits',
      suffix: '+',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      value: stats?.totalViews || 0,
      label: 'Visites / mois',
      suffix: '+',
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ].filter((item) => item.value > 0);

  if (items.length === 0) return null;

  return (
    <section ref={ref} className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 lg:grid-cols-${items.length} gap-8`}>
          {items.map((item) => (
            <StatCard key={item.label} item={item} primaryColor={primaryColor} animate={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
