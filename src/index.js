import express from 'express';
import cors from 'cors'
import insuranceRoutes from './insuranceApi/insuranceRoutes.js'
import { checkConnection } from './db/pgDb.js';



// http://localhost:3000/api/crudList

const app = express();
//const PORT = 10002;
checkConnection(); 

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }));


app.use("/api/insurance", insuranceRoutes);
// app.use('/api/payment', razorpayRoutes);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


