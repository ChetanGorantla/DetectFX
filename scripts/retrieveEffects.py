
def classify(ref_link):
    import joblib
    import json
    import pandas as pd
    import librosa
    import tempfile
    import numpy as np
    import requests
    import psutil
    import os

    def log_memory(tag=""):
        process = psutil.Process(os.getpid())
        mem = process.memory_info().rss / 1024 / 1024  # in MB
        print(f"[MEMORY] {tag}: {mem:.2f} MB")


    #ref_link is the link to file on supabase storage, need to add logic to retrieve from supabase here
    
    log_memory("starting out")
    def download_audio_from_supabase(url, save_path = "temp_audio.wav"):
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        response = requests.get(url)
        if response.status_code == 200:
            tmp_file.write(response.content)
            tmp_file.close()
            print("Saved to temp:", tmp_file.name)
            log_memory("Generated tmp file")
            return tmp_file.name
        else:
            print("Failed to download:", response.status_code)
            return None
        
    file_path = download_audio_from_supabase(ref_link)
    print("Downloaded file path")
    log_memory("Downloaded file path")
    
    # Load trained model
    clf = joblib.load('./data/EGF_trained_model.pkl')
    log_memory("Loaded model")

    # Define list of effect classes directly
    classes = [
        "Blues Driver",
        "Chorus",
        "Clean",
        "Digital Delay",
        "Flanger",
        "Hall Reverb",
        "Phaser",
        "Plate Reverb",
        "RAT",
        "Spring Reverb",
        "Sweep Echo",
        "Tape Echo",
        "Tube Screamer"
    ]



    print("loaded model")
    def extract_features(file_path):
        try:
            print("trying to load via librosa")
            y, sr = librosa.load(file_path, sr=None)
            print("Loaded audio:", file_path)
        except Exception as e:
            print("❌ Failed to load audio with librosa:", str(e))
            return None
        features = []
        features.append(np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).T, axis=0))
        features.append(np.mean(librosa.feature.zero_crossing_rate(y).T, axis=0))
        features.append(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr).T, axis=0))
        features.append(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr).T, axis=0))

        return np.concatenate(features).reshape(1,-1)


    #file_path = "Reference guitar path"

    features = extract_features(file_path)
    log_memory("Extracted features")
    probs = clf.predict_proba(features)[0]
    prediction_results = {}
    # Show top effects with confidence
    for effect, prob in sorted(zip(classes, probs), key=lambda x: x[1], reverse=True):
        prediction_results[effect] = float(prob)
        print(f"{effect:<15}: {prob*100:.2f}%")
    log_memory("Generated predictions")
    print(prediction_results)


    df = pd.read_csv("./public/egfxset_metadata_updated.csv")

    
    return prediction_results

# scripts/retrieveEffects.py
def testClassify(file_path: str):
    print(f"🔍 Classifying file at: {file_path}")
    return "DummyEffect"

#print(classify("./testing/reference_guitar_2.wav"))