import React from 'react';
import './Badge.css';

const Badge = ({ children, type = 'default', className = '' }) => {
    return (
        <span className={`vibe-badge badge-${type} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
