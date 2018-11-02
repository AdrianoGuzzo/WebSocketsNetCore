using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft;

namespace WebSockets
{
    public class ChatWebSocketMiddleware
    {
        //Lista de conexões
        private static ConcurrentDictionary<UserSocket, WebSocket> _sockets = new ConcurrentDictionary<UserSocket, WebSocket>();

        private readonly RequestDelegate _next;

        public ChatWebSocketMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            if (context.Request.Path == "/wsChat")
            {
                if (!context.WebSockets.IsWebSocketRequest)
                {
                    await _next.Invoke(context);
                    return;
                }

                CancellationToken ct = context.RequestAborted;
                WebSocket currentSocket = await context.WebSockets.AcceptWebSocketAsync();
                
                Guid socketId = Guid.NewGuid();
                UserSocket user = new UserSocket
                {
                    Id = socketId,
                    Nome = context.Request.Query["username"]
                };
                _sockets.TryAdd(user, currentSocket);

                AtualizarLista(user, ct, TipoMensagem.ListaUsuarios);

                while (true)
                {
                    if (ct.IsCancellationRequested)
                    {
                        break;
                    }

                    var response = await ReceiveStringAsync(currentSocket, ct);
                    if (string.IsNullOrEmpty(response))
                    {
                        if (currentSocket.State != WebSocketState.Open)
                        {
                            if (_sockets.Keys.Any(x => x.Id == socketId))
                            {
                                WebSocket dummy;
                                _sockets.TryRemove(user, out dummy);
                                AtualizarLista(user, ct, TipoMensagem.Sair);
                            }
                            break;
                        }
                        continue;
                    }

                    SendAllSockets(Newtonsoft.Json.JsonConvert.SerializeObject(new
                    {
                        Tipo = TipoMensagem.Mensagem.ToString(),
                        user.Id,
                        user.Nome,
                        Mensagem = response
                    }), ct);
                }

                await currentSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", ct);
                currentSocket.Dispose();
            }
            else
            {
                await _next.Invoke(context);
                return;
            }
        }
        private void AtualizarLista(UserSocket user, CancellationToken ct, TipoMensagem tipo)
        {
            string[] listaNomes =
                    _sockets.Where(x => x.Value.State == WebSocketState.Open)
                    .Select(x => x.Key.Nome)
                    .ToArray();

            SendAllSockets(Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                Tipo = tipo.ToString(),
                Lista = listaNomes,
                User = user
            }), ct);
        }

        private async void SendAllSockets(string data, CancellationToken ct)
        {
            foreach (var socket in _sockets)
            {
                if (socket.Value.State != WebSocketState.Open)
                    continue;

                await SendStringAsync(socket.Value, data, ct);
            }

        }

        private static Task SendStringAsync(WebSocket socket, string data, CancellationToken ct = default(CancellationToken))
        {
            var buffer = Encoding.UTF8.GetBytes(data);
            var segment = new ArraySegment<byte>(buffer);
            return socket.SendAsync(segment, WebSocketMessageType.Text, true, ct);
        }

        private static async Task<string> ReceiveStringAsync(WebSocket socket, CancellationToken ct = default(CancellationToken))
        {
            var buffer = new ArraySegment<byte>(new byte[8192]);
            using (var ms = new MemoryStream())
            {
                WebSocketReceiveResult result;
                do
                {
                    ct.ThrowIfCancellationRequested();

                    result = await socket.ReceiveAsync(buffer, ct);
                    ms.Write(buffer.Array, buffer.Offset, result.Count);
                }
                while (!result.EndOfMessage);

                ms.Seek(0, SeekOrigin.Begin);
                if (result.MessageType != WebSocketMessageType.Text)
                {
                    return null;
                }

                // Encoding UTF8: https://tools.ietf.org/html/rfc6455#section-5.6
                using (var reader = new StreamReader(ms, Encoding.UTF8))
                {
                    return await reader.ReadToEndAsync();
                }
            }
        }
    }
    public class UserSocket
    {
        public Guid Id { get; set; }
        public string Nome { get; set; }
    }
    public enum TipoMensagem
    {
        ListaUsuarios,
        Mensagem,
        Sair

    }
}
