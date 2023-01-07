const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();
const check = require("../middleware/check");
require("../db/conn");

const Data = require("../data/appdata");
const { response } = require('express');
const client = new OAuth2Client("60852057631-bh0bsigt23urgnas3fb10kkcja20232m.apps.googleusercontent.com");


router.post("/Register", async (req, res) => {
    const { Name, Email, Phone, UserName, Password, CPassword } = req.body;
    if (!Name || !Email || !UserName || !Password || !CPassword) {
        return res.status(422).json(0);
    }

    try {
        const result = await Data.findOne({ Email: Email })
        if (result) {
            return res.status(422).json(0);
        }
        else if (Password != CPassword) {
            return res.status(422).json(0);
        }
        else {
            const data = new Data({ Name, Email, Phone, UserName, Password, CPassword });
            const result = await data.save()
            if (result) {
                res.status(200).json(1);
            }
        }
    }
    catch (err) { console.log(err); };
})

router.post("/Login", async (req, res) => {
    try {

        const { Email, Password } = req.body;
        console.log("check4");
        if (!Email || !Password) {
            console.log("check1",req.body);
            return res.status(400).json(0);
        }
        const userlogin = await Data.findOne({ Email: Email });
        if (userlogin) {
            const isMatch = await bcrypt.compare(Password, userlogin.Password);

            if (!isMatch) {
                console.log("check2");
                res.status(400).json(0);
            }
            else {
                const token = await userlogin.generateAuthToken();
                res.cookie("jwtoken", token, {
                    expires: new Date(Date.now() + 25892000000),
                    httpOnly: true
                })
                console.log("user login succsessfully");
                res.status(200).json(1);
            }
        }
        else {
            res.status(400).json(0);
            console.log("check3");
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.post("/googleLogin", async (req, res) => {

    try {

        const tokenId = req.body.token;
        const response = await client.verifyIdToken({ idToken: tokenId, audience: "60852057631-bh0bsigt23urgnas3fb10kkcja20232m.apps.googleusercontent.com" })
        const { email_verified, name, email } = response.getPayload();
        if (email_verified) {
            const userlogin = await Data.findOne({ Email: email });
            if (userlogin) {
                const token = await userlogin.generateAuthToken();
                res.cookie("jwtoken", token, {
                    expires: new Date(Date.now() + 25892000000),
                    httpOnly: true
                })
                console.log("user login succsessfully");
                res.clearCookie('G_AUTHUSER_H',{ path: '/'});
                res.status(200).json(1);
            }
            else {
                let Email = email;
                let Password = Email + process.env.SECRET_KEY;
                let CPassword = Email + process.env.SECRET_KEY;
                let UserName = Email + name;
                let Phone = 0;
                let Name = name;
                const data = new Data({ Name, Email, Phone, UserName, Password, CPassword });
                const result = await data.save()
                if (result) {
                    const token = await data.generateAuthToken();
                    res.cookie("jwtoken", token, {
                        expires: new Date(Date.now() + 25892000000),
                        httpOnly: true
                    })
                    console.log("user login succsessfully");
                    res.status(200).json(1);
                }
            }
        }

    }
    catch (err) {
        console.log(err);
    }

})

router.get("/About", check, (req, res) => {
    res.send(req.rootdata)
})
router.post("/Feedback", check,async (req, res) => {
    try {
        const { CCode, Phone, Email,  Meassage } = req.body;

        if (!Email || !Meassage) {
            return res.json({ error: "fill all the form" });
        }
        const userMsg = await Data.findOne({ _id: req.userId });
        if(userMsg){
            const Feedback = await userMsg.addFeedback( CCode, Phone, Email, Meassage );
            await userMsg.save();
            res.status(201).json({message:"we reciev feedback succesfully"});
        }
    } catch (err) {
        console.log(err);
    }
})
router.get("/Logout", (req, res) => {
    res.clearCookie('jwtoken', { path: '/' });
    res.clearCookie('G_AUTHUSER_H',{ path: '/'});
    res.status(200).send(req.rootdata);
})
// router.get("/Work", check, (req, res) => {
//     res.send(req.rootdata);
// })
router.get("/MyStocks", check, (req, res) => {
    res.send(req.rootdata);
})

router.get('/stocksData', () => {
    req.send("we are on stock data page")
});

router.post("/:User/stocksData", async (req, res) => {
    let Email = req.params.User;
    const { stockName, stockPrice } = req.body;
    try {
        let user = await Data.findOne({ Email: Email });
        if(user)
        {
            let dateObj = new Date();

            let buyDate = (dateObj.getUTCFullYear()) + "/" + (dateObj.getMonth() + 1)+ "/" + (dateObj.getUTCDate());
            user.MyStocks.push({
                stockName,
                stockPrice,
                buyDate
            });
            await user.save();
            res.status(200).json(1);
        }
        
    }
    catch (err) {
        console.log(err);
    }
});
router.put('/:User/updataData',async (req,res) =>{
    const Email=req.params.User;
    const {UsrEmail,UsrName,UsrNum} = req.body;
    let user= await Data.findOne({Email:Email});
    user.Email=UsrEmail;
    user.UserName=UsrName;
    user.Phone=UsrNum;
    await user.save();
});
router.post('/:User/deleteStock/:ind',async (req,res) => {
    const Email=req.params.User;
    const ind=req.params.ind;
    let user= await Data.findOne({Email:Email});
    user.MyStocks.splice(ind,1);

    await user.save();
})
router.get('/:User/stocksList',async (req,res) => {
    const Email=req.params.User;
    let user= await Data.findOne({ Email: Email });
    res.send(user.MyStocks);
   
})
module.exports = router;