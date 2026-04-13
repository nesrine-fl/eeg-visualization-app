import React, { useState, useEffect } from 'react';
import Brain3D from '../components/Brain3D';
import EEGChart from '../components/EEGChart';
import { Brain, Activity, Download, AlertTriangle, FileText, Calendar, Clock, Zap } from 'lucide-react';

export default function DoctorMode() {
  const [selectedTool, setSelectedTool] = useState('neural-scan');
  const [selectedChannels, setSelectedChannels] = useState([
    'FP1', 'FP2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2', 
    'F7', 'F8', 'T7', 'T8', 'FZ', 'CZ', 'PZ', 'FC1', 'FC2', 'CP1', 'CP2', 'PO1', 'PO2'
  ]);
  const [heatmap, setHeatmap] = useState({});
  const [seizures, setSeizures] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [bandPower, setBandPower] = useState({});
  const [patientInfo, setPatientInfo] = useState({
    name: 'Dr. Sarah Chen',
    id: 'NV-2050-0847',
    age: 34,
    gender: 'F',
    condition: 'Temporal Lobe Epilepsy',
    medications: ['Levetiracetam 500mg', 'Lamotrigine 100mg'],
    lastSeizure: '2 days ago',
    seizureFrequency: '2-3 per month'
  });
  
  const diagnosticTools = [
    { id: 'neural-scan', name: 'Neural Scan', icon: Brain },
    { id: 'eeg-analysis', name: 'EEG Analysis', icon: Activity },
    { id: 'stimulation-map', name: 'Stimulation Map', icon: Zap },
    { id: 'signal-monitor', name: 'Signal Monitor', icon: Activity },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'calibration', name: 'Calibration', icon: Activity }
  ];
  
  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      // Generate comprehensive heatmap data
      const sampleHeatmap = {
        frontal_lobe: Math.random() * 0.8,
        temporal_lobe: Math.random() * 0.9, // Higher activity in temporal lobe
        motor_cortex: Math.random() * 0.6,
        sensory_cortex: Math.random() * 0.5,
        parietal_lobe: Math.random() * 0.4,
        occipital_lobe: Math.random() * 0.3
      };
      setHeatmap(sampleHeatmap);
      
      // Generate detailed band power data
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
      
      // Generate clinical events
      const sampleEvents = [];
      
      // Seizure events (more frequent for this patient)
      if (Math.random() > 0.7) {
        const seizureEvent = {
          type: 'seizure',
          channel: 'T7', // Temporal channel
          time: Math.random() * 120,
          duration: Math.random() * 30 + 10,
          amplitude: Math.random() * 150 + 100,
          severity: Math.random() > 0.5 ? 'high' : 'medium',
          confidence: (Math.random() * 0.2 + 0.8).toFixed(2)
        };
        sampleEvents.push(seizureEvent);
      }
      
      // Artifact events
      if (Math.random() > 0.6) {
        sampleEvents.push({
          type: 'artifact',
          channel: selectedChannels[Math.floor(Math.random() * selectedChannels.length)],
          time: Math.random() * 120,
          amplitude: Math.random() * 80 + 20,
          artifactType: ['muscle_noise', 'electrode_pop', 'eye_movement'][Math.floor(Math.random() * 3)],
          confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
        });
      }
      
      setEvents(sampleEvents);
      
      // Update 3D visualization data
      setSeizures(sampleEvents.filter(e => e.type === 'seizure').map(e => ({ 
        region: 'temporal_lobe',
        severity: e.severity,
        confidence: e.confidence
      })));
      setArtifacts(sampleEvents.filter(e => e.type === 'artifact').map(e => ({ 
        region: 'frontal_lobe',
        type: e.artifactType,
        confidence: e.confidence
      })));
    }, 1500);
    
    return () => clearInterval(interval);
  }, [selectedChannels]);
  
  const exportReport = () => {
    // Generate clinical report
    const report = {
      patient: patientInfo,
      timestamp: new Date().toISOString(),
      session: {
        duration: '2h 14m',
        channels: selectedChannels.length,
        samplingRate: 256,
        events: events,
        summary: {
          totalSeizures: events.filter(e => e.type === 'seizure').length,
          totalArtifacts: events.filter(e => e.type === 'artifact').length,
          averageSeizureDuration: events
            .filter(e => e.type === 'seizure')
            .reduce((acc, e) => acc + (e.duration || 0), 0) / 
            Math.max(1, events.filter(e => e.type === 'seizure').length),
          confidence: events.reduce((acc, e) => acc + parseFloat(e.confidence || 0), 0) / Math.max(1, events.length)
        }
      },
      recommendations: [
        'Continue current medication regimen',
        'Consider increasing Levetiracetam dosage',
        'Schedule follow-up in 2 weeks',
        'Monitor sleep patterns closely'
      ]
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eeg-report-${patientInfo.id}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header with Patient Info */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Clinical EEG Analysis</h1>
                <p className="text-gray-400">Dr. Sarah Chen - NV-2050-0847</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <div className="text-right">
                <div className="text-green-400 text-lg font-semibold">System Nominal</div>
                <p className="text-gray-400 text-sm">All {selectedChannels.length} Channels Active</p>
              </div>
            </div>
          </div>
          
          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Age/Gender</div>
              <div className="font-semibold">{patientInfo.age}y {patientInfo.gender}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Condition</div>
              <div className="font-semibold">{patientInfo.condition}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Seizure Frequency</div>
              <div className="font-semibold">{patientInfo.seizureFrequency}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Last Seizure</div>
              <div className="font-semibold">{patientInfo.lastSeizure}</div>
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{tool.name}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Event Summary */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Event Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seizures:</span>
                    <span className="text-red-400 font-semibold">
                      {events.filter(e => e.type === 'seizure').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Artifacts:</span>
                    <span className="text-orange-400 font-semibold">
                      {events.filter(e => e.type === 'artifact').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Confidence:</span>
                    <span className="text-green-400 font-semibold">
                      {events.length > 0 
                        ? `${(events.reduce((acc, e) => acc + parseFloat(e.confidence || 0), 0) / events.length * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Channel Groups */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Channel Groups</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedChannels(['FP1', 'FP2', 'F3', 'F4', 'F7', 'F8', 'FZ'])}
                    className="w-full text-left px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Frontal (7)
                  </button>
                  <button
                    onClick={() => setSelectedChannels(['T7', 'T8'])}
                    className="w-full text-left px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Temporal (2)
                  </button>
                  <button
                    onClick={() => setSelectedChannels(['C3', 'C4', 'CZ'])}
                    className="w-full text-left px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Central (3)
                  </button>
                  <button
                    onClick={() => setSelectedChannels(['P3', 'P4', 'PZ', 'PO1', 'PO2'])}
                    className="w-full text-left px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Parietal (5)
                  </button>
                  <button
                    onClick={() => setSelectedChannels(['O1', 'O2'])}
                    className="w-full text-left px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Occipital (2)
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Visualization Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* 3D Brain + EEG Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3D Brain Visualization */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">3D Brain Activity</h3>
                <div className="h-64">
                  <Brain3D 
                    heatmap={heatmap} 
                    seizures={seizures} 
                    artifacts={artifacts} 
                    mode="doctor"
                  />
                </div>
              </div>
              
              {/* Real-time EEG Monitor */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">EEG Real-time Monitor</h3>
                <div className="h-64">
                  <EEGChart 
                    mode="doctor"
                    selectedChannels={['FP1', 'F3', 'C3', 'P3', 'O1']}
                    events={events}
                    timeWindow={5}
                  />
                </div>
              </div>
            </div>
            
            {/* Full Channel Display */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Full Channel Analysis</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    {selectedChannels.length} channels active
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    Select All
                  </button>
                </div>
              </div>
              <div className="h-96">
                <EEGChart 
                  mode="doctor"
                  selectedChannels={selectedChannels.slice(0, 8)}
                  events={events}
                  timeWindow={10}
                />
              </div>
            </div>
            
            {/* Clinical Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Seizure Detection */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold">Seizure Detection</h3>
                </div>
                <div className="space-y-3">
                  {events.filter(e => e.type === 'seizure').slice(0, 3).map((seizure, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Channel {seizure.channel}</span>
                        <span className="text-red-400">{seizure.confidence}%</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Time: {seizure.time.toFixed(1)}s | Duration: {seizure.duration?.toFixed(1)}s
                      </div>
                      <div className="text-xs text-gray-400">
                        Severity: {seizure.severity} | Amplitude: {seizure.amplitude.toFixed(1)}µV
                      </div>
                    </div>
                  ))}
                  {events.filter(e => e.type === 'seizure').length === 0 && (
                    <div className="text-gray-400 text-sm">No seizures detected</div>
                  )}
                </div>
              </div>
              
              {/* Artifact Detection */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">Artifact Detection</h3>
                </div>
                <div className="space-y-3">
                  {events.filter(e => e.type === 'artifact').slice(0, 3).map((artifact, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium capitalize">{artifact.artifactType}</span>
                        <span className="text-orange-400">{artifact.confidence}%</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Channel {artifact.channel} | Time: {artifact.time.toFixed(1)}s
                      </div>
                      <div className="text-xs text-gray-400">
                        Amplitude: {artifact.amplitude.toFixed(1)}µV
                      </div>
                    </div>
                  ))}
                  {events.filter(e => e.type === 'artifact').length === 0 && (
                    <div className="text-gray-400 text-sm">No artifacts detected</div>
                  )}
                </div>
              </div>
              
              {/* Band Power Analysis */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">Band Power</h3>
                </div>
                <div className="space-y-3">
                  {['delta', 'theta', 'alpha', 'beta', 'gamma'].map(band => {
                    const avgPower = selectedChannels.reduce((acc, ch) => {
                      return acc + (bandPower[ch]?.[band] || 0);
                    }, 0) / selectedChannels.length;
                    
                    return (
                      <div key={band} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium capitalize">{band}</span>
                          <span className="text-purple-400">{avgPower.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1">
                          <div 
                            className="bg-purple-500 h-1 rounded-full"
                            style={{ width: `${avgPower}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Clinical Recommendations */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Clinical Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">Medication Adjustments</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Consider Levetiracetam dose increase</li>
                    <li>Monitor Lamotrigine levels</li>
                    <li>Review adherence to current regimen</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-green-400 mb-2">Lifestyle Modifications</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Maintain consistent sleep schedule</li>
                    <li>Stress management techniques</li>
                    <li>Avoid known seizure triggers</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-orange-400 mb-2">Follow-up Actions</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Schedule follow-up in 2 weeks</li>
                    <li>Repeat EEG in 1 month</li>
                    <li>Consider video EEG monitoring</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-purple-400 mb-2">Emergency Protocol</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>Rescue medication available</li>
                    <li>Emergency contacts updated</li>
                    <li>Seizure action plan reviewed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
