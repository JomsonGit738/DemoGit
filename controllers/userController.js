//import model in userController
const users = require('../Models/userSchema')

//import jsonwebtoken
const jwt = require('jsonwebtoken')


//define and export logic to resolve to resolve different http client request

//register => Controller
exports.register = async (request,response) => {
    // response.send("Register request received...")

    //register logic
    console.log(request.body);

    const { username,acno,password} = request.body
    if(!username || !acno || !password){
        response.status(403).json("All inputs are required...")
    }
    // else {
    //     response.send("data received")
    // }

    //check if user exists in the database
    try{
        const preuser = await users.findOne({acno})
        if(preuser){
            //if user exitst
            request.status(406).json("User already exists...!")
        }
        else {
            //add new user to db
            const newuser = new users({
                username,
                password,
                acno,
                balance:5000,
                transactions:[]
            })
            //to save new user in mongodb
            await newuser.save()
            response.status(200).json(newuser)
        }

       }
    catch(error){
        request.status(401).json(error)
    }
  

}

//login => Controller
exports.login = async (req,res) => {

    //Destructuring
    const {acno,password} = req.body

    //check if user exists
    try {

        //check acno and pswd is in db
        const preuser = await users.findOne({acno,password})
        //check presuser is exit
        if(preuser){
            
            //setting jwt to generate token
            const token = jwt.sign({
                loginAcno:acno
            },"supersecreatkey12345")

            //res.sending successful status 
            res.status(200).json({preuser,token})
        } else {
            res.status(404).json("Invalid account number/password")
        }
    }
    catch(Login_error){
        res.status(401).json(error)
    }
}

//getBalance
exports.getBalance = async (req,res)=>{
    //get path parameter 
    let acno = req.params.acno

    //get data of given acno
    try{
        //find acno from users
       const preuser = await users.findOne({acno})
       if(preuser){
            res.status(200).json(preuser.balance)
       } else {
        res.status(404).json("Invalid Account Number")
       }

    }catch(error){
        res.status(401).json(error)
    }
}

//fundTransfer
exports.fundTransfer = async (request,response)=>{
    console.log('inside fundTransfer logics...');
    try{
        //logic
        //1. get body from URL with request.body => creditAcno, creditAmount, profilePswd
        const {creditAcno, creditAmount, profilePswd} = request.body
        const {debitAcno} = request
        console.log(debitAcno);
        //2. check debit acno & password is available in MongoDB 
        const debitUser = await users.findOne({acno:debitAcno,password:profilePswd})
        console.log('debituser existing...'+debitUser);
        //3. check credit acno is existing in mongoDB
        const creditUser = await users.findOne({acno:creditAcno})
        console.log('credittuser existing...'+creditUser);
        if(debitAcno != creditAcno){
            if(debitUser && creditUser){
                //check sufficient balance for debitUser
                if(debitUser.balance>=creditAmount){
                    //perform transfer

                    //DEBIT
                    //debit creditamount from debitUser 
                    debitUser.balance-=creditAmount
                    //add debit transaction details to debitUser transactions
                    debitUser.transactions.push({
                        transaction_type:"DEBIT",
                        amount:creditAmount,
                        toAcno:creditAcno
                    })
                    //save in mongoDB by calling save() of mongoose
                    await debitUser.save()

                    //CREDIT
                    //credit creditAmount to creditUser
                    creditUser.balance+=creditAmount
                    //add debit transaction details to debitUser transactions
                    creditUser.transactions.push({
                        transaction_type:"CREDIT",
                        amount:creditAmount,
                        fromAcno:debitAcno
                    })
                    //save in mongoDB by calling save() of mongoose
                    await creditUser.save()

                    //reponse for DEBIT USER
                    //response for successful transfer
                    response.status(200).json("Fund Transfer successfully...")

                }else { 
                    //insufficient balance
                    response.status(406).json("Insufficient balance")
                }
            }else {
                response.status(406).json("Invalid Credit/Debit details!")
            }
        }
        else {
            res.status(406).json("Self-transaction denied!, not allowed... ")
        }

    }catch(error){
        response.status(401).json(error)
    }
}

//get All Transactions of User
exports.getTransactions = async (req,res)=>{
    //1. get acno from req.debitACno
    let acno = req.debitAcno

    //2. checking if acno exists in db
    try{
        const preuser = await users.findOne({acno})
        res.status(200).json(preuser.transactions)
    }
    catch(err){
        res.status(401).json(err)
    }
}

//delete acno
exports.deleteMyACNO = async(req,res)=>{
    //get current acno
    let acno = req.debitAcno

    try{
        await users.deleteOne({acno})
        res.status(200).json('Removed sucessfully')
    }
    catch(error){
        res.status(401).json(error)
    }
}

