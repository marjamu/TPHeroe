var port = 3000;
var bodyParser = require('body-parser');
var cors = require('cors');
var path = require('path');
var jwt = require('jsonwebtoken');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

io.on('connection', function(socket){
    console.log('a user connected');
});

app.use(cors());
app.use(express.static(__dirname));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/agregar',verifyToken, function (req, res) {
    jwt.verify(req.token,'secretKey', (error,authData)=>{
        if(error){
            res.sendStatus(403);
        }
        else{
            var collection = req.body.collection;
            var nuevoObjeto = req.body;

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
                setTimeout(function(){res.send(response);    },5000);
            }
           
            });  
        }
    });
    
    
});

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
function getPathFromCollection(collection){
    if(collection==="Personas"){
        return '/data/people.json';
    }
    if(collection==="posts"){
        return '/data/posts.json';
    }
}
function remove(a){
    a.active = false;
}

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

app.post('/login', function (req, res) {
    //MOCK USER
    var u = req.body;

    var user = {
        id:1,
        username:u.usuario,
        email: u.usuario + "@gmail.com",
        role:"admin"
    };

    jwt.sign({user},'secretKey',(err,token) => {
         //armo respuesta
        var rta = {
            message: "Log in exitoso",
            user: user,
            token:token 
        }
          res.append('Redirect', 'http://localhost:3000/index.html');
        res.send(rta);
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


http.listen(port ,function(){
    console.log('Servidor web iniciado. Escuchando en el puerto ' + port);
});