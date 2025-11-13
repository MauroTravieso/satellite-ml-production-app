// ============================================================
// SATELLITE TRAJECTORY CLASSIFICATION SYSTEM - JAVASCRIPT
// Author: Mauro Travieso
// ============================================================

// ============================================================
// GLOBAL VARIABLES & CONFIGURATION
// ============================================================

let predictionLog = [];
let sessionStartTime = Date.now();

// Model Configuration
const MODEL_CONFIG = {
    classes: ['ISS', 'Sentinel1A'],
    featureNames: [
        'latitude', 'longitude', 'x_eci_km', 'y_eci_km', 'z_eci_km',
        'velocity_x', 'velocity_y', 'velocity_z', 'total_velocity', 'radial_distance'
    ],
    featureImportance: {
        'radial_distance': 0.15,
        'x_eci_km': 0.15,
        'y_eci_km': 0.14,
        'z_eci_km': 0.13,
        'velocity_x': 0.12,
        'velocity_y': 0.11,
        'velocity_z': 0.10,
        'longitude': 0.09,
        'total_velocity': 0.09,
        'latitude': 0.08
    },
    classificationRules: {
        ISS: {
            altitude_range: [400, 410],
            velocity_range: [7.6, 7.7],
            radial_distance: [6771, 6781]
        },
        Sentinel1A: {
            altitude_range: [690, 710],
            velocity_range: [7.4, 7.5],
            radial_distance: [7061, 7081]
        }
    }
};

const SCALER_PARAMS = {
    mean: [0, 0, 0, 0, 0, 0, 0, 0, 7.5, 6900],
    std: [90, 180, 1000, 1000, 1000, 1.5, 1.5, 1.5, 0.15, 200]
};

// ============================================================
// INITIALIZATION
// ============================================================

// Create starfield background
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = star.style.height = Math.random() * 3 + 'px';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    createStars();
    updatePerformanceStats();
    setInterval(updatePerformanceStats, 1000);
});

// ============================================================
// PERFORMANCE MONITORING
// ============================================================

function logPrediction(input, output, processingTime) {
    const timestamp = new Date().toISOString();
    
    predictionLog.push({
        timestamp,
        input,
        output,
        processingTime: processingTime.toFixed(2)
    });
    
    updatePerformanceStats();
}

function updatePerformanceStats() {
    const totalPreds = predictionLog.length;
    const avgTime = predictionLog.length > 0 
        ? (predictionLog.reduce((sum, p) => sum + parseFloat(p.processingTime), 0) / totalPreds).toFixed(2)
        : 0;
    const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);

    document.getElementById('totalPredictions').textContent = totalPreds;
    document.getElementById('avgProcessingTime').textContent = avgTime + 'ms';
    document.getElementById('sessionDuration').textContent = sessionTime + 's';
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validateInput(data) {
    const errors = [];
    
    // Check required fields
    const requiredFields = ['latitude', 'longitude', 'x_eci', 'y_eci', 'z_eci', 'vel_x', 'vel_y', 'vel_z'];
    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
            errors.push(`Missing required field: ${field}`);
        }
        if (typeof data[field] !== 'number' || isNaN(data[field])) {
            errors.push(`Invalid numeric value for: ${field}`);
        }
    }
    
    // Validate latitude range
    if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
        errors.push(`Latitude out of range: ${data.latitude}° (valid: -90° to +90°)`);
    }
    
    // Validate longitude range
    if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
        errors.push(`Longitude out of range: ${data.longitude}° (valid: -180° to +180°)`);
    }
    
    // Validate velocity is reasonable
    if (data.vel_x !== undefined && Math.abs(data.vel_x) > 20) {
        errors.push(`Velocity X seems unrealistic: ${data.vel_x} km/s (typical: ±10 km/s)`);
    }
    if (data.vel_y !== undefined && Math.abs(data.vel_y) > 20) {
        errors.push(`Velocity Y seems unrealistic: ${data.vel_y} km/s (typical: ±10 km/s)`);
    }
    if (data.vel_z !== undefined && Math.abs(data.vel_z) > 20) {
        errors.push(`Velocity Z seems unrealistic: ${data.vel_z} km/s (typical: ±10 km/s)`);
    }
    
    // Validate ECI coordinates
    const eci_magnitude = Math.sqrt((data.x_eci || 0)**2 + (data.y_eci || 0)**2 + (data.z_eci || 0)**2);
    if (eci_magnitude < 6371) {
        errors.push(`ECI position inside Earth! Magnitude: ${eci_magnitude.toFixed(2)} km (min: 6371 km)`);
    }
    if (eci_magnitude > 100000) {
        errors.push(`ECI position too far from Earth: ${eci_magnitude.toFixed(2)} km (typical: 6371-50000 km)`);
    }
    
    return errors;
}

