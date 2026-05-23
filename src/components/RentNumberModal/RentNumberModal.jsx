import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchNumbersStart, selectSearchResults, selectSearchLoading, selectSearchError, rentNumberStart, selectRentLoading, selectRentError, selectRentResult, fetchDashboardDataStart, resetRentState, selectQuota } from '../../store/slices/smsSlice';
import { selectWorkspaces, selectBoards, selectMondayContext, fetchWorkspacesStart, selectMondayError, fetchBoardColumnsStart, selectBoardColumns, selectColumnsLoading } from '../../store/slices/mondaySlice';
import './RentNumberModal.css';

const RentNumberModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const searchResults = useSelector(selectSearchResults);
    const searchLoading = useSelector(selectSearchLoading);
    const searchError = useSelector(selectSearchError);
    const quota = useSelector(selectQuota);

    // Monday Data
    const workspaces = useSelector(selectWorkspaces);
    const boards = useSelector(selectBoards);
    const context = useSelector(selectMondayContext);
    const mondayError = useSelector(selectMondayError);
    const columnsLoading = useSelector(selectColumnsLoading);

    // Renting State
    const rentLoading = useSelector(selectRentLoading);
    const rentError = useSelector(selectRentError);
    const rentResult = useSelector(selectRentResult);

    const [step, setStep] = useState(1);
    const [connectionType, setConnectionType] = useState(null); // 'app' or 'external'
    const [provider, setProvider] = useState(null);
    const [country, setCountry] = useState('United States');
    const [type, setType] = useState('Mobile Number');
    const [pattern, setPattern] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [selectedNumber, setSelectedNumber] = useState(null);

    // Step 5 State
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [customName, setCustomName] = useState('');

    // Column Mapping State
    const [senderColumnId, setSenderColumnId] = useState('');
    const [textColumnId, setTextColumnId] = useState('');
    const [dateColumnId, setDateColumnId] = useState('');

    const boardColumns = useSelector(state => selectBoardColumns(state, selectedBoardId));

    const handleConnectionTypeSelect = (type) => {
        setConnectionType(type);
        if (type === 'app') {
            setProvider('twilio');
            setStep(4); // Skip to Search
        } else {
            setProvider(null);
            setStep(2); // Go to Provider Selection
        }
    };

    const handleSearch = () => {
        dispatch(resetRentState()); // Clear previous rent errors/results
        dispatch(searchNumbersStart({
            country,
            type,
            pattern,
            connectionType,
            apiKey: connectionType === 'external' ? apiKey : undefined,
            apiSecret: connectionType === 'external' ? apiSecret : undefined
        }));
    };

    const handleRentNumber = () => {
        console.log('Renting number with details:');
        if (!selectedNumber) return;

        dispatch(rentNumberStart({
            phoneNumber: selectedNumber.phoneNumber,
            countryCode: selectedNumber.isoCountry,
            connectionType,
            apiKey: connectionType === 'external' ? apiKey : undefined,
            apiSecret: connectionType === 'external' ? apiSecret : undefined,
            boardId: selectedBoardId,
            workspaceId: selectedWorkspaceId,
            customName: customName,
            senderNumberColumnId: senderColumnId,
            smsBodyColumnId: textColumnId,
            dateTimeColumnId: dateColumnId
        }));
    };

    // Close on success
    useEffect(() => {
        if (rentResult && rentResult.success) {
            dispatch(fetchDashboardDataStart()); // Refresh dashboard
            onClose();
        }
    }, [rentResult, onClose, dispatch]);

    useEffect(() => {
        if (isOpen) {
            dispatch(resetRentState());
        }
    }, [isOpen, dispatch]);

    // Initialize default workspace from context or first available
    useEffect(() => {
        if (workspaces.length > 0 && !selectedWorkspaceId) {
            // Try to match context workspace, otherwise use first
            const contextWsId = context?.workspaceId ? String(context.workspaceId) : null;
            const matchingWs = contextWsId ? workspaces.find(ws => String(ws.id) === contextWsId) : null;
            if (matchingWs) {
                setSelectedWorkspaceId(String(matchingWs.id));
            } else {
                setSelectedWorkspaceId(String(workspaces[0].id));
            }
        }
    }, [context, workspaces]);

    // Derived filtered boards - use String() to handle type mismatches
    const filteredBoards = boards.filter(b => {
        if (selectedWorkspaceId === 'main') return !b.workspace_id;
        if (!selectedWorkspaceId) return true;
        return String(b.workspace_id) === String(selectedWorkspaceId);
    });

    // Initialize default board when filtered boards change
    useEffect(() => {
        if (filteredBoards.length > 0) {
            const exists = filteredBoards.find(b => String(b.id) === String(selectedBoardId));
            if (!exists) {
                setSelectedBoardId(String(filteredBoards[0].id));
            }
        } else {
            setSelectedBoardId('');
        }
    }, [selectedWorkspaceId, boards]);

    // Fetch columns when board changes
    useEffect(() => {
        if (selectedBoardId) {
            dispatch(fetchBoardColumnsStart(selectedBoardId));
        }
    }, [selectedBoardId, dispatch]);

    // Filter columns by type
    const phoneColumns = boardColumns.filter(c => c.type === 'phone');
    const textColumns = boardColumns.filter(c => c.type === 'text' || c.type === 'long_text');
    const dateColumns = boardColumns.filter(c => c.type === 'date');

    if (!isOpen) return null;

    const nextStep = () => setStep(s => s + 1);

    const prevStep = () => {
        if (step === 4 && connectionType === 'app') {
            setStep(1);
        } else {
            setStep(s => s - 1);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <div className="wizard-title">
                            <h3>Choose Connection Type</h3>
                            <p>How would you like to connect to an SMS provider?</p>
                        </div>
                        <div className="provider-options">
                            <div
                                className={`provider-card ${connectionType === 'app' ? 'selected' : ''}`}
                                onClick={() => handleConnectionTypeSelect('app')}
                            >
                                <div className="provider-badge badge-recommended">Recommended</div>
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚡</div>
                                <h4>App Provider</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended. The easiest way to get started. No external accounts or API keys required.</p>
                            </div>
                            <div
                                className={`provider-card disabled ${connectionType === 'external' ? 'selected' : ''}`}
                                onClick={() => {/* handleConnectionTypeSelect('external') */ }}
                                style={{ cursor: 'not-allowed', opacity: 0.7, position: 'relative' }}
                            >
                                <div className="provider-badge badge-coming-soon" style={{ background: '#676879', color: 'white' }}>Coming Soon</div>
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
                                <h4>External Provider</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect your own Vonage or Twilio account with API keys.</p>
                            </div>
                        </div>
                    </div>
                );
            case 2: // External only: Choose Provider
                return (
                    <div className="wizard-step">
                        <div className="wizard-title">
                            <h3>Choose Your SMS Provider</h3>
                            <p>Select the underlying carrier for your new phone numbers</p>
                        </div>
                        <div className="provider-options">
                            <div
                                className={`provider-card ${provider === 'vonage' ? 'selected' : ''}`}
                                onClick={() => setProvider('vonage')}
                            >
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📲</div>
                                <h4>Vonage</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Global communications platform with extensive coverage</p>
                            </div>
                            <div
                                className={`provider-card ${provider === 'twilio' ? 'selected' : ''}`}
                                onClick={() => setProvider('twilio')}
                            >
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔴</div>
                                <h4>Twilio</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Leading cloud communications platform with flexible APIs</p>
                            </div>
                        </div>
                    </div>
                );
            case 3: // External only: Enter Credentials
                return (
                    <div className="wizard-step">
                        <div className="wizard-title">
                            <h3>Connect to {provider === 'vonage' ? 'Vonage' : 'Twilio'}</h3>
                            <p>Enter your API credentials to search and rent phone numbers</p>
                        </div>
                        <div className="form-group">
                            <label>API Key</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={`Enter your ${provider} API Key`}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>API Secret</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder={`Enter your ${provider} API Secret`}
                                value={apiSecret}
                                onChange={(e) => setApiSecret(e.target.value)}
                            />
                        </div>
                        <div style={{ background: '#f0f7ff', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            <p style={{ fontSize: '12px', margin: 0 }}>Your credentials are stored locally and used only for direct communication with provider APIs.</p>
                        </div>
                    </div>
                );
            case 4: // Search Numbers
                return (
                    <div className="wizard-step">
                        <div className="wizard-title">
                            <h3>Search Available Numbers</h3>
                            <p>Find and select a phone number to rent from {provider === 'twilio' ? 'Twilio' : 'Vonage'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Country</label>
                                <select
                                    className="form-control"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                >
                                    <option>United Kingdom</option>
                                    <option>United States</option>
                                    <option>Germany</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Type</label>
                                <select
                                    className="form-control"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option>Mobile Number</option>
                                    <option>Landline</option>
                                    <option>Toll-Free</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Area Code / Pattern (Optional)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., 020, 161, 44"
                                value={pattern}
                                onChange={(e) => setPattern(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={handleSearch} disabled={searchLoading}>
                                {searchLoading ? 'Searching...' : 'Search Numbers'}
                            </button>
                        </div>

                        {searchLoading && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div className="spinner"></div>
                                <p>Searching for numbers...</p>
                            </div>
                        )}

                        {searchError && (
                            <div style={{ padding: '16px', background: '#fff0f0', color: '#d32f2f', borderRadius: '8px', marginBottom: '16px' }}>
                                Error: {searchError}
                            </div>
                        )}

                        {!searchLoading && !searchError && searchResults.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ marginBottom: '12px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No numbers available for the selected criteria.</p>
                            </div>
                        )}

                        {!searchLoading && searchResults.length > 0 && (
                            <div className="search-results" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                {searchResults.map((num) => (
                                    <div
                                        key={num.phoneNumber}
                                        className={`search-result-item ${selectedNumber?.phoneNumber === num.phoneNumber ? 'selected' : ''}`}
                                        onClick={() => setSelectedNumber(num)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            background: selectedNumber?.phoneNumber === num.phoneNumber ? '#f0f7ff' : 'white'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{num.friendlyName || num.phoneNumber}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {num.locality ? `${num.locality}, ` : ''}{num.region ? `${num.region}, ` : ''}{num.isoCountry}
                                            </div>
                                        </div>
                                        {selectedNumber?.phoneNumber === num.phoneNumber && (
                                            <div style={{ color: 'var(--primary-color)' }}>✓</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 5: // Configure Number
                return (
                    <div className="wizard-step">
                        <div className="wizard-title">
                            <h3>Configure Number</h3>
                            <p>Set up your rented phone number</p>
                        </div>
                        <div className="form-group">
                            <label>Workspace</label>
                            <select
                                className="form-control"
                                value={selectedWorkspaceId !== null ? selectedWorkspaceId : ''}
                                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            >
                                <option value="" disabled>Select Workspace</option>
                                {workspaces.map(ws => (
                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                ))}
                            </select>
                            {mondayError && <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>Error loading workspaces: {mondayError}</p>}
                        </div>
                        <div className="form-group">
                            <label>Choose board to receive messages</label>
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
                        <div className="form-group">
                            <label>Custom Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., Customer Support Line, Sales Inquiries"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
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
                        {rentError && (
                            <div style={{ color: 'red', marginTop: '16px', padding: '12px', background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: '4px', fontSize: '14px' }}>
                                <strong>Error:</strong> {rentError}
                                {rentError.includes('Bundle required') && (
                                    <div style={{ marginTop: '8px', color: '#666', borderTop: '1px solid #ffc9c9', paddingTop: '8px' }}>
                                        <strong>Tip:</strong> Some countries (like UK) require a Regulatory Bundle (identity verification) in your Twilio Console.
                                        <br /><br />
                                        For testing, we recommend trying a <strong>United States</strong> number, which typically doesn't require a bundle for purchase.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    const getStepLabel = () => {
        if (step === 1) return 'Connection Type';
        if (step === 2) return 'Provider Selection';
        if (step === 3) return 'Connect Provider';
        if (step === 4) return 'Search & Rent';
        if (step === 5) return 'Configuration';
        return '';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Rent Phone Number</h2>
                    <span className="step-info">Step {step} of 5 - {getStepLabel()}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
                <div className="modal-body">
                    {rentError && (
                        <div style={{ padding: '12px', background: '#fff5f5', borderLeft: '4px solid #f44336', marginBottom: '16px', color: '#d32f2f', fontSize: '13px' }}>
                            <strong>Error:</strong> {typeof rentError === 'object' ? (rentError.message || JSON.stringify(rentError)) : rentError}
                        </div>
                    )}
                    {renderStep()}
                </div>
                <div className="modal-footer">
                    {step > 1 ? (
                        <button className="btn-secondary" onClick={prevStep}>Back</button>
                    ) : (
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    )}

                    {step < 5 ? (
                        <button
                            className="btn-primary"
                            onClick={nextStep}
                            disabled={
                                (step === 1 && !connectionType) ||
                                (step === 2 && !provider) ||
                                (step === 4 && !selectedNumber)
                            }
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleRentNumber}
                            disabled={rentLoading || !selectedBoardId}
                        >
                            {rentLoading ? 'Renting...' : 'Rent Number'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentNumberModal;
