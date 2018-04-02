const router = require('express').Router()
const request = require('request')
const url = require('url')

const INJECTED_JAVASCRIPT_URL = 'https://s3.amazonaws.com/ithaka-labs/ugw-assets/ugw-test-latest.js'

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

    // request.body exists courtesy of bodyParser middleware
    request({ uri }, (err, response, data) => {
      if (err) {
        throw Error(err)
      }
      res.send(injectScriptTag(response.body))
    })
  })


function hasNoProtocol(uri){
  return !uri.startsWith('http')
}

function extractProxyTargetHostFromRequest(uri) {
  return uri.startsWith('https://')
    ? `https://${uri.split('https://')[1].split('/')[0]}`
    : `http://${uri.split('http://')[1].split('/')[0]}`
}

function injectScriptTag(body) {
  return body.replace(
    '</html>',
    `<script src="${INJECTED_JAVASCRIPT_URL}"></script></html>`
  )
}

module.exports = router
