const express = require('express');
const emailjs = require('@emailjs/nodejs');
const mongoose = require('mongoose');
const { Notification } = require("./models")
const OTPAuth = require("otpauth")
const QRCode = require('qrcode');

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
//update data

app.post('/api/updateNotification', async (req, res) => {
    var updatedNotification = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        message: req.body.message
    };
    let existingNotification = await Notification.find({name:updatedNotification.name});

    if (!existingNotification){
        return res.status(404).send("can not find notifications");
    }
    await Notification.updateOne({name:updatedNotification.name}, updatedNotification)
    return res.status(200).send("success");
})
//Find data
app.get('/api/getNotificationsByName/:name', async (req, res) => {
    const {name} = req.params;
    const allNotifcations = await Notification.find({name:name});
    return res.status(200).json(allNotifcations);
})
//Find data
app.get('/api/getNotifications', async (req, res) => {
    const allNotifcations = await Notification.find();
    return res.status(200).json(allNotifcations);
})

app.get('/api/getTotp', async (req, res) => {
    return res.send(totp.generate())
})

//generate qr code
app.get('/api/generateQRCodeString/:customerId', async (req, res) => {
    const {customerId} = req.params;
    //build url
    let url = `http://localhost:3000/api/makeCreditForCustomer?customerId=${customerId}&token=${totp.generate()}`
    //use libary to generate qrcode encoding string
    console.log(url)
    QRCode.toString(url, {
        errorCorrectionLevel: 'H',
        type: 'svg'
      }, function(err, data) {
        if (err) throw err;
        res.send(data)
      });
})



app.post('/api/totpVerify', async (req, res) => {
    const { token } = req.body;
    console.log(`Token: ${token}`);
    const validationOutcome = totp.validate({ token, window: 1 });
    const validationOutcomeStr = JSON.stringify(validationOutcome);
    console.log(`validateResult: ${validationOutcomeStr}`);
    res.send(validationOutcomeStr);
});



app.get('/api/makeCreditForCustomer', async (req, res) => {
   
    const {customerId,token} = req.query;
    console.log(`Token: ${token},ID:${customerId}`)
    let result = totp.validate({ token, window: 1 });
  
    if (result == 0){
        return res.send("success")

    }
 
    return res.send("failed")
})

app.delete('/api/deleteNotificationsByName/:name', async (req, res) => {
    const {name} = req.params;
    let existingNotification = await Notification.find({name:name});

    if (!existingNotification || existingNotification.length == 0){
        
        return res.status(404).send("can not find notifications");
    }
    
   await Notification.deleteOne({name:name});
   return res.status(200).send("success");

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
