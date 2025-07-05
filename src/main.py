#fastapi server
from fastapi import FastAPI, HTTPException, APIRouter
import psutil
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import joblib
import requests

# Add the parent directory (main_dir) to the Python path

# Now you can import the function from scripts
from scripts.retrieveEffects import classify, testClassify
from scripts.audiotest import generate




router = APIRouter()
HEROKU_API_KEY = os.getenv("HEROKU_API_KEY")
HEROKU_APP_NAME = os.getenv("HEROKU_APP_NAME")
HEROKU_LINK = os.getenv("VITE_BACKEND_ENDPOINT")
RAM_LIMIT_MB = 800

@router.get("/watchdog")
def watchdog():
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024  # in MB

    print(f"[WATCHDOG] Memory usage: {mem:.2f} MB")

    if mem > RAM_LIMIT_MB:
        print("[WATCHDOG] Memory threshold exceeded. Restarting dyno...")

        if not HEROKU_API_KEY or not HEROKU_APP_NAME:
            raise HTTPException(status_code=500, detail="Heroku credentials not set")

        response = requests.delete(
            f"https://api.heroku.com/apps/{HEROKU_APP_NAME}/dynos",
            headers={
                "Accept": "application/vnd.heroku+json; version=3",
                "Authorization": f"Bearer {HEROKU_API_KEY}"
            }
        )

        if response.status_code == 202:
            return {"status": "Restart triggered", "memory": f"{mem:.2f} MB"}
        else:
            raise HTTPException(status_code=500, detail=f"Heroku restart failed: {response.text}")

    return {"status": "OK", "memory": f"{mem:.2f} MB"}



WATCHDOG_URL = f"{HEROKU_LINK}/watchdog"

def ping_watchdog():
    try:
        res = requests.get(WATCHDOG_URL)
        print("[WATCHDOG] Pinged:", res.status_code, res.json())
    except Exception as e:
        print("[WATCHDOG] Error:", e)


clf = joblib.load('./data/EGF_trained_model.pkl')

app = FastAPI()
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or use your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)






class InputData(BaseModel):
    supabase_file_link:str
class GenerationInputData(BaseModel):
    clean_file_link:str
    reference_file_link:str
    output_file_link:str

@app.get("/")
def homePage():
    return {"message": "hello world"}

#post results to frontend
#perform classifications, return result
@app.post("/results")
def returnResults(data:InputData):
    print("Recieved post request")
    print("Classifying: ", data.supabase_file_link)
    ping_watchdog()
    return {"result": classify(data.supabase_file_link, clf)}

@app.post("/generate")
def returnResults(data:GenerationInputData):
    print("Recieved post request")
    print("Classifying: ", data.clean_file_link, data.reference_file_link, ", outputting to:", data.output_file_link)
    ping_watchdog()
    return {"result": generate(data.clean_file_link, data.reference_file_link, data.output_file_link)}

@app.post("/testresults")
def returnResults(data:InputData):
    print("Classifying: ", data.supabase_file_link)
    return {"result": testClassify(data.supabase_file_link)}