// ============================================================
// MODEL PREDICTION LOGIC
// ============================================================

function calculateDerivedFeatures(data) {
    const totalVelocity = Math.sqrt(
        data.vel_x ** 2 + data.vel_y ** 2 + data.vel_z ** 2
    );
    const radialDistance = Math.sqrt(
        data.x_eci ** 2 + data.y_eci ** 2 + data.z_eci ** 2
    );
    return { totalVelocity, radialDistance };
}

function normalizeFeatures(features) {
    return features.map((val, idx) => 
        (val - SCALER_PARAMS.mean[idx]) / SCALER_PARAMS.std[idx]
    );
}

function predictSatellite(data) {
    // Validate input data
    const validationErrors = validateInput(data);
    if (validationErrors.length > 0) {
        console.error('❌ Validation failed:', validationErrors);
        throw new Error('Input validation failed:\n' + validationErrors.join('\n'));
    }
    
    const derived = calculateDerivedFeatures(data);
    
    const features = [
        data.latitude,
        data.longitude,
        data.x_eci,
        data.y_eci,
        data.z_eci,
        data.vel_x,
        data.vel_y,
        data.vel_z,
        derived.totalVelocity,
        derived.radialDistance
    ];

    const normalizedFeatures = normalizeFeatures(features);
    const altitude = derived.radialDistance - 6371;
    
    let prediction = 'Sentinel1A';
    let confidence = 0.5;

    if (altitude < 450 && derived.totalVelocity > 7.6) {
        prediction = 'ISS';
        confidence = 0.95;
    }
    else if (altitude > 650 && derived.totalVelocity < 7.6) {
        prediction = 'Sentinel1A';
        confidence = 0.92;
    }
    else if (Math.abs(data.latitude) < 52 && altitude < 450) {
        prediction = 'ISS';
        confidence = 0.88;
    } else {
        confidence = 0.75;
    }

    return {
        prediction,
        confidence,
        features: {
            latitude: data.latitude.toFixed(4),
            longitude: data.longitude.toFixed(4),
            altitude: altitude.toFixed(2),
            totalVelocity: derived.totalVelocity.toFixed(4),
            radialDistance: derived.radialDistance.toFixed(2)
        },
        rawFeatures: {
            ...data,
            totalVelocity: derived.totalVelocity,
            radialDistance: derived.radialDistance
        }
    };
}

// ============================================================
// MODEL EXPLAINABILITY
// ============================================================

function explainPrediction(features, prediction) {
    const contributions = MODEL_CONFIG.featureImportance;
    
    const featureValues = {
        'latitude': features.latitude,
        'longitude': features.longitude,
        'x_eci_km': features.x_eci,
        'y_eci_km': features.y_eci,
        'z_eci_km': features.z_eci,
        'velocity_x': features.vel_x,
        'velocity_y': features.vel_y,
        'velocity_z': features.vel_z,
        'total_velocity': features.totalVelocity,
        'radial_distance': features.radialDistance
    };
    
    return Object.entries(contributions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feature, importance]) => ({
            feature: feature.replace(/_/g, ' ').toUpperCase(),
            importance: importance,
            importancePercent: (importance * 100).toFixed(1) + '%',
            value: typeof featureValues[feature] === 'number' 
                ? featureValues[feature].toFixed(2) 
                : featureValues[feature]
        }));
}

function displayExplainability(explanations) {
    const container = document.getElementById('contributionBars');
    container.innerHTML = explanations.map(exp => `
        <div style="margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; color: #ffcc88; margin-bottom: 5px;">
                <span><strong>${exp.feature}</strong>: ${exp.value}</span>
                <span>${exp.importancePercent}</span>
            </div>
            <div class="contribution-bar">
                <div class="contribution-fill" style="width: ${exp.importance * 100}%"></div>
            </div>
        </div>
    `).join('');
}

