const express = require('express');
const app = express();

app.get('/api/sendEmail', (req, res) => {
    // code fragment
    var data = {
        service_id: 'default_service',
        template_id: 'template_4jy2yu9',
        user_id: 'cRvLZ3RUw3QmirEFF',
        template_params: {
            'name': req.body.name,
            'email': req.body.email,
            'phoneNumber': req.body.phoneNumber,
            'message': req.body.message
        }
    };
    
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        data: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    }).then(function() {
        console.log('Your mail is sent!');
    }).catch(function(error) {
        console.log('Oops... ' + JSON.stringify(error));
    });
});

app.listen(3000, ()=> console.log('Server is running on port 3000'))