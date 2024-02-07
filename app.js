const express = require('express');
const emailjs = require('@emailjs/nodejs');
const mongoose = require('mongoose');
const { Notification } = require("./models")
const OTPAuth = require("otpauth")
const QRCode = require('qrcode');
const { v5: uuidv5 } = require('uuid');
require('dotenv').config()

//add supabase sdk to access the database

const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://snqmybgrurossgixkuyg.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


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
    emailjs.send('default_service', 'template_fu48g3t', templateParams, {
        publicKey: 'cYszRWLG4VIoLB7uV',
    })
        .then(function (response) {
            console.log('SUCCESS!', response.status, response.text);
            res.send('ok')
        }, function (err) {
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
    let existingNotification = await Notification.find({ name: updatedNotification.name });

    if (!existingNotification) {
        return res.status(404).send("can not find notifications");
    }
    await Notification.updateOne({ name: updatedNotification.name }, updatedNotification)
    return res.status(200).send("success");
})
//Find data
app.get('/api/getNotificationsByName/:name', async (req, res) => {
    const { name } = req.params;
    const allNotifcations = await Notification.find({ name: name });
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
    let { customerId } = req.params;
    //check if customer Id exist in database
    let { data, error } = await supabase
        .from('Customer')
        .select()
        .maybeSingle()
        .eq('id', customerId)
    console.log(`Customer: ${data}`)
    console.log(`Error: ${error}`)
    if(error) {
        res.send(error)
        return
    }
    if(data == null) {
        res.send(data)
        return
    }

    //build url
    let url = `http://localhost:3000/api/makeCreditForCustomer?customerId=${customerId}&token=${totp.generate()}`
    //use libary to generate qrcode encoding string
    console.log(url)
    QRCode.toString(url, {
        errorCorrectionLevel: 'H',
        type: 'svg'
    }, function (err, data) {
        if (err) throw err;
        res.send(data)
    });
})


app.get('/api/makeCreditForCustomer', async (req, res) => {

    const { customerId, token } = req.query;
    console.log(`Token: ${token},ID:${customerId}`)
    let result = totp.validate({ token, window: 1 });

    if (result == 0) {
        //get current credit
        let { data, error } = await supabase
            .from('Customer')
            .select()
            .maybeSingle()
            .eq('id', customerId)
        var credit = data.credit;
        if(e) {
            return res.send("success") 
        }
        //update database to add credit

        const { updated, e } = await supabase
            .from('Customer')
            .update({ credit: credit +1 })
            .eq('id', customerId)
            .select()
        return res.send("success")

    }

    return res.send("failed")
})

app.delete('/api/deleteNotificationsByName/:name', async (req, res) => {
    const { name } = req.params;
    let existingNotification = await Notification.find({ name: name });

    if (!existingNotification || existingNotification.length == 0) {

        return res.status(404).send("can not find notifications");
    }

    await Notification.deleteOne({ name: name });
    return res.status(200).send("success");

})

//connect to database
const startApp = async () => {
    app.listen(3000, () => console.log('Server is running on port 3000'))
    
    // try {
    //     await mongoose.connect('mongodb+srv://cf2112006240:AVLBEyl3I6w0U5Wf@digtial-coffee-card.eqa0qzx.mongodb.net/digtial-coffee-card')
    // }
    // catch (error) {
    //     console.log(error)
    //     process.exit(1);
    // }
}

startApp();
