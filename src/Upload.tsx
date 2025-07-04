import { useState, useEffect } from 'react'
import {supabase} from './supabase-client';
import HueBar from './HueBar';

//create presence bars component separate file

function Upload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  interface EffectsJSON {
    effect:string,
    value:number
  }
  const [effects, setEffects] = useState<EffectsJSON | null>(null)

  


  async function uploadFile(file:File){

    const {
        data: { user },
    } = await supabase.auth.getUser();

    //generate a random uuid, append that to path instead of file.name
    //send the data to the supabase table in addition to the storage service
    const fileUUID: string = crypto.randomUUID();
    
    console.log("File UUID:", fileUUID);
    

    const path = `${user?.id}/${fileUUID}`;
    console.log(path);

    
    

    const {data, error} = await supabase
      .storage
      .from("detectfx-bucket")
      .upload(path, file, {
        cacheControl:"3600",
        upsert: true
      });

    if (error){
      console.log("Upload error: ", error);
      return null;
    }

    const publicFileUrl = await getPublicURL("detectfx-bucket", path);
    
    if (publicFileUrl) {
      console.log("File URL:", publicFileUrl);
      await sendData(publicFileUrl, fileUUID, user!.id, file.name);  // ✅ Will run after URL is ready
    } else {
      console.error("Public file URL could not be generated.");
    }
    

    

    


  }

  async function updateTable(fileUUID:string, userID:string, fileName:string, effects:JSON, fileURL:string){
    
    const {error} = await supabase.from("files").insert({file_id: fileUUID, uploader_id: userID, file_name: fileName, processed_result: effects, file_storage_link: fileURL});
    if (error){
      console.log("Error uploading file to table:", error.message);
      console.log("File ID:", fileUUID);
      console.log("User ID:", userID);
      return;
    } else {
      console.log("Successfully uploaded file to table");
    }
  }

  //READ:
  //error with RLS when uploading duplicate files; maybe instead of storing as user UUID/file name, do user UUID/file name + file UUID (custom ID, can just randomize, virtually impossible to duplicate UUID)
  //also for new files, get a connection refused error to localhost:8000 even tho the supabase stuff is working, maybe issue with fastapi backend

  async function getPublicURL(bucketName:string, filePath: string) {
    const {data:{publicUrl}} = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrl;
  }



  const sendData = async (inputtedUrl: string, fileUUID: string, userID: string, fileName: string) => {
      
      
      try {

        const res = await fetch(`http://localhost:8000/results`, {
          method:"POST",
          headers:{
            "Content-Type": "application/json",
          },
          body: JSON.stringify({supabase_file_link: inputtedUrl})
          
        });

        if (!res.ok){
          const text = await res.text();
          console.log("Error fetching result: ", res.status, text);
          return;

        }

        const data = await res.json();
        
        console.log(data)
        setEffects(data.result);
        

        await updateTable(fileUUID, userID, fileName, data.result, inputtedUrl);
      } catch (error) {
        console.log("Error:", error);
      }
    }

  
  
  
  

  return (
    

    
    <>
      <div>
        <input
          type = "file"
          accept=".wav"
          onChange = {(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setUploadedFile(file);
            }
          }}
        />
        {uploadedFile &&
          <button onClick = {() => uploadFile(uploadedFile)}>Send</button>
        }
        
        {effects && 
          <ul>
            {Object.entries(effects).filter(([_, value]) => value > 0).map(([name, value]) => (
              
              <li key ={name}>
                {name}:{value}
                <HueBar value={value*100} />
              </li>
            ))}
          </ul>
        }
      </div>
      
    </>
  )
}

export default Upload
