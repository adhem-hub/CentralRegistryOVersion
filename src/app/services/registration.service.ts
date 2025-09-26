import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { REGISTER_URL } from "../shared/api_constants";
import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private backendErrorTranslationMap: { [key: string]: string } = {
    'This field may not be blank.': 'error.fieldRequired',
    'Enter a valid email address.': 'error.emailInvalid',
    'user with this email already exists.': 'error.emailAlreadyExists',
'Password must be between 8 and 14 characters long.': 'error.password'
  };
  constructor(private translate: TranslateService,private http: HttpClient) {}



  registerUser(registrationData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });

    return this.http.post(REGISTER_URL, registrationData, { headers, observe: 'response' }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Full Error Details:', error);

        if (error.status === 400 && error.error) {
          const errorResponse = error.error;
          let errorMessage = '';

          if (typeof errorResponse === 'string') {
            const translationKey = this.backendErrorTranslationMap[errorResponse];
            errorMessage = translationKey
              ? this.translate.instant(translationKey)
              : errorResponse;

          } else if (errorResponse.email) {
            const emailError = errorResponse.email.join(' ');
            const translationKey = this.backendErrorTranslationMap[emailError];
            errorMessage = translationKey
              ? this.translate.instant(translationKey)
              : emailError;

          } else if (errorResponse.password) {
            const passwordError = errorResponse.password.join(' ');
            const translationKey = this.backendErrorTranslationMap[passwordError];
            errorMessage = translationKey
              ? this.translate.instant(translationKey)
              : passwordError;

          } else {
            errorMessage = this.translate.instant('error.invalidInput');
          }

          return throwError(() => errorMessage);
        }

        if (error.status === 500) {
          return throwError(() => this.translate.instant('error.serverError'));
        }
        if (error.status === 0) {
          return throwError(() => this.translate.instant('error.connectionError'));
        }

        return throwError(() => this.translate.instant('error.unexpectedError'));
      })
    );
  }

  
  
  // Verification method
  verifyEmail(email: string, verificationCode: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
  
    const body = { email, verification_code: verificationCode };
    const url = environment.apiUrl +'/authentication/verify-email/';
  
    return this.http.post(url, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error details:', error);  // Log the complete error object
        
        let errorMessage = 'An error occurred during email verification';
        
        if (error.status === 400) {
          const errorResponse = error.error;
          
          console.log('Server Error Response:', errorResponse);  // Log the error response
          
          if (errorResponse.detail) {
            this.translate.get('ERROR_VERIFICATION_EMAIL').subscribe((translation) => {
              errorMessage = translation || errorResponse.detail;
            });
          } else if (errorResponse.errors) {
            if (errorResponse.errors.email) {
              this.translate.get('ERROR_EMAIL_INVALID').subscribe((translation) => {
                errorMessage = translation || `Email error: ${errorResponse.errors.email.join(' ')}`;
              });
            }
            if (errorResponse.errors.verification_code) {
              this.translate.get('ERROR_VERIFICATION_CODE_INVALID').subscribe((translation) => {
                errorMessage = translation || `Verification code error: ${errorResponse.errors.verification_code.join(' ')}`;
              });
            }
          } else if (errorResponse.message) {
            this.translate.get('ERROR_GENERAL').subscribe((translation) => {
              errorMessage = translation || `Error: ${errorResponse.message}`;
            });
          }
        } else if (error.status === 401) {
          this.translate.get('ERROR_INVALID_VERIFICATION_CODE').subscribe((translation) => {
            errorMessage = translation || 'Invalid verification code. Please try again.';
          });
        } else if (error.status === 410) {
          this.translate.get('ERROR_CODE_EXPIRED').subscribe((translation) => {
            errorMessage = translation || 'Verification code has expired or does not exist.';
          });
        } else if (error.status === 0) {
          this.translate.get('ERROR_CONNECTION').subscribe((translation) => {
            errorMessage = translation || 'Unable to connect to the server. Please check your network connection.';
          });
        }
  
  
        return throwError(errorMessage);
      })
    );
  }
  
}
