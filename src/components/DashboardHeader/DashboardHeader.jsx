import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardDataStart, selectQuota } from '../../store/slices/smsSlice';
import { selectIsConnected } from '../../store/slices/mondaySlice';
import Badge from '../common/Badge/Badge';
import Button from '../common/Button/Button';
import './DashboardHeader.css';

const DashboardHeader = ({ activeTab, onTabChange, onRentClick }) => {
    const dispatch = useDispatch();
    const { stats, numbers } = useSelector((state) => state.sms);
    const isConnected = useSelector(selectIsConnected);
    const quota = useSelector(selectQuota);

    const totalReserved = numbers.length;
    const activeCount = stats.find(s => s.label === 'Active Numbers')?.value || 0;
    const workspaceCount = stats.find(s => s.label === 'Workspaces')?.value || 0;

    const isQuotaExceeded = quota.maxBoards > 0 && quota.boardsCount >= quota.maxBoards;
    return (
        <div className="header-root">
            <div className="header-container">
                <div className="top-bar">
                    <h2 className="page-title">
                        Incoming SMS Messages
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 13l-5-5h10l-5 5z" />
                        </svg>
                    </h2>
                    <div className="top-actions">
                        {/* Action icons could go here */}
                    </div>
                </div>

                <div className="banner">
                    <div className="banner-left">
                        <div className="banner-icon-bg">
                            <div className="banner-icon-white-bg">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                        </div>
                        <div className="banner-info">
                            <h1>SMS Management Hub</h1>
                            <p>Enterprise SMS infrastructure for your Monday.com workspace</p>
                            <div className="banner-stats">
                                <Badge type="light">{totalReserved} Numbers Reserved</Badge>
                                <Badge type="green-solid">{activeCount} Active</Badge>
                                <Badge type="light">{workspaceCount} Workspaces</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="banner-right">
                        <Button variant="outline-white" style={{ borderRadius: '4px' }}
                            onClick={() => dispatch(fetchDashboardDataStart())}
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="white"
                            onClick={onRentClick}
                            style={{ borderRadius: '4px' }}
                            disabled={isQuotaExceeded}
                            title={isQuotaExceeded ? "You have reached your plan limit for reserved numbers. Please upgrade your plan." : ""}
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                        >
                            Reserve Number
                        </Button>
                    </div>
                </div>
            </div>

            <nav className="nav-tabs">
                <div
                    className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => onTabChange('overview')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    Overview
                </div>
                <div
                    className={`tab-link ${activeTab === 'reserved' ? 'active' : ''}`}
                    onClick={() => onTabChange('reserved')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    Reserved Numbers
                </div>
                <div
                    className={`tab-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => onTabChange('analytics')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>
                    Analytics
                </div>
                <div
                    className={`tab-link ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => onTabChange('settings')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Settings
                    {isConnected === false && <span className="warning-dot" title="Not connected">!</span>}
                </div>
            </nav>
        </div>
    );
};

export default DashboardHeader;
