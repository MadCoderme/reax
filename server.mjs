import express from 'express'
const app = express()
import cors from 'cors'
const port = 5000
import fs from 'node:fs'
import { globby, globbySync } from 'globby'
import { Octokit } from 'octokit'
import http from 'http'
import { Server } from "socket.io";
import { exec } from 'node:child_process'

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}

const octo = new Octokit({
})

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
      origin: ["http://localhost:3000", "http://192.168.0.104:3000"]
  }
});

app.use(express.json())
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
})

//read file content
app.get('/readFile', cors(corsOptions), (req, res) => {
  const content = fs.readFileSync('./src/apps/' + req.query.path, 'utf8')
  res.send(content)
})

//write or update file content
app.get('/writeFile', cors(corsOptions), (req, res) => {
  let encoding = req?.query?.encoding ?? 'utf8'
  if(req?.query?.type === 'append') {
    fs.appendFileSync('./src/apps/' + req.query.path, req.query.content, { encoding })
  } else {
    fs.writeFileSync('./src/apps/' + req.query.path, req.query.content, { encoding })
  }
  res.json({ res: 'success' })
})

//write or update file content
app.post('/writeFile', cors(corsOptions), (req, res) => {
  fs.writeFileSync('./src/apps/' + req.body.path, req.body.content, { encoding: 'utf8' })
  res.json({ res: 'success' })
})

//delete a file
app.get('/deleteFile', cors(corsOptions), (req, res) => {
  fs.rmSync('./src/apps/' + req.query?.path)
  res.json({ res: 'success' })
})

