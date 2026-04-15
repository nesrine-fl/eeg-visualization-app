import React, { useState, useEffect } from 'react';
import StudentMode from './pages/StudentMode';
import { Brain, Activity, Zap, AlertCircle } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/status');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Backend not responding`);
        }
        
        const status = await response.json();
        
        if (status.status === 'error') {
          throw new Error(status.error || 'Backend initialization failed');
        }
        
        setIsConnected(true);
        setSystemStatus(status.status);
        setError(null);
        
      } catch (err) {
        console.error('Backend connection failed:', err);
        setError(err.message);
        setIsConnected(false);
        setSystemStatus('error');
        
        // Retry connection every 3 seconds
        setTimeout(checkBackendConnection, 3000);
      }
    };
    
    checkBackendConnection();
  }, []);
  
  // Show loading/error screen
  if (!isConnected || systemStatus === 'initializing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              error ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {error ? (
                <AlertCircle className="w-12 h-12" />
              ) : (
                <Brain className="w-12 h-12" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">NeuroVision — EEG Visualization</h1>
            <p className="text-gray-400">
              {error ? 'Connection Error' : 'Real-time brain signal analysis system'}
            </p>
          </div>
          
          <div className="space-y-4">
            {!error && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              </div>
            )}
            <p className="text-gray-400">
              {error ? error : 'Connecting to backend...'}
            </p>
          </div>
          
          {!error && (
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
                <div className="text-xs text-gray-400">EEG Analysis</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Main Content */}
      <div className="min-h-[calc(100vh-80px)]">
        <StudentMode />
      </div>
    </div>
  );
}

export default App;
