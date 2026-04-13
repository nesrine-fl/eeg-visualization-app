import React, { useState, useEffect } from 'react';
import Brain3D from '../components/Brain3D';
import { Brain, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export default function PatientMode() {
  const [brainStatus, setBrainStatus] = useState('normal');
  const [riskLevel, setRiskLevel] = useState('low');
  const [completion, setCompletion] = useState(97.3);
  const [sessionTime, setSessionTime] = useState('2h 14m');
  const [heatmap, setHeatmap] = useState({});
  const [seizures, setSeizures] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  
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
      
      // Randomly simulate seizure detection
      if (Math.random() > 0.95) {
        setSeizures([{ region: 'temporal_lobe', severity: 'medium' }]);
        setBrainStatus('seizure');
        setRiskLevel('elevated');
      } else {
        setSeizures([]);
        setBrainStatus('normal');
        setRiskLevel('low');
      }
      
      // Update session time
      const minutes = Math.floor(Math.random() * 240);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      setSessionTime(`${hours}h ${mins}m`);
      
      // Update completion
      setCompletion(Math.min(100, completion + Math.random() * 0.1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [completion]);
  
  const getStatusColor = () => {
    switch (brainStatus) {
      case 'seizure': return 'text-red-500';
      case 'elevated': return 'text-orange-500';
      default: return 'text-green-500';
    }
  };
  
  const getStatusMessage = () => {
    switch (brainStatus) {
      case 'seizure': return 'Seizure Activity Detected';
      case 'elevated': return 'Elevated Brain Activity';
      default: return 'Normal Brain Activity';
    }
  };
  
  const getStatusIcon = () => {
    switch (brainStatus) {
      case 'seizure': return <AlertCircle className="w-6 h-6" />;
      case 'elevated': return <Activity className="w-6 h-6" />;
      default: return <CheckCircle className="w-6 h-6" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Patient Profile Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dr. Sarah Chen</h1>
                <p className="text-gray-400">Patient ID: NV-2050-0847</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-xl font-semibold">{getStatusMessage()}</span>
              </div>
              <p className="text-gray-400 mt-1">Session Active - {sessionTime}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Neural Map Completion</span>
              <span>{completion.toFixed(1)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>
          
          {/* Risk Level */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-gray-400">Risk Level:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              riskLevel === 'elevated' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}>
              {riskLevel === 'elevated' ? 'Elevated' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Brain Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-96">
            <h2 className="text-xl font-semibold mb-4">Brain Activity Map</h2>
            <div className="h-80">
              <Brain3D 
                heatmap={heatmap} 
                seizures={seizures} 
                artifacts={artifacts} 
                mode="patient"
              />
            </div>
          </div>
        </div>
        
        {/* Summary Metrics */}
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Brain Health Score</h3>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getStatusColor()}`}>
                {brainStatus === 'seizure' ? '45' : brainStatus === 'elevated' ? '68' : '92'}
              </div>
              <p className="text-gray-400 mt-2">Overall Health</p>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cognitive Load</span>
                  <span>{Math.floor(Math.random() * 60 + 20)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 60 + 20)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Neural Fatigue</span>
                  <span>{Math.floor(Math.random() * 30 + 10)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 30 + 10)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Stress Level</span>
                  <span>{Math.floor(Math.random() * 40 + 10)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 40 + 10)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-300">Continue current medication schedule</p>
              </div>
              <div className="flex items-start space-x-3">
                <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-300">Maintain regular sleep patterns</p>
              </div>
              <div className="flex items-start space-x-3">
                <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
                <p className="text-sm text-gray-300">Practice stress reduction techniques</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alert for Seizure Detection */}
      {brainStatus === 'seizure' && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg animate-pulse max-w-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h4 className="font-semibold">Seizure Activity Detected</h4>
              <p className="text-sm">Medical team has been notified</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
