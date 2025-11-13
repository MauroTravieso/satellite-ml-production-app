// js/prediction_engine.js
// ============================================================
// Satellite Classification Prediction Engine
// ============================================================

class SatelliteClassifier {
    constructor(modelConfig, scalerParams, constants) {
        this.config = modelConfig;
        this.scaler = scalerParams;
        this.constants = constants;
    }

    /**
     * Calculate derived features from raw input
     * @param {Object} data - Raw input features
     * @returns {Object} Derived features
     */
    calculateDerivedFeatures(data) {
        // Total velocity magnitude
        const totalVelocity = Math.sqrt(
            Math.pow(data.velocity_x, 2) + 
            Math.pow(data.velocity_y, 2) + 
            Math.pow(data.velocity_z, 2)
        );
        
        // Radial distance from Earth's center
        const radialDistance = Math.sqrt(
            Math.pow(data.x_eci_km, 2) + 
            Math.pow(data.y_eci_km, 2) + 
            Math.pow(data.z_eci_km, 2)
        );
        
        // Altitude above Earth's surface
        const altitude = radialDistance - this.constants.EARTH_RADIUS_KM;
        
        // Orbital velocity (theoretical for circular orbit)
        const orbitalVelocity = Math.sqrt(
            this.constants.GRAVITATIONAL_CONSTANT / radialDistance
        );
        
        return {
            totalVelocity,
            radialDistance,
            altitude,
            orbitalVelocity
        };
    }

    /**
     * Normalize features using StandardScaler parameters
     * @param {Array} features - Raw feature values
     * @returns {Array} Normalized features
     */
    normalizeFeatures(features) {
        return features.map((val, idx) => 
            (val - this.scaler.mean[idx]) / this.scaler.std[idx]
        );
    }

    /**
     * Check if data matches satellite classification rules
     * @param {Object} data - Input data
     * @param {Object} derived - Derived features
     * @param {string} satelliteName - Name of satellite to check
     * @returns {boolean} Whether data matches rules
     */
    matchesRules(data, derived, satelliteName) {
        const rules = this.config.classificationRules[satelliteName];
        
        // Check altitude range
        const altitudeMatch = (
            derived.altitude >= rules.altitude_range[0] &&
            derived.altitude <= rules.altitude_range[1]
        );
        
        // Check velocity range
        const velocityMatch = (
            derived.totalVelocity >= rules.velocity_range[0] &&
            derived.totalVelocity <= rules.velocity_range[1]
        );
        
        // Check radial distance range
        const radialMatch = (
            derived.radialDistance >= rules.radial_distance[0] &&
            derived.radialDistance <= rules.radial_distance[1]
        );
        
        return altitudeMatch && velocityMatch && radialMatch;
    }

    /**
     * Calculate prediction confidence based on feature matching
     * @param {Object} data - Input data
     * @param {Object} derived - Derived features
     * @param {string} prediction - Predicted class
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(data, derived, prediction) {
        const rules = this.config.classificationRules[prediction];
        
        // Calculate how well features match expected ranges
        const altitudeCenter = (rules.altitude_range[0] + rules.altitude_range[1]) / 2;
        const altitudeRange = rules.altitude_range[1] - rules.altitude_range[0];
        const altitudeScore = 1 - Math.min(
            Math.abs(derived.altitude - altitudeCenter) / altitudeRange,
            1
        );
        
        const velocityCenter = (rules.velocity_range[0] + rules.velocity_range[1]) / 2;
        const velocityRange = rules.velocity_range[1] - rules.velocity_range[0];
        const velocityScore = 1 - Math.min(
            Math.abs(derived.totalVelocity - velocityCenter) / velocityRange,
            1
        );
        
        // Weighted average (can be tuned)
        const confidence = (altitudeScore * 0.6 + velocityScore * 0.4);
        
        // Boost confidence if strongly matches
        if (this.matchesRules(data, derived, prediction)) {
            return Math.max(confidence, 0.90);
        }
        
        return Math.max(confidence, 0.50);
    }

    /**
     * Main prediction method
     * @param {Object} inputData - Raw input features
     * @returns {Object} Prediction results
     */
    predict(inputData) {
        // Validate input
        this.validateInput(inputData);
        
        // Calculate derived features
        const derived = this.calculateDerivedFeatures(inputData);
        
        // Build feature vector
        const features = [
            inputData.latitude,
            inputData.longitude,
            inputData.x_eci_km,
            inputData.y_eci_km,
            inputData.z_eci_km,
            inputData.velocity_x,
            inputData.velocity_y,
            inputData.velocity_z,
            derived.totalVelocity,
            derived.radialDistance
        ];

        // Normalize features
        const normalizedFeatures = this.normalizeFeatures(features);

        // Classification logic
        let prediction = null;
        let confidence = 0.0;

        // Check ISS rules
        if (this.matchesRules(inputData, derived, 'ISS')) {
            prediction = 'ISS';
            confidence = this.calculateConfidence(inputData, derived, 'ISS');
        }
        // Check Sentinel1A rules
        else if (this.matchesRules(inputData, derived, 'Sentinel1A')) {
            prediction = 'Sentinel1A';
            confidence = this.calculateConfidence(inputData, derived, 'Sentinel1A');
        }
        // Fallback classification based on altitude
        else {
            if (derived.altitude < 500) {
                prediction = 'ISS';
                confidence = 0.70;
            } else {
                prediction = 'Sentinel1A';
                confidence = 0.70;
            }
        }

        // Calculate class probabilities
        const probabilities = {
            'ISS': prediction === 'ISS' ? confidence : (1 - confidence),
            'Sentinel1A': prediction === 'Sentinel1A' ? confidence : (1 - confidence)
        };

        return {
            prediction,
            confidence,
            probabilities,
            features: {
                latitude: inputData.latitude.toFixed(4),
                longitude: inputData.longitude.toFixed(4),
                altitude: derived.altitude.toFixed(2),
                totalVelocity: derived.totalVelocity.toFixed(4),
                radialDistance: derived.radialDistance.toFixed(2),
                orbitalVelocity: derived.orbitalVelocity.toFixed(4)
            },
            rawFeatures: {
                ...inputData,
                ...derived
            }
        };
    }

    /**
     * Validate input data
     * @param {Object} data - Input data to validate
     * @throws {Error} If validation fails
     */
    validateInput(data) {
        const required = ['latitude', 'longitude', 'x_eci_km', 'y_eci_km', 
                         'z_eci_km', 'velocity_x', 'velocity_y', 'velocity_z'];
        
        for (const field of required) {
            if (data[field] === undefined || data[field] === null) {
                throw new Error(`Missing required field: ${field}`);
            }
            if (typeof data[field] !== 'number' || isNaN(data[field])) {
                throw new Error(`Invalid value for field: ${field}`);
            }
        }
        
        // Range validation
        if (data.latitude < -90 || data.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (data.longitude < -180 || data.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }
    }

    /**
     * Batch prediction for multiple data points
     * @param {Array} dataArray - Array of input data objects
     * @returns {Array} Array of prediction results
     */
    predictBatch(dataArray) {
        return dataArray.map((data, index) => {
            try {
                return {
                    index,
                    input: data,
                    result: this.predict(data),
                    success: true
                };
            } catch (error) {
                return {
                    index,
                    input: data,
                    error: error.message,
                    success: false
                };
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SatelliteClassifier;
}
