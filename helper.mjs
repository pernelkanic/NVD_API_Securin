
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import historydata from './Models/cveMeta.mjs';
const app = express();
dotenv.config();
app.use(express.json())
app.use(cors())

app.use(express.urlencoded({extended: true}))
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log('listening on port ' , process.env.PORT);
    })
})
.catch((err)=>{
    console.log(err);
})


async function indexFunction() {
    try {
       let startinx = 104000;
        let pagePerSize=  2000;

        while(true){
            console.log(startinx);
            await new Promise(resolve => setTimeout(resolve, 20000));
            let data = await getData(startinx , pagePerSize);

            if(data.resultsPerPage == 0){
                break;
            }
          
            await writeInDb(data.vulnerabilities);
            startinx += pagePerSize;

        }
        await fetch(`https://services.nvd.nist.gov/rest/json/cvehistory/2.0?resultsPerPage=1&startIndex=0`).then( res => res.json()).then(async(data)=>{
            let res = {
                status :"info",
                cvehistory: {
                  total: data.totalResults,
                  lastUpdated: new Date()
                }
              }
              await historydata.create(res);
              console.log("the new history is created ");

        });
           
        
    } catch (error) {
        console.error("Error:", error);
    } 
}

async function writeInDb(datas){
    const client = new MongoClient(process.env.MONGO_URL)
await client.connect();
const database = client.db('Securin');
const collection = database.collection('Cve_Securin');
    for(const data of datas){
        const item = data.cve;
        item._id = data.id;
        try{
            await collection.insertOne(item);

        }catch(e){
            if(e.code === 11000){
                continue;
            }
            else{
                throw new Error(e);
            }
        }
    }
}




function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  } 


export default async function cleanDb(){
    const client = new MongoClient(process.env.MONGO_URL)
await client.connect();
const database = client.db('Securin');
const collection = database.collection('Cve_Securin');
    const query = {
        "vulnStatus": "Rejected"
    }
    const res = await collection.deleteMany(query)
    console.log("documents deleted:", res.deletedCount)  
}


async function getData(startinx , pagePerSize){

    const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?startIndex=${startinx}&resultsPerPage=${pagePerSize}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const cveData = await response.json();
    return cveData;
   
}

   
async function setUpdate(){
    const client = new MongoClient(process.env.MONGO_URL)
    await client.connect();
    const database = client.db('Securin');
    const collection = database.collection('Cve_Securin');

        
    try {
       
      
        const metadata = await historydata.findOne({ status: "info" });
    
        const historyresponse = await fetch(`https://services.nvd.nist.gov/rest/json/cvehistory/2.0?resultsPerPage=1&startIndex=0`);
        const historyresult = await historyresponse.json();
        console.log("fetched the count of receent history" + historyresult.totalResults);
        if (historyresult.totalResults !== metadata.cvehistory.total) {
           
            const newcount = historyresult.totalResults - metadata.cvehistory.total;
            console.log("the diff is " + newcount);
            console.log("last metadata end is " + metadata.cvehistory.total);
            console.log("going to start the history to get the diff");
            const newentriesResponse = await fetch(`https://services.nvd.nist.gov/rest/json/cvehistory/2.0?resultsPerPage=${newcount}&startIndex=${metadata.cvehistory.total}`);
            const newhistoryres = await newentriesResponse.json();
            
            for (let j = 0; j < newcount; j++) {
                const change = newhistoryres.cveChanges[j].change;
                if (newhistoryres.cveChanges[j].eventName !== "CVE Received") {
                    await collection.findOneAndDelete({ id: change.cveId });
                }
                const cveDetailsResponse = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${change.cveId}`);
                const cveDetailsResult = await cveDetailsResponse.json();
                console.log(cveDetailsResult.vulnerabilities[0]);
                const item = cveDetailsResult.vulnerabilities[0].cve;
                item._id = cveDetailsResult.vulnerabilities[0].id;
                try{
                    await collection.insertOne(item);
        
                }catch(e){
                    if(e.code === 11000){
                        continue;
                    }
                    else{
                        throw new Error(e);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
    
            console.log(`Updated DB with ${newcount} records`);
    
            let res = {
                cvehistory: {
                  total: 0,
                  lastUpdated: null
                }
              }
              res.cvehistory.total = historyresult.totalResults;
              res.cvehistory.lastUpdated = new Date();
              await historydata.deleteMany({ status : "info"})
              .then(
                async() => {
                await historydata.create(res);
              });
              console.log("created a new entry");

            //   cleanDb(); // clean the Database by removing all the rejected status data 
        }
        else{
            console.log("the database and API are in sync");
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// async function deleteDuplicates() {
    
//         const client = new MongoClient(process.env.MONGO_URL);
//         await client.connect();
//         const database = client.db('Securin');
//         const collection = database.collection('Cve_Securin');
//         try {
//             console.log("Connecting to MongoDB...");
          
//             console.log("Identifying duplicate documents...");
    
//             const pipeline = [
//                 {
//                     $group: {
//                         _id: { cveId: "$cve.id" },
//                         count: { $sum: 1 },
//                         duplicates: { $addToSet: "$_id" }
//                     }
//                 },
//                 {
//                     $match: {
//                         count: { $gt: 1 }
//                     }
//                 }
//             ];
    
//             const duplicateGroups = await collection.aggregate(pipeline).toArray();
    
//             console.log(`Found ${duplicateGroups.length} groups of duplicate documents.`);
    
//             if (duplicateGroups.length === 0) {
//                 console.log("No duplicates found. Exiting...");
//                 return;
//             }
    
//             console.log("Removing duplicate documents...");
    
//             const duplicateIds = duplicateGroups.flatMap(group => group.duplicates.slice(1)); // Extract duplicate IDs
    
//             if (duplicateIds.length > 0) {
//                 await collection.deleteMany({ _id: { $in: duplicateIds } });
//                 console.log("Duplicate removal complete.");
//             }
//         } catch (error) {
//             console.error("Error removing duplicates:", error);
//         }
// }

// // Call the function
// deleteDuplicates();


await indexFunction();

while(true){
await setUpdate();
await sleep(30 * 60 * 1000);

}

