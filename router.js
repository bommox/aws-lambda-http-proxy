const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const httpProxy = require('http-proxy')
const apiProxy = httpProxy.createProxyServer({
  ignorePath: true, 
  secure:false, 
  changeOrigin: true,
  followRedirects: true,
  selfHandleResponse : true
})

// Restream parsed body before proxying
apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
  if(req.body) {
    let bodyData = JSON.stringify(req.body);
    //console.log("REQUEST", bodyData);
    // In case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
    proxyReq.setHeader('Content-Type','application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    // Stream the content
    proxyReq.write(bodyData);
  }
});


apiProxy.on('proxyRes', function (proxyRes, req, res) {
    var body = new Buffer('');
    proxyRes.on('data', function (data) {
        body = Buffer.concat([body, data]);
    });
    proxyRes.on('end', function () {
        body = body.toString();
        console.log("LOG_PROXIED", JSON.stringify({
          requestBody: JSON.stringify(req.body),
          responseBody: body,
          path: req.path,
          method: req.method,
          requestHeaders: JSON.stringify(req.headers),
          responseHeaders: JSON.stringify(proxyRes.headers),
          status: proxyRes.statusCode || 'none'
        }));
        res.status(proxyRes.statusCode)
        res.end(body);
    });
});


app.all('*', (req, res) => {
  //console.log(req.headers)
  let target = req.headers['x-proxy-to']
  if (target) {
    target = unescape(target)
    let body = req.body
    try {
      body = JSON.stringify(body)
    } catch (e) {}
    //console.log(body)
    apiProxy.web(req, res, { target })
  } else {
    res.status(404).send('Not Found')
  }
})
app.all('/', (req, res) => res.send('Hello world!'))

module.exports = app