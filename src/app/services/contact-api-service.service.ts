import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ContactApiService {
  // private apiUrl = 'http://localhost:8000/parent-company/';
  private apiUrl = environment.apiUrl + '/parent-company/';

  constructor(private http: HttpClient) { }

  getParentCompany(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      headers: { 'accept': 'application/json' }
    });
  }
}
