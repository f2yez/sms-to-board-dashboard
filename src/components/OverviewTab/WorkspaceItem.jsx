import React from 'react';
import Badge from '../common/Badge/Badge';

const WorkspaceItem = ({ name, count }) => {
    return (
        <div className="workspace-item">
            <div className="workspace-info">
                <span className="name">{name}</span>
                <span className="count">{count} numbers reserved</span>
            </div>
            <Badge type="blue">Connected</Badge>
        </div>
    );
};

export default WorkspaceItem;
