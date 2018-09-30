var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })


app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/admin.html',function(){
    console.log("pide admin.html");
});

app.get('/login',function(req,res){
    res.sendFile(__dirname + '/login.html');
});

app.get('/admin',function(req,res){
    res.sendFile(__dirname + '/admin.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
    socket.on("holamundo",function(message){
        console.log(message);
    })
  });

  app.post('/login', function (req, res) {
    //MOCK USER
    var u = req.body;
    var user;
    require('fs').readFile(__dirname + getPathFromCollection(req.body.collection), 'utf8', function (err, data) {
        if (err) {
            throw err; 
        }
        else if(data === undefined){
            throw("No se encontro la data solicitada");
        }

           var array = JSON.parse(data);
           array = array.filter(function(a){
             return a.active == true && a.password == u['data[password]'] && a.name == u['data[usuario]'];
           });
           
           if(array.length==0){
            res.sendStatus(403);
           }
           else if(array>1){
            res.sendStatus(500);
           }
           else{
               user = array[0];
           
           //setTimeout(function(){res.send({"message": "Carga exitosa","data":array});},5000);

                jwt.sign({user},'secretKey',(err,token) => {
                    //armo respuesta
                var rta = {
                    message: "Log in exitoso",
                    user: user,
                    token:token 
                }
                    res.append('redirect', 'http://localhost:3000/admin.html');
                res.send(rta);
                
                });
            }
    });  


  
}); 

app.get('/traer', function (req, res) {

    var url = require('url');
    var parts = url.parse(req.url, true);
    var query = parts.query;
    require('fs').readFile(__dirname + getPathFromCollection(query.collection), 'utf8', function (err, data) {
        if (err) {
            throw err; 
        }
        else if(data === undefined){
            throw("No se encontro la data solicitada");
        }

           var array = JSON.parse(data);
           array = array.filter(function(a){
             return a.active == true;
           });
           
           setTimeout(function(){res.send({"message": "Carga exitosa","data":array});},5000);
    });  
});

app.post('/eliminar', function (req, res) {

    var indice = req.body.id;
    var array;
    require('fs').readFile(__dirname + getPathFromCollection(req.body.collection), 'utf8', function (err, data) {
        if (err) {
            // error handling
        }
           array = JSON.parse(data);
           var objectToDelete = array.filter(function(a){
             return a.id == indice;
           });
          remove(objectToDelete[0]);
          require('fs').writeFileSync(__dirname + getPathFromCollection(req.body.collection), JSON.stringify(array));
          res.send({"message":"Baja exitosa"}); 
    });  

});

app.post('/upload', function(req, res) {
	var upload = multer({
		storage: storage
    }).single('txtFile')
    upload(req, res, function(err) {
		res.end('File is uploaded')
	})

})
app.post('/agregar',verifyToken,multer({storage: storage}).single('txtFile'), function (req, res) {
//app.post('/agregar',verifyToken, function (req, res) {
    //codigo para subir archivo
    var collection = req.body.collection;
    var nuevoObjeto = req.body;
    nuevoObjeto.foto = req.file.filename;
    /*var upload = multer({
		storage: storage
    }).single('txtFile')
    upload(req, res, function(err) {
		res.end('File is uploaded')
	})*/
    
    jwt.verify(req.token,'secretKey', (error,authData)=>{
        if(error){
            res.sendStatus(403);
        }
        else{
            //var collection = req.body.collection;
            //var nuevoObjeto = req.body;

            require('fs').readFile(__dirname + getPathFromCollection(collection), 'utf8', function (err, data) {
            if (err) {
                 throw err; // error handling
            }else{
                array = JSON.parse(data);
                nuevoObjeto.id = getID(array);
                nuevoObjeto.active = true;
                nuevoObjeto.created_dttm = new Date().toLocaleString();
                array.push(nuevoObjeto);
                require('fs').writeFileSync(__dirname + getPathFromCollection(collection), JSON.stringify(array));
                //build response
                var response = {
                    message: "Alta exitosa",
                    data: array
                }
                io.emit("newpostAlert",{"response":response,data:nuevoObjeto});
                setTimeout(function(){res.send(response);    },5000);
            }
           
            });  
        }
    });
});

app.post('/modificar', function (req, res) {
    var object = req.body;
    var array = new Array();
    require('fs').readFile(__dirname + getPathFromCollection(req.body.collection), 'utf8', function (err, data) {
        if (err) {
            // error handling
        }
           array = JSON.parse(data);
           //obtengo index del id que necesito
           var index = array.findIndex(function(obj){return obj.id === object.id;})
           array[index] = object;

          require('fs').writeFileSync(__dirname + getPathFromCollection(req.body.collection), JSON.stringify(array));
          res.send('Modificacion exitosa'); 
    });  
 
});

function getPathFromCollection(collection){
    if(collection==="Personas"){
        return '/data/people.json';
    }
    if(collection==="posts"){
        return '/data/posts.json';
    }
    if(collection==="users"){
        return '/data/users.json';
    }
}

function remove(a){
    a.active = false;
}

//FORMAT OF TOKEN
//Authorization : Bearer <access_token>
function verifyToken(req,res,next){
    //get auth header value
    var bearerHeader = req.headers['authorization'];

    if(bearerHeader!=""){
        req.token = bearerHeader;
        next();
    }
    else{
        //Forbidden
        res.sendStatus(403);
    }
}

function getID(array){
    if(array.length == 0){
        return 1;
    }
    else if(array.length == 1){
        return 2;
    }
    else{
        var maxIndex = array.reduce(function(prev,curr,index){
            if(prev.id>curr.id)
            return prev.id;
            else
            return curr.id;
        });
        return maxIndex+1;
    }
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});