
var express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var http = require('http');
var path = require('path');
var cors = require('cors');
var Request = require("request");
var _ = require('underscore');

var app = express();
// enable files upload
app.use(fileUpload({
    createParentPath: true
}));


// Set up the path for the quickstart.
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// app.use(express.bodyParser({limit: '50mb'}));
app.use(cors());
// app.use("/dynamicForms",express.static('dist'))
// app.use("/dynamicForms",express.static('dist'))

app.use('/dist', express.static(path.join(__dirname, 'dist')))
app.use('/vendor', express.static(path.join(__dirname, 'vendor')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))



app.get('/node/dynamicForms/getForm', (req, res) => {
    console.log('query params', req.query)
    // apiDomain = req.query.apiDomain;
    res.render('index')
});




app.post('/node/dynamicForms/saveForm', async function (req, res) {
    console.log(req.body, 'addNotes');
    console.log(JSON.stringify(req.body), '256');
    let apiDomain = req.body.apiDomain;
    if (apiDomain) {
        apiDomain = getDomainbyId(apiDomain);
    }
    Request.post({
        "headers": { "content-type": "application/json" },
        "url": apiDomain + "/api/eForms/UpdateEForms",
        "body": JSON.stringify(req.body.formData)
    }, async (error, response, body) => {
        // console.log(body);
        if (error) {
            return false;
        } else {
            let response = JSON.parse(body);
            console.log(response.Item, '122');
            // http://bmv.tracktechllc.com/node/dynamicForms/getJsonForm?poId=5e746ff08b2be90f6843175e&pmId=null&agencyId=5e6b7b2413bd7090ec7b66d3&formId=5f59bc0f24e2fbe118ca24c0
            //  val.formURL + "&formResponseId=" + val.formResponseId + "&eFormId=" + val.eFormId + "&apiDomain=" + apiDomain;
            // 
            let header = { "Content-Type": "application/json" }
            let url = "https://bmv.tracktechllc.com/node/dynamicForms/getJsonForm?eFormId=" + response.Item.eFormId;
            let updateUrl = await updateFormUrl(header, response.Item.eFormId, url);
            console.log(updateUrl, 58);
            if (response.Item.eFormId) {
                res.send({ success: true, formId: response.Item.eFormId })
            } else {
                res.send({ success: true, formId: null })
            }

        }
    });
});




function updateFormUrl(header, formId, url) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": header,
            "url": "https://beta-api.tracktechllc.com/api/eForms/UpdateFormUrl?formId=" + formId + "&url=" + url,
            "body": null
        }, async (error, result, body) => {
            console.log(body, 'res 79');
            if (error) {
                return reject(error);
            } else {
                return resolve(body);
            }
        });
    })
}

app.get('/node/dynamicForms/getJsonForm', async (req, res) => {
    console.log('query params', req.query)
    let formResponseId = req.query.formResponseId;
    let header = { "Content-Type": "application/json" }
    // let url = "https://beta-api.tracktechllc.com/api/eForms/UpdateFormResponseStatus?eFormResponseId=" + formResponseId;
    // let response = await changeResponse(header, url);
    // console.log(response, '100');
    res.render('jsonForm')
});

function changeResponse(header, url) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": header,
            "url": url,
            "body": null
        }, async (error, result, body) => {
            // console.log(body, 'res 79');
            if (error) {
                return reject(error);
            } else {
                return resolve(body);
            }
        });
    })
}

app.get('/node/dynamicForms/editForm', function (req, res) {
    console.log(req.query.formId, 'edit funtion');
    let apiDomain = req.query.apiDomain;
    if (apiDomain) {
        apiDomain = getDomainbyId(apiDomain);
    }
    console.log(apiDomain + "api/eForms/GetFormById?formId=" + req.query.formId);
    Request.get({
        "headers": { "content-type": "application/json" },
        "url": apiDomain + "api/eForms/GetFormById?formId=" + req.query.formId,
        "body": null
    }, (error, response, body) => {
        if (error) {
            return false;
        } else {
            let response = body;
            return res.send(response);

        }
    });
});

