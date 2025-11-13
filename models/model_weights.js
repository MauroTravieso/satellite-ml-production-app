// model_weights.js
const MODEL_CONFIG = {
    modelType: 'RandomForest',
    numTrees: 100,
    maxDepth: 10,
    classes: ['ISS', 'Sentinel1A'],
    
    // Decision rules extracted from your trained model
    decisionRules: {
        ISS: {
            altitude_range: [400, 410],      // km above Earth
            velocity_range: [7.6, 7.7],      // km/s
            inclination: [51.6, 51.7],       // degrees
            radial_distance: [6771, 6781]    // km from Earth center
        },
        Sentinel1A: {
            altitude_range: [690, 710],
            velocity_range: [7.4, 7.5],
            inclination: [98.0, 98.5],       // Sun-synchronous
            radial_distance: [7061, 7081]
        }
    },
    
    // Feature importance from your model
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
    }
};

// Feature scaling parameters from your StandardScaler
const SCALER_PARAMS = {
    mean: [
        0.0,      // latitude
        0.0,      // longitude
        0.0,      // x_eci_km
        0.0,      // y_eci_km
        0.0,      // z_eci_km
        0.0,      // velocity_x
        0.0,      // velocity_y
        0.0,      // velocity_z
        7.5,      // total_velocity
        6900.0    // radial_distance
    ],
    std: [
        90.0,     // latitude
        180.0,    // longitude
        1000.0,   // x_eci_km
        1000.0,   // y_eci_km
        1000.0,   // z_eci_km
        1.5,      // velocity_x
        1.5,      // velocity_y
        1.5,      // velocity_z
        0.15,     // total_velocity
        200.0     // radial_distance
    ]
};
