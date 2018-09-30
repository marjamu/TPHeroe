var socket;
var xhr;
var datos = new Array();



function cargarDatos(){
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200) {
           var resp = JSON.parse(this.response); 
           console.log(resp.message);
           datos = resp.data;
           cargarPosts();
        }
    };
    var url = "http://localhost:3000/traer?collection=posts";
    xhr.open("GET",url,true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    
}

window.onload = function(){
    cargarDatos();
    socket = io();
    socket.emit('holamundo',"Hola Mundo");
    socket.on('newpostAlert', function(msg){
        alert("Nuevo articulo publicado!! \nTitulo: " + msg.data.titulo);
    });
}

function showNewPostAlert(post){
    if($("#divAlerta")){
        //si existe el div, solamente le cambio el contenido
        $("#divAlerta")
    }
    else{
        //construo el div
        var divAlerta = `<div id="divAlerta">
                             </div>`
    }
}


function cargarPosts(){
    var posts = document.getElementsByTagName("main");
    posts[0].innerHTML = "";
    var post = "";
    /*for(var i = 0;i<datos.length;i++){
        post += `<article><h2> ` + datos[i].titulo + `</h2>
        <img src="img/imagen_2.jpg" alt="Imagen puente de la torre">
        <p> `+ datos[i].articulo + ` </p>    
        <a href="#" class="boton">Leer más</a>
        </article>`;
        //posts.innerHTML += post;
        //posts.appendChild(post);
    }*/
    for(var i = 0;i<datos.length;i++){
        if(i==0){
            
            post += `<div class='row'>`
            
        }
        if(((i+2)%2==0)&&(i!=0)){
            post += `</div>`
            post += `<div class='row'>`
        }
        
        post += `
        <div class = 'col-md-6'>
            <div class = 'h2'> ` + datos[i].titulo + `</div>
            <div>
                <img class='img-fluid' src="img/imagen_2.jpg" alt="Imagen puente de la torre">
            </div>
            <div>
                <p> `+ datos[i].articulo + ` </p>    
                <a href="#" class="btn btn-primary">Leer más</a>
            </div>
            
        </div>`;
        //posts.innerHTML += post;
        //posts.appendChild(post);

        
    }
    
    posts[0].innerHTML = post;
    
}

$("#btnAJAXPOST").click(function(){
        data = {
            "titulo": "Nuevo post",
            "articulo": "Nuevo articulo",
            "mas": "Nuevo mas",
            "collection": "posts"
        }
        $.ajax({
            url: "http://localhost:3000/agregar", 
            method:'POST',
            data:data,
            success: function(result){
                var a = result;
                console.log(a.message);
            },
            error: function(jqXHR,textStatus,errorThrown ){
                console.log(errorThrown);
            },
            complete:function(jqXHR, textStatus){
                console.log(textStatus);
            }
        });
    });