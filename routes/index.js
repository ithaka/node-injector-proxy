const router = require('express').Router();
const request = require('request');
const url = require('url')

let currentHost = '';

router.route('*')
.get((req, res) => {
  let uri = req.originalUrl.substring(1);
  if (!uri.startsWith('http')){
    uri=`${currentHost}/${uri}`
  } else {
    if (uri.startsWith('https')){
      currentHost = `https://${uri.split('https://')[1].split('/')[0]}`
    } else {
      currentHost = `http://${uri.split('http://')[1].split('/')[0]}`
    }
  }
  request({uri}, (err, response, data)=> {
    if (err){
      throw Error(err);
    }
    res.send(injectScriptTag(response.body));
  });
})

function injectScriptTag(body){
  return body.replace(
    '</html>',
    '<script src="https://s3.amazonaws.com/ithaka-labs/ugw-assets/ugw-test-latest.js"></script></html>'
  )
}

module.exports = router;
