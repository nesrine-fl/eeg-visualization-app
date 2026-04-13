import React, { useState, useEffect } from 'react';
import PatientMode from './pages/PatientMode';
import StudentMode from './pages/StudentMode';
import DoctorMode from './pages/DoctorMode';
import { Brain, User, GraduationCap, Stethoscope, Activity, Zap } from 'lucide-react';

function App() {
  const [currentMode, setCurrentMode] = useState('patient');
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState('initializing');
  
  useEffect(() => {
    // Simulate system initialization
    setTimeout(() => {
      setIsConnected(true);
      setSystemStatus('active');
    }, 2000);
  }, []);
  
  const modes = [
    {
      id: 'patient',
      name: 'Patient Mode',
      icon: User,
      description: 'Simple, human-friendly brain activity overview',
      color: 'green'
    },
    {
      id: 'student',
      name: 'Student Mode',
      icon: GraduationCap,
      description: 'Educational EEG analysis and learning tools',
      color: 'purple'
    },
    {
      id: 'doctor',
      name: 'Doctor Mode',
      icon: Stethoscope,
      description: 'Full clinical analysis and diagnostic tools',
      color: 'blue'
    }
  ];
  
  const renderMode = () => {
    switch (currentMode) {
      case 'patient':
        return <PatientMode />;
      case 'student':
        return <StudentMode />;
      case 'doctor':
        return <DoctorMode />;
      default:
        return <PatientMode />;
    }
  };
  
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
              <Brain className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">EEG Brain Visualization</h1>
            <p className="text-gray-400">Real-time brain signal analysis system</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
            </div>
            <p className="text-gray-400">Initializing system...</p>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <Activity className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Signal Processing</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="text-xs text-gray-400">3D Engine</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <Brain className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-xs text-gray-400">AI Analysis</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mode Selection Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EEG Brain Visualization</h1>
                <p className="text-xs text-gray-400">
                  {systemStatus === 'active' ? 'System Active - Real-time Monitoring' : 'System Initializing...'}
                </p>
              </div>
            </div>
            
            {/* Mode Selector */}
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
              {modes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setCurrentMode(mode.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      currentMode === mode.id
                        ? `bg-${mode.color}-600 text-white`
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{mode.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-400">
                {systemStatus === 'active' ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="min-h-[calc(100vh-80px)]">
        {renderMode()}
      </div>
    </div>
  );
}

export default App;
