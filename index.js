const express=require('express');
const app=express()
const mongoose=require('mongoose')
require('dotenv').config()
const bodyParser=require('body-parser')
const cors=require('cors')
const customerRouter=require('./Routes/customerRoute')


const URI=process.env.URI
const PORT=process.env.PORT
mongoose.connect(URI,(err)=>{
if (err) {
    console.log('mongoose connection failed');
}else{
console.log('Mongoose connected successfully');
}
})

app.get("/", (req,res)=>{
res.json({name:'Oluwagbemiga', age:22,gender:"Male"})
})

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use('/customer',customerRouter)

app.listen(PORT,()=>{
console.log(`app is listening at port ${PORT}`);
})
