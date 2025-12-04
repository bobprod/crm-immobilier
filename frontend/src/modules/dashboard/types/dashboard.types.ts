export interface DashboardStats {
    activeProspects: number;
    availableProperties: number;
    todayAppointments: number;
    totalMatches: number;
    activeCampaigns: number;
    pendingTasks: number;
    totalCommunications: number;
    conversionRate: number;
    matchSuccessRate: number;
}

export interface ChartData {
    labels: string[];
    values: number[];
}

export interface DashboardCharts {
    prospects: ChartData;
    properties: ChartData;
    appointments: ChartData;
    communications: ChartData;
}

export interface RecentProspect {
    id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    status: string;
}

export interface RecentProperty {
    id: string;
    title: string;
    createdAt: string;
    price: number;
    status: string;
}

export interface RecentAppointment {
    id: string;
    title: string;
    startTime: string;
    status: string;
}

export interface RecentCommunication {
    id: string;
    type: string;
    to: string;
    subject: string;
    sentAt: string;
    status: string;
}

export interface RecentActivities {
    recentProspects: RecentProspect[];
    recentProperties: RecentProperty[];
    recentAppointments: RecentAppointment[];
    recentCommunications: RecentCommunication[];
}

export interface TopProperty {
    id: string;
    title: string;
    price: number;
    viewsCount: number;
    _count: {
        matches: number;
    };
}

export interface TopProspect {
    id: string;
    firstName: string;
    lastName: string;
    score: number;
    budget: number;
}

export interface TopMatch {
    id: string;
    score: number;
    properties: {
        title: string;
    };
    prospects: {
        firstName: string;
        lastName: string;
    };
}

export interface TopPerformers {
    topProperties: TopProperty[];
    topProspects: TopProspect[];
    topMatches: TopMatch[];
}

export interface Alert {
    type: 'warning' | 'info' | 'error' | 'success';
    message: string;
    action: string;
}

export interface DashboardAlerts {
    alerts: Alert[];
    counts: {
        overdueTasks: number;
        upcomingAppointments: number;
        unmatchedProspects: number;
    };
}
