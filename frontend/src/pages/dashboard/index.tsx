  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');

      if (response.data) {
        setStats(response.data.stats || {
          totalProperties: 0,
          totalProspects: 0,
          totalAppointments: 0,
          conversionRate: 0
        });
        setRecentActivities(response.data.recentActivities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalProperties: 0,
        totalProspects: 0,
        totalAppointments: 0,
        conversionRate: 0
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };
