const router = require('express').Router()
const request = require('request-promise')
const { injectScriptTag, extractProxyHostAndPath, hasNoProtocol, preserveHeaders, nullEncodeForImages } = require('./proxy')

const proxyTarget = { host: '', path: '' }

router.route('*')
  .get((req, res) => {
    let uri = req.originalUrl
    if (uri.startsWith('/http')) {
      uri = uri.substring(1)
      // new host or URL with protocol
      extractProxyHostAndPath(uri, proxyTarget)
      console.log('setting proxyTargetHost', proxyTarget.host)
    }
    if (hasNoProtocol(uri)) {
      console.log('relative URL requested', uri)
      if (uri.startsWith('/')) {
        uri = `${proxyTarget.host}${uri}`
      } else {
        uri = `${proxyTarget.host}/${proxyTarget.path}/${uri}`
      }
      console.log('resetting URI', uri)
    }

    const options = { uri, encoding: nullEncodeForImages(uri), resolveWithFullResponse: true }

    request(options)
      .then(originResponse => {
        let contentType = preserveHeaders(originResponse, res)

        if (originResponse.statusCode === 200) {
          console.log(`200 for ${uri}, forwarding to client`)
          if (contentType.includes('text/html')) {
            res.send(injectScriptTag(originResponse.body))
          } else {
            res.send(originResponse.body)
          }
        } else {
          res.send('')
        }
      })
      .catch(e => {throw Error(e)})
  })


module.exports = router
