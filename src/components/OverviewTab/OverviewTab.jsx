import React from 'react';
import { useSelector } from 'react-redux';
import StatCard from './StatCard';
import ActivityItem from './ActivityItem';
import WorkspaceItem from './WorkspaceItem';
import './OverviewTab.css';

const OverviewTab = () => {
    const { stats, activities, workspaces, loading, error } = useSelector((state) => state.sms);

    if (loading) {
        return <div className="loading-state">Loading dashboard data...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    return (
        <div className="overview-container">
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <StatCard key={i} {...s} />
                ))}
            </div>

            <div className="recent-activity">
                <h3>Recent SMS Activity</h3>
                <div className="activity-list">
                    {activities.map((a, i) => (
                        <ActivityItem key={i} {...a} />
                    ))}
                </div>
            </div>

            <div className="overview-sidebar">
                <div className="sidebar-card">
                    <h3>Connected Workspaces</h3>
                    <div className="workspace-list">
                        {workspaces.map((w, i) => (
                            <WorkspaceItem key={i} {...w} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
