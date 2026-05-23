import React from 'react';

const ActivityItem = ({ icon, name, time, msg }) => {
    return (
        <div className="activity-item">
            <div className="activity-avatar">{icon}</div>
            <div className="activity-details">
                <div className="meta">
                    <span className="name">{name}</span>
                    <span className="time">{time}</span>
                </div>
                <div className="msg">{msg}</div>
            </div>
        </div>
    );
};

export default ActivityItem;
