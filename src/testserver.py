import requests

# Correct URL and POST method with query param
params = {
    "supabase_file_link": "./testing/reference_guitar_2.wav"
}

response = requests.get("http://127.0.0.1:8000/results", params=params)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())
