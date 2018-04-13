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

const cachedRouteMap = {}


let proxyTargetHost = ''

router.route('*')
  .get((req, res) => {
    let uri = req.originalUrl.substring(1)
    let relativeURLRequested = ''
    if (hasNoProtocol(uri)) {
      relativeURLRequested = uri
      // relative URL from previous host.  Prepend proxyTargetHost to URL.
      uri = `${proxyTargetHost}/${uri}`
    } else {
      // new host or URL with protocol
      proxyTargetHost = extractProxyTargetHostFromRequest(uri)
    }


    if (cachedRouteMap[uri]) {
      console.log('using cached route', cachedRouteMap[uri])
    }
    uri = cachedRouteMap[uri] || uri

    let options = { uri, encoding: nullEncodeForImages(uri) }

    request(options, (err, originResponse) => {
      if (err) throw Error(err)

      let contentType = preserveHeaders(originResponse, res)

      if (originResponse.statusCode === 200) {
        return sendResponse(contentType, res, originResponse)
      }
      // route is cached, but we didn't get a 200.  Send an empty response
      if (cachedRouteMap[uri]) {
        return res.send('')
      }
      // not cached, let's try to request resource from base domain
      const originalUri = uri
      const urlObject = url.parse(uri)

      // if we're not already at the root, and we are trying to get a relative URL,
      if (urlObject.pathname !== '/' && relativeURLRequested) {
        // try fetching resource from hostname without intermediate path elements
        uri = `${urlObject.protocol}//${urlObject.hostname}/${relativeURLRequested}`
        request({...options, uri}, (err, retryResponse) => {
          if (err) throw Error(err)

          contentType = retryResponse.headers['content-type']
          if (retryResponse.statusCode === 200) {
            // if successful request, cache the modified URL
            cachedRouteMap[originalUri] = uri
            return sendResponse(contentType, res, retryResponse)
          }
        })
      } else {
        return res.send('')
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
  if (typeof body !== 'string') {
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
