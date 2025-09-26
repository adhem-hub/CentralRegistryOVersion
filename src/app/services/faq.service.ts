import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaqService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFaqSections(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/faq-sections/`);
  }

  getFaqItems(sectionId: string, language: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/faq-sections/${sectionId}/items/?language=${language}`
    );
  }
}
