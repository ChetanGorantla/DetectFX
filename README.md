
# DetectFX 🎸

DetectFX is an **AI-powered guitar tone transformation platform** designed to analyze a clean DI guitar signal and transform it to match a reference tone. It leverages cutting-edge **DSP (Digital Signal Processing)**, **Machine Learning**, and **audio fingerprinting** to replicate iconic guitar tones and effects with precision.

---

## 🚀 Features

- **Tone Matching Engine**: Matches a clean DI guitar input to a reference tone using spectral analysis and EQ mapping.
- **Effect Detection & Application**: Automatically detects required effects (distortion, fuzz, overdrive, chorus, reverb, etc.) and applies them dynamically.
- **Custom DSP Pipeline**: Python-based audio effects engine with spectral feature extraction and real-time processing.
- **Web Interface**: Built with React + TypeScript + Vite for a seamless and modern user experience.
- **Backend API**: Powered by Python FastAPI for training, inference, and tone transformation services.
- **Cloud-Ready Deployment**: Dockerized environment running on **GCP Compute Engine** with GPU acceleration for fast processing.
- **Data Management**: Integrated **Supabase** for authentication, file storage, and user data tracking.
- **Scalable Design**: Modular microservice architecture designed for future integration with mobile or desktop apps.

---

## 🛠️ Tech Stack

| Component             | Technology                                |
|-----------------------|-------------------------------------------|
| **Frontend**          | React, TypeScript, Vite                   |
| **Backend API**       | FastAPI, Python                           |
| **DSP & ML**          | PyTorch, TensorFlow, NumPy, librosa       |
| **Storage**           | Supabase (PostgreSQL + Buckets)           |
| **Deployment**        | Docker, GCP Compute Engine, Heroku        |
| **Authentication**    | Supabase Auth                             |
| **Audio Processing**  | Custom DSP algorithms, Demucs, DDSP       |

---


## 🔬 Core Workflow

1. **Upload Audio Files**  
   Users upload a clean DI track and a reference tone file.

2. **Feature Extraction**  
   Spectral and harmonic analysis performed on both files.

3. **Effect Detection**  
   Model predicts required effects chain (distortion, fuzz, reverb, etc.).

4. **Tone Matching**  
   Custom DSP algorithms + ML models apply transformations.

5. **Playback & Download**  
   Transformed audio is rendered in-browser or downloadable.

---

## 🎯 Future Plans

- Expand supported effects (flanger, phaser, compression, etc.).
- Real-time guitar tone transformation with low-latency processing in C/C++/Rust.
- Cloud-based presets and tone-sharing platform.
- AI-assisted tone suggestions and historical tone analysis.

---

## 🤝 Contributing

Contributions are welcome! Open an issue or submit a pull request to help improve DetectFX.

---

## 📜 License

This project is licensed under the MIT License.
