window.onload = function(){

    $('form').on('submit', function(e){
        e.preventDefault();  
    });

    $("#btnLogIn").click(function(e){;
        login();
    });

};

function login(){
    data = {
        "usuario": $("#txtUsuario").val(),
        "password": $("#txtPassword").val()
    };
    $.ajax({
        url: "http://localhost:3000/login", 
        method:'POST',
        data:{"collection":"users",
                "data":data},
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