import React from 'react';
import './Toggle.css';

const Toggle = ({ active, onChange }) => {
    return (
        <div
            className={`vibe-toggle ${!active ? 'toggle-off' : ''}`}
            onClick={onChange}
        ></div>
    );
};

export default Toggle;
