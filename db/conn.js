const mongoose = require("mongoose");

const DB = "mongodb+srv://aadity:aadi@cluster0.xpyyl.mongodb.net/StockData?retryWrites=true&w=majority";


mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
    console.log("conection succses");
}).catch((err)=>{
    console.log(err);
});