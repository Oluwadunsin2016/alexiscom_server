const express=require('express');
const app=express()
const mongoose=require('mongoose')
require('dotenv').config()

const requiredEnv = ["URI", "PORT", "JWT_SECRET", "EMAIL", "MAIL_PASSWORD"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`CRITICAL STARTUP ERROR: Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
const bodyParser=require('body-parser')
const cors=require('cors')
const customerRouter=require('./Routes/customerRoute')


const URI=process.env.URI
const PORT=process.env.PORT
mongoose.connect(URI,(err)=>{
if (err) {
    console.log('mongoose connection failed');
    console.error(err);
}else{
console.log('Mongoose connected successfully');
}
})


app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use('/customer',customerRouter)

app.listen(PORT,()=>{
console.log(`app is listening at port ${PORT}`);
})
