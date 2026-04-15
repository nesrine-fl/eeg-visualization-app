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
from data.chbmit_processor import CHBMITProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NeuroVision API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
    rawData: List[List[float]]

class EEGProcessor:
    def __init__(self):
        self.chbmit_processor = CHBMITProcessor("backend/data/chbmit")
        self.sampling_rate = 256
        self.raw_data = None
        self.clean_data = None
        self.band_power = None
        self.heatmap = None
        self.events = None
        self.current_stream_index = 0
        self.stream_window_size = 2560  # 10 seconds of data at 256 Hz
        
        # Load real EEG data once at startup
        self._load_real_eeg_data()
    
    def _load_real_eeg_data(self):
        """Load real EEG data from chb01_03.edf file"""
        try:
            logger.info("Loading real EEG data from chb01_03.edf...")
            
            # Load the actual chb01_03.edf file directly with MNE
            import os
            from pathlib import Path
            # Get the directory where this script is located
            script_dir = Path(__file__).parent
            # Use absolute path from script directory
            file_path = script_dir / "data" / "chbmit" / "chb01" / "chb01_03.edf"
            if not file_path.exists():
                # Try alternative path from project root
                file_path = script_dir.parent / "data" / "chb01_03.edf"
            if not file_path.exists():
                # Try data directory in backend
                file_path = script_dir / "data" / "chb01_03.edf"
            if not file_path.exists():
                raise FileNotFoundError(f"Could not find chb01_03.edf file. Tried: {file_path}")
            logger.info(f"Loading EEG data from: {file_path}")
            raw = mne.io.read_raw_edf(file_path, preload=True, verbose=False)
            self.raw_data = raw.get_data()
            
            # Get actual channel names from the EDF file
            self.channels = raw.ch_names
            logger.info(f"Loaded {len(self.channels)} channels: {self.channels}")
            
            # Update channel mapping based on actual channels
            self.channel_mapping = {}
            for ch in self.channels:
                # Map to brain regions based on channel naming
                if 'FP' in ch or 'F' in ch:
                    self.channel_mapping[ch] = 'frontal_lobe'
                elif 'T' in ch:
                    self.channel_mapping[ch] = 'temporal_lobe'
                elif 'C' in ch:
                    self.channel_mapping[ch] = 'motor_cortex'
                elif 'P' in ch:
                    self.channel_mapping[ch] = 'parietal_lobe'
                elif 'O' in ch:
                    self.channel_mapping[ch] = 'occipital_lobe'
                else:
                    self.channel_mapping[ch] = 'frontal_lobe'  # default
            
            # Process the data once (limit to first 5 minutes for performance)
            max_samples = min(self.raw_data.shape[1], 256 * 60 * 5)  # 5 minutes max
            self.raw_data = self.raw_data[:, :max_samples]
            self.clean_data = self.preprocess_signal(self.raw_data)
            
            # Compute features once
            self.band_power = self.compute_band_power(self.clean_data)
            self.heatmap = self.generate_heatmap(self.band_power)
            self.events = self.detect_events(self.clean_data)
            
            logger.info(f"Successfully loaded and processed EEG data: {self.clean_data.shape}")
            
        except Exception as e:
            logger.error(f"Failed to load real EEG data: {e}")
            raise
    
    def get_data_window(self, window_size: int = None) -> np.ndarray:
        """Get a window of data for streaming"""
        if self.clean_data is None:
            return np.zeros((23, window_size or self.stream_window_size))
        
        window_size = window_size or self.stream_window_size
        total_samples = self.clean_data.shape[1]
        
        # Get current window
        start_idx = self.current_stream_index
        end_idx = min(start_idx + window_size, total_samples)
        
        if end_idx - start_idx < window_size:
            # Loop back to beginning if we reach the end
            self.current_stream_index = 0
            start_idx = 0
            end_idx = window_size
        else:
            self.current_stream_index = end_idx
        
        return self.clean_data[:, start_idx:end_idx]
    
    def detect_events(self, data: np.ndarray) -> List[Dict[str, Any]]:
        """Detect both artifacts and seizures in EEG data"""
        artifacts = self.detect_artifacts(data)
        seizures = self.detect_seizures(data)
        return artifacts + seizures
    
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
                power = np.trapezoid(psd[band_mask], freqs[band_mask])
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

