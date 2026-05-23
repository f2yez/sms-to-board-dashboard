import { useDispatch } from 'react-redux';
import { updateNumberStatus } from '../../store/slices/smsSlice';
import Badge from '../common/Badge/Badge';
import Toggle from '../common/Toggle/Toggle';
import Button from '../common/Button/Button';

const NumberTableRow = ({ row, onEdit }) => {
    const dispatch = useDispatch();
    const getStatusBadgeType = (status) => {
        switch (status) {
            case 'active': return 'green-light';
            case 'paused': return 'orange-light';
            case 'expired': return 'red-light';
            default: return 'default';
        }
    };

    return (
        <tr>
            <td className="cell-phone">
                <div className="phone-icon-bg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <div className="phone-details">
                    <span className="number">{row.name}</span>
                    <span className="id">{row.number}</span>
                    <span className="desc">{row.desc}</span>
                </div>
            </td>
            <td>
                <div className="cell-country">
                    <span className="flag">{row.flag}</span>
                    <div className="country-info">
                        <span className="name">{row.country}</span>
                        <span className="code">{row.country === 'United States' ? 'US' : 'GB'}</span>
                    </div>
                </div>
            </td>
            <td>
                <div className="cell-status">
                    <Badge type={getStatusBadgeType(row.status)}>{row.status}</Badge>
                    <Toggle active={row.toggle} onChange={() => dispatch(updateNumberStatus({ id: row.id, toggle: !row.toggle }))} />
                </div>
            </td>
            <td className="cell-workspace">
                <span className="name">Name: {row.workspaceName}</span>
                <span className="id">Id: {row.workspaceId}</span>
            </td>
            <td>
                <div className="cell-board">
                    <div className="board-info">
                        <span className="name">Name: {row.boardName}</span>
                        {row.boardId && <span className="id">Id: {row.boardId}</span>}
                    </div>
                    {row.boardId && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>}
                </div>
            </td>
            <td className="cell-messages">
                <div className="messages-group">
                    <span className="count">{row.messages}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <span className="total">Total received</span>
            </td>
            <td className="cell-actions">
                <Button
                    variant="edit"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                    onClick={onEdit}
                >
                    Edit
                </Button>
                <Button variant="menu">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                </Button>
            </td>
        </tr>
    );
};

export default NumberTableRow;