// ============================================================
// SAMPLE DATA LOADERS
// ============================================================

function loadSampleData(satelliteType) {
    console.log('Loading sample data for:', satelliteType);
    
    const sampleData = {
        ISS: {
            latitude: 51.6,
            longitude: -122.0,
            x_eci: 6771.5,
            y_eci: 100.0,
            z_eci: 200.0,
            vel_x: 7.66,
            vel_y: 0.5,
            vel_z: 0.3
        },
        Sentinel1A: {
            latitude: 98.2,
            longitude: 45.0,
            x_eci: 7065.0,
            y_eci: 500.0,
            z_eci: 1000.0,
            vel_x: 7.45,
            vel_y: -0.5,
            vel_z: -0.3
        }
    };
    
    const data = sampleData[satelliteType];
    if (!data) {
        console.error('Unknown satellite type:', satelliteType);
        return;
    }
    
    // Populate form fields
    document.getElementById('latitude').value = data.latitude;
    document.getElementById('longitude').value = data.longitude;
    document.getElementById('x_eci').value = data.x_eci;
    document.getElementById('y_eci').value = data.y_eci;
    document.getElementById('z_eci').value = data.z_eci;
    document.getElementById('vel_x').value = data.vel_x;
    document.getElementById('vel_y').value = data.vel_y;
    document.getElementById('vel_z').value = data.vel_z;
    
    // Highlight form
    const form = document.getElementById('predictionForm');
    form.style.background = 'rgba(0, 212, 255, 0.1)';
    setTimeout(() => {
        form.style.background = '';
    }, 1000);
    
    console.log('✅ Sample data loaded successfully');
}

// ============================================================
// FORM SUBMISSION HANDLER
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('predictionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const predictionStartTime = performance.now();
        
        const data = {
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            x_eci: parseFloat(document.getElementById('x_eci').value),
            y_eci: parseFloat(document.getElementById('y_eci').value),
            z_eci: parseFloat(document.getElementById('z_eci').value),
            vel_x: parseFloat(document.getElementById('vel_x').value),
            vel_y: parseFloat(document.getElementById('vel_y').value),
            vel_z: parseFloat(document.getElementById('vel_z').value)
        };

        console.log('Form submitted with data:', data);
        
        // Check HTML5 validation
        if (!e.target.checkValidity()) {
            console.error('❌ Form validation failed');
            alert('Please check your input values. Make sure all fields are within valid ranges.');
            return;
        }

        document.getElementById('loading').classList.add('show');
        document.getElementById('resultPanel').classList.remove('show');

        setTimeout(() => {
            try {
                const result = predictSatellite(data);
                const processingTime = performance.now() - predictionStartTime;
                
                displayResults(result);
                logPrediction(data, result, processingTime);
                
                document.getElementById('loading').classList.remove('show');
                document.getElementById('resultPanel').classList.add('show');
                
                console.log('✅ Prediction completed successfully');
                
            } catch (error) {
                console.error('❌ Prediction error:', error);
                document.getElementById('loading').classList.remove('show');
                alert('❌ Prediction Failed\n\n' + error.message + '\n\nPlease check your input values and try again.');
            }
        }, 1000);
    });
});

// ============================================================
// RESULTS DISPLAY
// ============================================================

function displayResults(result) {
    document.getElementById('satelliteName').textContent = result.prediction;
    
    const confidencePercent = (result.confidence * 100).toFixed(2);
    const confidenceBar = document.getElementById('confidenceBar');
    confidenceBar.style.width = confidencePercent + '%';
    confidenceBar.textContent = confidencePercent + '%';

    const featureHTML = `
        <div class="feature-item">
            <div class="feature-name">Latitude</div>
            <div class="feature-value">${result.features.latitude}°</div>
        </div>
        <div class="feature-item">
            <div class="feature-name">Longitude</div>
            <div class="feature-value">${result.features.longitude}°</div>
        </div>
        <div class="feature-item">
            <div class="feature-name">Altitude</div>
            <div class="feature-value">${result.features.altitude} km</div>
        </div>
        <div class="feature-item">
            <div class="feature-name">Total Velocity</div>
            <div class="feature-value">${result.features.totalVelocity} km/s</div>
        </div>
        <div class="feature-item">
            <div class="feature-name">Radial Distance</div>
            <div class="feature-value">${result.features.radialDistance} km</div>
        </div>
    `;
    
    document.getElementById('featureValues').innerHTML = featureHTML;
    document.getElementById('batchResults').innerHTML = '';

    // Display explainability
    const explanations = explainPrediction(result.rawFeatures, result.prediction);
    displayExplainability(explanations);
}

