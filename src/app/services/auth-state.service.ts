import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private loggedInSubject = new BehaviorSubject<boolean>(false); // Default: not logged in
  isLoggedIn$ = this.loggedInSubject.asObservable();
  private usernameSubject = new BehaviorSubject<string | null>(null);
  private userData: any = null;
  private tokenKey = 'access';

  username$ = this.usernameSubject.asObservable();
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem('isLoggedIn');
      const savedUsername = localStorage.getItem('username');
  
      console.log('Saved State:', savedState);
      console.log('Saved Username:', savedUsername);
  
      if (savedState) {
        this.loggedInSubject.next(JSON.parse(savedState));
      }
  
      if (savedUsername) {
        this.usernameSubject.next(savedUsername);  // Check if username is loaded correctly
      }
    }
  }
  

  // Toggle login state
  setLoggedIn(value: boolean): void {
    this.loggedInSubject.next(value);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isLoggedIn', JSON.stringify(value));
    }
  }

  get isLoggedIn(): boolean {
    return this.loggedInSubject.getValue();
  }
  setUsername(username: string) {
    this.usernameSubject.next(username);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('username', username);
    }
  }

  getUsername(): string | null {
    return this.usernameSubject.getValue();
  }

  setUserData(user: any) {
    this.userData = user;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userData', JSON.stringify(user));
    }
  }
  refreshUserData() {
    const user = this.getUserData(); // Get updated user data
    if (user && user.username) {
      this.setUsername(user.username); // Correctly update the observable
    }
  }
  
  
  getUserData(): any {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('userData');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return this.userData;
  }
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  logout(): void {
    this.loggedInSubject.next(false);
    this.usernameSubject.next(null);
    this.userData = null;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('userData');
      localStorage.removeItem('refresh');
      localStorage.removeItem('access');
      localStorage.removeItem('user_id');
      

      localStorage.removeItem(this.tokenKey);
      
    }
  }
}
