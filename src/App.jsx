import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, toggleRentModal } from './store/slices/uiSlice';
import { fetchDashboardDataStart } from './store/slices/smsSlice';
import { checkConnectionStart, selectIsConnected, selectIsCheckingConnection } from './store/slices/mondaySlice';
import './App.css';
import './styles/components.css';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import OverviewTab from './components/OverviewTab/OverviewTab';
import NumberTable from './components/NumberTable/NumberTable';
import RentNumberModal from './components/RentNumberModal/RentNumberModal';
import SettingsTab from './components/SettingsTab/SettingsTab';

function App() {
  const dispatch = useDispatch();
  const isConnected = useSelector(selectIsConnected);
  const isCheckingConnection = useSelector(selectIsCheckingConnection);

  useEffect(() => {
    dispatch(fetchDashboardDataStart());
    dispatch(checkConnectionStart());
  }, [dispatch]);

  const activeTab = useSelector((state) => state.ui.activeTab);
  const showRentModal = useSelector((state) => state.ui.showRentModal);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'reserved':
        return <NumberTable />;
      case 'analytics':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-secondary)' }}>Analytics View</h2>
            <p>Visual usage data and cost analysis coming soon.</p>
          </div>
        );
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="dashboard">
      {!isCheckingConnection && isConnected === false && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <span>Your Monday.com account is not connected. Inbound SMS will not create items. <button className="link-button" onClick={() => dispatch(setActiveTab('settings'))}>Connect now</button></span>
        </div>
      )}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => dispatch(setActiveTab(tab))}
        onRentClick={() => dispatch(toggleRentModal(true))}
      />
      <main className="dashboard-content">
        {renderContent()}
      </main>

      <RentNumberModal
        isOpen={showRentModal}
        onClose={() => dispatch(toggleRentModal(false))}
      />

      <footer className="app-footer">
        <span>SMS to Board</span>
        <span className="app-footer-sep">·</span>
        <span>v{__APP_VERSION__}</span>
      </footer>
    </div>
  );
}

export default App;
