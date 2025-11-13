// js/explainability.js
// ============================================================
// STEP 6 ENHANCEMENT: Model Explainability
// Provides feature contribution analysis and prediction explanations
// ============================================================

class ModelExplainer {
    constructor(modelConfig) {
        this.config = modelConfig;
    }

    /**
     * Explain a prediction by showing feature contributions
     * @param {Object} features - Input and derived features
     * @param {string} prediction - Predicted class
     * @param {number} confidence - Prediction confidence
     * @returns {Array} Top contributing features
     */
    explainPrediction(features, prediction, confidence) {
        const contributions = this.config.featureImportance;
        
        // Map features to their values
        const featureValues = {
            'latitude': features.latitude,
            'longitude': features.longitude,
            'x_eci_km': features.x_eci,
            'y_eci_km': features.y_eci,
            'z_eci_km': features.z_eci,
            'velocity_x': features.velocity_x || features.vel_x,
            'velocity_y': features.velocity_y || features.vel_y,
            'velocity_z': features.velocity_z || features.vel_z,
            'total_velocity': features.totalVelocity,
            'radial_distance': features.radialDistance
        };
        
        // Get top N contributing features
        const topFeatures = Object.entries(contributions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([feature, importance]) => ({
                feature: this.formatFeatureName(feature),
                featureKey: feature,
                importance: importance,
                importancePercent: (importance * 100).toFixed(1) + '%',
                value: this.formatFeatureValue(feature, featureValues[feature]),
                rawValue: featureValues[feature]
            }));
        
        return topFeatures;
    }

    /**
     * Format feature name for display
     * @param {string} featureName - Raw feature name
     * @returns {string} Formatted name
     */
    formatFeatureName(featureName) {
        const nameMap = {
            'latitude': 'Latitude',
            'longitude': 'Longitude',
            'x_eci_km': 'X Position (ECI)',
            'y_eci_km': 'Y Position (ECI)',
            'z_eci_km': 'Z Position (ECI)',
            'velocity_x': 'X Velocity',
            'velocity_y': 'Y Velocity',
            'velocity_z': 'Z Velocity',
            'total_velocity': 'Total Velocity',
            'radial_distance': 'Radial Distance'
        };
        
        return nameMap[featureName] || featureName.replace(/_/g, ' ').toUpperCase();
    }

    /**
     * Format feature value with appropriate units
     * @param {string} featureName - Feature name
     * @param {number} value - Raw value
     * @returns {string} Formatted value with units
     */
    formatFeatureValue(featureName, value) {
        if (value === undefined || value === null) return 'N/A';
        
        const unitMap = {
            'latitude': `${value.toFixed(4)}°`,
            'longitude': `${value.toFixed(4)}°`,
            'x_eci_km': `${value.toFixed(2)} km`,
            'y_eci_km': `${value.toFixed(2)} km`,
            'z_eci_km': `${value.toFixed(2)} km`,
            'velocity_x': `${value.toFixed(4)} km/s`,
            'velocity_y': `${value.toFixed(4)} km/s`,
            'velocity_z': `${value.toFixed(4)} km/s`,
            'total_velocity': `${value.toFixed(4)} km/s`,
            'radial_distance': `${value.toFixed(2)} km`
        };
        
        return unitMap[featureName] || value.toFixed(4);
    }

    /**
     * Generate textual explanation of prediction
     * @param {Object} predictionResult - Full prediction result
     * @returns {string} Human-readable explanation
     */
    generateTextExplanation(predictionResult) {
        const { prediction, confidence, features } = predictionResult;
        const confidencePercent = (confidence * 100).toFixed(1);
        
        let explanation = `The model predicts this is <strong>${prediction}</strong> `;
        explanation += `with <strong>${confidencePercent}%</strong> confidence.\n\n`;
        
        explanation += `Key orbital parameters:\n`;
        explanation += `• Altitude: ${features.altitude} km above Earth\n`;
        explanation += `• Velocity: ${features.totalVelocity} km/s\n`;
        explanation += `• Position: ${features.latitude}° lat, ${features.longitude}° lon\n\n`;
        
        // Add satellite-specific context
        if (prediction === 'ISS') {
            explanation += `The International Space Station operates in Low Earth Orbit (LEO) `;
            explanation += `at approximately 408 km altitude with an inclination of 51.6°.`;
        } else if (prediction === 'Sentinel1A') {
            explanation += `Sentinel-1A is a polar-orbiting satellite in a sun-synchronous orbit `;
            explanation += `at approximately 693 km altitude with an inclination near 98°.`;
        }
        
        return explanation;
    }

    /**
     * Compare feature values against typical satellite ranges
     * @param {Object} features - Input features
     * @returns {Object} Comparison analysis
     */
    compareToReferenceRanges(features) {
        const altitude = parseFloat(features.altitude);
        const velocity = parseFloat(features.totalVelocity);
        
        const analysis = {
            altitudeClassification: '',
            velocityClassification: '',
            orbitalType: ''
        };
        
        // Altitude classification
        if (altitude < 200) {
            analysis.altitudeClassification = 'Very Low Earth Orbit (VLEO)';
        } else if (altitude < 600) {
            analysis.altitudeClassification = 'Low Earth Orbit (LEO)';
        } else if (altitude < 2000) {
            analysis.altitudeClassification = 'Medium Earth Orbit (MEO)';
        } else {
            analysis.altitudeClassification = 'High Earth Orbit (HEO)';
        }
        
        // Velocity classification
        if (velocity > 7.7) {
            analysis.velocityClassification = 'High velocity (elliptical orbit likely)';
        } else if (velocity > 7.5) {
            analysis.velocityClassification = 'Typical LEO velocity';
        } else {
            analysis.velocityClassification = 'Lower velocity (higher altitude orbit)';
        }
        
        // Orbital type inference
        const lat = parseFloat(features.latitude);
        if (Math.abs(lat) > 80) {
            analysis.orbitalType = 'Polar orbit';
        } else if (Math.abs(lat) < 10) {
            analysis.orbitalType = 'Equatorial orbit';
        } else {
            analysis.orbitalType = 'Inclined orbit';
        }
        
        return analysis;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelExplainer;
}
