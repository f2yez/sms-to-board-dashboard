import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import mondaySdk from 'monday-sdk-js';
import { selectIsConnected, selectIsCheckingConnection, checkConnectionStart } from '../../store/slices/mondaySlice';
import './SettingsTab.css';

const monday = mondaySdk();

const SettingsTab = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use global state
    const isConnected = useSelector(selectIsConnected);
    const checkingStatus = useSelector(selectIsCheckingConnection);

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
