import dotenv from 'dotenv';
import express from 'express';
import { MongoClient } from "mongodb";
const app = express();
dotenv.config();

export const getListCve = async (req,res)=>{
     const client = new MongoClient(process.env.MONGO_URL)
     await client.connect();
     const database = client.db('Securin');
     const collection = database.collection('Cve_Securin');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    //search box queries
    const year = req.query.year || "";
    const lastModified = parseInt(req.query.lastmodified) || -1;
    const lt = parseFloat(req.query.lt) || 10.0;
    const gt = parseFloat(req.query.gt) || 0.0;
    const id = req.query.id || "";

    try {
        let query = {};
        if (year !== "" || lastModified !== -1 || lt < 10.0 || gt > 0.0 || id !== "") {
            query = {
                "published": { "$regex": year },
                "$or": [
                    { "metrics.cvssMetricV2.cvssData.baseScore": { "$gte": gt, "$lte": lt } },
                    { "metrics.cvssMetricV31.cvssData.baseScore": { "$gte": gt, "$lte": lt } }
                ],
                "id": { "$regex": id }
            };
        }

        let count = await collection.countDocuments(query);
        let countofpages = Math.ceil(count / limit);

        let Cve;
        if (lastModified !== -1) {
            Cve = await collection.find(query).limit(lastModified).sort({ lastModified: -1 }).toArray();
            
            count = Cve.length;
           
        } else {
            Cve = await collection.find(query).sort({published : 1 }).limit(limit).skip((page - 1) * limit).toArray();
            
        }
        
       
        res.render('index', { count,year,id, page,lastModified,lt,gt,limit, countofpages, Cve, message: "success" });
    } catch (err) {
        res.render('index' , "error occured")
}
 };

export const getcveById =async (req,res)=>{
    const client = new MongoClient(process.env.MONGO_URL)
     await client.connect();
     const database = client.db('Securin');
     const collection = database.collection('Cve_Securin');
    let id = req.params.id;
    
    try{
        const cveById  = await collection.findOne({id : id});
        console.log(cveById)
        res.render('cve' , { cveById: cveById });
    
 }
 catch(err){
     res.render('cve' , "Error while getting from id ")
 
 }
 }
