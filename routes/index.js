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

router.route('*')
  .get((req, res) => {
    let uri = req.originalUrl.substring(1)
    if (hasNoProtocol(uri)) {
      // relative URL from previous host.  Prepend proxyTargetHost to URL.
      uri = `${proxyTargetHost}/${uri}`
    } else {
      // new host or URL with protocol
      proxyTargetHost = extractProxyTargetHostFromRequest(uri)
    }


    let options = { uri,  encoding: nullEncodeForImages(uri) }

    request(options, (err, originResponse, data) => {
      if (err) {
        throw Error(err)
      }

      const contentType = preserveHeaders(originResponse, res);

      if (originResponse.statusCode !== 200){
        res.send("");
        return;
      }

      if (contentType.includes('text/html')) {
        res.send(injectScriptTag(originResponse.body))
      } else if (contentType.includes('image')) {
        res.write(new Buffer(data), 'binary')
        res.end(undefined, 'binary')
      } else {
        res.send(originResponse.body)
      }
    })
  })

function nullEncodeForImages(uri){
  return (uri.includes('png') || uri.includes('gif') || uri.includes('jpg')) ? null : undefined;
}

function preserveHeaders(origin, proxyResponse){
  Object.keys(PRESERVE_HEADERS)
    .forEach(headerName => proxyResponse.set(PRESERVE_HEADERS[headerName], origin.headers[headerName]))
  return origin.headers['content-type']
}

function hasNoProtocol(uri) {
  return !uri.startsWith('http')
}

function extractProxyTargetHostFromRequest(uri) {
  if (uri.startsWith('https://')) {
    let targetDomain = uri.split('https://')[1]
    let domainElements = targetDomain.split('/')
    domainElements.pop()
    return `https://${domainElements.join('/')}`
  } else {
    let targetDomain = uri.split('http://')[1]
    let domainElements = targetDomain.split('/')
    domainElements.pop()
    return `http://${domainElements.join('/')}`
  }
}

function injectScriptTag(body) {
  if (typeof body !== 'string'){
    body = body.toString()
    console.log(body)
  }
  return body
    .replace(
      '</head>',
      `<script async src="${INJECTED_JAVASCRIPT_URL}"></script></head>`
    )
}

module.exports = router
