import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';


interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface SearchParams {
  page?: number;
  page_size?: number;
  headquarters?: string;
  branch_locations?: string;
  name_or_uid?: string;
  legal_forms?: string;
  ordering?: string;
  name?: string;
  unique_identifier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanySearchService {
  
  // private apiUrl = 'http://localhost:8000/companies-client/';
 // private apiUrl = 'https://sandbox.d-itcompanytunis.com/companies-client/';
    private apiUrl  = `${environment.apiUrl}/companies-client/`;
  
  constructor(private http: HttpClient) {}

  // Updated simple search with pagination
  searchCompanies(query: string, page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<any>> {
    const param = query.trim();
    console.log('Searching with parameter:', param, 'Page:', page, 'PageSize:', pageSize);
    
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    
    const isUniqueIdentifier = param.toUpperCase().startsWith('CH');
    console.log('Is Unique Identifier:', isUniqueIdentifier);
    
    if (isUniqueIdentifier) {
      httpParams = httpParams.set('unique_identifier', param);
    } else {
      httpParams = httpParams.set('name', param);
    }
    
    console.log('Final API URL with params:', this.apiUrl, httpParams.toString());
    
    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error in searchCompanies:', error);
          return throwError(() => error);
        })
      );
  }

  // Updated advanced search with pagination
  searchCompanie(filters: SearchParams): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    
    // Add pagination parameters (with defaults)
    httpParams = httpParams.set('page', (filters.page || 1).toString());
    httpParams = httpParams.set('page_size', (filters.page_size || 10).toString());
    
    // Add filter parameters
    if (filters.headquarters) {
      httpParams = httpParams.set('headquarters', filters.headquarters);
    }
    if (filters.branch_locations) {
      httpParams = httpParams.set('branch_locations', filters.branch_locations);
    }
    if (filters.name_or_uid) {
      const param = filters.name_or_uid;
      
      if (param.toUpperCase().startsWith('CH')) {
        httpParams = httpParams.set('unique_identifier', param);
      } else {
        httpParams = httpParams.set('name', param);
      }
    }
    if (filters.legal_forms) {
      httpParams = httpParams.set('legal_forms', filters.legal_forms);
    }
    if (filters.ordering) {
      httpParams = httpParams.set('ordering', filters.ordering);
    }

    console.log('Advanced search params:', httpParams.toString());
    
    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error in searchCompanie:', error);
          return throwError(() => error);
        })
      );
  }

  // Get company list without pagination (for backwards compatibility)
  getCompanyList(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error in getCompanyList:', error);
          return throwError(() => error);
        })
      );
  }

  // Get paginated company list
  getCompanyListPaginated(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Error in getCompanyListPaginated:', error);
          return throwError(() => error);
        })
      );
  }
}