const awsServerlessExpress = require('aws-serverless-express')
const router = require('./router')

const binaryMimeTypes = [
  'application/octet-stream',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml'
]

const server = awsServerlessExpress.createServer(router, null, binaryMimeTypes)

exports.handler = (event, context) =>
  awsServerlessExpress.proxy(server, event, context)