import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser, CommonModule} from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Company } from '../models/company.model';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment.development';

// Add interface for paginated response
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Add interface for pagination parameters
interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private baseUrl = environment.apiUrl 
  private apiUrl = environment.apiUrl + '/employee/companies/';
  private testurl = environment.apiUrl + '/companies/'

  constructor(private translate: TranslateService, @Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {}
  
  getAuthHeaders(): HttpHeaders {
    let token = '';
  
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('access') || ''; 
    }
  
    if (!token) {
      console.error("Token is missing from localStorage!");
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
  
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  // Updated method with pagination parameters
  getCompanies(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.page_size) {
        httpParams = httpParams.set('page_size', params.page_size.toString());
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.ordering) {
        httpParams = httpParams.set('ordering', params.ordering);
      }
    }

    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { 
      headers: this.getAuthHeaders(),
      params: httpParams 
    }).pipe(
      tap((data) => console.log('API Response:', data)),
      catchError((error) => {
        console.error('Error fetching companies:', error);
        return throwError(error);
      })
    );
  }

  // Keep the old method for backward compatibility (optional)
  getAllCompanies(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      tap((data) => console.log('API Response:', data)),
      catchError((error) => {
        console.error('Error fetching companies:', error);
        return throwError(error);
      })
    );
  }

  createCompany(companyData: any): Observable<any> {
    console.log("company data : ", companyData)
    if (!companyData.logo) {
      delete companyData.logo;
    }

    if (!companyData.financial_report) {
      delete companyData.financial_report;
    }

    // if (!companyData.financial_information.company_capital) {
    //   delete companyData.financial_information.company_capital;
    // }
    
    return this.http.post<any>(`${this.baseUrl}/employee/companies/`, companyData, { headers: this.getAuthHeaders() }).pipe(
        tap(response => console.log('Company created:', response)),
        catchError((error: HttpErrorResponse) => {
            console.error('Full error response:', error);

            let errorMessage = 'An unknown error occurred. Please try again.';

            if (error.error) {
                console.log('Error Body:', error.error); // Debugging

                if (typeof error.error === 'object' && error.error.detail) {
                    const errorDetail = error.error.detail;
                    console.log('Extracted Error Detail:', errorDetail);

                    // Check for specific error messages and display distinct messages
                    if (errorDetail.includes('A company with this name already exists')) {
                        this.translate.get('COMPANY_NAME_EXISTS').subscribe((translatedMessage) => {
                            errorMessage = translatedMessage;
                        });
                    } else if (errorDetail.includes('A company with this unique identifier already exists')) {
                        this.translate.get('COMPANY_UID_EXISTS').subscribe((translatedMessage) => {
                            errorMessage = translatedMessage;
                        });
                    } else {
                        // If it's another error, just use the error detail
                        errorMessage = errorDetail;
                    }
                } else if (typeof error.error === 'string') {
                    errorMessage = error.error;
                }
            }

            // Handle specific HTTP error codes
            switch (error.status) {
                case 401:
                    this.translate.get('NOT_AUTHENTICATED').subscribe((translatedMessage) => {
                        errorMessage = translatedMessage;
                    });
                    break;
                case 403:
                    this.translate.get('NO_PERMISSION').subscribe((translatedMessage) => {
                        errorMessage = translatedMessage;
                    });
                    break;
                case 400:
                    // Error messages for company name or UID already existing are handled above
                    break;
                case 500:
                    this.translate.get('SERVER_ERROR').subscribe((translatedMessage) => {
                        errorMessage = translatedMessage;
                    });
                    break;
            }

            console.error('Final Error Message:', errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
  }

  deleteCompany(companyID: string): Observable<any> {
    const url = `${this.apiUrl}${companyID}/archive/`;
    return this.http.post<any>(url, {}, { headers: this.getAuthHeaders() }).pipe(
      tap((data) => console.log('Company archived:', data)),
      catchError((error) => {
        console.error('Error archiving company:', error);
        return throwError(error);
      })
    );
  }
  
  getCompanyById(companyId: string): Observable<any> {
    const url = `${this.testurl}${companyId}/`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Company details retrieved:', response)),
      catchError(error => {
        console.error('Failed to fetch company details:', error);
        return throwError(() => new Error('Failed to fetch company details.'));
      })
    );
  }
  
  getCompanyById1(companyId: string): Observable<any> {
    const url = `${this.apiUrl}${companyId}/`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Company details retrieved:', response)),
      catchError(error => {
        console.error('Failed to fetch company details:', error);
        return throwError(() => new Error('Failed to fetch company details.'));
      })
    );
  }
  
  updateCompany(companyId: string, companyData: any): Observable<any> {
    const url = `${this.apiUrl}${companyId}/`;  
    console.log("companyData : ", companyData)
  
    return this.http.patch<any>(url, companyData, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Company updated:', response)),  // Debugging log
      catchError(error => {
        console.error('Failed to update company:', error);
        let errorMessage = 'Failed to update company details.';
        if (error.status === 400) {
          errorMessage = 'Invalid company data. Please check the details and try again.';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.status === 500) {
          errorMessage = 'Internal server error. Please try again later.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  updateLegalInfo(companyID: string, updateDataLF: any): Observable<any> {
    const url = `http://localhost:8000/legal-info/${companyID}/`; // Correct API URL
    
    return this.http.patch<any>(url, updateDataLF, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Legal info updated:', response)),  // Debugging log
      catchError(error => {
        console.error('Failed to update legal info:', error);
        let errorMessage = 'Failed to update legal information.';
        if (error.status === 400) {
          errorMessage = 'Invalid legal information. Please check the data and try again.';
        } else if (error.status === 404) {
          errorMessage = 'Legal information not found.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  updateDirector(companyID: string, directorData: any): Observable<any> {
    const url = `${this.baseUrl}/directors/${companyID}/`;

    return this.http.patch<any>(url, directorData, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Director updated:', response)),
      catchError(error => {
        console.error('Failed to update director:', error);
        let errorMessage = 'Failed to update director details.';
        if (error.status === 400) {
          errorMessage = 'Invalid director data. Please check the details and try again.';
        } else if (error.status === 404) {
          errorMessage = 'Director not found.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  updateFinancialInfo(companyID: string, financialData: any): Observable<any> {
    const url = `${this.baseUrl}/financial-information/${companyID}/`;
    return this.http.patch<any>(url, financialData, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Financial information updated:', response)),
      catchError(error => {
        console.error('Failed to update financial information:', error);
        let errorMessage = 'Failed to update financial information.';
        if (error.status === 400) {
          errorMessage = 'Invalid financial data. Please check the details and try again.';
        } else if (error.status === 500) {
          errorMessage = 'Internal server error. Please try again later.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  updateActivity(companyID: string, activityData: any): Observable<any> {
    const url = `${this.baseUrl}/activities/${companyID}/`; // Replace {id} with actual activity ID

    return this.http.patch<any>(url, activityData, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('Activity updated:', response)),  // Debugging log
      catchError(error => {
        console.error('Failed to update activity:', error);
        let errorMessage = 'Failed to update activity details.';
        if (error.status === 400) {
          errorMessage = 'Invalid activity data. Please check the details and try again.';
        } else if (error.status === 404) {
          errorMessage = 'Activity not found.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateCompanyLogo(companyID: string, logo: any): Observable<any> {
    const url = `${this.apiUrl}${companyID}/logo/`; // PUT
    console.log("logo : ", logo)
    return this.http.put<any>(url, logo, { headers: this.getAuthHeaders() }).pipe(
      tap(response => console.log('logo updated:', response)),  // Debugging log
      catchError(error => {
        console.error('Failed to update logo:', error);
        let errorMessage = 'Failed to update logo details.';
        if (error.status === 400) {
          errorMessage = 'Invalid logo data. Please check the details and try again.';
        } else if (error.status === 404) {
          errorMessage = 'logo not found.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}