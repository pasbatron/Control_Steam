import React, { useState, useEffect } from 'react';
import { 
  Gauge, Power, Settings, AlertTriangle, Thermometer, 
  Droplets, Activity, Zap, Play, Pause, RotateCcw, 
  DollarSign, Clock, Car, SprayCan, Loader2, Wifi, WifiOff
} from 'lucide-react';

const SteamControlDashboard = () => {
  const API_BASE_URL = 'https://8aa6-103-47-133-159.ngrok-free.app';
  
  const [systemData, setSystemData] = useState({
    systemStatus: {
      steam_pressure: 0,
      temperature: 25,
      water_level: 75,
      motor_speed: 0,
      voltage: 220,
      is_running: false,
      target_pressure: 5,
      target_speed: 1800,
      active_motors: 3
    },
    resourceUsage: {
      energy_consumption: 0,
      water_usage: 0,
      soap_usage: 0,
      wash_duration: 0,
      wash_sessions: 0,
      total_revenue: 0
    },
    tariffs: {
      electricity: 1500,
      water: 500,
      soap: 50,
      service_price: 15000
    },
    realtimeDebits: {
      water_debit: 0,
      soap_debit: 0,
      energy_debit: 0
    },
    alerts: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Fetch data from backend API
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setSystemData(result.data);
        setConnectionStatus('connected');
      } else {
        throw new Error('Invalid response format');
      }
      
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setConnectionStatus('disconnected');
      setIsLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  // Initial fetch and set interval for real-time updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle API commands
  const sendCommand = async (endpoint, body = {}) => {
    setIsSendingCommand(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Command failed');
      }
      
      // Refresh data after successful command
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Command error:', err);
    } finally {
      setIsSendingCommand(false);
    }
  };

  // Handle start command
  const handleStart = () => {
    setSessionStartTime(new Date());
    sendCommand('/api/update-status', { is_running: true });
  };

  // Handle stop command
  const handleStop = () => {
    sendCommand('/api/update-status', { is_running: false });
  };

  // Handle emergency stop
  const handleEmergencyStop = () => {
    setSessionStartTime(null);
    sendCommand('/api/update-status', { 
      is_running: false,
      steam_pressure: 0,
      motor_speed: 0,
      temperature: 25
    });
  };

  // Reset counters
  const resetCounters = () => {
    sendCommand('/api/reset');
    setSessionStartTime(null);
  };

  // Update target pressure
  const updateTargetPressure = (value) => {
    sendCommand('/api/update-status', { target_pressure: value });
  };

  // Update target speed
  const updateTargetSpeed = (value) => {
    sendCommand('/api/update-status', { target_speed: value });
  };

  // Update active motors
  const updateActiveMotors = (value) => {
    sendCommand('/api/update-status', { active_motors: value });
  };

  // Update service price
  const updateServicePrice = (value) => {
    sendCommand('/api/update-resources', { service_price: value });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-200">Menghubungkan ke sistem...</p>
          <p className="text-sm text-gray-400 mt-2">Mengambil data dari {API_BASE_URL}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 bg-gray-800 border border-red-500 rounded-lg shadow-xl max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Koneksi Gagal</h2>
          <p className="text-gray-300 mb-4">Tidak dapat terhubung ke sistem kontrol</p>
          <p className="text-gray-400 text-sm mb-2">
            Endpoint: <code className="bg-gray-700 p-1 rounded">{API_BASE_URL}/api/status</code>
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Error: {error}
          </p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const {
    systemStatus,
    resourceUsage,
    tariffs,
    realtimeDebits,
    alerts
  } = systemData;

  // Calculate wash duration if session is running
  let washDuration = resourceUsage.wash_duration || 0;
  if (systemStatus.is_running && sessionStartTime) {
    const secondsElapsed = (new Date() - sessionStartTime) / 1000;
    washDuration += secondsElapsed / 60;
  }

  // Calculate financials
  const grossRevenue = (resourceUsage.wash_sessions || 0) * (systemStatus.active_motors || 0) * (tariffs.service_price || 0);
  const operationalCost = 
    ((resourceUsage.energy_consumption || 0) * (tariffs.electricity || 0)) +
    ((resourceUsage.water_usage || 0) * (tariffs.water || 0)) +
    ((resourceUsage.soap_usage || 0) * (tariffs.soap || 0));
  
  const netRevenue = grossRevenue - operationalCost;
return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 overflow-auto">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 mb-1 flex items-center gap-2">
              <span className="bg-blue-900/30 p-2 rounded-lg">
                <Gauge className="w-6 h-6" />
              </span>
              STEAM MOTOR CONTROL SYSTEM
            </h1>
            <p className="text-gray-400 text-sm">Kontrol dan Monitor Steam Motor Secara Real-time</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-300">
                {connectionStatus === 'connected' ? 'TERHUBUNG' : 
                connectionStatus === 'connecting' ? 'MENGHUBUNGKAN...' : 'TERPUTUS'}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Wifi className="w-4 h-4" />
              {API_BASE_URL.replace('https://', '')}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Gauges Panel */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <GaugeComponent
                value={systemStatus.steam_pressure}
                max={10}
                title="TEKANAN STEAM"
                unit="Bar"
                color="#3b82f6"
                icon={Activity}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <GaugeComponent
                value={systemStatus.temperature}
                max={150}
                title="SUHU"
                unit="°C"
                color="#ef4444"
                icon={Thermometer}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <GaugeComponent
                value={systemStatus.motor_speed}
                max={3000}
                title="KEC. MOTOR"
                unit="RPM"
                color="#10b981"
                icon={Zap}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <GaugeComponent
                value={systemStatus.water_level}
                max={100}
                title="LEVEL AIR"
                unit="%"
                color="#0ea5e9"
                icon={Droplets}
              />
            </div>
          </div>

          {/* Center Control Panel */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {/* Control Panel */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                  <Settings className="w-5 h-5" />
                  PANEL KONTROL
                </h2>
                <div className="text-xs px-2 py-1 bg-blue-900/30 rounded text-blue-300">
                  Motor Aktif: {systemStatus.active_motors}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ControlSlider 
                  label="Target Tekanan"
                  unit="Bar"
                  min={0}
                  max={10}
                  step={0.1}
                  value={systemStatus.target_pressure}
                  onChange={updateTargetPressure}
                  icon={Activity}
                  color="from-blue-600 to-blue-800"
                />
                
                <ControlSlider 
                  label="Target Kecepatan"
                  unit="RPM"
                  min={0}
                  max={3000}
                  step={100}
                  value={systemStatus.target_speed}
                  onChange={updateTargetSpeed}
                  icon={Zap}
                  color="from-green-600 to-green-800"
                />
                
                <div className="md:col-span-2">
                  <div className="grid grid-cols-4 gap-3">
                    <ControlInput 
                      label="Motor Aktif"
                      value={systemStatus.active_motors}
                      min={1}
                      max={10}
                      onChange={updateActiveMotors}
                      icon={Car}
                    />
                    
                    <ControlInput 
                      label="Harga (Rp)"
                      value={tariffs.service_price}
                      onChange={updateServicePrice}
                      icon={DollarSign}
                      currency
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <div className="grid grid-cols-4 gap-3">
                <ActionButton
                  onClick={handleStart}
                  disabled={systemStatus.is_running || isSendingCommand}
                  label="START"
                  icon={Play}
                  color="bg-green-600 hover:bg-green-700"
                  active={systemStatus.is_running}
                />
                
                <ActionButton
                  onClick={handleStop}
                  disabled={!systemStatus.is_running || isSendingCommand}
                  label="STOP"
                  icon={Pause}
                  color="bg-blue-600 hover:bg-blue-700"
                  active={!systemStatus.is_running}
                />
                
                <ActionButton
                  onClick={resetCounters}
                  disabled={isSendingCommand}
                  label="RESET"
                  icon={RotateCcw}
                  color="bg-gray-600 hover:bg-gray-700"
                />
                
                <ActionButton
                  onClick={handleEmergencyStop}
                  disabled={isSendingCommand}
                  label="EMERGENCY"
                  icon={Power}
                  color="bg-red-600 hover:bg-red-700"
                />
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                <Activity className="w-5 h-5" />
                STATUS SISTEM
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatusIndicator
                  label="Level Air"
                  value={`${systemStatus.water_level.toFixed(1)}%`}
                  icon={Droplets}
                  color="bg-blue-500"
                />
                <StatusIndicator
                  label="Tegangan"
                  value={`${systemStatus.voltage.toFixed(1)}V`}
                  icon={Zap}
                  color="bg-yellow-500"
                />
                <StatusIndicator
                  label="Status Sistem"
                  value={systemStatus.is_running ? "RUNNING" : "STOPPED"}
                  icon={Activity}
                  color={systemStatus.is_running ? "bg-green-500" : "bg-red-500"}
                />
                <StatusIndicator
                  label="Suhu Steam"
                  value={`${systemStatus.temperature.toFixed(1)}°C`}
                  icon={Thermometer}
                  color="bg-red-500"
                />
                <StatusIndicator
                  label="Durasi Cuci"
                  value={`${washDuration.toFixed(1)} min`}
                  icon={Clock}
                  color="bg-purple-500"
                />
                <StatusIndicator
                  label="Motor Aktif"
                  value={`${systemStatus.active_motors} unit`}
                  icon={Car}
                  color="bg-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Right Data Panel */}
          <div className="lg:col-span-3 grid grid-cols-1 gap-4">
            {/* Alerts */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm h-full">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                ALARM SYSTEM
              </h2>
              <div className="space-y-2 max-h-60 overflow-auto pr-2">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        alert.type === 'danger' 
                          ? 'bg-red-900/60 border border-red-700' 
                          : 'bg-yellow-900/60 border border-yellow-700'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{alert.title || "Peringatan"}</div>
                        <div className="text-sm opacity-80">{alert.message}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-800/50 rounded-lg">
                    Tidak ada alarm saat ini
                  </div>
                )}
              </div>
            </div>

            {/* Resource Monitoring */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                <Zap className="w-5 h-5" />
                MONITORING RESOURCE
              </h2>
              <div className="space-y-4">
                <ResourceItem
                  icon={Droplets}
                  color="text-blue-400"
                  label="Air"
                  debit={realtimeDebits.water_debit}
                  debitUnit="L/min"
                  total={resourceUsage.water_usage}
                  totalUnit="L"
                  cost={resourceUsage.water_usage * tariffs.water}
                />
                
                <ResourceItem
                  icon={SprayCan}
                  color="text-green-400"
                  label="Sabun"
                  debit={realtimeDebits.soap_debit}
                  debitUnit="ml/min"
                  total={resourceUsage.soap_usage}
                  totalUnit="ml"
                  cost={resourceUsage.soap_usage * tariffs.soap}
                />
                
                <ResourceItem
                  icon={Zap}
                  color="text-yellow-400"
                  label="Energi"
                  debit={realtimeDebits.energy_debit}
                  debitUnit="kW"
                  total={resourceUsage.energy_consumption}
                  totalUnit="kWh"
                  cost={resourceUsage.energy_consumption * tariffs.electricity}
                />
              </div>
            </div>

            {/* Financials */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                <DollarSign className="w-5 h-5" />
                FINANSIAL
              </h2>
              <div className="space-y-4">
                <FinancialItem 
                  label="Pendapatan Kotor" 
                  value={grossRevenue} 
                  positive 
                />
                <FinancialItem 
                  label="Biaya Operasional" 
                  value={operationalCost} 
                />
                <div className="h-0.5 bg-gray-700 my-2"></div>
                <FinancialItem 
                  label="Keuntungan Bersih" 
                  value={netRevenue} 
                  bold 
                  positive={netRevenue >= 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>Steam Motor Control System v1.3.0</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {new Date().toLocaleString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen Gauge yang diperbarui
const GaugeComponent = ({ value, max, min = 0, title, unit, color, icon: Icon }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 text-gray-300">
        <Icon className="w-5 h-5" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[160px] mx-auto">
          <svg className="w-full" viewBox="0 0 160 80">
            {/* Background arc */}
            <path 
              d="M20,70 A60,60 0 0,1 140,70" 
              fill="none" 
              stroke="#334155" 
              strokeWidth="12" 
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path 
              d="M20,70 A60,60 0 0,1 140,70" 
              fill="none" 
              stroke={color} 
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray={`${percentage * 1.885} 188.5`}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold text-white">
              {typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value}
            </div>
            <div className="text-sm text-gray-400">{unit}</div>
          </div>
        </div>
        <div className="flex justify-between w-full text-xs text-gray-500 mt-2 px-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Komponen baru untuk slider kontrol
const ControlSlider = ({ label, unit, value, min, max, step, onChange, icon: Icon, color }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="w-4 h-4" />
      <label className="text-sm">{label}</label>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`flex-1 h-2 bg-gradient-to-r ${color} rounded-lg appearance-none cursor-pointer`}
      />
      <div className="w-16 text-center font-mono font-bold text-white bg-gray-700 py-1 rounded">
        {value.toFixed(step < 1 ? 1 : 0)}
      </div>
    </div>
    <div className="flex justify-between text-xs text-gray-500">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

// Komponen baru untuk input kontrol
const ControlInput = ({ label, value, onChange, min, max, icon: Icon, currency }) => (
  <div className={`${min ? 'col-span-2' : 'col-span-2'}`}>
    <div className="flex items-center gap-2 text-gray-400 mb-1">
      <Icon className="w-4 h-4" />
      <label className="text-xs">{label}</label>
    </div>
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center font-medium"
      />
      {currency && (
        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">Rp</span>
      )}
    </div>
  </div>
);

// Komponen tombol aksi
const ActionButton = ({ onClick, disabled, label, icon: Icon, color, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03]'
    } ${color} ${active ? 'ring-2 ring-white ring-opacity-50' : ''}`}
  >
    <Icon className={`w-6 h-6 ${disabled ? 'animate-pulse' : ''}`} />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

// Komponen indikator status
const StatusIndicator = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-2 bg-gray-700/50 border border-gray-600 rounded-lg">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  </div>
);

// Komponen baru untuk item resource
const ResourceItem = ({ icon: Icon, color, label, debit, debitUnit, total, totalUnit, cost }) => (
  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded">
        Debit: {debit.toFixed(1)} {debitUnit}
      </span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Total: {total.toFixed(1)} {totalUnit}</span>
      <span className="text-red-400">Rp {cost.toLocaleString('id-ID')}</span>
    </div>
  </div>
);

// Komponen baru untuk item finansial
const FinancialItem = ({ label, value, positive, bold }) => (
  <div className={`flex justify-between ${bold ? 'text-base' : 'text-sm'}`}>
    <span className={`${bold ? 'font-bold' : 'text-gray-400'}`}>{label}:</span>
    <span className={`font-mono ${
      positive ? 'text-green-400' : 'text-red-400'
    } ${bold ? 'font-bold' : ''}`}>
      {value >= 0 ? 'Rp ' : '-Rp '}
      {Math.abs(value).toLocaleString('id-ID')}
    </span>
  </div>
);

export default SteamControlDashboard;