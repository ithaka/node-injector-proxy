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


    let options = {uri};
    if (uri.includes("png")){
      options['encoding'] = null;
    }
    // request.body exists courtesy of bodyParser middleware
    request(options, (err, response, data) => {
      if (err) {
        throw Error(err)
      }
      if (uri.includes('png')){
        res.write(new Buffer(data),'binary');
        res.end(undefined,'binary');
      } else {
        res.send(injectScriptTag(response.body, uri))
      }
    })
  })


function hasNoProtocol(uri){
  return !uri.startsWith('http')
}

function extractProxyTargetHostFromRequest(uri) {
  if (uri.startsWith('https://')){
    return `https://${uri.split('https://')[1].split('/')[0]}`
  } else {
    let targetDomain = uri.split('http://')[1];
    let domainElements = targetDomain.split('/');
    domainElements.pop();
    return `http://${domainElements.join('/')}`
  }
}

function injectScriptTag(body, uri) {
  if (uri.includes('folger')){
    body = body.replace('<head>', '<link href="http://www.folgerdigitaltexts.org/html/fdt.css" rel="stylesheet"/>')
  }
  return body
    .replace(
    '</html>',
    `<script src="${INJECTED_JAVASCRIPT_URL}"></script></html>`
  )
}

module.exports = router
