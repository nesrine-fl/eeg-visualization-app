import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, AlertTriangle, CheckCircle, Info, TrendingUp, Activity } from 'lucide-react';

export default function AIExplanation({ 
  mode = 'student', 
  brainData = {}, 
  events = [], 
  context = 'general' 
}) {
  const [explanation, setExplanation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanations, setExplanations] = useState([]);
  
  // AI explanation templates based on mode and context
  const generateExplanation = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      let newExplanation = '';
      
      if (mode === 'patient') {
        newExplanation = generatePatientExplanation();
      } else if (mode === 'student') {
        newExplanation = generateStudentExplanation();
      } else if (mode === 'doctor') {
        newExplanation = generateDoctorExplanation();
      }
      
      setExplanation(newExplanation);
      setExplanations(prev => [...prev.slice(-2), {
        text: newExplanation,
        timestamp: new Date().toLocaleTimeString(),
        type: context
      }]);
      setIsAnalyzing(false);
    }, 1500);
  };
  
  const generatePatientExplanation = () => {
    const seizureCount = events.filter(e => e.type === 'seizure').length;
    const artifactCount = events.filter(e => e.type === 'artifact').length;
    
    if (seizureCount > 0) {
      return `I've detected some unusual brain activity that looks like seizure patterns. This is normal for your condition and the medical team has been notified. Your brain is showing increased activity in the temporal region, which is common with your type of epilepsy. The treatment is working as expected.`;
    } else if (artifactCount > 2) {
      return `Your brain signals show some noise from muscle movement or eye blinking. This is completely normal and doesn't indicate any problems with your brain function. Think of it like static on a radio - the music (your brain activity) is still playing clearly underneath.`;
    } else {
      return `Your brain activity looks healthy and stable. All regions are showing normal patterns of electrical activity. The frontal lobe (your thinking and planning center) is particularly active, which suggests good cognitive function. Keep up with your current treatment plan!`;
    }
  };
  
  const generateStudentExplanation = () => {
    const hasSeizures = events.filter(e => e.type === 'seizure').length > 0;
    const hasArtifacts = events.filter(e => e.type === 'artifact').length > 0;
    
    if (hasSeizures && hasArtifacts) {
      return `This recording shows both seizure activity and artifacts - perfect for learning! Notice how the seizure patterns (sharp, rhythmic spikes) differ from artifacts (sudden irregular spikes). The seizure shows consistent 3Hz spike-and-wave patterns typical of absence seizures, while the artifacts appear as random high-amplitude discharges without rhythm.`;
    } else if (hasSeizures) {
      return `Excellent example of seizure activity! You're seeing clear ictal patterns with spike-and-wave complexes. Notice the rhythmic nature - this is key for distinguishing seizures from artifacts. The temporal lobe focus suggests mesial temporal epilepsy, which is the most common form in adults.`;
    } else if (hasArtifacts) {
      return `Great example of EEG artifacts! You're seeing muscle artifacts (high-frequency noise) and possibly eye movement artifacts (frontal slow waves). Learning to recognize these patterns is crucial - they can mimic seizures but have different characteristics. Notice how artifacts lack the rhythmic, organized patterns of true seizures.`;
    } else {
      return `This shows normal background EEG activity. You can see the posterior dominant rhythm (alpha waves) at 8-10Hz, which is normal for an awake, relaxed state. The frontal beta activity suggests alertness. This is your baseline for comparison when looking at abnormal recordings.`;
    }
  };
  
  const generateDoctorExplanation = () => {
    const seizures = events.filter(e => e.type === 'seizure');
    const artifacts = events.filter(e => e.type === 'artifact');
    
    let explanation = `Clinical Analysis: `;
    
    if (seizures.length > 0) {
      const avgDuration = seizures.reduce((acc, s) => acc + (s.duration || 0), 0) / seizures.length;
      const avgConfidence = seizures.reduce((acc, s) => acc + parseFloat(s.confidence || 0), 0) / seizures.length;
      
      explanation += `Detected ${seizures.length} ictal events with average duration of ${avgDuration.toFixed(1)}s and ${avgConfidence.toFixed(1)}% confidence. `;
      
      if (avgDuration > 30) {
        explanation += `Prolonged seizure duration suggests consideration of rescue medication. `;
      }
      
      explanation += `Patterns consistent with focal onset seizures with secondary generalization. `;
    }
    
    if (artifacts.length > 0) {
      explanation += `Identified ${artifacts.length} artifacts requiring filtering: `;
      const artifactTypes = [...new Set(artifacts.map(a => a.artifactType))];
      explanation += artifactTypes.join(', ') + `. `;
      
      if (artifacts.length > 5) {
        explanation += `High artifact burden may affect signal quality - consider electrode adjustment. `;
      }
    }
    
    if (brainData.heatmap) {
      const maxRegion = Object.entries(brainData.heatmap).reduce((a, b) => 
        brainData.heatmap[a[0]] > brainData.heatmap[b[0]] ? a : b
      );
      explanation += `Maximum activity observed in ${maxRegion[0]} (${(maxRegion[1] * 100).toFixed(1)}%). `;
    }
    
    if (seizures.length === 0 && artifacts.length < 3) {
      explanation += `EEG shows normal background activity with good signal quality. No epileptiform discharges observed. Current therapeutic regimen appears effective. `;
    }
    
    explanation += `Recommend continuing current monitoring protocol and medication schedule.`;
    
    return explanation;
  };
  
  const getInsights = () => {
    const insights = [];
    
    // Analyze brain activity patterns
    if (brainData.heatmap) {
      const highActivityRegions = Object.entries(brainData.heatmap)
        .filter(([_, value]) => value > 0.7)
        .map(([region]) => region);
      
      if (highActivityRegions.length > 0) {
        insights.push({
          type: 'activity',
          icon: Activity,
          color: 'blue',
          text: `High activity detected in: ${highActivityRegions.join(', ')}`
        });
      }
    }
    
    // Analyze events
    const recentSeizures = events.filter(e => e.type === 'seizure');
    const recentArtifacts = events.filter(e => e.type === 'artifact');
    
    if (recentSeizures.length > 0) {
      insights.push({
        type: 'seizure',
        icon: AlertTriangle,
        color: 'red',
        text: `${recentSeizures.length} seizure events detected`
      });
    }
    
    if (recentArtifacts.length > 2) {
      insights.push({
        type: 'artifact',
        icon: TrendingUp,
        color: 'orange',
        text: `${recentArtifacts.length} artifacts may affect signal quality`
      });
    }
    
    // General insights based on mode
    if (mode === 'patient' && recentSeizures.length === 0) {
      insights.push({
        type: 'positive',
        icon: CheckCircle,
        color: 'green',
        text: 'Brain activity patterns are normal'
      });
    }
    
    return insights;
  };
  
  const insights = getInsights();
  
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <button
          onClick={generateExplanation}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
        </button>
      </div>
      
      {/* Current Explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-gray-300 leading-relaxed">{explanation}</p>
              <p className="text-xs text-gray-500 mt-2">
                Generated at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Insights */}
      {insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Quick Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <Icon className={`w-4 h-4 text-${insight.color}-500`} />
                  <p className="text-sm text-gray-300">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Recent Explanations */}
      {explanations.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Recent Analysis</h4>
          <div className="space-y-2">
            {explanations.slice(-2).reverse().map((exp, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-gray-400">{exp.timestamp}</span>
                  <span className="text-xs px-2 py-1 bg-gray-600 rounded">
                    {exp.type}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{exp.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Educational Content for Students */}
      {mode === 'student' && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Learning Tips</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>Compare seizure patterns vs artifacts - seizures are rhythmic, artifacts are random</li>
            <li>Look for spike-and-wave complexes in 3Hz range for absence seizures</li>
            <li>Muscle artifacts show high-frequency activity, usually in frontal regions</li>
            <li>Eye blinks create slow waves in frontal electrodes</li>
          </ul>
        </div>
      )}
      
      {/* Clinical Guidelines for Doctors */}
      {mode === 'doctor' && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-green-400 mb-2">Clinical Guidelines</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>Seizure duration &gt;5min: consider rescue medication</li>
            <li>Artifact burden &gt;30%: recommend electrode adjustment</li>
            <li>Temporal lobe focus: consider MRI for structural analysis</li>
            <li>Normal background with seizures: good prognosis for medication control</li>
          </ul>
        </div>
      )}
      
      {/* Patient Education */}
      {mode === 'patient' && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-400 mb-2">Understanding Your Brain</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>Green on the brain map means normal, healthy activity</li>
            <li>Red areas show where your brain is working harder</li>
            <li>Orange spots are just noise, like static on a radio</li>
            <li>Your brain patterns are unique and change throughout the day</li>
          </ul>
        </div>
      )}
      
      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
            <span className="text-gray-400 text-sm">AI is analyzing brain patterns...</span>
          </div>
        </div>
      )}
    </div>
  );
}
