import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectWorkspaces, selectBoards } from '../../store/slices/mondaySlice';
import NumberTableRow from './NumberTableRow';
import EditNumberModal from '../EditNumberModal/EditNumberModal';
import Badge from '../common/Badge/Badge';
import './NumberTable.css';

const NumberTable = () => {
    const dispatch = useDispatch();
    const { numbers, loading, error } = useSelector((state) => state.sms);
    const workspaces = useSelector(selectWorkspaces);
    const boards = useSelector(selectBoards);

    const [editingNumber, setEditingNumber] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEditClick = (num) => {
        setEditingNumber(num);
        setIsEditModalOpen(true);
    };

    // Enrich numbers with workspace and board names
    const enrichedNumbers = numbers.map(num => {
        const workspace = workspaces.find(ws => String(ws.id) === String(num.workspaceId));
        const board = boards.find(b => String(b.id) === String(num.boardId));

        return {
            ...num,
            workspaceName: workspace ? workspace.name : (num.workspaceId === 'main' ? 'main' : num.workspaceId),
            boardName: board ? board.name : num.boardId
        };
    });

    const displayNumbers = enrichedNumbers;

    if (loading) {
        return <div className="loading-state">Loading numbers...</div>;
    }

    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }

    const totalNumbers = displayNumbers.length;
    const activeNumbers = displayNumbers.filter(num => num.status === 'active').length;

    return (
        <div className="table-container card">
            <div className="table-header">
                <div>
                    <h3>Reserved Numbers Management</h3>
                    <p className="subtitle">Manage SMS-enabled phone numbers across your workspaces</p>
                </div>
                <div className="table-stats">
                    <Badge type="blue">{totalNumbers} Total</Badge>
                    <Badge type="green">{activeNumbers} Active</Badge>
                </div>
            </div>
            <table className="vibe-table">
                <thead>
                    <tr>
                        <th>Phone Number</th>
                        <th>Country</th>
                        <th>Status</th>
                        <th>Linked Workspace</th>
                        <th>Board Connection</th>
                        <th>Messages</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {displayNumbers.map((row) => (
                        <NumberTableRow
                            key={row.id}
                            row={row}
                            onEdit={() => handleEditClick(row)}
                        />
                    ))}
                </tbody>
            </table>

            <EditNumberModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                number={editingNumber}
            />
        </div>
    );
};

export default NumberTable;
