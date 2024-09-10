import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoDownloadService {
  private apiUrl = 'http://localhost:3000/download';  // Backend URL

  constructor(private http: HttpClient) {}

  downloadGif(youtubeUrl: string, startTime: number, endTime: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = { youtubeUrl, startTime, endTime };

    return this.http.post(this.apiUrl, body, {
      headers: headers,
      responseType: 'blob'  // We are expecting a Blob as the GIF file
    });
  }
}
