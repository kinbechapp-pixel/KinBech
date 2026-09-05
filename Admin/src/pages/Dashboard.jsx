import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingReports: 0,
    pendingShops: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [attentionItems, setAttentionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/auth/admin/dashboard-stats');
      setStats(response.data.stats);
      setWeeklyData(response.data.weeklyData || []);

      // For now, keep activity and attention items as simulated since they require more complex analytics
      setRecentActivity([]);
      setAttentionItems([]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: colors.primary,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      icon: '📦',
      color: colors.info,
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: '🚩',
      color: colors.error,
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'Shops Awaiting Verification',
      value: stats.pendingShops,
      icon: '🏪',
      color: colors.warning,
      trend: '+2',
      trendUp: true,
    },
  ];

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const maxListings = Math.max(...weeklyData.map(d => d.listings));

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value.toLocaleString()}</p>
              <div className={`stat-trend ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                {stat.trendUp ? '↑' : '↓'} {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Weekly Listings</h3>
            <button className="view-report-btn">View Report</button>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {weeklyData.map((data) => (
                <div key={data.day} className="bar-wrapper">
                  <div
                    className="bar"
                    style={{
                      height: `${(data.listings / maxListings) * 100}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                  <div className="bar-label">{data.day}</div>
                  <div className="bar-value">{data.listings}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'report' && '🚩'}
                  {activity.type === 'verification' && '📄'}
                  {activity.type === 'action' && '⚡'}
                  {activity.type === 'system' && '⚙️'}
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="attention-card">
        <div className="card-header">
          <h3>Needs Your Attention</h3>
        </div>
        <div className="attention-table">
          {attentionItems.map((item) => (
            <div key={item.id} className="attention-item">
              <div className={`priority-badge ${item.priority.toLowerCase()}`}>
                {item.priority}
              </div>
              <div className="attention-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <span className="attention-time">{item.time}</span>
              </div>
              <button className="review-btn">Review</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;