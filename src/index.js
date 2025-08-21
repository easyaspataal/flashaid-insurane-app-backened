import express from 'express';
import cors from 'cors'
import insuranceRoutes from './insuranceApi/routes/insuranceRoutes.js'


// http://localhost:3000/api/crudList

const app = express();
const port = 3000;

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }));


app.use("/api/insurance", insuranceRoutes);
// app.use('/api/payment', razorpayRoutes);

app.listen(port, () => {
    console.log("listening on to the port 3000")
});

