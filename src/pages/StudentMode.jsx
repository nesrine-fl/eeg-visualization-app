import React, { useState, useEffect } from 'react';
import Brain3D from '../components/Brain3D';
import EEGChart from '../components/EEGChart';
import { Brain, BookOpen, Activity, Zap, Eye, Hand } from 'lucide-react';

export default function StudentMode() {
  const [selectedTool, setSelectedTool] = useState('neural-scan');
  const [showRaw, setShowRaw] = useState(true);
  const [showClean, setShowClean] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState(['FP1', 'F3', 'C3', 'P3', 'O1']);
  const [heatmap, setHeatmap] = useState({});
  const [seizures, setSeizures] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [bandPower, setBandPower] = useState({});
  const [events, setEvents] = useState([]);
  
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
  
  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      // Generate sample heatmap data
      const sampleHeatmap = {
        frontal_lobe: Math.random() * 0.8,
        temporal_lobe: Math.random() * 0.6,
        motor_cortex: Math.random() * 0.7,
        sensory_cortex: Math.random() * 0.5,
        parietal_lobe: Math.random() * 0.4,
        occipital_lobe: Math.random() * 0.3
      };
      setHeatmap(sampleHeatmap);
      
      // Generate sample band power data
      const sampleBandPower = {};
      selectedChannels.forEach(channel => {
        sampleBandPower[channel] = {
          delta: Math.random() * 20 + 10,
          theta: Math.random() * 15 + 10,
          alpha: Math.random() * 25 + 15,
          beta: Math.random() * 20 + 15,
          gamma: Math.random() * 10 + 5
        };
      });
      setBandPower(sampleBandPower);
      
      // Generate sample events
      const sampleEvents = [];
      if (Math.random() > 0.8) {
        sampleEvents.push({
          type: 'seizure',
          channel: selectedChannels[Math.floor(Math.random() * selectedChannels.length)],
          time: Math.random() * 10,
          amplitude: Math.random() * 100 + 50,
          severity: 'medium'
        });
      }
      if (Math.random() > 0.7) {
        sampleEvents.push({
          type: 'artifact',
          channel: selectedChannels[Math.floor(Math.random() * selectedChannels.length)],
          time: Math.random() * 10,
          amplitude: Math.random() * 80 + 20,
          artifactType: artifactTypes[Math.floor(Math.random() * artifactTypes.length)].name
        });
      }
      setEvents(sampleEvents);
      
      // Update seizures and artifacts for 3D view
      setSeizures(sampleEvents.filter(e => e.type === 'seizure').map(e => ({ region: 'temporal_lobe' })));
      setArtifacts(sampleEvents.filter(e => e.type === 'artifact').map(e => ({ region: 'frontal_lobe' })));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [selectedChannels]);
  
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
                <h1 className="text-2xl font-bold">EEG Learning Mode</h1>
                <p className="text-gray-400">Interactive Brain Signal Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-green-400 text-lg font-semibold">System Nominal</div>
              <p className="text-gray-400 text-sm">All Channels Active</p>
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
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Active Channels</h4>
                <div className="space-y-2">
                  {['FP1', 'F3', 'C3', 'P3', 'O1', 'F7', 'T7', 'PZ'].map(channel => (
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
            
            {/* EEG Signal Analysis */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">EEG Signal Analysis</h3>
              <div className="h-80">
                <EEGChart 
                  mode="student"
                  showRaw={showRaw}
                  showClean={showClean}
                  selectedChannels={selectedChannels}
                  events={events}
                />
              </div>
            </div>
            
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
