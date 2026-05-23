import React from 'react';

const StatCard = ({ icon, value, label, trend, trendValue }) => {
    return (
        <div className="stat-card card">
            <span className="icon">{icon}</span>
            <span className="value">{value}</span>
            <span className="label">{label}</span>
            {trendValue && (
                <span className="trend">
                    <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
                        {trendValue}
                    </span>
                </span>
            )}
        </div>
    );
};

export default StatCard;
