var fs = require('fs'),
    express = require('express'),
    https = require('https'),
    bodyParser = require('body-parser'),
    lang = require('language-classifier');

const spawn = require('child_process').spawn;

var https_options = {
  key: fs.readFileSync('./localhost-key.pem'),
  cert: fs.readFileSync('./localhost-cert.pem')
};

var PORT = 8443,
    HOST = 'localhost';

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// set static routes
app.use('/', express.static(__dirname + '/src'));
app.use('/content', express.static(__dirname + '/content'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

var server = https.createServer(https_options, app)
                  .listen(PORT, HOST);

var io = require('socket.io')(server);

io.on('connection', function (socket) {
  socket.emit('connected', { text: 'connected' });


  socket.on('data', function(data) {
    fs.writeFile('junk.txt', data.text, function(err) {
        if (err) {
          return console.log(err);
        }
      })
    //   
    // console.log(data.text);
    var text =  data.text.trim().replace(/(?:\r\n|\r|\n)/g, '\n').replace(/[^\x00-\x7F]/g, "");
    var language = null;
    var extension = null;
    
    if (text.startsWith('```') && text.endsWith('```')) {

      var lines = text.split('\n');
      var firstLine = lines[0];
      var trimmedLines = lines.slice(1, lines.length -1).join('\n');
      
      language = firstLine.substring(firstLine.lastIndexOf(" ")+1)
      text = trimmedLines;

      extension = get_extension(language);

      console.log(firstLine)
    }
    else {
      language = lang(text);
      extension = get_extension(language);
    }
    
    
    // if (language === 'html') {
    //   console.log('HTML')
    //   var filename = 'test.html'
    //   fs.writeFile(filename, text, function(err) {
    //     if (err) {
    //       return console.log(err);
    //     }
    //   })
    // }
    // else if (language === 'shell') {
    //   var filename = 'test.sh';
    //   fs.writeFile(filename, text, function(err) {
    //     if (err) {
    //       return console.log(err);
    //     }
    //   })
    // }

    if (extension === null){
      // res.send('ERROR: Cannot detect language');
      // res.status(500).send('ERROR: Cannot detect language');
      console.log(language);
      socket.emit('compile_error', {data: 'ERROR: Cannot detect language' });
    }
    else {
      console.log(language);
      socket.emit('lang', {lang: language, text: text});
      var extension = get_extension(language);
      var filename = 'test' + extension;
      
      if (language === 'javascript') {
        fs.writeFile(filename, text, function(err) {
          if (err) {
            return console.log(err);
          }
          

          const process = spawn('node', [filename]); 

          process.stdout.on('data', function(data) {
            // console.log(`${data}`);
            socket.emit('output', { data: `${data}`});
          })

          process.stderr.on('data', function(data) {
            // console.log(`stderr: ${data}`);
            
            socket.emit('compile_error', {data: `${data}`});
            // fs.unlink(filename);
          })

          process.on('close', function(code) {
            console.log(`child process exited with code ${code}`);
            socket.emit('end', {data: 'end'})
            // fs.unlink(filename);
          })

          socket.on('exit', function() {
            process.kill();
          })
        }); 
      }

      else if (language === 'c') {
        fs.writeFile(filename, text, function(err) {
          if (err) {
            return console.log(err);
          }

          const process = spawn('gcc', [filename]); 

          process.stdout.on('data', function(data) {
            // console.log(`${data}`);
            socket.emit('output', { data: `${data}`});
          })

          process.stderr.on('data', function(data) {
            // console.log(`stderr: ${data}`);
            
            socket.emit('compile_error', {data: `${data}`});
            // fs.unlink(filename);
          })

          process.on('close', function(code) {
            console.log(`child process exited with code ${code}`);
            // socket.emit('end', {data: 'end'})
            // fs.unlink(filename);
            const process2 = spawn('./a.out');

            process2.stdout.on('data', function(data) {
            // console.log(`${data}`);
              socket.emit('output', { data: `${data}`});
            })

            process2.stderr.on('data', function(data) {
              // console.log(`stderr: ${data}`);
              socket.emit('compile_error', {data: `${data}`});
              // fs.unlink(filename);
            })
            process2.on('close', function(code) {
              console.log(`child process exited with code ${code}`);
              socket.emit('end', {data: 'end'})
            })

            socket.on('exit', function() {
              process2.kill();
            })
          })

          socket.on('exit', function() {
            process.kill();
          })
        }); 
      }

      else if (language === 'python') {
        fs.writeFile(filename, text, function(err) {
          if (err) {
            return console.log(err);
          }
          

          const process = spawn('python', [filename]); 

          process.stdout.on('data', function(data) {
            // console.log(`${data}`);
            socket.emit('output', { data: `${data}`});
          })

          process.stderr.on('data', function(data) {
            // console.log(`stderr: ${data}`);
            
            socket.emit('compile_error', {data: `${data}`});
            // fs.unlink(filename);
          })

          process.on('close', function(code) {
            console.log(`child process exited with code ${code}`);
            socket.emit('end', {data: 'end'})
            // fs.unlink(filename);
          })

          socket.on('exit', function() {
            process.kill();
          })
        }); 
      }
      
      else if (language === 'java') {
        var classIndex = text.split(' ').findIndex(function(el) {
          return el === 'class'
        })

        var className = text.split(' ')[classIndex + 1];

        filename = className + extension;
        
        fs.writeFile(filename, text, function(err) {
          if (err) {
            return console.log(err);
          }

          const process = spawn('javac', [filename]); 

          process.stdout.on('data', function(data) {
            // console.log(`${data}`);
            socket.emit('output', { data: `${data}`});
          })

          process.stderr.on('data', function(data) {
            // console.log(`stderr: ${data}`);         
            socket.emit('compile_error', {data: `${data}`});
            // fs.unlink(filename);
          })

          process.on('close', function(code) {
            console.log(`child process exited with code ${code}`);
            // socket.emit('end', {data: 'end'})
            // fs.unlink(filename);
            const process2 = spawn('java', [className]);


            process2.stdout.on('data', function(data) {
              // console.log(`${data}`);
              socket.emit('output', { data: `${data}`});
            })

            process2.stderr.on('data', function(data) {
              // console.log(`stderr: ${data}`);         
              socket.emit('compile_error', {data: `${data}`});
              // fs.unlink(filename);
            })

            process2.on('close', function(code) {
              console.log(`child process exited with code ${code}`);
              socket.emit('end', {data: 'end'})
            });

            socket.on('exit', function() {
              process2.kill();
            })
          })

          socket.on('exit', function() {
            process.kill();
          })
        }); 
      }
    }

  })
});


function get_extension(language) {
  switch(language) {
    case 'javascript':
      return '.js';
    case 'ruby':
      return '.rb'
    case 'python':
      return '.py'
    case 'java':
      return '.java'
    // case 'objective-c':
    //   return '.m';
    // case 'html':
    //   return '.html'
    // case 'css':
    //   return '.css';
    case 'shell':
      return '.sh';
    case 'c++':
      return '.cpp';
    case 'c':
      return '.c';
    default:
      return null;
  }
}


console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');
console.log('HTTPS Server listening @ https://%s:%s', HOST, PORT);
console.log('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+');