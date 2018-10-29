var connectionForm = document.getElementById("connectionForm");
var connectionUrl = document.getElementById("connectionUrl");
var connectButton = document.getElementById("connectButton");
var stateLabel = document.getElementById("stateLabel");
var sendMessage = document.getElementById("sendMessage");
var sendButton = document.getElementById("sendButton");
var sendForm = document.getElementById("sendForm");
var closeButton = document.getElementById("closeButton");
var commsLog = document.getElementById("commsLog");
var socket;
var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";
connectionUrl.value = scheme + "://" + document.location.hostname + port + "/ws";

function updateSate() {
    function disable() {
        sendMessage.disable = true;
        sendButton.disable = true;
        closeButton.disable = true;
    }
    function enable() {
        sendMessage.disable = false;
        sendButton.disable = false;
        closeButton.disable = false;
    }

    connectionUrl.disable = true;
    connectButton.disable = true;
    if (!socket) {
        disable();
    } else {
        switch (socket.readyState) {
            case WebSocket.CLOSED:
                stateLabel.innerHTML = "Desconectado";
                disable();
                connectionUrl.disable = false;
                break;
            case WebSocket.CLOSING:
                stateLabel.innerHTML = "Desconectando..."
                disable();
                break;
            case WebSocket.OPEN:
                stateLabel.innerHTML = "Conectado"
                disable();
                break;
            default:
                stateLabel.innerHTML = "Estado do WebSocket desconhecido>" + htmlEscape(socket.readyState);
                disable();
                break
        }

    }
}


closeButton.onclick = function () {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket não conectada");
    }
    socket.close(1000, "closing from client");
}

sendButton.onclick = function () {
    debugger;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket não conectada");
    }
    var data = sendMessage.value;
    socket.send(data);
    commsLog.innerHTML += '<tr>' +
        '<td class="commsLog-client">Cliente</td>' +
        '<td class="commsLog-server">Server</td>' +
        '<td class="commsLog-date">' + htmlEscape(data) + '</td>';
}

connectButton.onclick = function () {
    stateLabel.innerHTML = "Conectando....";
    socket = new WebSocket(connectionUrl.value);
    socket.onopen = function (e) {
        updateSate();
        commsLog.innerHTML += 'tr' +
            '<td colspan="3" class="commsLog-data">Conexão aberta</td>' +
            '</td>';
    }
    socket.onclose = function (event) {
        updateSate();
        commsLog.innerHTML += 'tr' +
            '<td colspan="3" class="commsLog-data">Conexão fechada:' +
            htmlEscape(event.code) + ', Reason ' + htmlEscape(event.reason) + '</td>' +
            '</td>';
    }
    socket.onerror = updateSate;
    socket.onmessage = function () {
        commsLog.innerHTML += '<tr>' +
            '<td class="commsLog-server">Server</td>' +
            '<td class="commsLog-client">Cliente</td>' +
            '<td class="commsLog-date">' + htmlEscape(event.data) + '</td>';
    }

}

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot')
        .replace(/'/g, '&#39')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

}