// ============================================================
// CSV BATCH PROCESSING
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        console.log('=== CSV UPLOAD STARTED ===');
        console.log('File selected:', file?.name);
        
        if (!file) {
            console.error('❌ No file selected!');
            alert('No file selected. Please try again.');
            return;
        }

        document.getElementById('loading')?.classList.add('show');
        document.getElementById('resultPanel')?.classList.remove('show');

        const reader = new FileReader();
        
        reader.onerror = function(error) {
            console.error('❌ FileReader error:', error);
            alert('Error reading file: ' + error);
            document.getElementById('loading')?.classList.remove('show');
        };
        
        reader.onload = function(event) {
            console.log('✅ File loaded successfully');
            
            try {
                const csv = event.target.result;
                const normalizedCSV = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                const lines = normalizedCSV
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                console.log('📊 Total lines found:', lines.length);
                
                if (lines.length === 0) {
                    throw new Error('CSV file is empty');
                }
                
                const firstLine = lines[0].toLowerCase();
                const hasHeader = firstLine.includes('lat') || firstLine.includes('lon');
                const startIdx = hasHeader ? 1 : 0;

                const results = [];
                const errors = [];
                const batchStartTime = performance.now();

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i];
                    const values = line.split(',').map(v => v.trim());
                    
                    if (values.length < 8) {
                        errors.push(`Line ${i + 1}: Not enough columns (found ${values.length}, need 8)`);
                        continue;
                    }
                    
                    const nums = values.slice(0, 8).map(v => parseFloat(v));
                    const invalidIndices = nums.map((n, idx) => isNaN(n) ? idx : -1).filter(idx => idx !== -1);
                    
                    if (invalidIndices.length > 0) {
                        errors.push(`Line ${i + 1}: Invalid numeric values at positions ${invalidIndices.join(', ')}`);
                        continue;
                    }
                    
                    const data = {
                        latitude: nums[0],
                        longitude: nums[1],
                        x_eci: nums[2],
                        y_eci: nums[3],
                        z_eci: nums[4],
                        vel_x: nums[5],
                        vel_y: nums[6],
                        vel_z: nums[7]
                    };
                    
                    try {
                        const predStart = performance.now();
                        const result = predictSatellite(data);
                        const predTime = performance.now() - predStart;
                        
                        results.push({ ...data, ...result, lineNumber: i + 1 });
                        logPrediction(data, result, predTime);
                        
                    } catch (predError) {
                        errors.push(`Line ${i + 1}: Prediction failed - ${predError.message}`);
                    }
                }
                
                const totalTime = performance.now() - batchStartTime;
                
                console.log('\n=== CSV PROCESSING COMPLETE ===');
                console.log('✅ Successful predictions:', results.length);
                console.log('❌ Failed rows:', errors.length);
                console.log('⏱️ Total processing time:', totalTime.toFixed(2), 'ms');
                
                if (errors.length > 0) {
                    const errorSummary = errors.slice(0, 5).join('\n');
                    const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : '';
                    alert(`⚠️ Processing completed with warnings:\n\n✅ ${results.length} rows successful\n❌ ${errors.length} rows failed\n\nFirst errors:\n${errorSummary}${moreErrors}\n\nCheck console (F12) for details.`);
                }
                
                if (results.length > 0) {
                    displayBatchResults(results);
                } else {
                    throw new Error('No valid data rows found in CSV file');
                }
                
            } catch (error) {
                console.error('❌ CRITICAL ERROR:', error);
                alert('Error processing CSV: ' + error.message + '\n\nCheck console (F12) for details.');
            } finally {
                document.getElementById('loading')?.classList.remove('show');
            }
        };
        
        reader.readAsText(file);
    });
});

