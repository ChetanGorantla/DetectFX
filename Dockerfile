# Use a stable Python version (e.g., 3.10)
FROM python:3.10-slim

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install system dependencies (needed for librosa, ffmpeg, etc.)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy your project files into the image
COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose the port your app runs on (important for Render)
EXPOSE 10000

# Run the server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "10000"]