//get file list inside a directory
app.get('/readFolder', cors(corsOptions), (req, res) => {
  const content = fs.readdirSync('./src/apps/' + req.query.path, { withFileTypes: true })
  .filter(item => req.query?.includeFolders ? true : !item.isDirectory())
  .map(item => item.name)
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

//create new project directory
app.get('/newProject', cors(corsOptions), (req, res) => {
  try {
    if(req.query?.id) {
      const id = req.query?.id
      fs.mkdirSync('./src/apps/' + id)
      fs.mkdirSync('./src/apps/' + id + '/src/components', { recursive: true })
      fs.mkdirSync('./src/apps/' + id + '/src/utils')
      fs.writeFileSync('./src/apps/' + id + '/src/index.js', indexTemplate)
      fs.writeFileSync('./src/apps/' + id + '/package.json', packageTemplate(req.query?.name))
      fs.writeFileSync('./src/apps/' + id + '/git.json', gitTemplate(req.query?.name))
      fs.writeFileSync('./src/apps/' + id + '/appearance.json', appearanceTemplate(req.query?.name, req.query?.id))
      res.json({res: 'success'})
    }
  } catch (err) {
    res.json({err})
    console.log(err)
  }
})


//glob
app.get('/glob', cors(corsOptions), async(req, res) => {
  const filesPaths = await globby('src/apps/' + req.query.path)
  res.json(filesPaths)
})

//add file for github management
app.get('/addFileForGithub', cors(corsOptions), async(req, res) => {
  try {
    let content = JSON.parse(fs.readFileSync('./src/apps/'+req.query.app+'/git.json', 'utf8'))
    let files = content?.treeFiles
    const globbedPath = globbySync('src/apps/' + req.query.path)
    if(!files.includes(globbedPath[0])) {
      files.push(globbedPath[0])
      content.treeFiles = files
      fs.writeFileSync('./src/apps/'+req.query.app+'/git.json', JSON.stringify(content))
    }
    res.json({res: 'success'})
  } catch (e) {
    res.json({err: e})
  }
})

//add dir for github management
app.get('/addDirForGithub', cors(corsOptions), async(req, res) => {
  try {
    let content = JSON.parse(fs.readFileSync('./src/apps/'+req.query.app+'/git.json', 'utf8'))
    const globbedPath = globbySync('./src/apps/' + req.query.app)
    content.treeFiles = globbedPath
    fs.writeFileSync('./src/apps/'+req.query.app+'/git.json', JSON.stringify(content))
    res.json({res: 'success'})
  } catch (e) {
    res.json({err: e})
  }
})

//read files for github management
app.get('/readFiles', cors(corsOptions), async(req, res) => {
  try {
    const files = JSON.parse(req.query.files)
    let formattedFileArr = []
    files.forEach(el => {
      if(el.startsWith('DEL-')) {
        formattedFileArr.push({
          path: el.replace('DEL-', '').replace(req.query.root, ''),
          type: 'blob',
          mode: '100644',
          sha: null
        })
      } else {
        let content = el.includes('public/icon.') ? fs.readFileSync(el, 'base64') :  fs.readFileSync(el, 'utf-8')
        formattedFileArr.push({
          content, 
          path: el.replace(req.query.root, ''),
          type: 'commit',
          mode: '100644'
        })
      }
    })

    res.json(formattedFileArr)
  } catch (e) {
    console.log(e)
    res.json({err: e})
  }
})

//create content for public folder
app.get('/createPublicFolder', cors(corsOptions), async(req, res) => {
  try {
    let content = JSON.parse(fs.readFileSync('./src/apps/'+req.query.app+'/appearance.json', 'utf8'))
    if(!fs.existsSync('./src/apps/'+req.query.app+'/public')) {
      fs.mkdirSync('./src/apps/'+req.query.app+'/public')
    }

    fs.writeFileSync('./src/apps/'+req.query.app+'/public/manifest.json', 
        ManifestJSON(content?.shortName, content?.name, content?.themeColor, content?.backgroundColor), 'utf-8')

    content?.robotsTxt && fs.writeFileSync('./src/apps/'+req.query.app+'/public/robots.txt', content?.robotsTxt, 'utf-8')
    
    let type = 'png'
    if(content?.icon) {
      if(content?.icon.startsWith('data:image/webp;base64')) type = 'webp'
      else if(content?.icon.startsWith('data:image/jpeg;base64')) type = 'jpg'
      else if(content?.icon.startsWith('data:image/jpg;base64')) type = 'jpg'
      else if(content?.icon.startsWith('data:image/png;base64')) type = 'png'

      let base64Data = content?.icon.replace(/^data:([A-Za-z-+\/]+);base64,/, '')
      fs.writeFileSync('./src/apps/'+req.query.app+'/public/icon.' + type, base64Data, 'base64')

      delete content.icon
      fs.writeFileSync('./src/apps/'+req.query.app+'/appearance.json', JSON.stringify(content, null, '\t'), 'utf8')
    }

    fs.writeFileSync('./src/apps/'+req.query.app+'/public/index.html', 
        IndexHTML(content?.name, content?.description, type, content?.lang), 'utf-8')

    res.json({res: 'success'})
  } catch (e) {
    console.log(e)
    res.json({err: e})
  }
})

//clean public folder
app.get('/cleanPublicFolder', cors(corsOptions), async(req, res) => {
  try {
    fs.rmdirSync('./src/apps/'+req.query.app+'/public', {
      force: true,
      recursive: true
    })

    if(req.query.icon) {
      let content = JSON.parse(fs.readFileSync('./src/apps/'+req.query.app+'/appearance.json', 'utf8'))
      content.icon = req.query.icon
      fs.writeFileSync('./src/apps/'+req.query.app+'/appearance.json', JSON.stringify(content, null, '\t'), 'utf8')
    }

    res.json({res: 'success'})
  } catch (e) {
    res.json({err: e})
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


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('code', e => {
    socket.broadcast.emit('code', e)
  })

  socket.on('cursorPos', e => {
    socket.broadcast.emit('cursorPos', e)
  })

  socket.on('fileSwitch', e => {
    socket.broadcast.emit('fileSwitch', e)
  })

  fs.watch('./src/apps/').on('change', (event, file) => {
    if(fs.existsSync('./src/apps/' + file)) {
      socket.emit('apps', file)
    }
  })

});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})





//template for public dir content
const IndexHTML = (name, description, iconType, lang) => `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/icon.${iconType}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="${description}"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/icon.${iconType}" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />

    <link rel="stylesheet" href="styles.css" />
    <title>${name}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`

const ManifestJSON = (shortName, name, themeColor, backgroundColor) => `{
  "short_name": "${shortName}",
  "name": "${name}",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "${themeColor}",
  "background_color": "${backgroundColor}"
}
`

const indexTemplate = 
`
import React from 'react'

export default function App() { 
    return (
        <h1>Hello world</h1>
    )
}
`

const packageTemplate = (name) => 
`{
  "name": "${name}",
  "version": "0.0.1",
  "dependencies": {
      "@testing-library/jest-dom": "^5.16.5",
      "@testing-library/react": "^13.4.0",
      "@testing-library/user-event": "^13.5.0",
      "react": "1.0.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "web-vitals": "^2.1.4"
  },
  "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
  },
  "eslintConfig": {
      "extends": ["react-app", "react-app/jest"]
  },
  "browserslist": {
      "production": [">0.2%", "not dead", "not op_mini all"],
      "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}`

const gitTemplate = (name) => `{"repo": "${name}", "treeFiles": [], "isSetup": false, "commitSHA": "", "newCommitSHA": ""}`
const appearanceTemplate = (name, id) => 
`{
	"name": "${name} - ${id}",
	"shortName": "${name}",
	"description": "",
	"lang": "en",
	"themeColor": "black",
	"backgroundColor": "white",
	"icon": ""
}`