import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContentService {

   private apiUrl = environment.apiUrl;
  
    constructor(private http: HttpClient) { }
  
    getContent(lang?: string, section?: string): Observable<any[]> {
      let params = new HttpParams();
      
      if (lang) {
        params = params.set('lang', lang);
      }
      
      if (section) {
        params = params.set('section', section);
      }
  
      return this.http.get<any[]>(`${this.apiUrl}/content/`, { params });
    }
   
}
