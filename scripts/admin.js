var xhr;
var datos = new Array();
var postAModificar;

//lo primero que hago es preguntar si hay localStorage.
/*if(localStorage){
    if(localStorage.token){
        validateUser(localStorage.token);
    }
}*/

function validateUser(token){
    $.ajax({
        url: "http://localhost:3000/login", 
        method:'POST',
        headers:{
            'authorization' : token
        },
        success: function(result,status,response){
            //si pudo logearse, existe token
            //tiene rol de admin?
            if(result.user.role ==="admin"){
                console.log(result.message);
                //si está clickeado "recordarme", lo guardo:
                if($("input:checkbox").val()==="on"){
                    localStorage.token = result.token;
                }
                window.location.replace(response.getResponseHeader('redirect'));
            }
            else{
                alert("No tiene permisos suficientes");
            }
            
        },
        error: function(jqXHR,textStatus,errorThrown ){
            console.log(errorThrown);
        },
        complete:function(jqXHR, textStatus){
            console.log(textStatus);
        }
    });
}

window.onload = function(){
    this.document.getElementById("btnGuardar").addEventListener("click",function(){

        guardar();
    });
    this.document.getElementById("btnUpload").addEventListener("click",function(){

        upload();
    });
    $('form').on('submit', function(e){
        e.preventDefault();  
    });
    $('#txtFile').on('change',function(e){
       // $("#imgFoto").attr("src",$('#txtFile').val()); //esto lo puedo hacer si hago workaround para
       //cargar archivos locales en mi pagina. primero hago el upload
    });
    cargarDatos();

};

function upload(){
    var formData = new FormData($("form")[0]);
    $.ajax({
        url: "http://localhost:3000/upload", 
        method:'POST',
        contentType: false,
        processData: false,
        data:formData,
        headers:{
            'authorization' : localStorage.token
        },
        success: function(result){
           console.log(result.message);
           cargarDatos();
           limpiarFormulario();
           postAModificar = null;
        },
        error: function(jqXHR,textStatus,errorThrown ){
            console.log(errorThrown);
        },
        complete:function(jqXHR, textStatus){
            console.log(textStatus);
        }
    });
}
function guardar(){
            //es un usuario autenticado?
        //miro localStorage
        var formData = new FormData($("form")[0]);
        
    if(localStorage){
        var token = localStorage.token;
        if(token){
            //recupero los valores del dom
            var titulo = document.getElementById("txtTitulo");
            var articulo = document.getElementById("txtArticulo");
            var mas = document.getElementById("txtMas");
            //var foto = document.getElementById("txtFoto");
            var data;
            //es modificacion o alta?
            if(postAModificar){
                data = {
                    "titulo": titulo.value,
                    "articulo": articulo.value,
                    "mas": mas.value,
                    "collection": "posts",
                    "id": postAModificar.id,
                    "active" : postAModificar.active,
                    "created_dttm" : postAModificar.created_dttm
                }
                enviarModificacion(data);
            }
            else{
                //es nuevo. no tiene ID
                data = {
                    "titulo": titulo.value,
                    "articulo": articulo.value,
                    "mas": mas.value,
                    "collection": "posts"
                }
                formData.append("collection","posts");
                for (var [key, value] of formData.entries()) { 
                    console.log(key, value);
                  }
                enviarAlta(formData);
            }   
        }
        else{
            $("#divLogin").modal();
        }
    }
}

function enviarModificacion(data){
    $.ajax({
        url: "http://localhost:3000/modificar", 
        method:'POST',
        data:data,
        headers:{
            'authorization' : localStorage.token
        },
        success: function(result){
           console.log(result.message);
           cargarDatos();
           limpiarFormulario();
           postAModificar = null;
        },
        error: function(jqXHR,textStatus,errorThrown ){
            console.log(errorThrown);
        },
        complete:function(jqXHR, textStatus){
            console.log(textStatus);
        }
    });
}

function limpiarFormulario(){
    document.getElementById("txtTitulo").value = "";
    document.getElementById("txtArticulo").value = "";
    document.getElementById("txtMas").value = "";
}
function enviarAlta(data){
    $.ajax({
        url: "http://localhost:3000/agregar", 
        method:'POST',
        contentType: false,
        processData: false,
        data:data,
        headers:{
            'authorization' : localStorage.token
        },
        success: function(result){
           console.log(result.message);
           cargarDatos();
           limpiarFormulario();
           postAModificar = null;
        },
        error: function(jqXHR,textStatus,errorThrown ){
            console.log(errorThrown);
        },
        complete:function(jqXHR, textStatus){
            console.log(textStatus);
        }
    });
}

function cargarDatos(){
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200) {
           var resp = JSON.parse(this.response); 
           console.log(resp.message);
           refrescarTabla(resp.data);
           datos = resp.data;
        }
    };
    var url = "http://localhost:3000/traer?collection=posts";
    xhr.open("GET",url,true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    
}

function refrescarTabla(data){
    var tabla = this.document.getElementById("tblPosts");
    var nuevasFilas="";
    //punto de parcial: mejorar carga
    for(var i in data){
        nuevasFilas += "<tr>";
        nuevasFilas += "<td>" + data[i].id + "</td>";
        nuevasFilas += "<td>" + data[i].created_dttm + "</td>";
        nuevasFilas += "<td>" + data[i].titulo + "</td>";
        nuevasFilas += "<td>" + data[i].articulo + "</td>";
        nuevasFilas += "<td><input type='button' class ='btn btn-warning' value='Modificar' onclick='modificar(" + data[i].id + ");'></td>";
        nuevasFilas += "<td><input type='button' class ='btn btn-danger' value='Borrar' onclick='borrar(" + data[i].id + ");'></td>";
        nuevasFilas += "</tr>";
    }
    tabla.children[2].innerHTML = nuevasFilas;
}

function borrar(id){
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200) {
           var resp = JSON.parse(this.response); 
           console.log(resp.message);
           cargarDatos();
        }
    };
    xhr.open("POST","http://localhost:3000/eliminar",true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({"collection":"posts","id": id}));
    
}


function modificar(id){
    //obtengo el post que hay que modificar
    postAModificar = datos.find(x => x.id === id);
    document.getElementById("txtTitulo").value = postAModificar.titulo;
    document.getElementById("txtArticulo").value = postAModificar.articulo;
    document.getElementById("txtMas").value = postAModificar.mas;
     
    
}