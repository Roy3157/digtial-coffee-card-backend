const express = require('express');
const emailjs = require('@emailjs/nodejs');
const mongoose = require('mongoose');
const { Notification } = require("./models")
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