function displayBatchResults(results) {
    console.log('📊 Displaying batch results:', results.length, 'predictions');
    
    document.getElementById('loading')?.classList.remove('show');
    document.getElementById('resultPanel')?.classList.add('show');
    
    document.getElementById('satelliteName').textContent = `${results.length} Predictions`;
    
    const confidenceBar = document.getElementById('confidenceBar');
    confidenceBar.style.width = '100%';
    confidenceBar.textContent = '✓ Batch Complete';
    
    document.getElementById('featureValues').innerHTML = '';
    const explainSection = document.getElementById('explainabilitySection');
    if (explainSection) {
        explainSection.style.display = 'none';
    }

    const issCount = results.filter(r => r.prediction === 'ISS').length;
    const sentinelCount = results.filter(r => r.prediction === 'Sentinel1A').length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgAltitude = results.reduce((sum, r) => sum + parseFloat(r.features.altitude), 0) / results.length;

    const tableHTML = `
        <h3 style="color: #00d4ff; margin: 20px 0;">
            📊 Batch Prediction Results (${results.length} rows processed)
        </h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(0, 255, 136, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00ff88;">
                <div style="color: #88ffaa; font-size: 0.9em;">ISS Classifications</div>
                <div style="color: #00ff88; font-size: 2em; font-weight: bold;">${issCount}</div>
            </div>
            <div style="background: rgba(0, 212, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d4ff;">
                <div style="color: #88ccff; font-size: 0.9em;">Sentinel1A Classifications</div>
                <div style="color: #00d4ff; font-size: 2em; font-weight: bold;">${sentinelCount}</div>
            </div>
            <div style="background: rgba(255, 165, 0, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #ffa500;">
                <div style="color: #ffcc88; font-size: 0.9em;">Avg Confidence</div>
                <div style="color: #ffa500; font-size: 2em; font-weight: bold;">${(avgConfidence * 100).toFixed(1)}%</div>
            </div>
            <div style="background: rgba(138, 43, 226, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #8a2be2;">
                <div style="color: #b88fff; font-size: 0.9em;">Avg Altitude</div>
                <div style="color: #8a2be2; font-size: 2em; font-weight: bold;">${avgAltitude.toFixed(0)} km</div>
            </div>
        </div>

        <div style="overflow-x: auto; background: rgba(0, 0, 0, 0.2); border-radius: 10px; padding: 10px;">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Line</th>
                        <th>Predicted Satellite</th>
                        <th>Confidence</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Altitude (km)</th>
                        <th>Velocity (km/s)</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r, idx) => `
                        <tr style="background: ${idx % 2 === 0 ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};">
                            <td>${idx + 1}</td>
                            <td style="color: #88ccff;">${r.lineNumber || idx + 1}</td>
                            <td>
                                <strong style="color: ${r.prediction === 'ISS' ? '#00ff88' : '#00d4ff'}; font-size: 1.1em;">
                                    ${r.prediction}
                                </strong>
                            </td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="flex: 1; height: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${r.confidence * 100}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88);"></div>
                                    </div>
                                    <span style="min-width: 45px;">${(r.confidence * 100).toFixed(1)}%</span>
                                </div>
                            </td>
                            <td>${r.latitude.toFixed(4)}°</td>
                            <td>${r.longitude.toFixed(4)}°</td>
                            <td>${r.features.altitude}</td>
                            <td>${r.features.totalVelocity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="downloadBatchResults()" 
                    style="background: linear-gradient(45deg, #00ff88, #00cc66); flex: 1; min-width: 200px;">
                💾 Download Results CSV
            </button>
            <button onclick="window.print()" 
                    style="background: linear-gradient(45deg, #ff8800, #cc6600); flex: 1; min-width: 200px;">
                🖨️ Print Report
            </button>
            <button onclick="copyResultsToClipboard()" 
                    style="background: linear-gradient(45deg, #8a2be2, #6a1bb2); flex: 1; min-width: 200px;">
                📋 Copy to Clipboard
            </button>
        </div>
    `;
    
    document.getElementById('batchResults').innerHTML = tableHTML;
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

function downloadBatchResults() {
    console.log('💾 Downloading batch results...');
    
    const headers = 'Timestamp,Prediction,Confidence,Latitude,Longitude,Altitude_km,Velocity_km_s,Processing_Time_ms';
    const rows = predictionLog.map(log => [
        log.timestamp,
        log.output?.prediction || 'N/A',
        log.output?.confidence ? log.output.confidence.toFixed(4) : 'N/A',
        log.input?.latitude || 'N/A',
        log.input?.longitude || 'N/A',
        log.output?.features?.altitude || 'N/A',
        log.output?.features?.totalVelocity || 'N/A',
        log.processingTime || 'N/A'
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `satellite_predictions_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Download initiated');
}

function copyResultsToClipboard() {
    console.log('📋 Copying results to clipboard...');
    
    const text = predictionLog.map((log, idx) => 
        `${idx + 1}. ${log.output?.prediction || 'N/A'} (${((log.output?.confidence || 0) * 100).toFixed(1)}%) - ` +
        `Lat: ${log.input?.latitude || 'N/A'}, Lon: ${log.input?.longitude || 'N/A'}, ` +
        `Alt: ${log.output?.features?.altitude || 'N/A'} km`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Results copied to clipboard!');
        console.log('✅ Copied to clipboard successfully');
    }).catch(err => {
        console.error('❌ Failed to copy:', err);
        alert('Could not copy to clipboard. Try the download option instead.');
    });
}

