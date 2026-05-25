import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/LoginPage/Login';
import ManagerUser from './pages/ManagerUserPage/ManagerUser';
import ProductManagement from './pages/addEditProductPage/ProductManagement';
import MeasurementDashboard from './pages/MeasurementDashboardPage/MeasurementDashboard';
import Measurement from './pages/MeasurementPage/Measurement'; // ตัวนี้คือ Flow หลัก (X -> Y)
import ActiveProductEdit from './pages/ActiveProductEditPage/ActiveProductEdit';
import SensorSettings from './pages/SensorSettingsPage/SensorSettings';
import RawValueLogPage from './pages/RawValueLogPage/RawValueLogPage';

import { ToastContainer } from 'react-toastify';
import {
  HiOutlineUsers,
  HiOutlinePlusCircle,
  HiCpuChip,
  HiOutlineClipboardDocumentCheck,
  HiOutlinePresentationChartLine,
  HiOutlineWrench,
  HiOutlineServer
} from "react-icons/hi2";

function Navigation() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (location.pathname === '/' || !isAuthenticated) return null;

  const getNavItems = () => {
    const allItems = [
      {
        path: '/manager-user',
        label: 'Manager User',
        icon: <HiOutlineUsers size={15} />,
        roles: ['admin', 'supervisor']
      },
      {
        path: '/add-product',
        label: 'Product Management',
        icon: <HiOutlinePlusCircle size={15} />,
        roles: ['admin', 'supervisor']
      },
      {
        path: '/sensor-settings',
        label: 'Sensor Settings',
        icon: <HiCpuChip size={15} />,
        roles: ['admin', 'supervisor', 'operator']
      },
      {
        path: '/measurement-flow',
        label: 'Measurement',
        icon: <HiOutlineClipboardDocumentCheck size={15} />,
        roles: ['admin', 'supervisor', 'operator']
      },
      {
        path: '/measurement-history',
        label: 'Measurement History',
        icon: <HiOutlinePresentationChartLine size={15} />,
        roles: ['admin', 'supervisor', 'operator']
      },
      {
        path: '/active-product-edit',
        label: 'Active Product Edit',
        icon: <HiOutlineWrench size={15} />,
        roles: ['admin', 'supervisor']
      },
      {
        path: '/raw-value-logs',
        label: 'Raw Logs',
        icon: <HiOutlineServer size={15} />,
        roles: ['admin', 'supervisor']
      }
    ];
    return allItems.filter(item => item.roles.includes(user?.role));
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-white/10 dark:border-white/5 sticky top-0 z-50 transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img src="./assets/icon_tail.png" alt="" className="absolute right-[-5%] lg:right-[5%] top-1/2 -translate-y-1/2 w-40 md:w-56 lg:w-72 z-10 opacity-40 dark:opacity-20 object-contain transition-all duration-500" />
        <div className='absolute bottom-0 w-full h-3/9 bg-blue-300 opacity-20'></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <img className='w-25' src="./assets/icon.png" alt="logo" />
            </div>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={`px-1 py-1 rounded-md text-xs font-medium transition duration-200 flex items-center gap-2 ${location.pathname === item.path ? 'bg-gray-500/10 text-black dark:text-gray-300' : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={handleLogout} className="px-1 py-1 text-xs z-50 font-bold text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20 rounded-lg transition duration-200">Logout</button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {isMobileMenuOpen ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 ${location.pathname === item.path ? 'bg-gray-500/10 text-gray-600 dark:text-gray-300' : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-200 hover:bg-red-500 dark:hover:bg-red-900/10">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 3. ล็อกอินเสร็จให้เด้งมาที่หน้าวัดงานเลย */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/measurement-flow" replace /> : <Login />}
      />
      <Route
        path="/manager-user"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <ManagerUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-product"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <ProductManagement />
          </ProtectedRoute>
        }
      />

      {/* 4. แก้ Route History ให้ตรงกับ Navbar */}
      <Route
        path="/measurement-history"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor', 'operator']}>
            <MeasurementDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sensor-settings"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor', 'operator']}>
            <SensorSettings />
          </ProtectedRoute>
        }
      />

      {/* 5. นี่คือ Route ของหน้าวัดงานหลัก ที่จะเรียกใช้ Measurement.jsx (ซึ่งมี StepProvider) */}
      <Route
        path="/measurement-flow"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor', 'operator']}>
            <Measurement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/active-product-edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <ActiveProductEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/raw-value-logs"
        element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <RawValueLogPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navigation />
          <AppRoutes />
        </div>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;