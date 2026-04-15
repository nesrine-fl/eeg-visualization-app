import React, { useState, useEffect, useRef } from 'react';
import Brain3D from '../components/Brain3D';
import EEGChart from '../components/EEGChart';
import { Brain, BookOpen, Activity, Zap, Eye, Hand } from 'lucide-react';

export default function StudentMode() {
  const [selectedTool, setSelectedTool] = useState('neural-scan');
  const [showRaw, setShowRaw] = useState(true);
  const [showClean, setShowClean] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [availableChannels, setAvailableChannels] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [seizures, setSeizures] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [bandPower, setBandPower] = useState({});
  const [events, setEvents] = useState([]);
  const [signalData, setSignalData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  
  const diagnosticTools = [
    { id: 'neural-scan', name: 'Neural Scan', icon: Brain },
    { id: 'eeg-analysis', name: 'EEG Analysis', icon: Activity },
    { id: 'stimulation-map', name: 'Stimulation Map', icon: Zap },
    { id: 'signal-monitor', name: 'Signal Monitor', icon: Activity },
    { id: 'reports', name: 'Reports', icon: BookOpen },
    { id: 'calibration', name: 'Calibration', icon: Activity }
  ];
  
  const brainWaveBands = [
    { name: 'Delta', range: '1-4 Hz', color: '#8B5CF6', description: 'Deep sleep, dreaming' },
    { name: 'Theta', range: '4-8 Hz', color: '#3B82F6', description: 'Meditation, creativity' },
    { name: 'Alpha', range: '8-13 Hz', color: '#10B981', description: 'Relaxed awareness' },
    { name: 'Beta', range: '13-30 Hz', color: '#F59E0B', description: 'Active thinking' },
    { name: 'Gamma', range: '30-40 Hz', color: '#EF4444', description: 'High-level processing' }
  ];
  
  const artifactTypes = [
    { name: 'Eye Movement', icon: Eye, description: 'Blinking and eye movements cause electrical artifacts' },
    { name: 'Muscle Noise', icon: Hand, description: 'Muscle contractions create high-frequency noise' },
    { name: 'Electrode Pop', icon: Zap, description: 'Sudden changes in electrode contact' },
    { name: 'Power Line', icon: Activity, description: '50/60 Hz electrical interference' },
    { name: 'ECG Artifact', icon: Activity, description: 'Heartbeat electrical signals' },
    { name: 'Chewing/Movement', icon: Activity, description: 'Jaw and head movements' }
  ];
  
  // Check system status and load initial data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check system status
        const backendUrl = process.env.NODE_ENV === 'production' 
          ? 'https://neurovision-backend.onrender.com/status'
          : 'http://localhost:8000/status';
        const statusResponse = await fetch(backendUrl);
        const status = await statusResponse.json();
        
        if (status.status === 'error') {
          throw new Error(status.error || 'Backend initialization failed');
        }
        
        setSystemStatus(status.status);
        setIsConnected(true);
        setError(null);
        
        // Load initial EEG data
        const dataResponse = await fetch('http://localhost:8000/sample-data');
        const data = await dataResponse.json();
        
        // Set available channels from backend
        setAvailableChannels(data.channels || []);
        
        // Select first 5 channels by default
        const defaultChannels = (data.channels || []).slice(0, 5);
        setSelectedChannels(defaultChannels);
        
        // Set all data from backend
        setHeatmap(data.heatmap || {});
        setBandPower(data.band_power || {});
        setEvents(data.events || []);
        
        // Update seizures and artifacts for 3D view
        setSeizures((data.events || []).filter(e => e.type === 'seizure').map(e => ({ region: 'temporal_lobe' })));
        setArtifacts((data.events || []).filter(e => e.type === 'artifact').map(e => ({ region: 'frontal_lobe' })));
        
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err.message);
        setIsConnected(false);
        setSystemStatus('error');
        
        // Retry after 3 seconds
        setTimeout(initializeData, 3000);
      }
    };

    initializeData();
  }, []);

  // Load initial data from backend
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const backendUrl = process.env.NODE_ENV === 'production' 
          ? 'https://neurovision-backend.onrender.com/sample-data'
          : 'http://localhost:8000/sample-data';
        const response = await fetch(backendUrl);
        const data = await response.json();
        
        setHeatmap(data.heatmap);
        setBandPower(data.band_power);
        setEvents(data.events);
        setSignalData(data.rawData || []);
        setAvailableChannels(data.channels || []);
        
        // Update seizures and artifacts for 3D view
        setSeizures(data.events.filter(e => e.type === 'seizure').map(e => ({ region: 'temporal_lobe' })));
        setArtifacts(data.events.filter(e => e.type === 'artifact').map(e => ({ region: 'frontal_lobe' })));
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    if (isConnected) {
      loadInitialData();
    }
  }, [isConnected]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isConnected || availableChannels.length === 0) return;

    const connectWebSocket = () => {
      // Add a small delay to ensure backend is ready
      setTimeout(() => {
        try {
          const wsUrl = process.env.NODE_ENV === 'production' 
            ? 'wss://neurovision-backend.onrender.com/ws'
            : 'ws://localhost:8000/ws';
          wsRef.current = new WebSocket(wsUrl);
          
          wsRef.current.onopen = () => {
            console.log('WebSocket connected');
            setError(null);
          };
          
          wsRef.current.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
            
            if (data.error) {
                setError(data.error);
                return;
              }
              
              setHeatmap(data.heatmap);
              setBandPower(data.band_power);
              setEvents(data.events);
              
              // Update seizures and artifacts for 3D view
              setSeizures((data.events || []).filter(e => e.type === 'seizure').map(e => ({ region: 'temporal_lobe' })));
              setArtifacts((data.events || []).filter(e => e.type === 'artifact').map(e => ({ region: 'frontal_lobe' })));
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
              setError('Failed to parse WebSocket data');
            }
          };
          
          wsRef.current.onclose = () => {
            console.log('WebSocket disconnected, attempting to reconnect...');
            setError('WebSocket disconnected');
            setTimeout(connectWebSocket, 3000);
          };
          
          wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('WebSocket connection error');
          };
        } catch (err) {
          console.error('Failed to create WebSocket:', err);
          setError('Failed to connect to WebSocket');
        }
      }, 1000); // 1 second delay
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isConnected, availableChannels]);

  // Render content based on selected tool
  const renderToolContent = () => {
    switch (selectedTool) {
      case 'neural-scan':
        return (
          <>
            {/* 3D Brain Visualization */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">3D Brain Activity</h3>
              <div className="h-80">
                <Brain3D 
                  heatmap={heatmap} 
                  seizures={seizures} 
                  artifacts={artifacts} 
                  mode="student"
                />
              </div>
            </div>
          </>
        );
      
      case 'eeg-analysis':
        return (
          <>
            {/* EEG Signal Analysis */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">EEG Signal Analysis</h3>
              <div className="h-80">
                <EEGChart 
                  data={{
                    channels: availableChannels,
                    rawData: signalData || [],
                    samplingRate: 256
                  }}
                  mode="student"
                  showRaw={showRaw}
                  showClean={showClean}
                  selectedChannels={selectedChannels}
                  events={events}
                />
              </div>
            </div>
          </>
        );
      
      case 'stimulation-map':
        return (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Stimulation Map</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Neural stimulation mapping interface</p>
                <p className="text-sm text-gray-500 mt-2">Interactive brain region stimulation planning</p>
              </div>
            </div>
          </div>
        );
      
      case 'signal-monitor':
        return (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Signal Monitor</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">Real-time signal monitoring</p>
                <p className="text-sm text-gray-500 mt-2">Live EEG signal quality and amplitude tracking</p>
              </div>
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Analysis Reports</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">EEG Analysis Reports</p>
                <p className="text-sm text-gray-500 mt-2">Detailed brain activity analysis and insights</p>
              </div>
            </div>
          </div>
        );
      
      case 'calibration':
        return (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">System Calibration</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">EEG System Calibration</p>
                <p className="text-sm text-gray-500 mt-2">Electrode impedance and signal calibration</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Select a Tool</h3>
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-400">Choose a diagnostic tool from the sidebar</p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">NeuroVision - Learning Mode</h1>
                <p className="text-gray-400">Interactive Brain Signal Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${
                systemStatus === 'active' ? 'text-green-400' : 
                systemStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {systemStatus === 'active' ? 'System Active' : 
                 systemStatus === 'error' ? 'System Error' : 'System Connecting...'}
              </div>
              <p className="text-gray-400 text-sm">
                {error ? error : (isConnected ? 'Connected to Backend' : 'Disconnected')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Diagnostic Tools Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Diagnostic Tools</h3>
              <div className="space-y-2">
                {diagnosticTools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedTool === tool.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{tool.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Signal Display Options */}
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-400">Signal Display</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showRaw}
                    onChange={(e) => setShowRaw(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm">Show Raw Signal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showClean}
                    onChange={(e) => setShowClean(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm">Show Clean Signal</span>
                </label>
              </div>
              
              {/* Channel Selection */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Active Channels ({selectedChannels.length}/{availableChannels.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableChannels.map(channel => (
                    <label key={channel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChannels([...selectedChannels, channel]);
                          } else {
                            setSelectedChannels(selectedChannels.filter(ch => ch !== channel));
                          }
                        }}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Visualization Area */}
          <div className="lg:col-span-3 space-y-6">
            {renderToolContent()}
            
            {/* Educational Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brain Wave Bands */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Brain Wave Bands</h3>
                <div className="space-y-3">
                  {brainWaveBands.map(band => (
                    <div key={band.name} className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: band.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{band.name}</span>
                          <span className="text-gray-400">{band.range}</span>
                        </div>
                        <div className="text-xs text-gray-400">{band.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Artifact Types */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Common Artifacts</h3>
                <div className="space-y-3">
                  {artifactTypes.slice(0, 4).map(artifact => {
                    const Icon = artifact.icon;
                    return (
                      <div key={artifact.name} className="flex items-start space-x-3">
                        <Icon className="w-4 h-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{artifact.name}</div>
                          <div className="text-xs text-gray-400">{artifact.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Learning Tips */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Learning Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-purple-400 mb-2">Signal Quality</h4>
                  <p className="text-sm text-gray-300">
                    Compare raw vs clean signals to understand how filtering removes noise while preserving important brain activity.
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">Artifact Detection</h4>
                  <p className="text-sm text-gray-300">
                    Look for sudden spikes or unusual patterns that don't reflect actual brain activity.
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-green-400 mb-2">Brain Regions</h4>
                  <p className="text-sm text-gray-300">
                    Each EEG channel corresponds to specific brain areas. Watch how activity changes across regions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
