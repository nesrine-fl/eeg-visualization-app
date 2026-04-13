"""
CHB-MIT Scalp EEG Dataset Processor
====================================

This module handles loading and processing of the CHB-MIT EEG dataset,
which contains EEG recordings from pediatric subjects with intractable seizures.

Dataset Information:
- 23 pediatric subjects
- 686 EEG recordings
- 916 hours of continuous EEG
- Sampling rate: 256 Hz
- 23 electrodes (International 10-20 system)

Files are in .edf format and contain:
- EEG signals from 23 channels
- Seizure annotations with start/end times
- Subject metadata (age, gender, etc.)

Reference:
https://physionet.org/content/chbmit/1.0.0/
"""

import os
import numpy as np
import pandas as pd
import mne
from typing import List, Dict, Tuple, Optional
import logging
from pathlib import Path
import wfdb
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CHBMITProcessor:
    """
    Processor for CHB-MIT EEG dataset
    
    Handles loading, preprocessing, and analysis of EEG recordings
    with seizure annotations from the CHB-MIT dataset.
    """
    
    def __init__(self, data_path: str = "backend/data/chbmit"):
        self.data_path = Path(data_path)
        self.sampling_rate = 256
        self.channels = [
            'FP1-F7', 'F7-T3', 'T3-T5', 'T5-O1', 'FP1-F3', 'F3-C3', 'C3-P3', 'P3-O1',
            'FP2-F8', 'F8-T4', 'T4-T6', 'T6-O2', 'FP2-F4', 'F4-C4', 'C4-P4', 'P4-O2',
            'FZ-CZ', 'CZ-PZ', 'P7-O1', 'P8-O2', 'T7-P7', 'FT9-FT10', 'T7-P7'
        ]
        self.channel_mapping = {
            'FP1-F7': 'FP1', 'FP1-F3': 'FP1', 'FP2-F8': 'FP2', 'FP2-F4': 'FP2',
            'F7-T3': 'F7', 'F3-C3': 'F3', 'F8-T4': 'F8', 'F4-C4': 'F4',
            'T3-T5': 'T3', 'C3-P3': 'C3', 'T4-T6': 'T4', 'C4-P4': 'C4',
            'T5-O1': 'T5', 'P3-O1': 'P3', 'T6-O2': 'T6', 'P4-O2': 'P4',
            'FZ-CZ': 'FZ', 'CZ-PZ': 'CZ', 'P7-O1': 'P7', 'P8-O2': 'P8',
            'T7-P7': 'T7', 'FT9-FT10': 'FT9', 'T7-P7': 'T7'  # Some channel variations
        }
        
        # Brain region mapping for channels
        self.brain_regions = {
            'FP1': 'frontal_lobe', 'FP2': 'frontal_lobe',
            'F3': 'frontal_lobe', 'F4': 'frontal_lobe', 'F7': 'frontal_lobe', 'F8': 'frontal_lobe',
            'FZ': 'frontal_lobe', 'FT9': 'frontal_lobe', 'FT10': 'frontal_lobe',
            'T3': 'temporal_lobe', 'T4': 'temporal_lobe', 'T5': 'temporal_lobe', 'T6': 'temporal_lobe',
            'T7': 'temporal_lobe', 'T8': 'temporal_lobe',
            'C3': 'motor_cortex', 'C4': 'motor_cortex', 'CZ': 'motor_cortex',
            'P3': 'parietal_lobe', 'P4': 'parietal_lobe', 'PZ': 'parietal_lobe',
            'P7': 'parietal_lobe', 'P8': 'parietal_lobe',
            'O1': 'occipital_lobe', 'O2': 'occipital_lobe'
        }
        
        self.subject_info = {}
        self.seizure_annotations = {}
        
    def load_dataset_summary(self) -> Dict:
        """
        Load summary information about the CHB-MIT dataset
        
        Returns:
            Dictionary containing dataset statistics
        """
        summary = {
            'total_subjects': 0,
            'total_recordings': 0,
            'total_seizures': 0,
            'total_duration_hours': 0,
            'subjects': []
        }
        
        # Scan for subject directories
        subject_dirs = [d for d in self.data_path.iterdir() 
                        if d.is_dir() and d.name.startswith('chb')]
        
        summary['total_subjects'] = len(subject_dirs)
        
        for subject_dir in sorted(subject_dirs):
            subject_id = subject_dir.name
            edf_files = list(subject_dir.glob('*.edf'))
            
            # Load subject info from summary file if available
            info_file = subject_dir / f'{subject_id}-summary.txt'
            subject_info = {
                'id': subject_id,
                'recordings': len(edf_files),
                'seizures': 0,
                'duration_hours': 0,
                'age': None,
                'gender': None,
                'files': []
            }
            
            # Process each recording
            for edf_file in edf_files:
                try:
                    # Get recording duration
                    raw = mne.io.read_raw_edf(edf_file, preload=False, verbose=False)
                    duration = raw.times[-1] / self.sampling_rate / 3600  # Convert to hours
                    
                    # Load seizure annotations
                    seizure_times = self.load_seizure_annotations(edf_file)
                    
                    recording_info = {
                        'file': edf_file.name,
                        'duration_hours': duration,
                        'seizure_count': len(seizure_times),
                        'seizure_times': seizure_times
                    }
                    
                    subject_info['files'].append(recording_info)
                    subject_info['duration_hours'] += duration
                    subject_info['seizures'] += len(seizure_times)
                    
                    summary['total_seizures'] += len(seizure_times)
                    
                except Exception as e:
                    logger.warning(f"Could not process {edf_file}: {e}")
                    continue
            
            summary['total_recordings'] += len(edf_files)
            summary['total_duration_hours'] += subject_info['duration_hours']
            summary['subjects'].append(subject_info)
            self.subject_info[subject_id] = subject_info
        
        return summary
    
    def load_seizure_annotations(self, edf_file: Path) -> List[Dict]:
        """
        Load seizure annotations for a specific EDF file
        
        Args:
            edf_file: Path to the EDF file
            
        Returns:
            List of seizure annotations with start/end times
        """
        seizures = []
        
        # Look for corresponding summary file
        summary_file = edf_file.parent / f"{edf_file.parent.name}-summary.txt"
        
        if summary_file.exists():
            try:
                with open(summary_file, 'r') as f:
                    content = f.read()
                
                # Parse seizure information for this file
                lines = content.split('\n')
                current_file = None
                
                for line in lines:
                    if line.startswith('File Name:'):
                        current_file = line.split(':')[1].strip()
                    elif line.startswith('Number of Seizures in File:') and current_file == edf_file.name:
                        seizure_count = int(line.split(':')[1].strip())
                        
                        # Parse seizure times
                        for i in range(seizure_count):
                            seizure_start_line = f"Seizure {i+1} Start Time:"
                            seizure_end_line = f"Seizure {i+1} End Time:"
                            
                            start_time = None
                            end_time = None
                            
                            for j, check_line in enumerate(lines):
                                if check_line.startswith(seizure_start_line):
                                    start_time = int(check_line.split(':')[1].strip())
                                elif check_line.startswith(seizure_end_line):
                                    end_time = int(check_line.split(':')[1].strip())
                                    break
                            
                            if start_time is not None and end_time is not None:
                                seizures.append({
                                    'start_time': start_time,
                                    'end_time': end_time,
                                    'duration': end_time - start_time,
                                    'file': edf_file.name
                                })
                        
                        break
                        
            except Exception as e:
                logger.warning(f"Could not parse annotations for {edf_file}: {e}")
        
        return seizures
    
    def load_recording(self, subject_id: str, file_name: str, preload: bool = True) -> mne.io.Raw:
        """
        Load a specific EEG recording
        
        Args:
            subject_id: Subject identifier (e.g., 'chb01')
            file_name: EDF file name
            preload: Whether to load data into memory
            
        Returns:
            MNE Raw object containing the EEG data
        """
        file_path = self.data_path / subject_id / file_name
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            raw = mne.io.read_raw_edf(file_path, preload=preload, verbose=False)
            
            # Set channel names to standard format
            standard_ch_names = []
            for ch in raw.ch_names:
                if ch in self.channel_mapping:
                    standard_ch_names.append(self.channel_mapping[ch])
                else:
                    # Try to extract the first electrode name
                    if '-' in ch:
                        standard_ch_names.append(ch.split('-')[0])
                    else:
                        standard_ch_names.append(ch)
            
            raw.rename_channels(dict(zip(raw.ch_names, standard_ch_names)))
            
            # Filter to only include channels we recognize
            recognized_channels = [ch for ch in standard_ch_names if ch in self.brain_regions]
            raw.pick_channels(recognized_channels)
            
            return raw
            
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            raise
    
    def extract_seizure_segments(self, raw: mne.io.Raw, seizures: List[Dict], 
                                pre_seizure_duration: int = 300, 
                                post_seizure_duration: int = 300) -> List[Dict]:
        """
        Extract seizure segments with pre and post seizure periods
        
        Args:
            raw: MNE Raw object
            seizures: List of seizure annotations
            pre_seizure_duration: Seconds before seizure to include
            post_seizure_duration: Seconds after seizure to include
            
        Returns:
            List of seizure segments with data
        """
        segments = []
        
        for seizure in seizures:
            start_time = seizure['start_time']
            end_time = seizure['end_time']
            
            # Extract pre-seizure, seizure, and post-seizure segments
            pre_start = max(0, start_time - pre_seizure_duration)
            pre_end = start_time
            
            seizure_start = start_time
            seizure_end = end_time
            
            post_start = end_time
            post_end = end_time + post_seizure_duration
            
            try:
                # Extract data for each segment
                pre_data = raw.copy().crop(tmin=pre_start, tmax=pre_end)
                seizure_data = raw.copy().crop(tmin=seizure_start, tmax=seizure_end)
                post_data = raw.copy().crop(tmin=post_start, tmax=post_end)
                
                segment = {
                    'seizure_info': seizure,
                    'pre_seizure': {
                        'data': pre_data.get_data(),
                        'times': pre_data.times,
                        'duration': pre_end - pre_start
                    },
                    'seizure': {
                        'data': seizure_data.get_data(),
                        'times': seizure_data.times,
                        'duration': seizure_end - seizure_start
                    },
                    'post_seizure': {
                        'data': post_data.get_data(),
                        'times': post_data.times,
                        'duration': post_end - post_start
                    }
                }
                
                segments.append(segment)
                
            except Exception as e:
                logger.warning(f"Could not extract seizure segment: {e}")
                continue
        
        return segments
    
    def generate_sample_data(self, duration_minutes: int = 10, 
                           include_seizure: bool = True) -> Dict:
        """
        Generate sample EEG data based on CHB-MIT characteristics
        
        Args:
            duration_minutes: Duration of generated data in minutes
            include_seizure: Whether to include seizure activity
            
        Returns:
            Dictionary containing generated EEG data and metadata
        """
        duration_seconds = duration_minutes * 60
        n_samples = int(duration_seconds * self.sampling_rate)
        t = np.linspace(0, duration_seconds, n_samples)
        
        # Generate realistic EEG signals
        data = np.zeros((len(self.channels), n_samples))
        
        for i, channel in enumerate(self.channels):
            # Base oscillations for different brain wave bands
            delta = 5 * np.sin(2 * np.pi * 2 * t + np.random.random() * 2 * np.pi)
            theta = 3 * np.sin(2 * np.pi * 5 * t + np.random.random() * 2 * np.pi)
            alpha = 4 * np.sin(2 * np.pi * 10 * t + np.random.random() * 2 * np.pi)
            beta = 2 * np.sin(2 * np.pi * 20 * t + np.random.random() * 2 * np.pi)
            gamma = 1 * np.sin(2 * np.pi * 35 * t + np.random.random() * 2 * np.pi)
            
            # Add realistic noise
            noise = np.random.normal(0, 2, n_samples)
            
            # Combine signals
            signal_data = delta + theta + alpha + beta + gamma + noise
            
            # Add seizure activity if requested
            if include_seizure and np.random.random() > 0.5:
                seizure_start = np.random.randint(n_samples // 4, 3 * n_samples // 4)
                seizure_duration = int(np.random.uniform(10, 60) * self.sampling_rate)
                seizure_end = min(seizure_start + seizure_duration, n_samples)
                
                # Generate seizure-like activity
                seizure_activity = np.random.normal(0, 50, seizure_end - seizure_start)
                signal_data[seizure_start:seizure_end] += seizure_activity
            
            data[i] = signal_data
        
        # Generate metadata
        metadata = {
            'subject_id': 'sample',
            'recording_id': f'sample_{duration_minutes}min',
            'sampling_rate': self.sampling_rate,
            'channels': self.channels,
            'duration_seconds': duration_seconds,
            'has_seizure': include_seizure,
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'data': data,
            'times': t,
            'metadata': metadata
        }
    
    def calculate_band_power(self, data: np.ndarray, bands: Dict[str, Tuple[float, float]] = None) -> Dict:
        """
        Calculate power in different frequency bands
        
        Args:
            data: EEG data array (channels x samples)
            bands: Dictionary of frequency bands
            
        Returns:
            Dictionary containing band power for each channel
        """
        if bands is None:
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
            
            for band, (low, high) in bands.items():
                # Calculate power spectral density
                freqs, psd = signal.welch(data[i], fs=self.sampling_rate, nperseg=256)
                band_mask = (freqs >= low) & (freqs <= high)
                power = np.trapz(psd[band_mask], freqs[band_mask])
                channel_power[band] = float(power)
            
            band_power[channel] = channel_power
        
        return band_power
    
    def get_dataset_statistics(self) -> Dict:
        """
        Get comprehensive statistics about the loaded dataset
        
        Returns:
            Dictionary with dataset statistics
        """
        if not self.subject_info:
            self.load_dataset_summary()
        
        stats = {
            'total_subjects': len(self.subject_info),
            'total_recordings': sum(info['recordings'] for info in self.subject_info.values()),
            'total_seizures': sum(info['seizures'] for info in self.subject_info.values()),
            'total_duration_hours': sum(info['duration_hours'] for info in self.subject_info.values()),
            'average_seizures_per_subject': np.mean([info['seizures'] for info in self.subject_info.values()]),
            'average_recordings_per_subject': np.mean([info['recordings'] for info in self.subject_info.values()]),
            'subjects_with_seizures': len([info for info in self.subject_info.values() if info['seizures'] > 0])
        }
        
        return stats

# Example usage and testing
if __name__ == "__main__":
    # Initialize processor
    processor = CHBMITProcessor()
    
    # Load dataset summary
    summary = processor.load_dataset_summary()
    print(f"Dataset Summary:")
    print(f"  Subjects: {summary['total_subjects']}")
    print(f"  Recordings: {summary['total_recordings']}")
    print(f"  Seizures: {summary['total_seizures']}")
    print(f"  Duration: {summary['total_duration_hours']:.1f} hours")
    
    # Generate sample data
    sample_data = processor.generate_sample_data(duration_minutes=5, include_seizure=True)
    print(f"\nGenerated sample data:")
    print(f"  Shape: {sample_data['data'].shape}")
    print(f"  Duration: {sample_data['metadata']['duration_seconds']} seconds")
    print(f"  Has seizure: {sample_data['metadata']['has_seizure']}")
    
    # Calculate band power
    band_power = processor.calculate_band_power(sample_data['data'])
    print(f"\nBand power for first channel:")
    for band, power in band_power[processor.channels[0]].items():
        print(f"  {band}: {power:.2f}")
