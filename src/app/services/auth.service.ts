import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { access } from 'fs';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { AuthStateService } from './auth-state.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // private baseUrl = 'http://localhost:8000/authentication/';
  // private baseUrl = 'https://sandbox.d-itcompanytunis.com/authentication/'; 
  private baseUrl  = `${environment.apiUrl}/authentication/`;
  
  private csrfToken = '4PGM5aEBRgW1tbe84vxrPVLPYSHMfB0Vpf8ciZBhJfaldA0c8LQhdMil8MZXKrRY';

  // private baseUrll = 'http://localhost:8000/authentication/';

  constructor(private http: HttpClient, private authStateService: AuthStateService,
    @Inject(PLATFORM_ID) private platformId: Object, private translateService: TranslateService
  ) { }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken,
      // Note: You typically don't need the Authorization header for refresh requests
      // 'Authorization': `Bearer ${localStorage.getItem('access')}`
    });

    return this.http.post<any>(
      `${this.baseUrl}token/refresh/`,
      { refresh: refreshToken },
      { headers }
    ).pipe(
      tap((response) => {
        if (response.access) {
          localStorage.setItem('access', response.access);
          console.log('Token refreshed successfully');

          // Optionally store new refresh token if your backend provides one
          if (response.refresh) {
            localStorage.setItem('refresh', response.refresh);
          }
        }
      }),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        // Logout user if refresh fails
        this.authStateService.logout();
        return throwError(() => new Error('Token refresh failed. Please login again.'));
      })
    );
  }

  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken,
    });

    const body = { email, password };

    return this.http.post<any>(`${this.baseUrl}login/`, body, { headers }).pipe(
      tap((response) => {
        console.log('Login Successful:', response);
        if (isPlatformBrowser(this.platformId)) {
          if (response.access) {
            localStorage.setItem('access', response.access);
          }
          if (response.refresh) {
            localStorage.setItem('refresh', response.refresh);
          }
          if (response.user_id) {
            localStorage.setItem('user_id', response.user_id);
          }
          if (response.username) {
            localStorage.setItem('username', response.username);
          }
        }
      }),
      catchError((error) => {
        let errorMessage = '';
        console.error('Full Error:', error);

        if (error.status === 400) {
          if (error.error.email) {
            const emailErrorMessage = error.error.email[0];
            console.log('Email error:', emailErrorMessage);

            // Check if we have a custom translation for this error
            switch (emailErrorMessage) {
              case "Your account is awaiting approval. Please contact support.":
                errorMessage = this.translateService.instant('ACCOUNT_AWAITING_APPROVAL');
                break;
              case "Your account has been blocked. Please contact support.":
                errorMessage = this.translateService.instant('ACCOUNT_BLOCKED');
                break;
              case "Enter a valid email address.":
                errorMessage = this.translateService.instant('INVALID_EMAIL_ADDRESS'); // Add translation for this case
                break;
              case "The email address does not exist.":
                errorMessage = this.translateService.instant('INEXIST_EMAIL_ADDRESS'); // Add translation for this case
                break;
                case "Please verify your email address to log in.":
                  errorMessage = this.translateService.instant('INVERIFIED_EMAIL_ADDRESS'); // Add translation for this case
                  break;
              default:
                const translated = this.translateService.instant(emailErrorMessage);
                errorMessage = translated !== emailErrorMessage ? translated : emailErrorMessage;
                break;
            }
          } else if (error.error.message) {
            errorMessage = this.translateService.instant('GENERIC_LOGIN_ERROR');
          } else {
            errorMessage = this.translateService.instant('INVALID_CREDENTIALS');
          }
        } else {
          errorMessage = this.translateService.instant('SERVER_ERROR');
        }

        console.error('Login Failed:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })


    );
  }





  requestPasswordReset(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken,
    });

    const body = { email };

    return this.http.post<any>(`${this.baseUrl}password-reset-request/`, body, { headers }).pipe(
      tap((response) => {
        console.log('Password Reset Request Sent:', response);
      }),
      catchError((error) => {
        let errorMessage = 'An unexpected error occurred.';

        if (error.status === 200) {
          this.translateService.get('VERIFICATION_CODE_SENT').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 400 && error.error.message.includes('email')) {
          this.translateService.get('EMAIL_REQUIRED').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 404) {
          this.translateService.get('USER_NOT_FOUND').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 500) {
          this.translateService.get('EMAIL_NOT_SENT').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        }

        console.error('Password Reset Request Failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Verify Reset Code
  verifyResetCode(email: string, verificationCode: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken,
    });

    const body = { email, verification_code: verificationCode };

    return this.http.post<any>(`${this.baseUrl}password-reset-verify/`, body, { headers }).pipe(
      tap((response) => {
        console.log('Reset Code Verified:', response);
      }),
      catchError((error) => {
        let errorMessage = 'An unexpected error occurred.';

        if (error.status === 200) {
          this.translateService.get('RESET_CODE_SUCCESS').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 400) {
          this.translateService.get('INVALID_VERIFICATION_CODE').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 404) {
          this.translateService.get('EXPIRED_OR_NONEXISTENT_CODE').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 500) {
          this.translateService.get('INTERNAL_SERVER_ERROR').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        }


        console.error('Reset Code Verification Failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Submit New Password
  submitNewPassword(email: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken,
    });

    const body = { email, new_password: newPassword };

    return this.http.post<any>(`${this.baseUrl}password-reset-submit/`, body, { headers }).pipe(
      tap((response) => {
        console.log('Password Reset Successfully:', response);
      }),
      catchError((error) => {
        let errorMessage = 'An unexpected error occurred.';

        if (error.status === 200) {
          this.translateService.get('PASSWORD_RESET_SUCCESS').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 400) {
          this.translateService.get('NEW_PASSWORD_REQUIRED').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 404) {
          this.translateService.get('USER_NOT_FOUND_OR_VERIFICATION_FAILED').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 500) {
          this.translateService.get('INTERNAL_SERVER_ERROR').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        }


        console.error('Password Reset Submission Failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  private usernameSubject = new BehaviorSubject<string>('');

  username$ = this.usernameSubject.asObservable();

  updateEmployee(username: string, new_password: string): Observable<any> {
    const token = localStorage.getItem('access');
    const user_id = localStorage.getItem('user_id'); // Retrieve user_id

    console.log('usernm3', username);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });
    if (!user_id) {
      console.error("User ID not found!");
      return throwError(() => new Error("User ID is missing."));
    }

    const body = {
      new_password: new_password,
      username: username
    };
    const updateUrl = `http://localhost:8000/administrator/employee/update/${user_id}/`; // to update url

    return this.http.patch<any>(updateUrl, body, { headers }).pipe(
      tap(response => {
        console.log('Employee updated successfully:', response);
        this.usernameSubject.next(username);

      }),
      catchError(error => {
        let errorMsg = "An error occurred. Please try again.";
        if (error.status === 400) {
          this.translateService.get('INVALID_REQUEST').subscribe((translatedMessage) => {
            errorMsg = translatedMessage || error.error.message;
          });
        } else if (error.status === 403) {
          this.translateService.get('FORBIDDEN_ACTION').subscribe((translatedMessage) => {
            errorMsg = translatedMessage;
          });
        }

        console.error('Employee update failed:', error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  // Resend Verification Code
  resendVerificationCode(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken, // If necessary, you can remove this if not required by the endpoint
    });

    const body = { email };

    return this.http.post<any>(
      'http://localhost:8000/api/resend-verification/', // to update url 
      body,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Verification Code Resent:', response);
      }),
      catchError((error) => {
        let errorMessage = 'An unexpected error occurred.';

        if (error.status === 200) {
          this.translateService.get('VERIFICATION_CODE_SENT').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 400 && error.error.message.includes('email')) {
          this.translateService.get('EMAIL_REQUIRED').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 404) {
          this.translateService.get('USER_NOT_FOUND').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 500) {
          this.translateService.get('EMAIL_NOT_SENT').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        }

        console.error('Verification Code Resend Failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  // Accept Verification Code
  acceptVerificationCode(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-CSRFToken': this.csrfToken, // If necessary, you can remove this if not required by the endpoint
    });

    return this.http.post<any>(
      'http://localhost:8000/api/accept-verification-code/', // to update url
      {}, // No body data required
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Verification Code Accepted:', response);
      }),
      catchError((error) => {
        let errorMessage = 'An unexpected error occurred.';

        if (error.status === 200) {
          this.translateService.get('VERIFICATION_CODE_ACCEPTED').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 400) {
          this.translateService.get('INVALID_VERIFICATION_CODE').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 404) {
          this.translateService.get('EXPIRED_OR_NONEXISTENT_CODE').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        } else if (error.status === 500) {
          this.translateService.get('INTERNAL_SERVER_ERROR').subscribe((translatedMessage) => {
            errorMessage = translatedMessage;
          });
        }

        console.error('Verification Code Acceptance Failed:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

}
