# Cómo consumir los endpoints HTTP de la API NestJS en Angular y Unity

## Angular

### 1. Instalar HttpClient
Angular ya incluye HttpClient, solo importa el módulo en tu app:
```typescript
import { HttpClientModule } from '@angular/common/http';
@NgModule({ imports: [HttpClientModule] })
```

### 2. Crear un servicio para la API
```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'https://TU_BACKEND_URL/api'; // Cambia por tu endpoint

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  getMe(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getRanking(): Observable<any> {
    return this.http.get(`${this.baseUrl}/score/ranking`);
  }

  getUserPosition(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/score/position/${userId}`);
  }

  submitScore(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/score/submit`, data);
  }
}
```

### 3. Usar el servicio en un componente
```typescript
// src/app/components/auth/auth.component.ts
import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  constructor(private api: ApiService) {}

  login() {
    this.api.login({ username: 'user', password: 'pass' }).subscribe(res => {
      localStorage.setItem('token', res.access_token);
    });
  }

  register() {
    this.api.register({ username: 'user', password: 'pass' }).subscribe();
  }

  getMe() {
    const token = localStorage.getItem('token');
    this.api.getMe(token).subscribe(user => {
      console.log(user);
    });
  }
}
```

## Unity

### 1. Usar UnityWebRequest
```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;

public class ApiClient : MonoBehaviour
{
    private string baseUrl = "https://TU_BACKEND_URL/api";

    public IEnumerator Login(string jsonData)
    {
        using (UnityWebRequest www = UnityWebRequest.Post(baseUrl + "/auth/login", jsonData))
        {
            www.SetRequestHeader("Content-Type", "application/json");
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                string token = www.downloadHandler.text; // Parsear el token del JSON
                Debug.Log(token);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }

    public IEnumerator Register(string jsonData)
    {
        using (UnityWebRequest www = UnityWebRequest.Post(baseUrl + "/auth/register", jsonData))
        {
            www.SetRequestHeader("Content-Type", "application/json");
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log(www.downloadHandler.text);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }

    public IEnumerator GetMe(string token)
    {
        using (UnityWebRequest www = UnityWebRequest.Get(baseUrl + "/auth/me"))
        {
            www.SetRequestHeader("Authorization", "Bearer " + token);
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log(www.downloadHandler.text);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }

    public IEnumerator GetRanking()
    {
        using (UnityWebRequest www = UnityWebRequest.Get(baseUrl + "/score/ranking"))
        {
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log(www.downloadHandler.text);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }

    public IEnumerator GetUserPosition(string userId)
    {
        using (UnityWebRequest www = UnityWebRequest.Get(baseUrl + $"/score/position/{userId}"))
        {
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log(www.downloadHandler.text);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }

    public IEnumerator SubmitScore(string jsonData)
    {
        using (UnityWebRequest www = UnityWebRequest.Post(baseUrl + "/score/submit", jsonData))
        {
            www.SetRequestHeader("Content-Type", "application/json");
            yield return www.SendWebRequest();
            if (www.result == UnityWebRequest.Result.Success)
            {
                Debug.Log(www.downloadHandler.text);
            }
            else
            {
                Debug.LogError(www.error);
            }
        }
    }
}
```

### 2. Llamar las funciones desde tu script
```csharp
StartCoroutine(Login(jsonData));
StartCoroutine(Register(jsonData));
StartCoroutine(GetMe(token));
StartCoroutine(GetRanking());
StartCoroutine(GetUserPosition("USER_ID"));
StartCoroutine(SubmitScore(jsonData));
```

---

**Notas:**
- Cambia `TU_BACKEND_URL` por la URL real de tu backend.
- Adapta los endpoints y datos según tu API.
- Para endpoints protegidos, agrega el header `Authorization: Bearer TOKEN`.
