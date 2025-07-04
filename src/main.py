#fastapi server
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add the parent directory (main_dir) to the Python path

# Now you can import the function from scripts
from scripts.retrieveEffects import classify, testClassify
from scripts.audiotest import generate



app = FastAPI()

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
    return {"result": classify(data.supabase_file_link)}

@app.post("/generate")
def returnResults(data:GenerationInputData):
    print("Recieved post request")
    print("Classifying: ", data.clean_file_link, data.reference_file_link, ", outputting to:", data.output_file_link)
    return {"result": generate(data.clean_file_link, data.reference_file_link, data.output_file_link)}

@app.post("/testresults")
def returnResults(data:InputData):
    print("Classifying: ", data.supabase_file_link)
    return {"result": testClassify(data.supabase_file_link)}