app.get('/node/dynamicForms/formValidationSettings', async function (req, res) {
    console.log(req.query.formId, 'edit funtion');
    console.log(req.query.formResponseId, 'edit formResponseId');
    console.log(req.query.apiDomain, 'edit formResponseId');
    let apiDomain = req.query.apiDomain;
    if (apiDomain) {
        apiDomain = getDomainbyId(apiDomain);
    }
    let validationSettings = await getFormValidationSettings(req.query.formResponseId, apiDomain);
    console.log(validationSettings, 'validationSettings');
    if (validationSettings.isValid && validationSettings.securityVerification === 'CODE') {
        res.status(200).send({ success: true, securityVerification: validationSettings.securityVerification })
    }
    else {
        if (validationSettings.Valid) {
            res.status(200).send({ success: true, securityVerification: validationSettings })
        } else {
            res.status(200).send({ success: false, securityVerification: validationSettings.Msg })
        }
    }

});





function getFormValidationSettings(formId, apiDomain) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": { "content-type": "application/json" },
            "url": apiDomain + "api/eForms/ValidateFormSecuritySettings?formResponseId=" + formId,
            "body": null
        }, (error, response, body) => {
            console.log(error, 'error');
            // console.log(response,'response');
            // console.log(body,'body');
            if (error) {
                reject(error);
            } else {
                let response = JSON.parse(body);
                resolve(response);
            }
        });
    })
}


app.get('/node/dynamicForms/verifySecurityCode', async function (req, res) {
    console.log(req.query.code, 'verifySecurityCode');
    console.log(req.query.formResponseId, 'verifySecurityCode formResponseId');
    let apiDomain = req.query.apiDomain;
    if (apiDomain) {
        apiDomain = getDomainbyId(apiDomain);
    }
    let verifyCode = await verifySecurityCode(req.query.formResponseId, req.query.code,apiDomain);
    console.log(verifyCode, '181');
    if (verifyCode.Valid) {
        res.status(200).send({ success: true, verifyCode: verifyCode })
    } else {
        res.status(200).send({ success: false, verifyCode: verifyCode.Msg })
    }

});

function verifySecurityCode(formId, code,apiDomain) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": { "content-type": "application/json" },
            "url": apiDomain+"api/eForms/VerifyEFormSecurityCode?formResponseId=" + formId + "&securityCode=" + code,
            "body": null
        }, (error, response, body) => {
            console.log(error, 'error');
            console.log(body, 'response');
            if (error) {
                reject(error);
            } else {
                let response = JSON.parse(body);
                resolve(response);
            }
        });
    })
}


