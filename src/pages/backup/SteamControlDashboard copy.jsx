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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Menghubungkan ke sistem...</p>
          <p className="text-sm text-gray-500 mt-2">Mengambil data dari {API_BASE_URL}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white border border-red-300 rounded-lg shadow-md max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Koneksi Gagal</h2>
          <p className="text-gray-600 mb-4">Tidak dapat terhubung ke sistem kontrol</p>
          <p className="text-gray-500 text-sm mb-2">
            Endpoint: <code className="bg-gray-100 p-1 rounded">{API_BASE_URL}/api/status</code>
          </p>
          <p className="text-gray-500 text-sm mb-4">
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with connection status */}
        <div className="mb-6 text-center relative">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Steam Motor Control Dashboard</h1>
          <p className="text-gray-600">Kontrol dan Monitor Steam Motor Secara Real-time</p>
          
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              {connectionStatus === 'connected' ? 'Terhubung' : 
               connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Terputus'}
            </span>
          </div>
          
          <div className="w-20 h-0.5 bg-gray-300 mx-auto mt-3"></div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-5 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 flex items-center gap-3 border-l-4 ${
                  alert.type === 'danger' 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${alert.type === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className="text-gray-700">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-white border border-gray-300 rounded-lg p-5 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <Settings className="w-5 h-5 text-gray-600" />
            Panel Kontrol
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Tekanan (Bar)</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={systemStatus.target_pressure}
                  onChange={(e) => updateTargetPressure(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-sm text-gray-600 mt-1">
                  {systemStatus.target_pressure.toFixed(1)} Bar
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Kecepatan (RPM)</label>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={systemStatus.target_speed}
                  onChange={(e) => updateTargetSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-sm text-gray-600 mt-1">
                  {systemStatus.target_speed} RPM
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motor Aktif</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={systemStatus.active_motors}
                  onChange={(e) => updateActiveMotors(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga per Motor (Rp)</label>
                <input
                  type="number"
                  value={tariffs.service_price}
                  onChange={(e) => updateServicePrice(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-center space-y-3">
              <button
                onClick={handleStart}
                disabled={systemStatus.is_running || isSendingCommand}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  systemStatus.is_running 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSendingCommand ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Motor
              </button>
              <button
                onClick={handleStop}
                disabled={!systemStatus.is_running || isSendingCommand}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  !systemStatus.is_running 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSendingCommand ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Stop Motor
              </button>
              <button
                onClick={resetCounters}
                disabled={isSendingCommand}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isSendingCommand ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Reset
              </button>
            </div>
            
            <div className="flex flex-col justify-center">
              <button
                onClick={handleEmergencyStop}
                disabled={isSendingCommand}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors mb-3"
              >
                {isSendingCommand ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                Emergency Stop
              </button>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${
                  systemStatus.is_running ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${systemStatus.is_running ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  {systemStatus.is_running ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <GaugeComponent
            value={systemStatus.steam_pressure}
            max={10}
            title="Tekanan Steam"
            unit="Bar"
            color="#3b82f6"
          />
          <GaugeComponent
            value={systemStatus.temperature}
            max={150}
            title="Suhu"
            unit="°C"
            color="#ef4444"
          />
          <GaugeComponent
            value={systemStatus.motor_speed}
            max={3000}
            title="Kecepatan Motor"
            unit="RPM"
            color="#10b981"
          />
          <GaugeComponent
            value={systemStatus.water_level}
            max={100}
            title="Level Air"
            unit="%"
            color="#0ea5e9"
          />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
            label="Status Motor"
            value={systemStatus.is_running ? "Running" : "Stopped"}
            icon={Activity}
            color={systemStatus.is_running ? "bg-green-500" : "bg-gray-500"}
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

        {/* Resource Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Monitoring Energi
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Konsumsi Total:</span>
                <span className="font-semibold">{resourceUsage.energy_consumption.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Debit Saat Ini:</span>
                <span className="font-semibold">{realtimeDebits.energy_debit.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Listrik:</span>
                <span className="font-semibold text-red-600">
                  Rp {(resourceUsage.energy_consumption * tariffs.electricity).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Monitoring Air
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Penggunaan Total:</span>
                <span className="font-semibold">{resourceUsage.water_usage.toFixed(1)} Liter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Debit Saat Ini:</span>
                <span className="font-semibold">{realtimeDebits.water_debit.toFixed(1)} L/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Air:</span>
                <span className="font-semibold text-red-600">
                  Rp {(resourceUsage.water_usage * tariffs.water).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <SprayCan className="w-5 h-5 text-green-500" />
              Monitoring Sabun
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Penggunaan Total:</span>
                <span className="font-semibold">{resourceUsage.soap_usage.toFixed(0)} ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Debit Saat Ini:</span>
                <span className="font-semibold">{realtimeDebits.soap_debit.toFixed(1)} ml/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Sabun:</span>
                <span className="font-semibold text-red-600">
                  Rp {(resourceUsage.soap_usage * tariffs.soap).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600" />
              Status Operasional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.active_motors}</div>
                <div className="text-sm text-gray-600">Motor Aktif</div>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-2xl font-bold text-blue-600">{resourceUsage.wash_sessions}</div>
                <div className="text-sm text-gray-600">Sesi Cuci</div>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-2xl font-bold text-green-600">{washDuration.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Menit</div>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-2xl font-bold text-orange-600">
                  {systemStatus.is_running ? 'Aktif' : 'Standby'}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              Perhitungan Keuangan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pendapatan Kotor:</span>
                <span className="font-semibold text-green-600">
                  Rp {grossRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Operasional:</span>
                <span className="font-semibold text-red-600">
                  Rp {operationalCost.toLocaleString('id-ID')}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-800 font-semibold">Keuntungan Bersih:</span>
                <span className={`font-bold text-lg ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {Math.abs(netRevenue).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                *Belum termasuk biaya perawatan dan operasional lainnya
              </div>
            </div>
          </div>
        </div>

        {/* API Connection Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Wifi className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Koneksi Sistem</h3>
              <p className="text-blue-600 text-sm mt-1">
                Terhubung ke: <code className="bg-blue-100 px-2 py-1 rounded">{API_BASE_URL}</code>
              </p>
              <p className="text-blue-600 text-sm mt-2">
                Status: <span className="font-medium">
                  {connectionStatus === 'connected' ? 'Berhasil terhubung' : 
                   connectionStatus === 'connecting' ? 'Mencoba menghubungkan...' : 'Koneksi terputus'}
                </span>
              </p>
              <button 
                onClick={fetchData}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Gauge Component
const GaugeComponent = ({ value, max, min = 0, title, unit, color = "#3b82f6" }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.83} 283`}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </div>
            <div className="text-sm text-gray-500">{unit}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2 px-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

// Status Indicator
const StatusIndicator = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white border border-gray-300 rounded-md p-4 flex items-center gap-3 shadow-sm">
    <div className={`p-2 rounded-md ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-800">{value}</div>
    </div>
  </div>
);

export default SteamControlDashboard;