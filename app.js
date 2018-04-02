const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const index = require('./routes/index')
const app = express()

app.use(bodyParser.text())
app.use('*', index)

app.set('view engine', 'ejs')

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error', {error: res.locals.err ? err.message : ''})
})


module.exports = app