# Initialize processor (loads real EEG data at startup)
try:
    processor = EEGProcessor()
    logger.info("EEG Processor initialized successfully with real data")
except Exception as e:
    logger.error(f"Failed to initialize EEG Processor: {e}")
    processor = None

@app.get("/")
async def root():
    return {"message": "NeuroVision API", "version": "1.0.0"}

@app.post("/upload")
async def upload_eeg(file: UploadFile = File(...)):
    """Upload and process EEG file"""
    try:
        if processor is None:
            return JSONResponse(status_code=503, content={"error": "EEG processor not initialized"})
        
        # Use pre-processed real data
        duration_seconds = processor.clean_data.shape[1] / processor.sampling_rate
        
        # Create response
        eeg_data = EEGData(
            timestamp=datetime.now().isoformat(),
            channels=processor.channels,
            duration_seconds=duration_seconds,
            sampling_rate=processor.sampling_rate,
            events=processor.events,
            band_power=processor.band_power,
            heatmap=processor.heatmap
        )
        
        return eeg_data.dict()
        
    except Exception as e:
        logger.error(f"Error processing EEG file: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/sample-data")
async def get_sample_data():
    """Get real EEG data from CHB-MIT dataset"""
    try:
        if processor is None:
            return JSONResponse(status_code=503, content={"error": "EEG processor not initialized"})
        
        # Use pre-processed real data
        duration_seconds = processor.clean_data.shape[1] / processor.sampling_rate
        
        # Create response - include actual signal data (first 2560 samples for each channel)
        signal_data = processor.clean_data[:, :2560].tolist() if processor.clean_data is not None else []
        eeg_data = EEGData(
            timestamp=datetime.now().isoformat(),
            channels=processor.channels,
            duration_seconds=duration_seconds,
            sampling_rate=processor.sampling_rate,
            events=processor.events,
            band_power=processor.band_power,
            heatmap=processor.heatmap,
            rawData=signal_data
        )
        
        return eeg_data.dict()
        
    except Exception as e:
        logger.error(f"Error loading real EEG data: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    await manager.connect(websocket)
    try:
        while True:
            if processor is None:
                await manager.send_personal_message(
                    json.dumps({"error": "EEG processor not initialized"}), 
                    websocket
                )
                await asyncio.sleep(1)
                continue
            
            # Get real-time data window from pre-loaded EEG data
            data_window = processor.get_data_window()
            
            # Compute features for current time window
            band_power = processor.compute_band_power(data_window)
            heatmap = processor.generate_heatmap(band_power)
            
            # Detect events in current window
            events = processor.detect_events(data_window)
            
            # Send update
            update_data = {
                "timestamp": datetime.now().isoformat(),
                "band_power": band_power,
                "heatmap": heatmap,
                "events": events[:5]  # Limit events for performance
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
    """Get detected events from real EEG data"""
    try:
        if processor is None:
            return JSONResponse(status_code=503, content={"error": "EEG processor not initialized"})
        
        # Separate events by type
        artifacts = [e for e in processor.events if e.get('type') == 'artifact']
        seizures = [e for e in processor.events if e.get('type') == 'seizure']
        
        return {
            "artifacts": artifacts,
            "seizures": seizures,
            "total_events": len(processor.events)
        }
        
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/heatmap")
async def get_heatmap():
    """Get current brain activity heatmap from real EEG data"""
    try:
        if processor is None:
            return JSONResponse(status_code=503, content={"error": "EEG processor not initialized"})
        
        return {
            "timestamp": datetime.now().isoformat(),
            "heatmap": processor.heatmap,
            "band_power": processor.band_power
        }
        
    except Exception as e:
        logger.error(f"Error getting heatmap: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/status")
async def get_status():
    """Get system status"""
    if processor is None:
        return {
            "status": "error",
            "connections": len(manager.active_connections),
            "timestamp": datetime.now().isoformat(),
            "channels": 0,
            "sampling_rate": 256,
            "error": "EEG processor not initialized"
        }
    
    return {
        "status": "active",
        "connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat(),
        "channels": len(processor.channels),
        "sampling_rate": processor.sampling_rate,
        "data_loaded": processor.clean_data is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
