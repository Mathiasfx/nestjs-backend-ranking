# Cómo implementar el cliente WebSocket para ranking en Angular y Unity

## Angular

### 1. Instalar Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Crear un servicio para WebSocket
```typescript
// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.wsUrl); // wsUrl = 'http://localhost:3000' o tu endpoint
  }

  getRanking(callback: (data: any) => void) {
    this.socket.emit('getRanking');
    this.socket.on('rankingUpdates', callback);
  }

  getPosition(userId: string, callback: (data: any) => void) {
    this.socket.emit('getPosition', userId);
    this.socket.on('myPosition', callback);
  }
}
```

### 3. Usar el servicio en un componente
```typescript
// src/app/components/ranking/ranking.component.ts
import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
})
export class RankingComponent implements OnInit {
  ranking: any[] = [];
  myPosition: number;

  constructor(private wsService: WebsocketService) {}

  ngOnInit() {
    this.wsService.getRanking((data) => {
      this.ranking = data;
    });
    this.wsService.getPosition('USER_ID', (pos) => {
      this.myPosition = pos;
    });
  }
}
```

## Unity

### 1. Instalar Socket.IO Client para Unity
Usa [https://github.com/doghappy/socket.io-unity](https://github.com/doghappy/socket.io-unity) o [https://github.com/nhatcher/socketio-client-unity](https://github.com/nhatcher/socketio-client-unity)

### 2. Conectar y escuchar eventos
```csharp
using UnityEngine;
using SocketIOClient;

public class RankingClient : MonoBehaviour
{
    private SocketIO client;

    async void Start()
    {
        client = new SocketIO("http://localhost:3000"); // Cambia por tu endpoint
        await client.ConnectAsync();

        client.On("rankingUpdates", response => {
            Debug.Log("Ranking: " + response.GetValue().ToString());
        });

        client.On("myPosition", response => {
            Debug.Log("Mi posición: " + response.GetValue().ToString());
        });

        await client.EmitAsync("getRanking");
        await client.EmitAsync("getPosition", "USER_ID");
    }
}
```

### 3. Usar los datos en tu UI
Procesa los datos recibidos y actualiza tu interfaz de usuario según tus necesidades.

---

**Notas:**
- Cambia las URLs y el `USER_ID` por los valores reales.
- Asegúrate de que el backend esté corriendo y accesible desde el cliente.
- Puedes adaptar los eventos y la lógica según tu caso de uso.
