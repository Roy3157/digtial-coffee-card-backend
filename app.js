const express = require('express');
const emailjs = require('@emailjs/nodejs');
const mongoose = require('mongoose');
const { Notification } = require("./models")
const OTPAuth = require("otpauth")

let totp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "AzureDiamond",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: "NB2W45DFOIZA", // or 'OTPAuth.Secret.fromBase32("NB2W45DFOIZA")'
});
var app = express();
app.use(express.json());

app.post('/api/sendEmail', async (req, res) => {

    var templateParams = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        message: req.body.message
    };
    //write data to database
    const notification = new Notification(templateParams);
    const saveResult = await notification.save()
    console.log(`Database save result ${saveResult}`);
    //send email
    emailjs.send('default_service','template_fu48g3t', templateParams, {
        publicKey: 'cYszRWLG4VIoLB7uV',
      })
        .then(function(response) {
           console.log('SUCCESS!', response.status, response.text);
           res.send('ok')
        }, function(err) {
           console.log('FAILED...', err);
           res.send('fail')
        });
});

app.get('/api/getNotifications', async (req, res) => {
    const allNotifcations = await Notification.find();
    return res.status(200).json(allNotifcations);
})

app.get('/api/getTotp', async (req, res) => {
    return res.send(totp.generate())
})

app.post('/api/totpVerify', async (req, res) => {
    var token = req.body.token;
    console.log(`Token: ${token}`)
    let result = totp.validate({ token, window: 1 });
    let resultString = JSON.stringify(result)
    console.log(`validateResult: ${resultString}`)
    return res.send(resultString)
})



//connect to database
const startApp = async () => {
    try {
        await mongoose.connect('mongodb+srv://cf2112006240:AVLBEyl3I6w0U5Wf@digtial-coffee-card.eqa0qzx.mongodb.net/digtial-coffee-card')
        app.listen(3000, ()=> console.log('Server is running on port 3000'))  
    }
    catch (error) {
        console.log(error)
        process.exit(1);
    }
}

startApp();
