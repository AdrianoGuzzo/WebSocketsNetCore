var Chat = function (username) {
    var webSocketConfig = new WebSocketConfig('wsChat', {
        username: username
    });

    webSocketConfig.socket.onopen = e => {
        console.log("socket opened", e);
    };

    webSocketConfig.socket.onclose = function (e) {
        debugger;
        console.log("socket closed", e);
    };

    webSocketConfig.socket.onmessage = function (e) {
        debugger;
        var json = JSON.parse(e.data);
        console.log(json);
        switch (json.Tipo) {
            case "ListaUsuarios":
            case "Sair":
                $('#lista').html("");
                for (var i in json.Lista) {
                    $('#lista').append("<p class='nome'>" + json.Lista[i] + "</p>");
                }
                if (json.Tipo =="ListaUsuarios")
                    $('#msgs').append('<p style="color:green"><span class="nome">' + json.User.Nome + '</span> entrou na sala</p>');
                if (json.Tipo == "Sair")
                    $('#msgs').append('<p style="color:red"><span class="nome">' + json.User.Nome + '</span> saiu da sala</p>');
                break;

            case "Mensagem":
                $('#msgs').append('<p><span class="nome">' + json.Nome + ':</span> ' + json.Mensagem + '</p>');
                window.scrollTo(0, document.body.scrollHeight);
                break;          
        }
    };

    webSocketConfig.socket.onerror = function (e) {
        console.error(e.data);
    };

    $('#MessageField').keypress(function (e) {
        if (e.which != 13) {
            return;
        }
        e.preventDefault();
        var message = $('#MessageField').val();
        webSocketConfig.socket.send(message);
        $('#MessageField').val('');
    });
}
$('#InputName').keypress(function (e) {
    if (e.which != 13) {
        return;
    }
    e.preventDefault();
    var name = $('#InputName').val();
    chat = new Chat(name);
    $("#panelName").hide();
    $(".panelChat").show();
});