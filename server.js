const express = require('express')
const app = express()
const cors = require('cors')
const port = 5000
const fs = require('node:fs')
const { exec } = require('node:child_process')

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}

//read file content
app.get('/readFile', cors(corsOptions), (req, res) => {
  const content = fs.readFileSync('./src/apps/' + req.query.path, 'utf8')
  res.send(content)
})

//write or update file content
app.get('/writeFile', cors(), (req, res) => {
  if(req?.query?.type === 'append') {
    fs.appendFileSync('./src/apps/' + req.query.path, req.query.content, { encoding: 'utf8' })
  } else {
    fs.writeFileSync('./src/apps/' + req.query.path, req.query.content, { encoding: 'utf8' })
  }
  res.json({ res: 'success' })
})

//get file list inside a directory
app.get('/readFolder', cors(corsOptions), (req, res) => {
  const content = fs.readdirSync('./src/apps/' + req.query.path)
  res.json(content)
})

//create file inside a directory
app.get('/newFile', cors(corsOptions), (req, res) => {
  const exists = fs.existsSync('./src/apps/'  + req.query.path)
  if(exists) {
    res.json({res: 'File Already Exists'})
  } else {
    fs.writeFileSync('./src/apps/' + req.query.path, '', 'utf8')
    res.json({res: 'success'})
  }
})

//install modules
app.get('/installModule', cors(corsOptions), (req, res) => {
  exec('yarn add ' + req.query.name, (err, out) => {
    if(err) {
      res.json({res: err})
    } else {
      res.json({res: 'success', output: out})
    }
  })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})