function getFormSchema(formId) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": { "content-type": "application/json" },
            "url": "https://beta-api.tracktechllc.com/api/eForms/GetFormById?formId=" + formId,
            "body": null
        }, (error, response, body) => {
            if (error) {
                reject(false);
            } else {
                let response = JSON.parse(body);
                resolve(response);
            }
        });
    })
}
app.post('/node/dynamicForms/getJsonFormResponse', async (req, res) => {
    // console.log('BODY', JSON.stringify(req.body))
    //    console.log('query', JSON.stringify(req.query))
    let formData = req.body;
    //  console.log('query params', req.query.formResponseId) ,application/multipart
    let formResponseId = req.query.formResponseId;
    let code = req.query.code;

    let formId = req.query.formId;
    let formSchema = await getFormSchema(formId);
    console.log(JSON.stringify(formSchema.Item.fields), 'RAM');
    // let fields = _.pluck(formSchema.Item.fields, 'label');
    let arraySize = new Array(formSchema.Item.fields.length).fill("")
    let fields = _.object(_.pluck(formSchema.Item.fields, 'label'), arraySize);
    // console.log(fields,'pick');
    // let fields1 = JSON.stringify(fields);
    const summary = { ...fields, ...formData };
    console.log(summary, 'summary');

    let header = { "Content-Type": "application/json" }
    Request.post({
        "headers": header,
        "url": "https://beta-api.tracktechllc.com/api/eForms/UpdateFormResponse?formResponseId=" + formResponseId + "&securityCode=" + code,
        "body": JSON.stringify(req.body)
    }, async (error, result, body) => {
        if (error) {
            return res.status(200).send({
                success: false,
                data: req.body
            })
        } else {
            let data = JSON.parse(body);
            if (data.Valid) {
                return res.status(200).send({
                    success: true,
                    data: data.Msg
                })
            } else {
                return res.status(200).send({
                    success: false,
                    data: data.Msg
                })
            }

        }
    });
    // res.render('jsonForm');
});
app.get('/node/dynamicForms/getFormlayout', async (req, res) => {
    //   console.log('query getFormlayout', req.query)
    let eFormId = req.query.formId;
    let apiDomain = req.query.apiDomain;
    if (apiDomain) {
        apiDomain = getDomainbyId(apiDomain);
    }
    // let header = { "Content-Type": "application/json" }
    // let url = "https://beta-api.tracktechllc.com/api/eForms/GetEFormBannerSettings?eFormId="+eFormId;
    let response = await getCssSchema(eFormId,apiDomain);
    // console.log(response,'100');
    // let formMockdata = [
    //     { isHeader: true, headerHtml: "<div class='container'><h3>Testing Header</h3></div>" },
    //     { isFooter: true, footerHtml: "<div class='container'>Copyright &copy; 2020 Tracktechllc.com , Version 1.0</div>" },
    //     { isLogo: true, logoUrl: "https://beta.tracktechllc.com/Images/Logos/ttl.jpg", logoPosition: "center" },
    //     { isbgColor: true, backgroundColor: 'grey' }];
    // let data = { valid: true, Item: formMockdata }
    if (response) {
        res.status(200).send({
            status: true,
            data: response
        })
    } else {
        res.status(200).send({
            status: false,
            data: null
        })
    }


});

function getCssSchema(formId,apiDomain) {
    return new Promise((resolve, reject) => {
        Request.get({
            "headers": { "content-type": "application/json" },
            "url": apiDomain+"api/eForms/GetEFormBannerSettings?eFormId=" + formId,
            "body": null
        }, (error, response, body) => {
            if (error) {
                reject(false);
            } else {
                let response = JSON.parse(body);
                resolve(response);
            }
        });
    })
}


function getDomainbyId(id) {
    //     apiDomain : 1 - https://api.tracktechllc.com/ 
    // apiDomain : 2 - http://demo-api.tracktechllc.com/ 
    // apiDomain : 3 - https://beta-api.tracktechllc.com/ 
    // apiDomain : 4 - http://devapi.tracktechllc.com/tracktech
    // apiDomain : 5 - 
    switch (id) {
        case 1: return 'https://api.tracktechllc.com/';
            break;
        case 2: return 'http://demo-api.tracktechllc.com/';
            break;
        case 3: return 'https://beta-api.tracktechllc.com/';
            break;
        case 4: return 'http://devapi.tracktechllc.com/tracktech/';
            break;
        default: return 'https://beta-api.tracktechllc.com/';
            break;
    }
}

//File upload
// app.post('/getResponses', async (req, res) => {
//       console.log(req.body,'body');
//       console.log(req.files,'files');
//     try {                    
//         if(!req.files) {
//             res.send({
//                 status: false,
//                 message: 'No file uploaded'
//             });
//         } else {
//             // console.log(req.files.File+' '+field_files,'ffffff');
//             console.log('file upload');
//             console.log(req.files,'files');
//             let avatar = req.files.Photo_files;
//             console.log(avatar,108);
//           let paths =  path.join(__dirname, '/uploads/')
//             //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
//             // let avatar = req.files.File field_files;
//             console.log(paths,'avatar');
//             console.log(avatar,'avatar');

//             //Use the mv() method to place the file in upload directory (i.e. "uploads")
//             avatar.mv('./uploads/' + avatar.name);

//             //send response
//             res.send({
//                 status: true,
//                 message: 'File is uploaded'
//             });
//         }
//     } catch (err) {
//         console.log(err,'113');
//         res.status(500).send(err);
//     }
// });

var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function () {
    // var datetime = new Date();
    // console.log(datetime.toISOString());
    console.log('Express server running on *:' + port);
});