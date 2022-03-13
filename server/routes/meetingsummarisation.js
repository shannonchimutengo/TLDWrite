const express = require('express')
const multer = require('multer')
const path = require('path')
const spawn = require('child_process').spawn
const hasbin = require('hasbin')
const fs = require("fs");

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

const router = express.Router()

const storage = multer.diskStorage({
  destination: `${path.resolve('./')}/public/uploads`,
  filename: function(req, file, cb){
     cb(null, + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({ storage: storage }).single('file')

router.post("/", async(req, res) => {
  
  console.log('Post request received: meetingsummarisation')

    try {
      upload(req, res, async () => {
        if (req.file === undefined) {
          return res.status(400).json({message:"No File Found. Try again"})
        }

        if(path.extname(req.file.filename) !== ".mp4" && path.extname(req.file.filename) !== ".mp3" && path.extname(req.file.filename) !== ".wav") {
          return res.status(400).json({message: "Upload only .wav or .mp3 or .mp4 files"})
        }

        if(path.extname(req.file.filename) === ".mp3") {
          let track = `${path.resolve('./')}/public/uploads/${req.file.filename.toString()}`
          
          ffmpeg(track)
            .toFormat('wav')
            .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
            })
            .on('progress', (progress) => {
                // console.log(JSON.stringify(progress));
                console.log('Processing: ' + progress.targetSize + ' KB converted');
            })
            .on('end', () => {
                console.log('Processing finished !');
            })
            .save(`${path.resolve('./')}/public/uploads/${req.file.filename.toString().slice(0, -4)}`+'.wav');
        }

        if(path.extname(req.file.filename) === ".mp4")
        {
          let track = `${path.resolve('./')}/public/uploads/${req.file.filename.toString()}`
          ffmpeg(track)
            .toFormat('wav')
            .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
            })
            .on('progress', (progress) => {
                // console.log(JSON.stringify(progress));
                console.log('Processing: ' + progress.targetSize + ' KB converted');
            })
            .on('end', () => {
                console.log('Processing finished !');
            })
            .save(`${path.resolve('./')}/public/uploads/${req.file.filename.toString().slice(0, -4)}`+'.wav');
        }

        let py;
        req.file.filename = req.file.filename.toString().slice(0, -4)+'.wav'
        console.log(req.file.filename)
        //Running ASR for Speech-to-Text 
        if(hasbin.sync('python') === true) {
          py = spawn('python', ['converter.py', req.file.filename.toString(), "true"])
        }
        else if(hasbin.sync('python3') === true) {
          py = spawn('python3', ['converter.py', req.file.filename.toString(), "true"])
        }
        else {
          return res.status(500).send("Python not found!!! :(")
        }
          
        py.stdout.on('data', data => {
          const text = data.toString()
          console.log(text)

          if (text === "Error Occurred") {
            return res.status(500).json({message: text})
          }

          var fileName = req.file.filename.toString()
          fileName = fileName.substring(0, fileName.indexOf('.'))+".txt"

          const content = fs.readFileSync(`./public/textsummarization/${fileName}`).toString();

          console.log(content)
          res.status(200).json({content: content})
        })
      })
    }
    catch(ex) {
      res.status(500).send("Some error occurred. Try again")
    }
})

module.exports = router