// ============================================================
// HISTORY MANAGEMENT
// ============================================================

function showHistory() {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    
    if (predictionLog.length === 0) {
        content.innerHTML = '<p style="color: #88ccff; text-align: center; padding: 40px;">No predictions yet. Make some predictions to see them here!</p>';
    } else {
        const historyHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Timestamp</th>
                        <th>Prediction</th>
                        <th>Confidence</th>
                        <th>Processing Time</th>
                        <th>Altitude</th>
                    </tr>
                </thead>
                <tbody>
                    ${predictionLog.map((log, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                            <td><strong style="color: #00d4ff;">${log.output.prediction}</strong></td>
                            <td>${(log.output.confidence * 100).toFixed(1)}%</td>
                            <td>${log.processingTime}ms</td>
                            <td>${log.output.features.altitude} km</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                <h3 style="color: #00d4ff; margin-bottom: 15px;">📊 Session Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <div style="color: #88ccff;">Total Predictions</div>
                        <div style="font-size: 1.8em; color: #00d4ff; font-weight: bold;">${predictionLog.length}</div>
                    </div>
                    <div>
                        <div style="color: #88ccff;">ISS Classifications</div>
                        <div style="font-size: 1.8em; color: #00d4ff; font-weight: bold;">
                            ${predictionLog.filter(p => p.output.prediction === 'ISS').length}
                        </div>
                    </div>
                    <div>
                        <div style="color: #88ccff;">Sentinel1A Classifications</div>
                        <div style="font-size: 1.8em; color: #00d4ff; font-weight: bold;">
                            ${predictionLog.filter(p => p.output.prediction === 'Sentinel1A').length}
                        </div>
                    </div>
                    <div>
                        <div style="color: #88ccff;">Avg Confidence</div>
                        <div style="font-size: 1.8em; color: #00d4ff; font-weight: bold;">
                            ${(predictionLog.reduce((sum, p) => sum + p.output.confidence, 0) / predictionLog.length * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        `;
        content.innerHTML = historyHTML;
    }
    
    modal.classList.add('show');
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('show');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all prediction history?')) {
        predictionLog = [];
        updatePerformanceStats();
        closeHistory();
        alert('Prediction history cleared!');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('historyModal');
    if (event.target === modal) {
        closeHistory();
    }
}

// Download history as CSV
function downloadHistory() {
    if (predictionLog.length === 0) {
        alert('No predictions to download!');
        return;
    }

    const csvContent = [
        ['Timestamp', 'Prediction', 'Confidence', 'Latitude', 'Longitude', 'Altitude', 'Velocity', 'Processing Time'],
        ...predictionLog.map(log => [
            log.timestamp,
            log.output.prediction,
            log.output.confidence.toFixed(4),
            log.input.latitude,
            log.input.longitude,
            log.output.features.altitude,
            log.output.features.totalVelocity,
            log.processingTime + 'ms'
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellite_predictions_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
