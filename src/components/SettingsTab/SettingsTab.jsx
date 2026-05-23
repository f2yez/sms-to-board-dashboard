import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import mondaySdk from 'monday-sdk-js';
import { selectIsConnected, selectIsCheckingConnection, checkConnectionStart } from '../../store/slices/mondaySlice';
import { selectQuota } from '../../store/slices/smsSlice';
import './SettingsTab.css';

const monday = mondaySdk();

const SettingsTab = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use global state
    const isConnected = useSelector(selectIsConnected);
    const checkingStatus = useSelector(selectIsCheckingConnection);
    const quota = useSelector(selectQuota);

    // Refresh status on mount
    useEffect(() => {
        dispatch(checkConnectionStart());
    }, [dispatch]);

    const handleConnectMonday = async () => {
        setLoading(true);
        setError(null);
        try {
            const sessionToken = await monday.get('sessionToken');
            const token = sessionToken.data;

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/api/monday/auth/connect-url?backToUrl=${encodeURIComponent(window.location.href)}`, {
                headers: {
                    'Authorization': token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get authorization URL');
            }

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error connecting Monday account:', err);
            setError('Failed to initiate connection. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderUsageStats = () => {
        const { smsCount = 0, maxSms = 0, maxBoards = 0, itemsCount = 0, activeNumbers = 0, planSlug = '', planName = '' } = quota || {};
        const appPlan = (planSlug || planName || 'Free')
            .split(/[^a-zA-Z0-9]/)
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
        const smsProgress = maxSms > 0 ? (smsCount / maxSms) * 100 : 0;
        const boardsProgress = maxBoards > 0 ? (activeNumbers / maxBoards) * 100 : 0;

        return (
            <div className="usage-stats">
                {/* Monday.com Plan display removed as tier is not used for app plan */}
                <div className="plan-info">
                    <span className="plan-label">App Plan:</span>
                    <span className="plan-badge app-plan-badge">{appPlan}</span>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">SMS Quota</span>
                            <span className="stat-value">{smsCount} / {maxSms}</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(smsProgress, 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Active Numbers</span>
                            <span className="stat-value">{activeNumbers} / {maxBoards}</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(boardsProgress, 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Created Items</span>
                            <span className="stat-value">{itemsCount}</span>
                        </div>
                        <div className="stat-desc">Total items created on Monday.com</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="settings-tab">
            <div className="settings-section">
                <h3>Monday.com Integration</h3>
                <p>Manage your account connection and view your current plan usage.</p>

                {error && <div className="error-message">{error}</div>}

                <div className="connection-status-wrapper">
                    {checkingStatus ? (
                        <div className="loading-container">
                            <span className="status-text loading">Checking connection status...</span>
                        </div>
                    ) : isConnected ? (
                        <div className="connected-container">
                            <div className="connected-badge">
                                <span className="status-dot"></span>
                                Connected to Monday.com
                            </div>
                            {renderUsageStats()}
                        </div>
                    ) : (
                        <div className="disconnected-container">
                            <p className="no-connection-text">
                                Your account is not connected to Monday.com. Connect now to start creating items from SMS.
                            </p>
                            <button
                                className="connect-button"
                                onClick={handleConnectMonday}
                                disabled={loading}
                            >
                                {loading ? 'Connecting...' : 'Connect Monday Account'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
