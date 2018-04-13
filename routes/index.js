const router = require('express').Router()
const request = require('request')
const url = require('url')

const INJECTED_JAVASCRIPT_URL = 'https://s3.amazonaws.com/ithaka-labs/ugw-assets/ugw-test-latest.js'

const PRESERVE_HEADERS = {
  'accept-ranges': 'Accept-Ranges',
  'content-type': 'Content-Type',
  'content-encoding': 'Content-Encoding',
  'content-length': 'Content-Length'
}

let proxyTargetHost = ''
let proxyTargetPath = ''

router.route('*')
  .get((req, res) => {
    let uri = req.originalUrl;
    if (uri.startsWith('/http')){
      uri = uri.substring(1)
      // new host or URL with protocol
      extractProxyHostAndPath(uri)
      console.log('setting proxyTargetHost', proxyTargetHost)
    }
    if (hasNoProtocol(uri)) {
      console.log('relative URL requested', uri)
      if (uri.startsWith('/')){
        uri = `${proxyTargetHost}${uri}`
      } else {
        uri = `${proxyTargetHost}/${proxyTargetPath}/${uri}`
      }
      console.log('resetting URI', uri)
    }

    let options = { uri, encoding: nullEncodeForImages(uri) }

    request(options, (err, originResponse) => {
      if (err) throw Error(err)

      let contentType = preserveHeaders(originResponse, res)

      if (originResponse.statusCode === 200) {
        console.log(`200 for ${uri}, forwarding to client`)
        sendResponse(contentType, res, originResponse)
      } else {
        res.send('')
      }
    })
  })


function sendResponse(contentType, res, originResponse) {
  if (contentType.includes('text/html')) {
    res.send(injectScriptTag(originResponse.body))
  } else {
    res.send(originResponse.body)
  }
}

function nullEncodeForImages(uri) {
  return (uri.includes('png') || uri.includes('gif') || uri.includes('jpg')) ? null : undefined
}

function preserveHeaders(origin, proxyResponse) {
  Object.keys(PRESERVE_HEADERS)
    .forEach(headerName => proxyResponse.set(PRESERVE_HEADERS[headerName], origin.headers[headerName]))
  return origin.headers['content-type']
}

function hasNoProtocol(uri) {
  return !uri.startsWith('http')
}

function extractProxyHostAndPath(uri) {
  let URLObject = url.parse(uri)
  proxyTargetHost = `${URLObject.protocol}//${URLObject.hostname}`
  proxyTargetPath = `${URLObject.pathname}`
}

function injectScriptTag(body) {
  if (typeof body !== 'string') {
    body = body.toString()
  }
  if (body.includes('</head>')) {
    return body
      .replace(
        '</head>',
        `<script async src="${INJECTED_JAVASCRIPT_URL}"></script></head>`
      )
  } else if (body.includes('</html>')) {
    return body
      .replace(
        '</html>',
        `<script async src="${INJECTED_JAVASCRIPT_URL}"></script></html>`
      )
  }

  console.log('No </head> or </html> tag found.  Returning body without JS injected')
  return body
}

module.exports = router
