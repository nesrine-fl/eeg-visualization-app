import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EEGChart({ 
  data, 
  mode = 'student', 
  showRaw = true, 
  showClean = true, 
  selectedChannels = ['FP1', 'F3', 'C3', 'P3', 'O1'],
  events = [],
  timeWindow = 10 
}) {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  
  // Generate sample data if none provided
  const generateSampleData = () => {
    const samplingRate = 256;
    const samples = timeWindow * samplingRate;
    const labels = Array.from({ length: samples }, (_, i) => (i / samplingRate).toFixed(2));
    
    const datasets = [];
    
    selectedChannels.forEach((channel, channelIndex) => {
      const baseOffset = channelIndex * 50; // Offset for visualization
      
      // Raw signal with noise
      if (showRaw) {
        const rawData = Array.from({ length: samples }, (_, i) => {
          const t = i / samplingRate;
          const signal = 
            10 * Math.sin(2 * Math.PI * 10 * t) + // Alpha wave
            5 * Math.sin(2 * Math.PI * 20 * t) +   // Beta wave
            3 * Math.sin(2 * Math.PI * 5 * t) +    // Theta wave
            (Math.random() - 0.5) * 20 +           // Noise
            baseOffset;
          
          // Add seizure spikes
          if (Math.random() > 0.95) {
            return signal + (Math.random() - 0.5) * 100;
          }
          return signal;
        });
        
        datasets.push({
          label: `${channel} (Raw)`,
          data: rawData,
          borderColor: `rgba(255, 99, 132, 0.8)`,
          backgroundColor: `rgba(255, 99, 132, 0.1)`,
          borderWidth: 1,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 3,
        });
      }
      
      // Clean signal (filtered)
      if (showClean) {
        const cleanData = Array.from({ length: samples }, (_, i) => {
          const t = i / samplingRate;
          const signal = 
            8 * Math.sin(2 * Math.PI * 10 * t) +   // Alpha wave (clean)
            4 * Math.sin(2 * Math.PI * 20 * t) +    // Beta wave (clean)
            2 * Math.sin(2 * Math.PI * 5 * t) +     // Theta wave (clean)
            baseOffset;
          return signal;
        });
        
        datasets.push({
          label: `${channel} (Clean)`,
          data: cleanData,
          borderColor: `rgba(54, 162, 235, 0.8)`,
          backgroundColor: `rgba(54, 162, 235, 0.1)`,
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
        });
      }
    });
    
    return { labels, datasets };
  };
  
  useEffect(() => {
    const sampleData = generateSampleData();
    setChartData(sampleData);
  }, [showRaw, showClean, selectedChannels, timeWindow]);
  
  // Chart options based on mode
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: mode === 'student' || mode === 'doctor',
          position: 'top',
          labels: {
            color: '#ffffff',
            font: {
              size: mode === 'patient' ? 10 : 12
            }
          }
        },
        tooltip: {
          enabled: mode !== 'patient',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#00ffff',
          borderWidth: 1,
        },
        title: {
          display: mode !== 'patient',
          text: mode === 'student' ? 'EEG Signal Comparison (Raw vs Clean)' : 
                mode === 'doctor' ? 'Multi-Channel EEG Analysis' : '',
          color: '#ffffff',
          font: {
            size: 16
          }
        }
      },
      scales: {
        x: {
          display: mode !== 'patient',
          title: {
            display: mode !== 'patient',
            text: 'Time (seconds)',
            color: '#ffffff'
          },
          ticks: {
            color: '#ffffff',
            maxTicksLimit: 10
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          display: mode !== 'patient',
          title: {
            display: mode !== 'patient',
            text: 'Amplitude (µV)',
            color: '#ffffff'
          },
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      animation: {
        duration: 0 // Real-time updates
      }
    };
    
    // Patient mode - simplified view
    if (mode === 'patient') {
      baseOptions.plugins.legend.display = false;
      baseOptions.scales.x.display = false;
      baseOptions.scales.y.display = false;
      baseOptions.plugins.title.display = false;
    }
    
    return baseOptions;
  };
  
  // Event overlay plugin
  const eventOverlayPlugin = {
    id: 'eventOverlay',
    afterDraw: (chart) => {
      if (mode === 'patient') return;
      
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      
      events.forEach(event => {
        const xPixel = xAxis.getPixelForValue(event.time);
        
        if (xPixel >= chart.chartArea.left && xPixel <= chart.chartArea.right) {
          ctx.save();
          ctx.strokeStyle = event.type === 'seizure' ? '#ff0000' : '#ffaa00';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          
          ctx.beginPath();
          ctx.moveTo(xPixel, chart.chartArea.top);
          ctx.lineTo(xPixel, chart.chartArea.bottom);
          ctx.stroke();
          
          ctx.restore();
          
          // Add label
          ctx.fillStyle = event.type === 'seizure' ? '#ff0000' : '#ffaa00';
          ctx.font = '10px Arial';
          ctx.fillText(
            event.type === 'seizure' ? 'SEIZURE' : 'ARTIFACT',
            xPixel + 5,
            chart.chartArea.top + 20
          );
        }
      });
    }
  };
  
  if (!chartData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading EEG data...</div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      <Line 
        ref={chartRef}
        data={chartData} 
        options={getChartOptions()}
        plugins={[eventOverlayPlugin]}
      />
      
      {/* Mode-specific overlays */}
      {mode === 'patient' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-green-400 text-2xl font-bold mb-2">Normal Brain Activity</div>
            <div className="text-gray-400 text-sm">Your brain signals are healthy</div>
          </div>
        </div>
      )}
      
      {/* Student mode annotations */}
      {mode === 'student' && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg max-w-xs">
          <h4 className="text-white font-semibold mb-2">Signal Analysis</h4>
          <div className="text-gray-300 text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span>Raw signal with noise</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>Clean filtered signal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-orange-500"></div>
              <span>Artifacts detected</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Doctor mode statistics */}
      {mode === 'doctor' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-3 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Channel Statistics</h4>
          <div className="text-gray-300 text-xs space-y-1">
            <div>Active Channels: {selectedChannels.length}</div>
            <div>Sampling Rate: 256 Hz</div>
            <div>Time Window: {timeWindow}s</div>
            <div>Events Detected: {events.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
