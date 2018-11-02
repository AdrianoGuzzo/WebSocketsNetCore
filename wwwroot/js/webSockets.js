var WebSocketConfig = function (nameAPP, objValues) {
    //Protocolo do WebSockets 
    var protocol = location.protocol === "https:" ? "wss:" : "ws:";
    //URL de conexão
    var wsUri = protocol + "//" +
        //URL Base
        window.location.host + '/' +
        //Nome da implementação
        nameAPP;

    var _setValues = function (objValues) {
        var valueGet = ""
        if (objValues) {
            valueGet = "?"
            for (var i in objValues)
                valueGet += i + "=" + objValues[i] + "&"
            valueGet = valueGet.substring(0, valueGet.length - 1);
        }
        return valueGet
    }
    //infomações iniciais
    wsUri += _setValues(objValues);

    var socket = new WebSocket(wsUri);

    return {
        socket: socket
    }

}