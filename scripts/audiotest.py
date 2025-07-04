def generate(clean_link, reference_link, output_link):
    
    from pydub import AudioSegment
    import os
    import librosa
    import numpy as np
    import subprocess
    import tempfile
    from scipy.signal import fftconvolve
    import soundfile as sf
    from scipy.signal import butter, lfilter, sawtooth
    import pyloudnorm as pyln
    from scipy.io.wavfile import write
    import tempfile

    def test(input_path, output_path):
        audio = AudioSegment.from_file(input_path)
        #low pass for underwater feel
        audio = audio.low_pass_filter(500)

        #gain boost to simulate distortion
        audio = audio+10

        audio.export(output_path, format = "wav")
        print(f"Finished processing, saved to: {output_path}")

    def apply_delay(input_audio: AudioSegment, delay_ms=300, feedback_db=-5, mix_db=0, wet_out_db=-6, dry_out_db=0):
        # Calculate delay amount
        delay_segment = AudioSegment.silent(duration=delay_ms)
        delayed = input_audio + feedback_db  # Feedback simulated as quieter repeat
        wet = delay_segment + delayed

        # Mix wet and dry
        dry = input_audio + dry_out_db
        wet = wet + wet_out_db

        # Combine signals
        mix = dry.overlay(wet, gain_during_overlay=mix_db)
        return mix

    def extract_audio_features(audio_path):
        y, sr = librosa.load(audio_path)
        
        # Frequency-based
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr).mean()
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr).mean()
        flatness = librosa.feature.spectral_flatness(y=y).mean()
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1)

        # Temporal/Harmonic
        rms = librosa.feature.rms(y=y).mean()
        zcr = librosa.feature.zero_crossing_rate(y=y).mean()

        # Combine into a vector
        features = np.array([centroid, rolloff, flatness, rms, zcr] + list(mfcc))
        return features

    def map_delta_to_dsp(delta, feature_names, thresholds):
        effect_chain = []
        

        #applying reverb, chorus
        clean_mfcc = extract_mfcc(input_file)
        ref_mfcc = extract_mfcc(ref_file)
        for i, feature in enumerate(feature_names):
            direction = "increase" if delta[i] > 0 else "decrease"
            magnitude = abs(delta[i])
            threshold = thresholds.get(feature, 0.1)

            #if magnitude < threshold:
            #    continue #skip small changes

            if feature == "spectral_centroid":
                if direction == "increase":
                    effect_chain.append({"effect": "lowpass", "cutoff": 3000})
                else:
                    effect_chain.append({"effect": "highpass", "cutoff": 3000})

            elif feature == "flatness":
                if direction == "increase":
                    effect_chain.append({"effect": "compressor", "intensity": "medium"})
                else:
                    effect_chain.append({"effect": "distortion", "intensity": "light"})

            elif feature == "rms":
                if direction == "decrease":
                    effect_chain.append({"effect": "gain", "amount_db": 6})
                else:
                    effect_chain.append({"effect": "compressor", "intensity": "light"})

            elif feature == "zcr":
                if direction == "increase":
                    effect_chain.append({"effect": "smoothen", "method": "low_pass_fade"})

            elif feature.startswith("mfcc"):
                effect_chain.append({"effect": "eq", "target": feature, "adjustment": direction})

        if should_apply_chorus(clean_mfcc, ref_mfcc):
            effect_chain.append({"effect": "chorus"})

        if should_apply_reverb(current_features, ref_features, delta):
            effect_chain.append({"effect": "reverb"})

        return effect_chain

    def apply_effect_chain(audio: AudioSegment, effect_chain: list) -> AudioSegment:
        audio = apply_distortion(audio, intensity="high")
        for effect in effect_chain:
            if effect["effect"] == "gain":
                audio = audio + effect["amount_db"]

            elif effect["effect"] == "lowpass":
                audio = audio.low_pass_filter(effect["cutoff"])

            elif effect["effect"] == "highpass":
                audio = audio.high_pass_filter(effect["cutoff"])

            elif effect["effect"] == "compressor":
                # Use SoX for real compression
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_input:
                    audio.export(temp_input.name, format="wav")
                    output_path = temp_input.name.replace(".wav", "_comp.wav")
                    subprocess.call([
                        "sox", temp_input.name, output_path,
                        "compand", "0.3,1", "6:-70,-60,-20", "-5", "-90", "0.2"
                    ])
                    audio = AudioSegment.from_file(output_path)
                    os.remove(output_path)

            elif effect["effect"] == "distortion":
                # Approximate light distortion with gain + compression
                audio = audio + 10
                audio = audio.compress_dynamic_range()

            elif effect["effect"] == "eq":
                # Future: match specific MFCC bands using sox equalizer
                pass
        
        return audio

    def apply_reverb_chorus(signal, sr, delta_vector, clean_mfcc, ref_mfcc):
        if should_apply_chorus(clean_mfcc, ref_mfcc):
            print("🎵 Applying chorus...")
            signal = apply_chorus(signal, sr)

        if should_apply_reverb(None, None, delta_vector):
            print("🌫️ Applying reverb...")
            signal = apply_reverb(signal, sr)

        return signal

    def soft_clip(signal, drive=5):
        return np.tanh(drive * signal)

    def hard_clip(signal, threshold=0.26):
        print("HARD CLIPPED")
        return np.clip(signal, -threshold, threshold)

    def apply_distortion(audio: AudioSegment, intensity="medium"):
        samples = np.array(audio.get_array_of_samples()).astype(np.float32)

        # Normalize
        samples /= np.max(np.abs(samples))

        # Choose distortion type
        if intensity == "light":
            processed = soft_clip(samples, drive=3)
        elif intensity == "high":
            processed = hard_clip(samples)
        else:  # medium
            processed = soft_clip(samples, drive=6)

        # Scale back and convert to int16
        processed *= 32767  # convert back to audio range
        processed = processed.astype(np.int16)

        # Reconstruct AudioSegment
        return AudioSegment(
            processed.tobytes(),
            frame_rate=audio.frame_rate,
            sample_width=2,  # 2 bytes for int16
            channels=audio.channels
        )
    #running script

    def s_clip(x, drive):
        # Apply gain
        x *= drive
        # Soft clipping using tanh for smooth distortion
        return np.tanh(x)

    def apply_chorus(signal, sr, depth_ms=30, rate_hz=0.5):
        from scipy.signal import sawtooth
        depth_samples = int((depth_ms / 1000) * sr)
        mod = (sawtooth(2 * np.pi * rate_hz * np.arange(len(signal)) / sr) + 1) / 2
        mod *= depth_samples

        chorus_signal = np.zeros_like(signal)
        for i in range(len(signal)):
            delay = int(mod[i])
            if i - delay >= 0:
                chorus_signal[i] = signal[i - delay]
        return (signal + chorus_signal) / 2


    def apply_reverb(signal, sr, decay=0.7, wet_level=0.3):
        """
        Approximates a plate reverb using multiple parallel feedback delays.
        """
        import numpy as np

        delay_times_ms = [12, 17, 23, 31]  # short, dense reflections
        gains = [decay ** (i + 1) for i in range(len(delay_times_ms))]
        reverb = np.zeros_like(signal)

        for delay_ms, g in zip(delay_times_ms, gains):
            delay_samples = int((delay_ms / 1000.0) * sr)
            echo = np.zeros_like(signal)
            for i in range(delay_samples, len(signal)):
                echo[i] = signal[i - delay_samples] + g * echo[i - delay_samples]
            reverb += echo

        # Normalize reverb and mix with dry
        reverb = reverb / (np.max(np.abs(reverb)) + 1e-9)
        output = (1 - wet_level) * signal + wet_level * reverb
        output = output / (np.max(np.abs(output)) + 1e-9)

        return output


    """
    #def apply_reverb(signal, sr, delays_ms=[20, 40, 60, 80, 100, 120], decay=0.25, mic_ratio=0.3, normalize=True):
    def apply_reverb(signal, sr, delays_ms=[20, 40, 60], decay=0.6, mic_ratio=0.6, wet_gain=0.3, normalize=True):
        
        Reverb with a mix knob (mic_ratio) and wet gain (to boost wet reverb signal).
        
        Parameters:
            signal (np.ndarray): Input mono audio
            sr (int): Sample rate
            delays_ms (list): List of delay times in ms
            decay (float): Echo decay strength
            mic_ratio (float): Dry/wet mix (0 = all reverb, 1 = all dry)
            wet_gain (float): Multiplier to boost reverb strength before mix
            normalize (bool): Normalize final output
            
        Returns:
            np.ndarray: Reverb-blended signal
        
        reverb = np.zeros_like(signal)

        for i, delay in enumerate(delays_ms):
            delay_samples = int((delay / 1000.0) * sr)
            if delay_samples >= len(signal):
                continue
            echo = np.zeros_like(signal)
            echo[delay_samples:] = signal[:-delay_samples] * (decay ** (i + 1))
            reverb += echo

        # Boost reverb before mixing
        reverb *= wet_gain

        # Blend dry and wet
        output = mic_ratio * signal + (1 - mic_ratio) * reverb

        if normalize:
            output = output / (np.max(np.abs(output)) + 1e-9)

        return output

    """

    def apply_slapback(signal, sr, delay_ms=90, wet_level=0.2):
        delay_samples = int((delay_ms / 1000.0) * sr)
        echo = np.zeros_like(signal)
        echo[delay_samples:] = signal[:-delay_samples]
        return (1 - wet_level) * signal + wet_level * echo


    def should_apply_chorus(clean_mfcc, ref_mfcc, threshold=5.0):
        # Measure spectral modulation increase
        var_clean = np.var(clean_mfcc, axis=1).mean()
        var_ref = np.var(ref_mfcc, axis=1).mean()
        return (var_ref - var_clean) > threshold

    def should_apply_reverb(clean_features, ref_features, delta_vector, threshold_flatness=0.05, threshold_energy=0.02):
        flatness_idx = 3  # assuming index 3 = flatness
        rms_idx = 1       # assuming index 1 = rms

        flatness_delta = delta_vector[flatness_idx]
        rms_delta = delta_vector[rms_idx]

        return (flatness_delta > threshold_flatness and rms_delta < threshold_energy)

    def extract_mfcc(audio_path, sr=22050, n_mfcc=13):
        y, sr = librosa.load(audio_path, sr=sr)
        if y.ndim > 1:
            y = librosa.to_mono(y)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        return mfcc  # shape: (n_mfcc, time)



    from scipy.signal import resample
    def pitch_down(signal, sr, semitones=-1):
        """
        Pitch-shifts the signal down by a given number of semitones.
        Negative values lower the pitch.
        """
        factor = 2 ** (semitones / 12)  # semitone ratio
        new_length = int(len(signal) / factor)

        # Step 1: Resample to pitch-shifted version
        pitched = resample(signal, new_length)

        # Step 2: Time-stretch back to original length
        stretched = resample(pitched, len(signal))

        return stretched

    def fuzz_distortion(signal, shape=40, hard_limit_db=-25, wet_db=0, dry_db=-60):
        print("Applying fuzz")
        """
        Apply JSFX-style fuzz distortion to a mono audio signal.
        Parameters:
            signal: np.ndarray of float32 audio samples (normalized -1 to 1)
            shape: controls the curvature of the waveshaper
            hard_limit_db: output clip threshold in dB
            wet_db: output level of distorted signal (in dB)
            dry_db: output level of original signal (in dB)
        Returns:
            np.ndarray of distorted audio samples
        """
        maxv = 2 ** (hard_limit_db / 6)
        s11 = shape - 1
        wet = 2 ** (wet_db / 6)
        dry = 2 ** (dry_db / 6)

        output = []
        for s in signal:
            a = abs(s)
            s0 = s * (a + shape) / (a * (a + s11) + 1)
            clipped = np.clip(s0, -maxv, maxv)
            output.append(clipped * wet + s * dry)

        return np.array(output)

    def apply_fuzz_to_file(input_path, output_path,
                        shape=20, hard_limit_db=-25, wet_db=0, dry_db=-60):
        """
        Load a mono audio file, apply fuzz distortion, and write output.
        input_path: path to input audio file (.wav or .mp3)
        output_path: path to save the processed file (.wav)
        """
        # Convert MP3 to WAV if needed
        if input_path.endswith(".mp3"):
            audio = AudioSegment.from_file(input_path, format="mp3").set_channels(1)
            wav_path = input_path.replace(".mp3", "_temp.wav")
            audio.export(wav_path, format="wav")
            input_path = wav_path

        # Read the WAV audio file
        signal, sr = sf.read(input_path)
        if signal.ndim > 1:
            signal = signal.mean(axis=1)  # Convert stereo to mono
        signal = signal.astype(np.float32)

        # Normalize to -1 to 1
        signal /= np.max(np.abs(signal))

        # Apply fuzz distortion
        processed = fuzz_distortion(signal, shape, hard_limit_db, wet_db, dry_db)

        # Normalize output to avoid clipping
        processed /= np.max(np.abs(processed))

        # Save output
        sf.write(output_path, processed, sr)
        print(f"✅ Distorted file saved to: {output_path}")

    def high_pass(signal, sr, cutoff=720):
        b, a = butter(1, cutoff / (sr / 2), btype='high')
        return lfilter(b, a, signal)

    def low_pass(signal, sr, cutoff=4000):
        b, a = butter(1, cutoff / (sr / 2), btype='low')
        return lfilter(b, a, signal)

    def soft_clip(signal, drive=5):
        return np.tanh(drive * signal)

    def apply_tube_screamer(signal, sr, drive=5, output_gain=1.0):
        # Step 1: High-pass filter to tighten low end
        filtered = high_pass(signal, sr, cutoff=720)

        # Step 2: Apply soft clipping distortion
        clipped = soft_clip(filtered, drive=drive)

        # Step 3: Low-pass filter to tame highs
        filtered2 = low_pass(clipped, sr, cutoff=4000)

        # Step 4: Output gain
        output = filtered2 * output_gain

        # Normalize to avoid clipping
        return output / np.max(np.abs(output))

    def apply_tube_screamer_to_file(input_path, output_path, drive=5, output_gain=1.0):
        signal, sr = sf.read(input_path)
        if signal.ndim > 1:
            signal = signal.mean(axis=1)
        signal = signal.astype(np.float32)
        signal /= np.max(np.abs(signal))  # Normalize input

        processed = apply_tube_screamer(signal, sr, drive, output_gain)
        sf.write(output_path, processed, sr)
        print(f"✅ Tube Screamer overdrive applied and saved to: {output_path}")


    def process_full_chain(input_path, output_path, effect_chain, clean_mfcc=None, ref_mfcc=None):
        audio = AudioSegment.from_file(input_path).set_channels(1)
        sr = audio.frame_rate
        samples = np.array(audio.get_array_of_samples()).astype(np.float32)
        samples /= np.max(np.abs(samples))

        # Step 1: Core saturation effects
        samples = apply_tube_screamer(samples, sr, drive=6, output_gain=1.2)
        samples = fuzz_distortion(samples, shape=10, hard_limit_db=-10, wet_db=0, dry_db=-20)

        for effect in effect_chain:
            if effect["effect"] == "chorus":
                print("🎵 Adding chorus...")
                samples = apply_chorus(samples, sr)
            elif effect["effect"] == "reverb":
                print("🌫️ Adding reverb...")
                samples = apply_reverb(samples, sr)
        samples /= np.max(np.abs(samples))

        # Step 2: Apply chorus/reverb before converting to AudioSegment
        

        samples = (samples * 32767).astype(np.int16)
        audio = AudioSegment(samples.tobytes(), frame_rate=sr, sample_width=2, channels=1)

        # Step 3: Apply remaining AudioSegment effects (gain, compressor)
        audio = apply_effect_chain(audio, effect_chain)
        audio.export(output_path, format="wav")
        print(f"✅ Full processed tone saved to: {output_path}")


    def match_volume_to_reference(processed_path, reference_path, output_path):
        """
        Adjust the volume of the processed audio to match the reference audio.
        
        Parameters:
            processed_path (str): Path to your processed audio file
            reference_path (str): Path to your reference tone file
            output_path (str): Path to save the volume-matched output
        """
        # Load both files
        processed, sr_proc = sf.read(processed_path)
        reference, sr_ref = sf.read(reference_path)

        # Convert to mono if stereo
        if processed.ndim > 1:
            processed = processed.mean(axis=1)
        if reference.ndim > 1:
            reference = reference.mean(axis=1)

        # Normalize both signals
        processed /= np.max(np.abs(processed))
        reference /= np.max(np.abs(reference))

        # Compute RMS (root mean square) loudness
        def rms(signal):
            return np.sqrt(np.mean(signal**2))

        rms_proc = rms(processed)
        rms_ref = rms(reference)

        # Scale processed signal to match reference RMS
        gain = rms_ref / (rms_proc + 1e-9)  # avoid division by zero
        processed_adjusted = processed * gain

        # Normalize final output to prevent clipping
        processed_adjusted /= np.max(np.abs(processed_adjusted))

        lufs_matched = match_loudness_lufs(processed_adjusted, sr_proc, reference)
        lufs_matched /= np.max(np.abs(lufs_matched)) * 1.2  # avoid clipping

        
        sf.write(output_path, lufs_matched, sr_proc)

        print(f"✅ Output volume matched to reference and saved to: {output_path}")

    def final_processing_touchups(processed_path, reference_path, output_path):
        

        processed_audio, sr_proc = sf.read(processed_path)
        reference_audio, sr_ref = sf.read(reference_path)

        # Ensure mono and normalize
        if processed_audio.ndim > 1:
            processed_audio = processed_audio.mean(axis=1)
        if reference_audio.ndim > 1:
            reference_audio = reference_audio.mean(axis=1)

        # Normalize both signals
        processed_audio /= np.max(np.abs(processed_audio))
        reference_audio /= np.max(np.abs(reference_audio))

        # Compute RMS energy to determine loudness
        def rms(signal):
            return np.sqrt(np.mean(signal**2))

        rms_proc = rms(processed_audio)
        rms_ref = rms(reference_audio)

        # Compute gain factor to match loudness
        gain_factor = rms_ref / rms_proc
        processed_scaled = processed_audio * gain_factor

        # Apply high-frequency compression (low-pass filtering to reduce harsh attack)
        

        def low_pass(signal, sr, cutoff=4000):
            b, a = butter(2, cutoff / (sr / 2), btype='low')
            return lfilter(b, a, signal)

        # Step 1: Filtering
        processed_smoothed = low_pass(processed_scaled, sr_proc, cutoff=4500)

        processed_smoothed = compress_highs(processed_smoothed, sr_proc)

        # Step 4: Pitch modification (optional but keep late)
        backgrounded_audio = pitch_down(processed_smoothed, sr_proc, semitones=-0.5)

        # Step 2: Dynamic compression before adding background/reverb
        compressed_audio = match_dynamics(backgrounded_audio, reference_audio, sr_proc)

        # Step 3: Background effects (post compression)
        backgrounded_audio = undertone_matching(compressed_audio, sr_proc)

        
        # Step 5: Final normalization to prevent clipping after all processing
        backgrounded_audio /= np.max(np.abs(backgrounded_audio))


        
        
        sf.write(output_path, backgrounded_audio, sr_proc)
        

    def match_loudness_lufs(signal, sr, reference_signal):
        import pyloudnorm as pyln

        meter = pyln.Meter(sr, block_size=0.1)  # use smaller block size
        if len(signal) < int(sr * 0.1):
            print("⚠️ Signal too short for LUFS matching. Skipping.")
            return signal

        current_loudness = meter.integrated_loudness(signal)
        target_loudness = meter.integrated_loudness(reference_signal)

        gain_db = target_loudness - current_loudness
        gain_linear = 10 ** (gain_db / 20)
        
        return signal * gain_linear


    def bandpass_filter(signal, sr, lowcut, highcut):
        b, a = butter(2, [lowcut / (sr/2), highcut / (sr/2)], btype='band')
        return lfilter(b, a, signal)

    def compress_highs(signal, sr, threshold=0.2, ratio=4.0, highcut=6000):
        highs = bandpass_filter(signal, sr, highcut, 0.99 * sr//2)

        # Compress only high band
        compressed = np.where(np.abs(highs) > threshold,
                            threshold + (np.abs(highs) - threshold) / ratio,
                            highs)
        compressed *= np.sign(highs)

        # Subtract original highs and add compressed highs
        return signal - highs + compressed

    def get_envelope(audio, sr, hop_size=512):
        # 1. Create coarse envelope (based on window max amplitude)
        raw_env = np.array([
            np.max(np.abs(audio[i:i + hop_size])) for i in range(0, len(audio), hop_size)
        ])

        # 2. Generate original time points for envelope and full audio
        env_x = np.linspace(0, len(audio), num=len(raw_env))
        audio_x = np.arange(len(audio))

        # 3. Interpolate coarse envelope back to full audio resolution
        full_env = np.interp(audio_x, env_x, raw_env)
        return full_env

        
    def detect_onset(env, threshold=0.1):
        """
        Detects the first index where the envelope rises sharply.
        """
        diff = np.diff(env)
        onset_candidates = np.where(diff > threshold)[0]
        return onset_candidates[0] if len(onset_candidates) > 0 else 0


    def extract_best_matching_segment(input_db, ref_db):
        len_input = len(input_db)
        len_ref = len(ref_db)

        # If input is longer, just truncate input
        if len_input > len_ref:
            return input_db[:len_ref], ref_db

        step = max(1, len_input // 20)  # Search resolution
        max_energy = -np.inf
        best_start = 0

        for i in range(0, len_ref - len_input, step):
            window = ref_db[i:i + len_input]
            energy = np.sum(window)
            if energy > max_energy:
                max_energy = energy
                best_start = i

        ref_db_segment = ref_db[best_start:best_start + len_input]
        return input_db, ref_db_segment

    def trim_leading_silence(signal, threshold=0.01, sr=44100, chunk_size=1024):
        for i in range(0, len(signal), chunk_size):
            chunk = signal[i:i+chunk_size]
            if np.sqrt(np.mean(chunk**2)) > threshold:
                return signal[i:]  # return trimmed
        return signal  # all silent? return as-is


    def match_dynamics(input_signal, ref_signal, sr, threshold_db=-20, ratio=4, attack=0.01, release=0.01):
        """
        Matches the dynamics of input_signal to that of ref_signal.
        Applies compression-style gain shaping to reduce dynamic delta.
        """
        # If reference is longer, extract best matching segment before envelope extraction

        ref_signal = trim_leading_silence(ref_signal)
        trimmed_ref_pcm = np.int16(ref_signal * 32767)  # assuming ref_signal is float32 in [-1, 1]
        input_signal = input_signal / np.max(np.abs(input_signal))

        # Save it
        write("trimmed_reference.wav", sr, trimmed_ref_pcm)

        if len(ref_signal) > len(input_signal):
            from scipy.signal import correlate

            # Find best match using cross-correlation
            corr = correlate(ref_signal, input_signal, mode='valid')
            best_start = np.argmax(corr)
            ref_signal = ref_signal[best_start:best_start + len(input_signal)]

        # Ensure both are same length
        min_len = min(len(input_signal), len(ref_signal))
        input_signal = input_signal[:min_len]
        ref_signal = ref_signal[:min_len]
        
        # --- ALIGN ONSETS BEFORE ENVELOPE EXTRACTION ---
        def compute_rms_envelope(signal, frame_size=1024, hop_size=512):
            rms = []
            for i in range(0, len(signal) - frame_size, hop_size):
                frame = signal[i:i + frame_size]
                rms.append(np.sqrt(np.mean(frame ** 2)))
            return np.array(rms)

        def detect_onset(env, threshold=0.1):
            diff = np.diff(env)
            onset_candidates = np.where(diff > threshold)[0]
            return onset_candidates[0] if len(onset_candidates) > 0 else 0

        # Compute RMS envelopes
        input_env_for_onset = compute_rms_envelope(input_signal)
        ref_env_for_onset = compute_rms_envelope(ref_signal)

        # Normalize
        input_env_for_onset /= np.max(input_env_for_onset)
        ref_env_for_onset /= np.max(ref_env_for_onset)

        # Detect onsets
        input_onset = detect_onset(input_env_for_onset)
        ref_onset = detect_onset(ref_env_for_onset)

        # Compute offset in samples
        frame_offset = ref_onset - input_onset
        samples_per_frame = 512
        sample_offset = frame_offset * samples_per_frame

        # Shift reference to align onset
        if sample_offset > 0:
            ref_signal = ref_signal[sample_offset:]
        elif sample_offset < 0:
            ref_signal = np.pad(ref_signal, (abs(sample_offset), 0), mode='constant')

        # Ensure both are same length again after onset shift
        min_len = min(len(input_signal), len(ref_signal))
        input_signal = input_signal[:min_len]
        ref_signal = ref_signal[:min_len]

        # --- END ONSET ALIGNMENT ---


        # Step: Match average RMS loudness
        def rms(signal):
            return np.sqrt(np.mean(signal**2))

        ref_rms = rms(ref_signal)
        input_rms = rms(input_signal)

        if input_rms > 0:
            gain = ref_rms / input_rms
        else:
            gain = 1.0  # fallback to no change

        # Apply constant gain to entire signal
        output = input_signal * gain

        # Optional: Normalize to prevent clipping
        output /= np.max(np.abs(output))

        print("Applied average volume matching:")
        print("Ref RMS:", ref_rms, " | Input RMS:", input_rms, " | Gain:", gain)
        print("Output shape:", output.shape)

        return output


    """
        # Now extract envelopes
        input_env = get_envelope(input_signal, sr)
        ref_env = get_envelope(ref_signal, sr)

        

            # Step 1: Extract RMS Envelopes
        def compute_rms_envelope(signal, frame_size=1024, hop_size=512):
            rms = []
            for i in range(0, len(signal) - frame_size, hop_size):
                frame = signal[i:i + frame_size]
                rms.append(np.sqrt(np.mean(frame ** 2)))
            return np.array(rms)

        input_env = compute_rms_envelope(input_signal)
        ref_env = compute_rms_envelope(ref_signal)

        # Step 2: Normalize & Compress reference envelope (stylized dynamics)
        ref_env = np.maximum(ref_env, 1e-5)
        ref_env = ref_env / np.max(ref_env)            # normalize to [0, 1]
        ref_env = np.power(ref_env, 0.6)               # soft compression shape

        # Step 3: Normalize input env to same scale
        input_env = np.maximum(input_env, 1e-5)
        input_env = input_env / np.max(input_env)

        # Step 4: Compute delta
        delta_db = 20 * np.log10(input_env) - 20 * np.log10(ref_env)

        

        # Step 5: Clip and smooth delta
        delta_db = np.clip(delta_db, -4, 4)
        delta_db = np.convolve(delta_db, np.ones(10)/10, mode='same')  # very light smoothing
        
        


        # Step 6: Compute gain reduction (compressor logic)
        gain_reduction_db = np.zeros_like(delta_db)
        over_threshold = delta_db > threshold_db
        gain_reduction_db[over_threshold] = (1 - 1 / ratio) * (delta_db[over_threshold] - threshold_db)

        # Step 7: Smooth gain using attack/release filter
        def smooth_gain(gain_db, sr, attack=0.005, release=0.015):
            alpha_a = np.exp(-1.0 / (sr * attack))
            alpha_r = np.exp(-1.0 / (sr * release))
            smoothed = np.zeros_like(gain_db)
            prev = 0
            for i in range(len(gain_db)):
                alpha = alpha_a if gain_db[i] > prev else alpha_r
                smoothed[i] = alpha * prev + (1 - alpha) * gain_db[i]
                prev = smoothed[i]
            return smoothed

        smoothed_gain_db = smooth_gain(gain_reduction_db, sr)

        # Step 8: Interpolate gain back to sample level
        from scipy.interpolate import interp1d

        frame_hop = 512  # used in RMS envelope
        x_env = np.arange(len(smoothed_gain_db)) * frame_hop
        x_full = np.arange(len(input_signal))

        gain_interp = interp1d(x_env, 10 ** (-smoothed_gain_db / 20), kind='linear', fill_value='extrapolate')
        gain = gain_interp(x_full)  # now gain matches full sample length
        gain = np.maximum(gain, 0.3)  # don't attenuate below -10.5 dB


        

        # Truncate gain if longer than input
        gain = gain[:len(input_signal)]

        # Apply gain to input
        output = input_signal[:len(gain)] * gain
        print("output shape:", output.shape)
        print("input_signal:", len(input_signal))
        print("ref_signal:", len(ref_signal))
        print("gain:", len(gain))
        print("output:", len(output))


        return output
    """

    import scipy.signal as sps

    def undertone_matching(signal, sr):
        """
        Enhances a mono guitar signal to match the tone of a reference by:
        - Slight low-shelf boost for warmth
        - Gentle high-shelf boost for brightness
        - Light transient enhancement
        - Subtle compression to bring forward
        Returns:
            Processed signal (normalized)
        """

        def apply_low_shelf(signal, sr, freq=200, gain_db=1.5):
            sos = sps.iirfilter(2, freq, rs=gain_db, btype='low', analog=False,
                                ftype='butter', fs=sr, output='sos')
            return sps.sosfilt(sos, signal)

        def apply_high_shelf(signal, sr, freq=5000, gain_db=1.0):
            sos = sps.iirfilter(2, freq, rs=gain_db, btype='high', analog=False,
                                ftype='butter', fs=sr, output='sos')
            return sps.sosfilt(sos, signal)

        def enhance_transients(signal, sr, boost_db=1.5):
            sos = sps.butter(2, 2000, 'hp', fs=sr, output='sos')
            transients = sps.sosfilt(sos, signal)
            gain = 10 ** (boost_db / 20)
            return signal + transients * gain

        def simple_compressor(signal, threshold=0.25, ratio=2.5):
            compressed = np.copy(signal)
            over_threshold = np.abs(signal) > threshold
            compressed[over_threshold] = np.sign(signal[over_threshold]) * (
                threshold + (np.abs(signal[over_threshold]) - threshold) / ratio
            )
            return compressed

        # Processing chain
        processed = apply_low_shelf(signal, sr, freq=200, gain_db=1.5)
        processed = apply_high_shelf(processed, sr, freq=5000, gain_db=1.0)
        processed = enhance_transients(processed, sr, boost_db=1.5)
        processed = simple_compressor(processed, threshold=0.25, ratio=2.5)

        # Normalize
        return processed / np.max(np.abs(processed))

    def prepare_audio_for_effects(input_audio: AudioSegment, ref_audio: AudioSegment) -> AudioSegment:
        # Convert both to mono
        input_audio = input_audio.set_channels(1)
        ref_audio = ref_audio.set_channels(1)

        # Convert to NumPy arrays
        input_samples = np.array(input_audio.get_array_of_samples()).astype(np.float32)
        ref_samples = np.array(ref_audio.get_array_of_samples()).astype(np.float32)

        # Normalize both
        input_samples /= np.max(np.abs(input_samples))
        ref_samples /= np.max(np.abs(ref_samples))

        # ✅ Only trim reference to match input length
        ref_samples = ref_samples[:len(input_samples)]

        # Match loudness (RMS)
        def rms(x): return np.sqrt(np.mean(x**2))
        input_samples *= rms(ref_samples) / (rms(input_samples) + 1e-9)

        # Convert back to AudioSegment
        processed_audio = AudioSegment(
            (input_samples * 32767).astype(np.int16).tobytes(),
            frame_rate=input_audio.frame_rate,
            sample_width=2,
            channels=1
        )

        return processed_audio

    def extract_guitar_demucs(ref_file_path):
        """
        Extracts the 'other' stem (likely guitar) using Demucs (htdemucs model by default).
        Returns the path to 'other.wav' or None if extraction fails.
        """
        if not os.path.exists(ref_file_path):
            raise FileNotFoundError(f"Reference file does not exist: {ref_file_path}")

        ref_basename = os.path.splitext(os.path.basename(ref_file_path))[0]

        # Change working directory to the directory containing the reference file
        working_dir = os.path.dirname(ref_file_path)
        os.chdir(working_dir)

        print(f"Running Demucs on: {ref_file_path}")
        try:
            subprocess.run(["demucs", ref_file_path], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error running Demucs: {e}")
            return None

        # Check for htdemucs output
        for model_name in ["htdemucs", "demucs"]:
            output_path = os.path.join("separated", model_name, ref_basename, "other.wav")
            if os.path.exists(output_path):
                return output_path

        print("Demucs finished, but 'other.wav' was not found.")
        return None
    

    from dotenv import load_dotenv
    import os
    load_dotenv()
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")  # MUST use service key here
    SUPABASE_BUCKET = "detectfx-bucket"

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    

    
    
    from urllib.parse import urlparse

    def extract_path_from_url(url):
        parsed = urlparse(url)
        # Remove `/storage/v1/object/public/<bucket-name>/` part
        prefix = f"/storage/v1/object/public/{SUPABASE_BUCKET}/"
        if prefix in parsed.path:
            return parsed.path.split(prefix)[-1]
        raise ValueError("Invalid Supabase public URL")
    
    input_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
    ref_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name

    relative_clean_link = extract_path_from_url(clean_link)
    print("RELATIVE CLEAN LINK:", relative_clean_link)
    # Download the file
    input_response = supabase.storage.from_(SUPABASE_BUCKET).download(relative_clean_link)

    # Save to disk
    with open(input_file, "wb") as f:
        f.write(input_response)
    print(f"✅ File downloaded and saved to: {input_file}")

    relative_reference_link = extract_path_from_url(reference_link)
    print("RELATIVE REFERENCE LINK:", relative_reference_link)
    # Download the file
    ref_response = supabase.storage.from_(SUPABASE_BUCKET).download(relative_reference_link)

    # Save to disk
    with open(ref_file, "wb") as f:
        f.write(ref_response)
    print(f"✅ File downloaded and saved to: {ref_file}")

    if (input_file != ""):
        input_audio = AudioSegment.from_file(input_file)

        # ✅ Save preprocessed clean audio temporarily for feature extraction
        temp_input_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        input_audio.export(temp_input_path, format="wav")

        guitar_path = ref_file

        ref_audio = AudioSegment.from_file(ref_file)

        # Convert to mono NumPy array
        samples = np.array(ref_audio.get_array_of_samples()).astype(np.float32)
        if ref_audio.channels == 2:
            samples = samples.reshape((-1, 2)).mean(axis=1)
        samples = samples / (2 ** (8 * ref_audio.sample_width - 1))

        # Trim silence
        trimmed_samples = trim_leading_silence(samples)

        # Convert back to AudioSegment
        trimmed_pcm = np.int16(trimmed_samples * 32767).tobytes()
        ref_trimmed_audio = AudioSegment(
            data=trimmed_pcm,
            sample_width=2,
            frame_rate=ref_audio.frame_rate,
            channels=1
        )

        # Export trimmed reference
        trimmed_ref_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        ref_trimmed_audio.export(trimmed_ref_path, format="wav")

        # ✅ Use trimmed reference from here on
        guitar_path = trimmed_ref_path

        

        
        # ⬇️ Use preprocessed file in downstream steps
        current_features = extract_audio_features(temp_input_path)
        ref_features = extract_audio_features(guitar_path)
        delta = ref_features - current_features
        norm_delta = np.abs(delta)

        feature_names = ["spectral_centroid", "rms", "zcr", "flatness", "mfcc_1"]
        thresholds = {
            "spectral_centroid": 500,
            "rms": 0.02,
            "zcr": 0.05,
            "flatness": 0.1,
            "mfcc_1": 10
        }

        print("Current guitar vector", current_features)
        print("Reference guitar vector", ref_features)
        print("Delta", delta)

        effect_chain = map_delta_to_dsp(delta, feature_names, thresholds)

        clean_mfcc = extract_mfcc(temp_input_path)
        ref_mfcc = extract_mfcc(guitar_path)

        if should_apply_chorus(clean_mfcc, ref_mfcc):
            effect_chain.append({"effect": "chorus"})

        if should_apply_reverb(current_features, ref_features, delta):
            effect_chain.append({"effect": "reverb"})

        effect_chain.append({"effect": "reverb"})

        print(effect_chain)

        first_output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name

        process_full_chain(
            input_path=temp_input_path,
            output_path=first_output_path,
            effect_chain=effect_chain,
            clean_mfcc=clean_mfcc,
            ref_mfcc=ref_mfcc
        )

        second_output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name

        final_processing_touchups(
            processed_path=first_output_path,
            reference_path=guitar_path,
            output_path=second_output_path
        )
        

        third_output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name

        match_volume_to_reference(
            processed_path=second_output_path,
            reference_path=guitar_path,
            output_path=third_output_path
        )

        print("Uploading to:", output_link)
        print("Using bucket:", SUPABASE_BUCKET)

        with open(third_output_path, "rb") as f:
            response = supabase.storage.from_(SUPABASE_BUCKET).upload(
                output_link,
                f,
                {"cacheControl": "3600", "x-upsert": "true", "content-type": "audio/wav"}
            )

        print(f"✅ Uploaded to Supabase: {response}")
        
        

        print("Final process complete")