import { Component, HostListener, Inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RegistrationService } from '../../services/registration.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RegistrationData } from '../../models/registration.model';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AuthStateService } from '../../services/auth-state.service';
import { CompanyService } from '../../services/company.service';
import { SearchComponent } from "../../components/search/search.component";
import { ContactApiService } from '../../services/contact-api-service.service';
import { FaqComponent } from '../../shared/faq/faq.component';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';




@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, HttpClientModule, 
    // SearchComponent,
     MatIconModule, TranslateModule,
    //  FaqComponent
  //  RouterOutlet,
  RouterLink,
  RouterLinkActive  
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  new_password: string = '';
  newPasswordConfirm: string = '';

  email: string = '';
  verificationErrorMessage: string = '';
  languages = ['en', 'fr', 'de', 'it'];
  currentLanguage = 'de';
  dropdownOpen = false;
  showModal = false;
  showRegisterModal = false;
  showCheckEmailModal = false;
  showAccountCreatedModal = false;
  showForgotPasswordModal = false;
  showPasswordResetSuccessModal = false;
  showOtpModal = false;
  otpCode = '';
  showResetPasswordModal = false;
  newPassword = '';
  confirmPassword = '';
  username: string = '';
  user_id: string = '';

  password: string = '';
  registrationMessage: string = '';
  loginErrorMessage: string = '';
  verificationCode: string = '';
  isLoggedIn: boolean = false;
  connectedHeader: string = '';
  modalOpen = false;
  showModale = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isAddCompanyFormVisible = false;
  role: string = '';


  legalForms: any[] = [];
  selectedLegalForm: string = '';


  forgotPasswordError: string = '';
  otpError: string = '';
  resetPasswordError: string = '';
  userData = {
    user_id: '',
    username: '',
    email: '',
    new_password: '',
    newPasswordConfirm: ''
  };
  profileDropdownOpen = false;

  loginSuccessMessage: string = '';
  registrationErrorMessage: string = '';
  registrationSuccessMessage: string = '';
  errorMessage: string = "";
  successMessage: string = "";


  // isMobileMenuOpen: boolean = false;

  mobileSidebarOpen = false;
