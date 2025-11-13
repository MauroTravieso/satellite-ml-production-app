// js/ui_controller.js
// ============================================================
// UI Controller - Manages all user interface interactions
// ============================================================

class UIController {
    constructor(classifier, explainer, monitor) {
        this.classifier = classifier;
        this.explainer = explainer;
        this.monitor = monitor;
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Single prediction form
        document.getElementById('predictionForm')?.addEventListener('submit', (e) => {
            this.handleSinglePrediction(e);
        });

        // CSV file upload
        document.getElementById('csvFile')?.addEventListener('change', (e) => {
            this.handleBatchPrediction(e);
        });

        // Update performance stats every second
        setInterval(() => this.updatePerformanceDisplay(), 1000);
    }

    /**
     * Handle single prediction submission
     * @param {Event} event - Form submit event
     */
    async handleSinglePrediction(event) {
        event.preventDefault();
        
        const startTime = performance.now();
        
        // Collect input data
        const data = {
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            x_eci: parseFloat(document.getElementById('x_eci').value),
            y_eci: parseFloat(document.getElementById('y_eci').value),
            z_eci: parseFloat(
