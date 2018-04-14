const url = require('url')


const INJECTED_JAVASCRIPT_URL = 'https://s3.amazonaws.com/ithaka-labs/ugw-assets/ugw-test-latest.js'
const PRESERVE_HEADERS = {
  'accept-ranges': 'Accept-Ranges',
  'content-type': 'Content-Type',
  'content-encoding': 'Content-Encoding',
  'content-length': 'Content-Length'
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

function extractProxyHostAndPath(uri, proxyTarget) {
  let URLObject = url.parse(uri)
  proxyTarget.host = `${URLObject.protocol}//${URLObject.hostname}`
  proxyTarget.path = `${URLObject.pathname}`
}

function injectScriptTag(body) {
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

module.exports = { injectScriptTag, extractProxyHostAndPath, hasNoProtocol, preserveHeaders, nullEncodeForImages }