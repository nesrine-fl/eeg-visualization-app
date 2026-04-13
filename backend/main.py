from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import json
import asyncio
import numpy as np
from datetime import datetime
import mne
from scipy import signal
import pandas as pd
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="EEG Brain Visualization API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Data models
class EEGData(BaseModel):
    timestamp: str
    channels: List[str]
    duration_seconds: float
    sampling_rate: int
    events: List[Dict[str, Any]]
    band_power: Dict[str, Dict[str, float]]
    heatmap: Dict[str, float]

class EEGProcessor:
    def __init__(self):
        self.sampling_rate = 256
        self.channels = ["FP1", "FP2", "F3", "F4", "C3", "C4", "P3", "P4", "O1", "O2", 
                        "F7", "F8", "T7", "T8", "FZ", "CZ", "PZ", "FC1", "FC2", 
                        "CP1", "CP2", "PO1", "PO2"]
        self.channel_mapping = {
            "FP1": "frontal_lobe", "FP2": "frontal_lobe",
            "F3": "frontal_lobe", "F4": "frontal_lobe", 
            "F7": "frontal_lobe", "F8": "frontal_lobe", "FZ": "frontal_lobe",
            "FC1": "frontal_lobe", "FC2": "frontal_lobe",
            "T7": "temporal_lobe", "T8": "temporal_lobe",
            "C3": "motor_cortex", "C4": "motor_cortex", "CZ": "motor_cortex",
            "CP1": "sensory_cortex", "CP2": "sensory_cortex",
            "P3": "parietal_lobe", "P4": "parietal_lobe", "PZ": "parietal_lobe",
            "PO1": "occipital_lobe", "PO2": "occipital_lobe",
            "O1": "occipital_lobe", "O2": "occipital_lobe"
        }
        
    def load_sample_data(self) -> np.ndarray:
        """Generate sample EEG data for demonstration"""
        duration_seconds = 120
        n_samples = int(duration_seconds * self.sampling_rate)
        n_channels = len(self.channels)
        
        # Generate realistic EEG signals
        t = np.linspace(0, duration_seconds, n_samples)
        data = np.zeros((n_channels, n_samples))
        
        for i, channel in enumerate(self.channels):
            # Base oscillations for different brain wave bands
            delta = 5 * np.sin(2 * np.pi * 2 * t + np.random.random() * 2 * np.pi)
            theta = 3 * np.sin(2 * np.pi * 5 * t + np.random.random() * 2 * np.pi)
            alpha = 4 * np.sin(2 * np.pi * 10 * t + np.random.random() * 2 * np.pi)
            beta = 2 * np.sin(2 * np.pi * 20 * t + np.random.random() * 2 * np.pi)
            gamma = 1 * np.sin(2 * np.pi * 35 * t + np.random.random() * 2 * np.pi)
            
            # Add noise
            noise = np.random.normal(0, 0.5, n_samples)
            
            # Combine signals
            signal_data = delta + theta + alpha + beta + gamma + noise
            
            # Add occasional spikes (seizure simulation)
            if np.random.random() > 0.7:  # 30% chance of seizure activity
                spike_time = np.random.randint(n_samples // 4, 3 * n_samples // 4)
                spike_width = int(0.5 * self.sampling_rate)  # 0.5 second spike
                spike_start = max(0, spike_time - spike_width // 2)
                spike_end = min(n_samples, spike_time + spike_width // 2)
                signal_data[spike_start:spike_end] += np.random.normal(0, 50, spike_end - spike_start)
            
            data[i] = signal_data
            
        return data
    
    def preprocess_signal(self, raw_data: np.ndarray) -> np.ndarray:
        """Apply preprocessing filters to EEG signal"""
        # Notch filter for powerline noise (50Hz)
        b_notch, a_notch = signal.iirnotch(50, 30, self.sampling_rate)
        filtered = signal.filtfilt(b_notch, a_notch, raw_data)
        
        # Bandpass filter (0.5-40 Hz)
        b_band, a_band = signal.butter(4, [0.5, 40], btype='band', fs=self.sampling_rate)
        filtered = signal.filtfilt(b_band, a_band, filtered)
        
        return filtered
    
    def detect_artifacts(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect various types of artifacts in EEG data"""
        artifacts = []
        
        for i, channel in enumerate(self.channels):
            channel_data = data[i]
            
            # Detect electrode pops (sudden large amplitude changes)
            diff = np.abs(np.diff(channel_data))
            pop_threshold = np.percentile(np.abs(diff), 99.5)
            pop_indices = np.where(diff > pop_threshold)[0]
            
            for idx in pop_indices:
                artifacts.append({
                    "type": "electrode_pop",
                    "channel": channel,
                    "time": idx / self.sampling_rate,
                    "amplitude": diff[idx],
                    "confidence": min(0.95, diff[idx] / pop_threshold)
                })
            
            # Detect muscle noise (high frequency activity)
            high_freq_power = np.sum(np.abs(signal.welch(channel_data, fs=self.sampling_rate, nperseg=256)[1][20:]))
            if high_freq_power > np.percentile([np.sum(np.abs(signal.welch(data[j], fs=self.sampling_rate, nperseg=256)[1][20:])) for j in range(len(self.channels))], 90):
                artifacts.append({
                    "type": "muscle_noise",
                    "channel": channel,
                    "time": 0,  # Continuous artifact
                    "amplitude": high_freq_power,
                    "confidence": min(0.9, high_freq_power / 1000)
                })
        
        return artifacts
    
    def detect_seizures(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect seizure patterns in EEG data"""
        seizures = []
        
        for i, channel in enumerate(self.channels):
            channel_data = data[i]
            
            # Spike detection using threshold method
            threshold = np.percentile(np.abs(channel_data), 99)
            spike_indices = np.where(np.abs(channel_data) > threshold)[0]
            
            # Group consecutive spikes into seizure events
            if len(spike_indices) > 0:
                spike_groups = []
                current_group = [spike_indices[0]]
                
                for j in range(1, len(spike_indices)):
                    if spike_indices[j] - spike_indices[j-1] < 10:  # Within 10 samples
                        current_group.append(spike_indices[j])
                    else:
                        if len(current_group) > 5:  # Minimum 5 spikes
                            spike_groups.append(current_group)
                        current_group = [spike_indices[j]]
                
                if len(current_group) > 5:
                    spike_groups.append(current_group)
                
                for group in spike_groups:
                    seizures.append({
                        "type": "seizure",
                        "channel": channel,
                        "time": group[0] / self.sampling_rate,
                        "duration": (group[-1] - group[0]) / self.sampling_rate,
                        "amplitude": np.mean(np.abs(channel_data[group])),
                        "severity": "high" if np.mean(np.abs(channel_data[group])) > 100 else "medium"
                    })
        
        return seizures
    
    def compute_band_power(self, data: np.ndarray) -> Dict[str, Dict[str, float]]:
        """Compute power in different frequency bands"""
        bands = {
            'delta': (1, 4),
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30),
            'gamma': (30, 40)
        }
        
        band_power = {}
        
        for i, channel in enumerate(self.channels):
            channel_power = {}
            total_power = 0
            
            for band, (low, high) in bands.items():
                freqs, psd = signal.welch(data[i], fs=self.sampling_rate, nperseg=256)
                band_mask = (freqs >= low) & (freqs <= high)
                power = np.trapz(psd[band_mask], freqs[band_mask])
                channel_power[band] = float(power)
                total_power += power
            
            # Normalize to percentage
            for band in bands:
                if total_power > 0:
                    channel_power[band] = (channel_power[band] / total_power) * 100
            
            band_power[channel] = channel_power
        
        return band_power
    
    def generate_heatmap(self, band_power: Dict[str, Dict[str, float]]) -> Dict[str, float]:
        """Generate brain region heatmap from channel data"""
        heatmap = {}
        
        # Initialize regions
        regions = set(self.channel_mapping.values())
        for region in regions:
            heatmap[region] = 0
            count = 0
            
            # Average power across channels in each region
            for channel, mapped_region in self.channel_mapping.items():
                if mapped_region == region and channel in band_power:
                    # Use alpha and beta bands as activity indicators
                    activity = band_power[channel].get('alpha', 0) + band_power[channel].get('beta', 0)
                    heatmap[region] += activity
                    count += 1
            
            if count > 0:
                heatmap[region] /= count
        
        # Normalize to 0-1 scale
        max_val = max(heatmap.values()) if heatmap.values() else 1
        for region in heatmap:
            heatmap[region] = heatmap[region] / max_val if max_val > 0 else 0
        
        return heatmap

# Initialize processor
processor = EEGProcessor()

@app.get("/")
async def root():
    return {"message": "EEG Brain Visualization API", "version": "1.0.0"}

@app.post("/upload")
async def upload_eeg(file: UploadFile = File(...)):
    """Upload and process EEG file"""
    try:
        # For now, use sample data. In production, process actual file
        raw_data = processor.load_sample_data()
        clean_data = processor.preprocess_signal(raw_data)
        
        # Detect events
        artifacts = processor.detect_artifacts(clean_data)
        seizures = processor.detect_seizures(clean_data)
        events = artifacts + seizures
        
        # Compute features
        band_power = processor.compute_band_power(clean_data)
        heatmap = processor.generate_heatmap(band_power)
        
        # Create response
        eeg_data = EEGData(
            timestamp=datetime.now().isoformat(),
            channels=processor.channels,
            duration_seconds=120,
            sampling_rate=processor.sampling_rate,
            events=events,
            band_power=band_power,
            heatmap=heatmap
        )
        
        return eeg_data.dict()
        
    except Exception as e:
        logger.error(f"Error processing EEG file: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/sample-data")
async def get_sample_data():
    """Get sample EEG data for demonstration"""
    try:
        raw_data = processor.load_sample_data()
        clean_data = processor.preprocess_signal(raw_data)
        
        # Detect events
        artifacts = processor.detect_artifacts(clean_data)
        seizures = processor.detect_seizures(clean_data)
        events = artifacts + seizures
        
        # Compute features
        band_power = processor.compute_band_power(clean_data)
        heatmap = processor.generate_heatmap(band_power)
        
        # Create response
        eeg_data = EEGData(
            timestamp=datetime.now().isoformat(),
            channels=processor.channels,
            duration_seconds=120,
            sampling_rate=processor.sampling_rate,
            events=events,
            band_power=band_power,
            heatmap=heatmap
        )
        
        return eeg_data.dict()
        
    except Exception as e:
        logger.error(f"Error generating sample data: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    await manager.connect(websocket)
    try:
        while True:
            # Generate real-time data updates
            raw_data = processor.load_sample_data()
            clean_data = processor.preprocess_signal(raw_data)
            
            # Compute features for current time window
            band_power = processor.compute_band_power(clean_data)
            heatmap = processor.generate_heatmap(band_power)
            
            # Send update
            update_data = {
                "timestamp": datetime.now().isoformat(),
                "band_power": band_power,
                "heatmap": heatmap,
                "events": processor.detect_seizures(clean_data)[:5]  # Limit events for performance
            }
            
            await manager.send_personal_message(json.dumps(update_data), websocket)
            await asyncio.sleep(0.1)  # 100ms update interval
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/events")
async def get_events():
    """Get detected events (seizures, artifacts)"""
    try:
        raw_data = processor.load_sample_data()
        clean_data = processor.preprocess_signal(raw_data)
        
        artifacts = processor.detect_artifacts(clean_data)
        seizures = processor.detect_seizures(clean_data)
        
        return {
            "artifacts": artifacts,
            "seizures": seizures,
            "total_events": len(artifacts) + len(seizures)
        }
        
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/heatmap")
async def get_heatmap():
    """Get current brain activity heatmap"""
    try:
        raw_data = processor.load_sample_data()
        clean_data = processor.preprocess_signal(raw_data)
        
        band_power = processor.compute_band_power(clean_data)
        heatmap = processor.generate_heatmap(band_power)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "heatmap": heatmap,
            "band_power": band_power
        }
        
    except Exception as e:
        logger.error(f"Error getting heatmap: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/status")
async def get_status():
    """Get system status"""
    return {
        "status": "active",
        "connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat(),
        "channels": len(processor.channels),
        "sampling_rate": processor.sampling_rate
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
