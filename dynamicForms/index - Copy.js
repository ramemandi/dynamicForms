
var express = require('express');
const bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var cors = require('cors');
var Request = require("request");
const open = require('open');
var _ = require('underscore');

var app = express();


// Set up the path for the quickstart.
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
// app.use("/dynamicForms",express.static('dist'))
// app.use("/dynamicForms",express.static('dist'))
let frontEnd = path.join(__dirname, 'dist');
let frontEnd1 = path.join(__dirname, 'vendor');

console.log(frontEnd, 'frontEnd');
console.log(frontEnd1, 'frontEnd1');

app.use('/node/dynamicForms/dist', express.static(frontEnd))
app.use('/node/dynamicForms/vendor', express.static(frontEnd1))


app.get('/node/dynamicForms/getForm', (req, res) => {
  console.log('query params', req.query)
  apiDomain = req.query.apiDomain;
  res.render('index')
});

app.post('/node/dynamicForms/saveForm', async function (req, res) {
  console.log(req.body, 'addNotes');
  console.log(JSON.stringify(req.body), '256');

  let apiDomain = req.body.apiDomain;
  console.log(apiDomain, '45');
  // https://api.tracktechllc.com/
  Request.post({
    "headers": { "content-type": "application/json" },
    "url": apiDomain + "api/eForms/UpdateEForms",
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
      let url = "https://bmv.tracktechllc.com/node/dynamicForms/getJsonForm?eFormId=" + response.Item.eFormId + "&apiDomain=" + apiDomain;
      console.log(url, '61');
      let updateUrl = await updateFormUrl(header, response.Item.eFormId, url, apiDomain);
      console.log(updateUrl, 58);
      if (response.Item.eFormId) {
        res.send({ success: true, formId: response.Item.eFormId })
      } else {
        res.send({ success: true, formId: null })
      }

    }
  });
});




function updateFormUrl(header, formId, url, apiDomain) {
  return new Promise((resolve, reject) => {
    Request.get({
      "headers": header,
      "url": apiDomain + "api/eForms/UpdateFormUrl?formId=" + formId + "&url=" + url,
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
app.get('/node/dynamicForms/editForm', function (req, res) {
  console.log(req.query.formId, 'edit funtion');
  let apiDomain = req.query.apiDomain;
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




app.get('/node/dynamicForms/getJsonForm', (req, res) => {
  console.log('query params', 118)
  // apiDomain = req.query.apiDomain;
  res.render('jsonForm')
});

app.post('/node/dynamicForms/getJsonFormResponse', async (req, res) => {
  console.log('BODY', JSON.stringify(req.body))
  // console.log('query', JSON.stringify(req.query))
  let formData = req.body;
  //  console.log('query params', req.query.formResponseId) ,application/multipart
  let formResponseId = req.query.formResponseId;
  let formId = req.query.formId;
  let apiDomain = req.query.apiDomain;
  let formSchema = await getFormSchema(formId, apiDomain);
  // console.log(JSON.stringify(formSchema.Item.fields), 'RAM');
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
    "url": apiDomain + "api/eForms/UpdateFormResponse?formResponseId=" + formResponseId,
    "body": JSON.stringify(summary)
  }, async (error, result, body) => {
    // console.log(result, 'res 124');
    console.log(error, 'error 125');
    console.log(body, 'body 126');

    if (error) {
      return res.status(200).send({
        success: false,
        data: req.body
      })
    } else {
      return res.status(200).send({
        success: true,
        data: req.body
      })
    }
  });

});

function getFormSchema(formId, apiDomain) {
  return new Promise((resolve, reject) => {
    Request.get({
      "headers": { "content-type": "application/json" },
      "url": apiDomain + "api/eForms/GetFormById?formId=" + formId,
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

app.get('/node/dynamicForms/getFormlayout', async (req, res) => {
  console.log('query getFormlayout', req.query)
  let eFormId = req.query.formId;
  let apiDomain = req.query.apiDomain;
  // let header = { "Content-Type": "application/json" }
  // let url = "https://beta-api.tracktechllc.com/api/eForms/GetEFormBannerSettings?eFormId="+eFormId;
  let response = await getCssSchema(eFormId, apiDomain);
  console.log(response, '100');
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

function getCssSchema(formId, apiDomain) {
  return new Promise((resolve, reject) => {
    Request.get({
      "headers": { "content-type": "application/json" },
      "url": apiDomain + "api/eForms/GetEFormBannerSettings?eFormId=" + formId,
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




var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function () {
  // var datetime = new Date();
  // console.log(datetime.toISOString());
  console.log('Express server running on *:' + port);
});