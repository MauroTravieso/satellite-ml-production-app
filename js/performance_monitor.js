// js/performance_monitor.js
// ============================================================
// STEP 6 ENHANCEMENT: Performance Monitoring
// Tracks predictions, timing, and provides analytics
// ============================================================

class PerformanceMonitor {
    constructor() {
        this.predictionLog = [];
        this.sessionStartTime = Date.now();
        this.metrics = {
            totalPredictions: 0,
            successfulPredictions: 0,
            failedPredictions: 0,
            avgProcessingTime: 0,
            minProcessingTime: Infinity,
            maxProcessingTime: 0,
            predictionsByClass: {}
        };
    }

    /**
     * Log a prediction for analytics
     * @param {Object} input - Input data
     * @param {Object} output - Prediction result
     * @param {number} processingTime - Time taken in ms
     */
    logPrediction(input, output, processingTime) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            input,
            output,
            processingTime: processingTime.toFixed(2),
            success: true
        };
        
        this.predictionLog.push(logEntry);
        this.updateMetrics(logEntry);
        
        return logEntry;
    }

    /**
     * Log a failed prediction
     * @param {Object} input - Input data
     * @param {Error} error - Error that occurred
     */
    logError(input, error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            input,
            error: error.message,
            success: false
        };
        
        this.predictionLog.push(logEntry);
        this.metrics.failedPredictions++;
        this.metrics.totalPredictions++;
        
        return logEntry;
    }

    /**
     * Update performance metrics
     * @param {Object} logEntry - Log entry to process
     */
    updateMetrics(logEntry) {
        this.metrics.totalPredictions++;
        this.metrics.successfulPredictions++;
        
        const time = parseFloat(logEntry.processingTime);
        this.metrics.minProcessingTime = Math.min(this.metrics.minProcessingTime, time);
        this.metrics.maxProcessingTime = Math.max(this.metrics.maxProcessingTime, time);
        
        // Calculate running average
        const totalTime = this.predictionLog
            .filter(e => e.success)
            .reduce((sum, e) => sum + parseFloat(e.processingTime), 0);
        this.metrics.avgProcessingTime = totalTime / this.metrics.successfulPredictions;
        
        // Track predictions by class
        if (logEntry.output && logEntry.output.prediction) {
            const className = logEntry.output.prediction;
            this.metrics.predictionsByClass[className] = 
                (this.metrics.predictionsByClass[className] || 0) + 1;
        }
    }

    /**
     * Get current performance statistics
     * @returns {Object} Performance metrics
     */
    getStats() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        
        return {
            ...this.metrics,
            sessionDuration,
            sessionDurationFormatted: this.formatDuration(sessionDuration),
            predictionsPerMinute: sessionDuration > 0 
                ? ((this.metrics.totalPredictions / sessionDuration) * 60).toFixed(2)
                : 0,
            successRate: this.metrics.totalPredictions > 0
                ? ((this.metrics.successfulPredictions / this.metrics.totalPredictions) * 100).toFixed(1)
                : 100
        };
    }

    /**
     * Get prediction history
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} Recent prediction logs
     */
    getHistory(limit = 100) {
        return this.predictionLog.slice(-limit);
    }

    /**
     * Clear all logs and reset metrics
     */
    clearHistory() {
        this.predictionLog = [];
        this.sessionStartTime = Date.now();
        this.metrics = {
            totalPredictions: 0,
            successfulPredictions: 0,
            failedPredictions: 0,
            avgProcessingTime: 0,
            minProcessingTime: Infinity,
            maxProcessingTime: 0,
            predictionsByClass: {}
        };
    }

    /**
     * Export prediction history as CSV
     * @returns {string} CSV formatted data
     */
    exportToCSV() {
        const headers = [
            'Timestamp',
            'Prediction',
            'Confidence',
            'Latitude',
            'Longitude',
            'Altitude',
            'Velocity',
            'Processing Time (ms)',
            'Success'
        ];
        
        const rows = this.predictionLog.map(log => [
            log.timestamp,
            log.output?.prediction || 'N/A',
            log.output?.confidence?.toFixed(4) || 'N/A',
            log.input?.latitude || 'N/A',
            log.input?.longitude || 'N/A',
            log.output?.features?.altitude || 'N/A',
            log.output?.features?.totalVelocity || 'N/A',
            log.processingTime || 'N/A',
            log.success ? 'Yes' : 'No'
        ]);
        
        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }

    /**
     * Format duration in seconds to human-readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Get performance summary for display
     * @returns {Object} Summary object
     */
    getSummary() {
        const stats = this.getStats();
        
        return {
            total: stats.totalPredictions,
            successful: stats.successfulPredictions,
            failed: stats.failedPredictions,
            avgTime: `${stats.avgProcessingTime.toFixed(2)}ms`,
            minTime: `${stats.minProcessingTime === Infinity ? 0 : stats.minProcessingTime.toFixed(2)}ms`,
            maxTime: `${stats.maxProcessingTime.toFixed(2)}ms`,
            sessionTime: stats.sessionDurationFormatted,
            predictionsByClass: stats.predictionsByClass,
            successRate: `${stats.successRate}%`,
            predictionsPerMinute: stats.predictionsPerMinute
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