mobileLangDropdownOpen = false;

  // Predefined Legal Status Choices
  legalStatusChoices = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'dissolved', label: 'Dissolved' },
    { value: 'bankrupt', label: 'Bankrupt' },
    { value: 'pending', label: 'Pending Registration' }
  ];

  // Predefined Sector Choices
  sectorChoices = [
    { value: 'raw_materials', label: 'Raw Materials & Extraction' },
    { value: 'manufacturing', label: 'Manufacturing & Industry' },
    { value: 'services', label: 'Services & Commerce' },
    { value: 'knowledge', label: 'Knowledge & Innovation' },
    { value: 'public', label: 'Public & Non-Profit Services' }
  ];
  typeOfCapitalChoices = [
    { value: 'ownership', label: 'Based on Ownership Structure' },
    { value: 'funding', label: 'Based on Funding Source' },
    { value: 'legal', label: 'Based on Legal Classification' }
  ];

  selectedTypeOfCapital: string = ''; // To track selected value

  selectedLegalStatus: string = '';
  selectedSector: string = '';

  parentCompany: any;

  showPassword: boolean = false;


  constructor(@Inject(PLATFORM_ID) private platformId: Object,
  private transferState: TransferState,
  private contactApiService: ContactApiService,
  private translateService: TranslateService,
  private registrationService: RegistrationService,
  private authStateService: AuthStateService,
  private authService: AuthService,
  private companyService: CompanyService,
  private router : Router
) {
  console.log("current language", this.translateService.currentLang);

  this.currentLanguage = this.translateService.currentLang || 'de';
  this.authStateService.isLoggedIn$.subscribe((status) => {
    this.isLoggedIn = status;
  });
  
}

  toggleModal() {
    this.modalOpen = !this.modalOpen;
  }

  closeModal() {
    this.modalOpen = false;
  }

  closeModale() {
    this.showModale = false;
  }
  resetForm() {
    this.username = '';
    this.email = '';
    this.new_password = '';
    this.newPasswordConfirm = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  openProfileModal() {
    const user = this.authStateService.getUserData(); // Get stored user data


    console.log("Opening Profile Modal"); // Debugging
    this.showModale = true;
    this.userData.username = user.username;
    this.userData.email = user.email;
    if (user) {
      this.username = user.username || '';
      this.email = user.email || '';
    }
    // this.closeMobileMenu();
  }

  onSubmit(): void {


    if (this.new_password !== this.newPasswordConfirm) {
      console.log("Passwords do not match!");

      this.errorMessage = "Passwords do not match!";
      this.successMessage = "";

      return;
    }

    console.log('username1', this.username)
    this.authService.updateEmployee(this.username, this.new_password).subscribe({
      next: (response) => {
        this.successMessage = response.message || "Password updated successfully.";
        this.errorMessage = "";
        this.authStateService.setUsername(this.username)
        setTimeout(() => {
          this.closeModale();
        }, 2000);


      },
      error: (err) => {
        this.errorMessage = err.error.message || "An error occurred. Please try again.";
        this.successMessage = "";
      },
    });

    console.log("Submitting form:");
    console.log("Username:", this.username);
    console.log("New Password:", this.new_password);
    console.log("Confirm Password:", this.newPasswordConfirm);
  }
  fetchParentCompanyData(): void {
    this.contactApiService.getParentCompany().subscribe(
      (data) => {
        this.parentCompany = data.results[0];
        console.log(this.parentCompany);
      },
      (error) => {
        console.error('Error fetching data', error);
        // this.refresh();
      }
    );
  }

  openModal() {
    this.showModal = true;
  }

  logout(): void {

    this.authStateService.logout();
    this.isLoggedIn = false;
    const savedLanguage = localStorage.getItem('selectedLanguage'); // Preserve language setting
    location.reload();

    if (savedLanguage) {
      this.translateService.use(savedLanguage); 
    }
    // this.closeMobileMenu();
  }
  changeLanguage(lang: string) {
    this.currentLanguage = lang;
    this.translateService.use(lang);
    localStorage.setItem('selectedLanguage', lang); // Store language preference

    this.dropdownOpen = false;
    // this.closeMobileMenu(); 

  }
 

  // Toggle methods
  toggleShowNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  toggleProfileDropdown(event: Event) {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    event.stopPropagation();
  }
  @HostListener('document:click', ['$event'])
  closeDropdownOnClickOutside(event: Event) {
    if (this.profileDropdownOpen) {
      this.profileDropdownOpen = false;
    }
  }
  openSignInModal() {
    this.showModal = true;
  }


  closeSignInModal(): void {
    this.showModal = false;
    this.email = '';
    this.password = '';
    this.loginErrorMessage = '';
    this.loginSuccessMessage = '';
  }

  openRegisterModal() {
    this.refreshRegisterModal();
    this.showRegisterModal = true;
    this.showModal = false;
    this.showCheckEmailModal;

    this.loginErrorMessage = '';
    this.loginSuccessMessage = '';

    // this.closeMobileMenu();


  }
  closeResetPasswordModal() {
    this.showResetPasswordModal = false;

    this.passwordStrengthMessage = '';
    this.passwordStrengthClass = '';
  }
  closeRegisterModal() {
    this.showRegisterModal = false;
    this.username = '';
    this.email = '';
    this.password = '';
    this.registrationErrorMessage = '';
    this.registrationSuccessMessage = '';

    this.passwordStrengthMessage = '';
    this.passwordStrengthClass = '';

  }
  refreshRegisterModal() {
    this.username = '';
    this.email = '';
    this.password = '';
    this.registrationMessage = '';
  }

  switchToSignIn() {
    this.closeRegisterModal();
    this.openSignInModal();
  }

  openCheckEmailModal() {
    this.closeRegisterModal();
    this.showCheckEmailModal = true;
  }

  closeCheckEmailModal() {
    this.showCheckEmailModal = false;
    this.verificationCode = '';
    this.verificationErrorMessage = '';
  }

  closeOTPModal() {
    this.showOtpModal = false;
  }


  openAccountCreatedModal() {
    this.closeCheckEmailModal();
    this.showAccountCreatedModal = true;
  }

  closeAccountCreatedModal() {
    this.showAccountCreatedModal = false;
    this.showModal = true;
  }
  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordError = '';
  }
  openPasswordResetSuccessModal() {
    this.showPasswordResetSuccessModal = true;
  }

  closePasswordResetSuccessModal(): void {
    this.showRegisterModal = false;
    this.showCheckEmailModal = false;
    this.showForgotPasswordModal = false;
    this.showOtpModal = false;
    this.showResetPasswordModal = false;
    this.showAccountCreatedModal = false;

    this.showPasswordResetSuccessModal = false;

    this.showModal = true;
  }


  resendVerificationCode(email: string) {
    this.authService.resendVerificationCode(email).subscribe(
      (response) => {
        console.log('Verification code resent successfully');
        // You can display a success message here
      },
      (error) => {
        console.error('Failed to resend verification code:', error);
        this.verificationErrorMessage = 'Failed to resend the verification code. Please try again.';
      }
    );
  }


 
  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.translateService.get('PASSWORDS_DO_NOT_MATCH').subscribe((translatedMessage) => {
        alert(translatedMessage);
      });   return;
    }
    console.log('Resetting password:', this.newPassword);
  }

  navigateTo(route: string) {
    console.log(`Navigating to ${route}`);
  }

  registerUser() {
    const registrationData: RegistrationData = {
      username: this.username,
      email: this.email,
      password: this.password,
    };
  
    this.registrationService.registerUser(registrationData).subscribe({
      next: (response) => {
        console.log("response ", response)
        this.registrationMessage = 'Registration successful!';
        this.showRegisterModal = false;
        this.showCheckEmailModal = true;
        this.passwordStrengthMessage = '';
        this.passwordStrengthClass = '';
      },
      error: (errorMessage) => {
        console.error('Error details:', errorMessage); // ✅ Debugging log
  
        this.registrationMessage = errorMessage || 'An error occurred. Please try again.';
        
        this.showRegisterModal = true;
        this.showCheckEmailModal = false;
      },
    });
  }
  

  verifyEmail(): void {
    if (!this.email || !this.verificationCode) {
      this.translateService.get('VERIFICATION_CODE_REQUIRED').subscribe((translatedMessage) => {
        this.verificationErrorMessage = translatedMessage;
      });  return;
    }

    this.registrationService.verifyEmail(this.email, this.verificationCode).subscribe({
      next: (response) => {
        console.log("register response : ", response )
        this.openAccountCreatedModal();
        this.closeCheckEmailModal();
      },
      error: (err) => {
        this.translateService.get('INVALID_VERIFICATION_CODE').subscribe((translatedMessage) => {
          this.verificationErrorMessage = translatedMessage || err;
        });
      },
    });
  }

  showResendButton: boolean = false;

  loginUser(): void {
    if (!this.email || !this.password) {
      this.translateService.get('PLEASE_FILL_ALL_FIELDS').subscribe((translatedMessage) => {
        this.loginErrorMessage = translatedMessage;
      });
      this.showResendButton = false;
      return;
    }
  
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        const access = response.access;
        if (access) {
          localStorage.setItem('access', access);
          localStorage.setItem('user_id', response.user_id); // Store user_id
  
          this.authStateService.setLoggedIn(true);
          this.authStateService.setUsername(response.username);  // Save username
          this.authStateService.setUserData(response);
  
          this.username = response.username || 'User'; // If no username, fallback to 'User'
          console.log('Login successful:', response);
  
          setTimeout(() => this.closeSignInModal(), 1500);
        } else {
          this.translateService.get('LOGIN_FAILED_NO_ACCESS').subscribe((translatedMessage) => {
            this.loginErrorMessage = translatedMessage;
          });
          this.showResendButton = false;
        }
      },
      (error) => {
        if (error.status === 401) {
          console.log('Token invalid or expired. Logging out...');
          this.logout(); 
        } else {
          this.translateService.get('ERROR_OCCURRED').subscribe((translatedMessage) => {
            this.loginErrorMessage = error.message || translatedMessage;
          });
          console.log('Error:', this.loginErrorMessage);
        }
      }
    );
  }
  




  requestPasswordReset() {
    if (!this.email) {
      this.translateService.get('EMAIL_REQUIRED').subscribe((translatedMessage) => {
        this.forgotPasswordError = translatedMessage;
      }); return;
    }

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.showOtpModal = true;
        this.closeForgotPasswordModal();
        this.forgotPasswordError = '';
      },
      error: (error) => {
        this.translateService.get('ERROR_OCCURED').subscribe((translatedMessage) => {
          this.forgotPasswordError = error.message || translatedMessage;
          
        });
      },
    });
  }

  verifyResetCode() {
    if (!this.email || !this.otpCode) {
      this.translateService.get('CODE_REQUIRED').subscribe((translatedMessage) => {
        this.otpError = translatedMessage;
      });   return;
    }

    this.authService.verifyResetCode(this.email, this.otpCode).subscribe({
      next: () => {
        this.showResetPasswordModal = true;
        this.otpError = ''; // Clear error on success
      },
      error: (error) => {
        this.translateService.get('ERROR_OCCURED').subscribe((translatedMessage) => {
          this.otpError = error.message || translatedMessage;
        });
      },
  
    });
  }



  submitNewPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.translateService.get('ALL_FIELDS_REQUIRED').subscribe((translatedMessage) => {
        this.resetPasswordError = translatedMessage;
      });  return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.translateService.get('PASSWORDS_DO_NOT_MATCH').subscribe((translatedMessage) => {
        this.resetPasswordError = translatedMessage;
      });
    return;
    }

    this.authService.submitNewPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.openPasswordResetSuccessModal();
        this.resetPasswordError = ''; // Clear error on success
      },
      error: (error) => {
        this.translateService.get('ERROR_OCCURED').subscribe((translatedMessage) => {
          this.resetPasswordError = error.message || translatedMessage;
        });
      },
    });
  }
  passwordStrengthMessage: string = '';
  passwordStrengthClass: string = '';

  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrengthMessage = '';
      this.passwordStrengthClass = '';
      return;
    }

    const strengthChecks = {
      strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      medium: /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&#]{6,}$/,
    };

    if (strengthChecks.strong.test(password)) {
      this.translateService.get('STRONG_PASSWORD').subscribe((translation: string) => {
        this.passwordStrengthMessage = translation;
      });
      this.passwordStrengthClass = 'text-green-500';
    } else if (strengthChecks.medium.test(password)) {
      this.translateService.get('MEDIUM_PASSWORD').subscribe((translation: string) => {
        this.passwordStrengthMessage = translation;
      });
      this.passwordStrengthClass = 'text-yellow-500';
    }else {
      this.translateService.get('WEAK_PASSWORD').subscribe((translation: string) => {
        this.passwordStrengthMessage = translation;
      });
      this.passwordStrengthClass = 'text-red-500';
    }
  }

  advancedSearch = false;
  activeTab: string = 'companies';  
  companyName: string = '';
  location: string = '';
  canton: string = '';
  legalForm: string = '';
  showResults: boolean = false;  

  sampleData = [
    { name: 'Company A', uid: 'UID123', location: 'Zurich', canton: 'Zurich', legalForm: 'SA' },
    { name: 'Company B', uid: 'UID456', location: 'Geneva', canton: 'Geneva', legalForm: 'SARL' },
    { name: 'Company C', uid: 'UID789', location: 'Basel', canton: 'Basel', legalForm: 'Sole Proprietorship' }
  ];


  resetFields() {
    this.companyName = '';
    this.location = '';
    this.canton = '';
    this.legalForm = '';
  }

  search() {
    this.showResults = true;
  }
  addCompany() {
    this.isAddCompanyFormVisible = !this.isAddCompanyFormVisible;
  }
  cancelCompanyForm() {
    this.isAddCompanyFormVisible = false;
  }
 
  ngOnInit(): void {
    this.fetchParentCompanyData();

    // Set the current language from localStorage (only in the browser)
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      this.currentLanguage = savedLanguage ? savedLanguage : 'de'; // Default to English if no language is saved
      this.translateService.use(this.currentLanguage);
    }

    // Subscribe to username changes
    this.authStateService.username$.subscribe((username) => {
      this.username = username || 'Guest';
    });

    console.log('user', this.username);
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token is missing from localStorage!');
      }
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeMobileSidebar();
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  //  toggleMobileMenu(): void {
  //    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  //  }
 
  //  closeMobileMenu(): void {
  //    this.isMobileMenuOpen = false;
  //  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
    
    // Prevent body scrolling when sidebar is open
    if (this.mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
    document.body.style.overflow = '';
    this.mobileLangDropdownOpen = false; // Close language dropdown when sidebar closes
  }
  
  toggleMobileLangDropdown() {
    this.mobileLangDropdownOpen = !this.mobileLangDropdownOpen;
  }
  
  closeMobileLangDropdown() {
    this.mobileLangDropdownOpen = false;
  }

}
