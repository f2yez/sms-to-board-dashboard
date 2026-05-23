import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editNumberStart, selectEditLoading, selectEditError, selectEditResult, fetchDashboardDataStart, resetEditState } from '../../store/slices/smsSlice';
import { selectWorkspaces, selectBoards, selectMondayContext, fetchWorkspacesStart, selectMondayError, fetchBoardColumnsStart, selectBoardColumns, selectColumnsLoading } from '../../store/slices/mondaySlice';
import './EditNumberModal.css';

const EditNumberModal = ({ isOpen, onClose, number }) => {
    const dispatch = useDispatch();
    const workspaces = useSelector(selectWorkspaces);
    const boards = useSelector(selectBoards);
    const context = useSelector(selectMondayContext);
    const mondayError = useSelector(selectMondayError);
    const columnsLoading = useSelector(selectColumnsLoading);

    // Edit State
    const editLoading = useSelector(selectEditLoading);
    const editError = useSelector(selectEditError);
    const editResult = useSelector(selectEditResult);

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [customName, setCustomName] = useState('');

    // Column Mapping State
    const [senderColumnId, setSenderColumnId] = useState('');
    const [textColumnId, setTextColumnId] = useState('');
    const [dateColumnId, setDateColumnId] = useState('');

    const boardColumns = useSelector(state => selectBoardColumns(state, selectedBoardId));

    // Pre-fill data
    useEffect(() => {
        if (isOpen && number) {
            setSelectedWorkspaceId(number.workspaceId || '');
            setSelectedBoardId(number.boardId || '');
            setCustomName(number.name || '');
            setSenderColumnId(number.senderNumberColumnId || '');
            setTextColumnId(number.smsBodyColumnId || '');
            setDateColumnId(number.dateTimeColumnId || '');
            dispatch(resetEditState());
        }
    }, [isOpen, number, dispatch]);

    // Initialize default workspace if not set
    useEffect(() => {
        if (isOpen && workspaces.length > 0 && !selectedWorkspaceId) {
            const contextWsId = context?.workspaceId ? String(context.workspaceId) : null;
            const matchingWs = contextWsId ? workspaces.find(ws => String(ws.id) === contextWsId) : null;
            if (matchingWs) {
                setSelectedWorkspaceId(String(matchingWs.id));
            } else {
                setSelectedWorkspaceId(String(workspaces[0].id));
            }
        }
    }, [isOpen, context, workspaces, selectedWorkspaceId]);

    // Derived filtered boards
    const filteredBoards = boards.filter(b => {
        if (selectedWorkspaceId === 'main') return !b.workspace_id;
        if (!selectedWorkspaceId) return true;
        return String(b.workspace_id) === String(selectedWorkspaceId);
    });

    // Handle board selection when filtered boards change
    useEffect(() => {
        if (isOpen && filteredBoards.length > 0) {
            const exists = filteredBoards.find(b => String(b.id) === String(selectedBoardId));
            if (!exists) {
                setSelectedBoardId(String(filteredBoards[0].id));
            }
        } else if (isOpen) {
            setSelectedBoardId('');
        }
    }, [isOpen, selectedWorkspaceId, boards, selectedBoardId]);

    // Fetch columns when board changes
    useEffect(() => {
        if (isOpen && selectedBoardId) {
            dispatch(fetchBoardColumnsStart(selectedBoardId));
        }
    }, [isOpen, selectedBoardId, dispatch]);

    // Filter columns by type
    const phoneColumns = boardColumns.filter(c => c.type === 'phone');
    const textColumns = boardColumns.filter(c => c.type === 'text' || c.type === 'long_text');
    const dateColumns = boardColumns.filter(c => c.type === 'date');

    // Close on success
    useEffect(() => {
        if (editResult && editResult.success) {
            onClose();
        }
    }, [editResult, onClose, dispatch]);

    if (!isOpen || !number) return null;

    const handleUpdate = () => {
        dispatch(editNumberStart({
            id: number.id, // Recipe ID
            boardId: selectedBoardId,
            workspaceId: selectedWorkspaceId,
            customName: customName,
            senderNumberColumnId: senderColumnId,
            smsBodyColumnId: textColumnId,
            dateTimeColumnId: dateColumnId
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content edit-modal">
                <div className="modal-header">
                    <h2>Edit Phone Number</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="modal-body">
                    <div className="number-info-banner">
                        <div className="info-item">
                            <label>Phone Number</label>
                            <span>{number.number}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Custom Name</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., Customer Support Line"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Workspace</label>
                        <select
                            className="form-control"
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                        >
                            <option value="main">Main Workspace</option>
                            {workspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                        </select>
                        {mondayError && <p className="error-text">Error loading workspaces: {mondayError}</p>}
                    </div>

                    <div className="form-group">
                        <label>Board Connection</label>
                        <select
                            className="form-control"
                            value={selectedBoardId}
                            onChange={(e) => setSelectedBoardId(e.target.value)}
                            disabled={filteredBoards.length === 0}
                        >
                            {filteredBoards.length === 0 && <option>No boards found</option>}
                            {filteredBoards.map(board => (
                                <option key={board.id} value={board.id}>{board.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="column-mapping-section" style={{ marginTop: '16px', padding: '12px', background: '#f8f9fb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px' }}>Column Mapping</h4>
                            {columnsLoading ? (
                                <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600' }}>Fetching columns...</span>
                            ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Link SMS details to columns</span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Sender (Phone)</label>
                                <select
                                    className="form-control"
                                    value={senderColumnId}
                                    onChange={(e) => setSenderColumnId(e.target.value)}
                                    disabled={columnsLoading || phoneColumns.length === 0}
                                    style={{ padding: '6px 8px', fontSize: '12px' }}
                                >
                                    <option value="">{columnsLoading ? 'Loading...' : (phoneColumns.length === 0 ? 'No Phone Column found' : 'Select Column')}</option>
                                    {phoneColumns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '8px' }}>
                                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Text (Text/Long)</label>
                                <select
                                    className="form-control"
                                    value={textColumnId}
                                    onChange={(e) => setTextColumnId(e.target.value)}
                                    disabled={columnsLoading || textColumns.length === 0}
                                    style={{ padding: '6px 8px', fontSize: '12px' }}
                                >
                                    <option value="">{columnsLoading ? 'Loading...' : (textColumns.length === 0 ? 'No Text Column found' : 'Select Column')}</option>
                                    {textColumns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '11px', marginBottom: '4px' }}>Date Column (Date)</label>
                            <select
                                className="form-control"
                                value={dateColumnId}
                                onChange={(e) => setDateColumnId(e.target.value)}
                                disabled={columnsLoading || dateColumns.length === 0}
                                style={{ padding: '6px 8px', fontSize: '12px' }}
                            >
                                <option value="">{columnsLoading ? 'Loading...' : (dateColumns.length === 0 ? 'No Date Column found' : 'Select Column')}</option>
                                {dateColumns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    </div>

                    {editError && (
                        <div className="alert alert-error">
                            <strong>Error:</strong> {editError}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleUpdate}
                        disabled={editLoading || !selectedBoardId}
                    >
                        {editLoading ? 'Updating...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditNumberModal;
