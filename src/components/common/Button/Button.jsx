import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, className = '', icon, style }) => {
    return (
        <button
            className={`vibe-btn btn-${variant} ${className}`}
            onClick={onClick}
            style={style}
        >
            {icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
