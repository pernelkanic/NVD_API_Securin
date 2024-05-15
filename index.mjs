
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import cveRouter from './Routes/cveRoutes.js';
const app = express();
dotenv.config();


app.set('view engine', 'ejs');


app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));


app.use('/', cveRouter);


app.listen(5003, () => {
    console.log(`Server started on port 5003`);
});

