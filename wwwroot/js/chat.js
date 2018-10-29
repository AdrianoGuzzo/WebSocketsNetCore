$(function () {
    var userName = '@Model';

    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    var wsUri = protocol + "//" + window.location.host + '/wsChat';
    
    var socket = new WebSocket(wsUri);
    console.log(socket);
    socket.onopen = e => {
        console.log("socket opened", e);
    };

    socket.onclose = function (e) {
        console.log("socket closed", e);
    };

    socket.onmessage = function (e) {
        
        console.log(e);
        $('#msgs').append(e.data + '<br />');
    };

    socket.onerror = function (e) {
        console.error(e.data);
    };

    $('#MessageField').keypress(function (e) {
        if (e.which != 13) {
            return;
        }

        e.preventDefault();

        var message = userName + ": " + $('#MessageField').val();
        socket.send(message);
        $('#MessageField').val('');
    });
});