# 🛰️ Satellite Trajectory Classification System

[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-success)](https://MauroTravieso.github.io/satellite-ml-production/)
[![PySpark](https://img.shields.io/badge/Framework-PySpark%20MLlib-orange)](https://spark.apache.org/mllib/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

#### *Production ML system for real-time satellite identification based on orbital parameters.*

---

## 👥 Author

### - **Mauro Travieso** - *Real-Time Big Data Processing & Management* - [GitHub](https://github.com/MauroTravieso)

---

- Satellites' LEO
![Satellite3D System](/assets/images/output.gif)

- Equirectangular trajectories
![Satellite System](/assets/images/satellites.gif)

---

## 🎯 Features
- Real-time single prediction
- Batch CSV processing
- 100% accuracy on test set
- No backend required
- Fully client-side processing

### Why Client-Side?
- ✅ **Zero hosting costs** (GitHub Pages is free)
- ✅ **Instant predictions** (no network latency)
- ✅ **Privacy-first** (data never leaves browser)
- ✅ **Scalable** (CDN-backed, handles millions of users)
- ✅ **Simple deployment** (just HTML/CSS/JS)

---

### 🔐 Security & Privacy

- ✅ **No data collection**: Predictions run locally in browser
- ✅ **No cookies**: No tracking or analytics
- ✅ **No backend**: No server to compromise
- ✅ **HTTPS**: Served over secure connection
- ✅ **Open source**: Code is fully auditable

---

## 🚀 Live Demo

![Satellite APP System](/assets/images/app_2_.gif)

Visit the deployed application:
```
https://MauroTravieso.github.io/satellite-ml-production-app/
```

## 📊 Model Performance
- **Algorithm**: Random Forest (100 trees, depth 10)
- **Accuracy**: 100%
- **F1 Score**: 1.0000
- **Classes**: ISS, Sentinel1A
- **Features**: 10 (8 input + 2 derived)

## 📖 Usage

### Single Prediction
1. Enter orbital parameters
2. Click "Classify Satellite"
3. View prediction and confidence

### Batch Prediction
1. Prepare CSV with columns: `lat,lon,x_eci,y_eci,z_eci,vel_x,vel_y,vel_z`
2. Upload file
3. Download results

## 📄 License
MIT License

## 🧪 Comprehensive Testing Protocol

- Test Case 1: ISS Prediction

Input Data:

```sh
Latitude: 51.6
Longitude: -122.0
X ECI: 6771.5 km
Y ECI: 100.0 km
Z ECI: 200.0 km
Velocity X: 7.66 km/s
Velocity Y: 0.5 km/s
Velocity Z: 0.3 km/s
```

- Test Case 2: Sentinel1A Prediction

Input Data:

```sh
Latitude: 98.2
Longitude: 45.0
X ECI: 7065.0 km
Y ECI: 500.0 km
Z ECI: 1000.0 km
Velocity X: 7.45 km/s
Velocity Y: -0.5 km/s
Velocity Z: -0.3 km/s
```

## Edge Cases

- Test invalid inputs:
```sh
Empty fields:

Leave latitude blank → Should show validation error
```

- Out of range values:
```sh
Latitude: 100 → Should show error (valid: -90 to 90)
Longitude: 200 → Should show error (valid: -180 to 180)
```

- Non-numeric values:
```sh
Latitude: "abc" → Should prevent submission
```

- Extreme values:
```sh
Very high altitude (20000 km) → Should still classify
Very low velocity (1 km/s) → Should still classify
```

---

**⭐ Star this repo if you find it useful!**

---

## 🎯 Production Deployment Checklist & Status

### Pre-Deployment
- [✅] Train models with PySpark
- [✅] Export model metadata
- [✅] Create predictions
- [✅] Test all 5 models
- [✅] Create web interface
- [✅] Write documentation

### Deployment
- [✅] Real-time data integration
- [✅] Create GitHub repository
- [✅] Push code to main branch
- [✅] Enable GitHub Pages
- [✅] Test live deployment
- [✅] Verify all predictions work

### Post-Deployment
- [ ] Monitor prediction accuracy
- [ ] Collect user feedback
- [ ] Track performance metrics
- [ ] Plan model updates
- [ ] A/B test improvements

---

## 🛠️ Development

### Adding New Models
1. Train model in PySpark
2. Export models
3. Add prediction function
4. Update UI in `index.html`
5. Test and deploy

### Code Style
- JavaScript: ES6+ syntax
- HTML: Semantic, accessible markup
- CSS: BEM naming convention
- Comments: JSDoc format

---

## 📚 Documentation

- **[API Documentation](docs/API.md)**: Complete API reference
- **[Model Details](docs/MODEL_DETAILS.md)**: Training specifications

---

## 📊 Performance Benchmarks

| Metric | Value | Status |
|--------|-------|--------|
| **Prediction Latency** | <100ms | ✅ Excellent |
| **Page Load Time** | 1.2s | ✅ Fast |
| **Model Accuracy** | 85.3% avg | ✅ Production Ready |
| **Uptime (GitHub Pages)** | 99.9% | ✅ Reliable |
| **Cost** | $0/month | ✅ Free |

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- PySpark MLlib team for the ML framework
- GitHub Pages for free hosting
- SF transportation data sources
- Open source community

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/mauroTravieso/vehicle-tracking-ml/issues)
- **Email**: mauro_travieso@hotmail.com
- **Documentation**: See `/docs` folder
- **Live Demo**: https://MauroTravieso.github.io/vehicle-tracking-ml/

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Contribution Ideas
- [ ] Add more satellite types
- [ ] Improve prediction accuracy
- [ ] Add visualization charts
- [ ] Create mobile app

---

