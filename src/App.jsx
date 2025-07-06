import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import PageSteam from './pages/PageSteam';
import SteamControlDashboard from './pages/SteamControlDashboard';
import './index.css';
import TodoList from './pages/TodoList';
import { 
  FaHome, 
  FaInfoCircle, 
  FaSteam, 
  FaThermometerHalf, 
  FaList, 
  FaBars,
  FaTimes
} from 'react-icons/fa';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-800 text-gray-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-900 shadow-lg p-4 flex justify-between items-center">
          <button 
            onClick={toggleSidebar} 
            className="text-blue-400 focus:outline-none hover:text-blue-300 transition-colors"
          >
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <h1 className="text-xl font-bold text-blue-400">CNC CONTROL PANEL</h1>
        </div>

        {/* Sidebar HMI Style */}
        <div 
          className={`fixed md:static inset-y-0 left-0 bg-gray-900 shadow-2xl w-64 z-30 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out border-r-2 border-blue-500 flex flex-col`}
        >
          {/* CNC Header */}
          <div className="p-4 border-b-2 border-blue-500 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-400 tracking-wider">CNC CONTROL PANEL</h1>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>STATUS: <span className="text-green-400">OPERATIONAL</span></span>
              <span>V2.4.8</span>
            </div>
          </div>
          
          {/* Navigation Panel - Takes remaining space */}
          <nav className="p-2 flex flex-col gap-1 mt-4 flex-grow">
            <NavLink to="/" icon={<FaHome />} label="Home" />
            <NavLink to="/about" icon={<FaInfoCircle />} label="System Info" />
            <NavLink to="/steam" icon={<FaSteam />} label="Steam Control" />
            <NavLink to="/steam-control" icon={<FaThermometerHalf />} label="Thermal Monitor" />
            <NavLink to="/todo" icon={<FaList />} label="Operation Log" />
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto bg-gray-700">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/steam" element={<PageSteam />} />
            <Route path="/steam-control" element={<SteamControlDashboard />} />
            <Route path="/todo" element={<TodoList />} />
            <Route path="*" element={<h1 className="text-2xl font-bold">404 - COMMAND NOT FOUND</h1>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Enhanced NavLink component with CNC style
function NavLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center p-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg border-l-4 border-yellow-400' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <span className={`mr-3 ${isActive ? 'text-yellow-300' : 'text-blue-400'}`}>
        {icon}
      </span>
      <span className="font-medium tracking-wider">{label}</span>
    </Link>
  );
}

export default App;