import { Component, HostListener, Input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { CompanyService } from '../../services/company.service';
import { AuthStateService } from '../../services/auth-state.service';
import { Company } from '../../models/company.model';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';  // Import the xlsx library
import { NgSelectModule } from '@ng-select/ng-select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatIconModule } from '@angular/material/icon';

import { MatChipsModule } from '@angular/material/chips';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CompanySearchService } from '../../services/company-search.service';
import { ContactApiService } from '../../services/contact-api-service.service';
import { AuthService } from '../../services/auth.service';
import { PhoneFormatPipe } from "../../phone-format.pipe";
import { SalutationTranslatePipe } from '../../salutation-translate-pipe.pipe';
import { FileData, FileUploadComponent } from '../../shared/file-upload/file-upload.component';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { TruncatePipe } from '../../shared/core/truncate.pipe';
import { CompanyDetailsModalComponent } from '../shared/company-details-modal/company-details-modal.component';
import { SearchResultsGridComponent } from '../shared/search-results-grid/search-results-grid.component';



interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  
  imports: [MatChipsModule,
    MatIconModule,
    TranslateModule, FormsModule,
    CommonModule, NgSelectModule,
    ReactiveFormsModule, MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
   // SalutationTranslatePipe, PhoneFormatPipe,
  FileUploadComponent,
  MatTooltipModule, TruncatePipe,
  MatDialogModule,
  CompanyDetailsModalComponent,
  SearchResultsGridComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  isEdit = false;
  addForm: FormGroup;
  companyForm: FormGroup;

  logo:any;  
  advancedSearch = false;
  activeTab: string = 'companies';  // Default to companies tab
  companyName: string = '';
  location: string = '';
  canton: string = '';
  legalForm: string = '';
  showResults: boolean = false;
  isAddCompanyFormVisible = false;
  role: string = '';
  //  isLoggedIn: boolean=true;
  @Input() isLoggedIn!: boolean;

  companies: any[] = [];

  legalForms: any[] = [];
  selectedLegalForm: string = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 0;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  // Search pagination properties
  searchCurrentPage: number = 1;
  searchItemsPerPage: number = 10;
  searchTotalItems: number = 0;
  searchTotalPages: number = 0;
  searchHasNext: boolean = false;
  searchHasPrevious: boolean = false;

  showActivityDetailsModal = false;

  // Pagination options for search
  searchItemsPerPageOptions: number[] = [5, 10, 15, 20];

  // Pagination options
  itemsPerPageOptions: number[] = [5, 10, 15, 20];

  legalStatusChoices = [
    { value: 'active', label: 'LEGAL_STATUSE.ACTIVE' },
    { value: 'inactive', label: 'LEGAL_STATUSE.INACTIVE' },
    { value: 'dissolved', label: 'LEGAL_STATUSE.DISSOLVED' },
    { value: 'bankrupt', label: 'LEGAL_STATUSE.BANKRUPT' },
    { value: 'pending', label: 'LEGAL_STATUSE.PENDING_REGISTRATION' }
  ];
  
  getTranslatedStatus(status: string): string {
    return this.translate.instant('LEGAL_STATUSE.' + status.toUpperCase());
  }

  get currentLanguage(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  locations: string[] = [
    'Berlin', 'Paris', 'Madrid', 'Rome', 'Amsterdam', 'Lisbon', 'Vienna', 'Brussels', 'Zurich', 'Oslo'
  ];
  workDaysMap: { [key: string]: string } = {
    'Monday-Friday': 'WORK_DAYS.MON_FRI',
    'Lundi-Vendredi': 'WORK_DAYS.MON_FRI',
    'Lunedì-Venerdì': 'WORK_DAYS.MON_FRI',
  
    'Monday-Saturday': 'WORK_DAYS.MON_SAT',
    'Lundi-Samedi': 'WORK_DAYS.MON_SAT',
    'Lunedì-Sabato': 'WORK_DAYS.MON_SAT',
  
    'Monday-Sunday': 'WORK_DAYS.MON_SUN',
    'Lundi-Dimanche': 'WORK_DAYS.MON_SUN',
    'Lunedì-Domenica': 'WORK_DAYS.MON_SUN',
  };
  

  
  countries: { value: string, label: string }[] = [
    { value: 'switzerland', label: 'COUNTRIES.SWITZERLAND' }
  ];


  legalFormMap: { [key: string]: string } = {
    "Sole Proprietorship": "LEGAL_FORMS.SOLE_PROPRIETORSHIP",
    "General Partnership (GP)": "LEGAL_FORMS.GENERAL_PARTNERSHIP",
    "Public Limited Company (PLC) / Joint Stock Company (JSC)": "LEGAL_FORMS.PUBLIC_LIMITED_COMPANY",
    "Limited Liability Company (LLC)": "LEGAL_FORMS.LIMITED_LIABILITY_COMPANY",
    "Cooperative": "LEGAL_FORMS.COOPERATIVE",
    "Association": "LEGAL_FORMS.ASSOCIATION",
    "Foundation": "LEGAL_FORMS.FOUNDATION",
    "Special Legal Form": "LEGAL_FORMS.SPECIAL_LEGAL_FORM",

  };
  legalFormsList = [
    { key: "LEGAL_FORMS.SOLE_PROPRIETORSHIP", value: "Sole Proprietorship" },
    { key: "LEGAL_FORMS.GENERAL_PARTNERSHIP", value: "General Partnership (GP)" },
    { key: "LEGAL_FORMS.PUBLIC_LIMITED_COMPANY", value: "Public Limited Company (PLC)" },
    { key: "LEGAL_FORMS.LIMITED_LIABILITY_COMPANY", value: "Limited Liability Company (LLC)" },
    { key: "LEGAL_FORMS.COOPERATIVE", value: "Cooperative" },
    { key: "LEGAL_FORMS.ASSOCIATION", value: "Association" },
    { key: "LEGAL_FORMS.FOUNDATION", value: "Foundation" },
    { key: "LEGAL_FORMS.SPECIAL_LEGAL_FORM", value: "Special Legal Form" },
  ];


  getLegalFormName(legalFormName: string): string {
    const key = this.legalFormMap[legalFormName];

    return key ? this.translate.instant(key) : 'N/A';
  }
  getLegalFormKey(label: string): string {
    return Object.keys(this.legalFormMap).find(key => this.legalFormMap[key] === label) || '';
  }


  // Predefined Sector Choices
  sectorChoices = [
    { value: 'raw_materials', label: 'SECTORE.RAW_MATERIALS' },
    { value: 'manufacturing', label: 'SECTORE.MANUFACTURING' },
    { value: 'services', label: 'SECTORE.SERVICES' },
    { value: 'knowledge', label: 'SECTORE.KNOWLEDGE' },
    { value: 'public', label: 'SECTORE.PUBLIC' }
  ];
  getTranslatedSector(sectorValue: string): string {
    const sector = this.sectorChoices.find(choice => choice.value === sectorValue);
    return sector ? this.translate.instant(sector.label) : sectorValue;
  }

  typeOfCapitalChoices = [
    { value: 'ownership', label: 'TYPE_OF_CAPITALE.OWNERSHIP' },
    { value: 'funding', label: 'TYPE_OF_CAPITALE.FUNDING' },
    { value: 'legal', label: 'TYPE_OF_CAPITALE.LEGAL' }
  ];
  getTranslatedCapitalType(type: string): string {
    const capitalType = this.typeOfCapitalChoices.find(choice => choice.value === type);
    return capitalType ? capitalType.label : 'N/A'; // Returns the translation key or 'N/A' if not found
  }

  branchLocations = [
    { name: 'Aargau', abbreviation: 'AG' },
    { name: 'Appenzell Innerrhoden', abbreviation: 'AI' },
    { name: 'Appenzell Ausserrhoden', abbreviation: 'AR' },
    { name: 'Basel-Landschaft', abbreviation: 'BL' },
    { name: 'Basel-Stadt', abbreviation: 'BS' },
    { name: 'Bern', abbreviation: 'BE' },
    { name: 'Fribourg', abbreviation: 'FR' },
    { name: 'Geneva (Genève)', abbreviation: 'GE' },
    { name: 'Glarus', abbreviation: 'GL' },
    { name: 'Graubünden', abbreviation: 'GR' },
    { name: 'Jura', abbreviation: 'JU' },
    { name: 'Lucerne (Luzern)', abbreviation: 'LU' },
    { name: 'Neuchâtel', abbreviation: 'NE' },
    { name: 'Nidwalden', abbreviation: 'NW' },
    { name: 'Obwalden', abbreviation: 'OW' },
    { name: 'Schaffhausen', abbreviation: 'SH' },
    { name: 'Schwyz', abbreviation: 'SZ' },
    { name: 'Solothurn', abbreviation: 'SO' },
    { name: 'St. Gallen', abbreviation: 'SG' },
    { name: 'Thurgau', abbreviation: 'TG' },
    { name: 'Ticino', abbreviation: 'TI' },
    { name: 'Uri', abbreviation: 'UR' },
    { name: 'Valais (Wallis)', abbreviation: 'VS' },
    { name: 'Vaud', abbreviation: 'VD' },
    { name: 'Zug', abbreviation: 'ZG' },
    { name: 'Zurich (Zürich)', abbreviation: 'ZH' }
  ];
  getCantonName(abbreviation: string): string {
    const canton = this.branchLocations.find(c => c.abbreviation === abbreviation);
    return canton ? canton.name : abbreviation; // Fallback to abbreviation if not found
  }
  getBranchLocationNames(abbreviations: any): string {
    if (!Array.isArray(abbreviations)) {
      return this.getCantonName(abbreviations); // If it's a single string, return its name
    }
    return abbreviations.map(abbr => this.getCantonName(abbr)).join(', ');
  }



  onLocationChange() {
    console.log('Selected Location:', this.companyData.branch_locations);
  }

  selectedTypeOfCapital: string = '';

  selectedLegalStatus: string = '';
  selectedSector: string = '';
  selectedRegions: any[] = [];

  swissRegions = [
    { id: 1, name: 'Zurich' },
    { id: 2, name: 'Tunis' },
    { id: 3, name: 'Architecto fuga Mol' },
    { id: 4, name: 'Jegenstorf' },
    { id: 5, name: 'Suisse' },
    { id: 6, name: 'Jenins' },
  ];

  filteredRegions: any[] = [];

  filterRegions(searchText: any) {
    const term = typeof searchText === 'string' ? searchText : searchText?.term;

    if (term && term.length >= 1) {
      this.filteredRegions = this.swissRegions.filter(region =>
        region.name.toLowerCase().includes(term.toLowerCase())
      );
    } else {
      this.filteredRegions = [];
    }
  }

  onCustomRegionAdd(term: any) {
    const name = typeof term === 'string' ? term : term?.name;
  
    if (!name) return;
  
    const exists = this.selectedRegions.some(region =>
      region.name.toLowerCase() === name.toLowerCase()
    );
  
    if (!exists) {
      const newRegion = { id: null, name, displayLabel: name };
      this.selectedRegions = [...this.selectedRegions, newRegion];
    }
  }
  
  customAddTag = (name: string) => {
    if (!name) return null;
    return {
      id: null,
      name,
      displayLabel: `${name}`
    };
  };
  currentSearchTerm: string = '';

  onRegionSearch(event: { term: string; items: any[] }) {
    this.currentSearchTerm = event.term;
    this.filterRegions(event.term); 
  }
  
  







  sampleData = [
    { name: 'Company A', uid: 'UID123', location: 'Zurich', canton: 'Zurich', legalForm: 'SA' },
    { name: 'Company B', uid: 'UID456', location: 'Geneva', canton: 'Geneva', legalForm: 'SARL' },
    { name: 'Company C', uid: 'UID789', location: 'Basel', canton: 'Basel', legalForm: 'Sole Proprietorship' }
  ];
  selectedKantons: any[] = [];

  kantons = [
    { code: 'AG', name: 'Aargau', selected: false },
    { code: 'AI', name: 'Appenzell Innerrhoden', selected: false },
    { code: 'AR', name: 'Appenzell Ausserrhoden', selected: false },
    { code: 'BL', name: 'Basel-Landschaft', selected: false },
    { code: 'BS', name: 'Basel-Stadt', selected: false },
    { code: 'BE', name: 'Bern', selected: false },
    { code: 'FR', name: 'Fribourg', selected: false },
    { code: 'GE', name: 'Geneva (Genève)', selected: false },
    { code: 'GL', name: 'Glarus', selected: false },
    { code: 'GR', name: 'Graubünden', selected: false },
    { code: 'JU', name: 'Jura', selected: false },
    { code: 'LU', name: 'Lucerne (Luzern)', selected: false },
    { code: 'NE', name: 'Neuchâtel', selected: false },
    { code: 'NW', name: 'Nidwalden', selected: false },
    { code: 'OW', name: 'Obwalden', selected: false },
    { code: 'SH', name: 'Schaffhausen', selected: false },
    { code: 'SZ', name: 'Schwyz', selected: false },
    { code: 'SO', name: 'Solothurn', selected: false },
    { code: 'SG', name: 'St. Gallen', selected: false },
    { code: 'TG', name: 'Thurgau', selected: false },
    { code: 'TI', name: 'Ticino', selected: false },
    { code: 'UR', name: 'Uri', selected: false },
    { code: 'VS', name: 'Valais (Wallis)', selected: false },
    { code: 'VD', name: 'Vaud', selected: false },
    { code: 'ZG', name: 'Zug', selected: false },
    { code: 'ZH', name: 'Zurich (Zürich)', selected: false },
  ];
  searchQuery: string = '';
  searchResults: any[] = [];
  filters: string = '';


  constructor(private snackBar: MatSnackBar,private contactApiService: ContactApiService, private translateService: TranslationService, private companyService: CompanyService, private authStateService: AuthStateService, private fb: FormBuilder, private searchService: CompanySearchService, private translate: TranslateService, private authService: AuthService) {
    this.authStateService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.refreshCompanies();  // Fetch data dynamically on login
      }
    });
    this.addForm = this.fb.group({
      companyName: ['', Validators.required],
      legal_forms: ['', Validators.required],
      legal_status: ['', Validators.required],
      sector: ['', Validators.required],
      headquartersAddress: ['', Validators.required],
      branchLocations: [''],
      role: [''],
      signature: [''],
      first_name: ['',
        [Validators.required, Validators.maxLength(255)]],
      last_name: ['',
        [Validators.required, Validators.maxLength(255)]],
      salutation: ['', Validators.required],
      number_of_employees: [0, [Validators.pattern(/^\d+$/)]],
      companyPurpose: ['', Validators.required],

      company_capital: [''],
      projectActivity: [''],
      location: ['', [Validators.required]],
      details: [''],
      financial_report: [''],
      logo: [''], //null
      unique_identifier: [
        '',
        [
          Validators.required,
          Validators.pattern(/^CHE-\d{3}\.\d{3}\.\d{3}$/)
        ]
      ],
      companyProfile: [
        ''
        // [ Validators.pattern(/^(https?:\/\/(www\.)?|http:\/\/|https:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(\/\S*)?$/)]
      ],
      
      zip_code: ['', Validators.required],
      country: ['', Validators.required],
      languages: [[], Validators.required],
      email: ['', [ Validators.email]],

      company_phone_number: ['', Validators.required],
      director_phone_number: ['',Validators.pattern(/^[0-9]{7,15}$/)],

    });
    this.companyForm = this.fb.group({
      companyName: ['', [Validators.required]],
      uniqueIdentifier: ['', [Validators.required]],
      companyProfile: [''],
      additionalInformation: ['', [Validators.required]],
      companyPurpose: ['', [Validators.required]],
      languages: [[], [Validators.required]],
      headquartersAddress: ['', [Validators.required]],
      branchLocations: [''],
      zipCode: ['', [Validators.required]],
      location: ['', [Validators.required]],
      country: ['', [Validators.required]],
      email: ['', [ Validators.email]],
      phone_number: ['', [ Validators.pattern(/^[0-9]{7,15}$/)]]

    });


  }
  salutationOptions: string[] = ['MR', 'MS'];

  onCapitalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!this.addForm) return;
  
    // Allow only digits (no decimal in the example format)
    let value = input.value.replace(/[^0-9]/g, '');
  
    this.addForm.get('financial_information.company_capital')?.setValue(value, { emitEvent: false });
  }
  
  companyCapital = new FormControl('');

formatCapital(event: any) {
  const input = event.target;
  let rawValue = input.value.replace(/[^0-9]/g, ''); // Keep only numbers
  
  if (rawValue === '') {
    input.value = '';
    // Set the form control to null/empty for backend
    this.companyCapital.setValue(null, { emitEvent: false });
    // Optional: Keep the raw value for internal use
    this.addForm.get('financial_information._company_capital_raw')?.setValue(0);
    return;
  }
  
  // Format for display with thousand separators
  // const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g);
  const displayValue = `${rawValue} CHF`;
  
  // Update the input display
  input.value = displayValue;
  
  // IMPORTANT: Set the form control to the RAW NUMERIC VALUE (not the formatted string)
  const numericValue = parseFloat(rawValue) || 0;
  this.companyCapital.setValue(numericValue.toString(), { emitEvent: false });
  
  // Optional: Store formatted version separately if needed for display elsewhere
  this.addForm.get('financial_information._company_capital_raw')?.setValue(numericValue);
  
  // Keep cursor before CHF
  setTimeout(() => {
    const cursorPos = displayValue.length - 4;
    input.setSelectionRange(cursorPos, cursorPos);
  }, 0);
}
  
  onFocus(event: any) {
    const input = event.target;
    let value = input.value;
    
    // Remove CHF for easier editing
    if (value.includes('CHF')) {
      value = value.replace(' CHF', '').trim();
      input.value = value;
      
      // Place cursor at the end
      setTimeout(() => {
        input.setSelectionRange(value.length, value.length);
      }, 0);
    }
  }
  
  onBlur(event: any) {
    const input = event.target;
    let value = input.value.trim();
    
    if (value && !value.includes('CHF')) {
      // Clean and reformat on blur
      value = value.replace(/[^0-9.]/g, '');
      
      if (value) {
        // Remove existing periods and reformat
        const cleanValue = value.replace(/\./g, '');
        const formatted = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const finalValue = `${formatted} CHF`;
        
        input.value = finalValue;
        this.companyCapital.setValue(finalValue, { emitEvent: false });
        
        // Update raw value
        const rawValue = parseFloat(cleanValue) || 0;
        this.addForm.get('financial_information._company_capital_raw')?.setValue(rawValue);
      }
    }
  }
  
  // Helper method to maintain cursor position
  private calculateCursorPosition(oldPos: number, rawValue: string, formattedValue: string): number {
    if (oldPos <= 0) return 0;
    
    // Count dots before cursor position in raw value
    const valueBeforeCursor = rawValue.substring(0, oldPos);
    const formattedBeforeCursor = valueBeforeCursor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return Math.min(formattedBeforeCursor.length, formattedValue.length - 4); // -4 for " CHF"
  }
  

  formatSwissNumber(value: number | string): string {
    if (value === null || value === undefined) return '';
  
    const numValue = typeof value === 'string' ? Number(value) : value;
  
    if (isNaN(numValue)) return String(value);
  
    const isWholeNumber = numValue % 1 === 0;
    const integerPart = Math.floor(numValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
    // Only show decimal part if it's not .00
    if (isWholeNumber) {
      return `${integerPart} CHF`;
    } else {
      const decimalPart = (numValue % 1).toFixed(2).split('.')[1];
      return `${integerPart}.${decimalPart} CHF`;
    }
  }


  

  private parseNumberInput(value: string | number): number {
    if (typeof value === 'number') return value;

    // Standardize to period decimal separator
    const standardized = value.toString()
      .replace(/'/g, '')
      .replace(/,/g, '.');

    return parseFloat(standardized);
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace(/,/g, "'");
  }


  changeLanguage(lang: string) {
    this.translateService.changeLanguage(lang);
  }
  isTableVisible = true; // Set initial value based on whether the table should be visible initially

  toggleTableVisibility() {
    this.isTableVisible = !this.isTableVisible;
  }
  search() {
    this.showResults = true;
  }

  addCompany() {
    this.isAddCompanyFormVisible = true;

    this.isEdit = false;
    this.isTableVisible = false;



  }
  exportToXLS(): void {
    // Prepare data from searchResults
    const tableData = this.searchResults.map(company => ({
      [this.translate.instant('EXPORT.UID')]: company.unique_identifier,
      [this.translate.instant('EXPORT.COMPANY_NAME')]: company.name,
      [this.translate.instant('EXPORT.APPROVAL_STATUS')]: this.translate.instant('STATUS_' + company.legal_information.legal_status?.toUpperCase()),
      [this.translate.instant('EXPORT.COMPANY_PROFILE')]: company.company_profile,
      [this.translate.instant('EXPORT.COMPANY_PURPOSE')]: company.company_purpose,
      [this.translate.instant('EXPORT.LANGUAGES')]: company.languages.join(', '),
      [this.translate.instant('EXPORT.PHONE_NUMBER')]: company.phone_number,
      [this.translate.instant('EXPORT.LEGAL_FORM')]: this.translate.instant(this.legalFormMap[company.legal_information.legal_forms] || company.legal_information.legal_forms) || company.legal_information.legal_forms,
      [this.translate.instant('EXPORT.LEGAL_STATUS')]: this.translate.instant('LEGAL_STATUSE.' + company.legal_information.legal_status.toUpperCase()) || company.legal_information.legal_status,
      [this.translate.instant('EXPORT.SECTOR')]: this.translate.instant(company.legal_information.sector) || company.legal_information.sector,
       [this.translate.instant('EXPORT.COMPANY_CAPITAL')]: this.formatSwissNumber(company.financial_information?.company_capital) + ' CHF',
      [this.translate.instant('EXPORT.HEADQUARTERS')]: company.headquarters,
      [this.translate.instant('EXPORT.BRANCH_LOCATIONS')]: Array.isArray(company.branch_locations) ? company.branch_locations.join(', ') : company.branch_locations,
      [this.translate.instant('EXPORT.ZIP_CODE')]: company.zip_code,
    }));

    // Convert data to a worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(tableData);

    // Adjust column widths based on the maximum length of each column
    const colWidths = this.getColumnWidths(tableData);
    ws['!cols'] = colWidths;

    // Create the workbook and append the sheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.translate.instant('EXPORT.SHEET_NAME'));

    // Generate the XLS file and trigger the download
    XLSX.writeFile(wb, 'Company_Details.xlsx');
}


  // Helper function to calculate column widths dynamically
  getColumnWidths(data: any[]): any[] {
    const columnWidths: any[] = [];

    // Check each column in the first row to calculate the max width
    const firstRow = data[0];
    Object.keys(firstRow).forEach(key => {
      let maxLength = key.length;  // Start with the length of the header (column name)

      data.forEach(row => {
        const cellValue = row[key] ? row[key].toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });

      columnWidths.push({ wch: maxLength });
    });

    return columnWidths;
  }



  isEditing = false;

  cancelEdit() {
    this.isEditing = false;
  }
  // companyData:any;
  companyData: Company = {
    id: '',
    name: '',
    headquarters: '',
    branch_locations: '',

    directors: [{
      role: '', signature: '',
      first_name: '',
      last_name: '',
      salutation: '',
      number_of_employees: 0,
      email: '',
      phone_number: 0
    }],
    legal_information: {
      legal_forms: '',
      legal_status: '',
      sector: ''
    },
    financial_information: {
      company_capital: ''
    },
    activity: {
      details: '',
      project_name: '',
      location: ''
    },
    financial_report: '',
    unique_identifier: '',
    company_profile: '',
    company_purpose: '',
    zip_code: '',
    location: '',
    country: '',
    languages: [],
    phone_number: 0,

    logo: ''

  };
  errorMessages: { [key: string]: string } = {};
  successMessage: string = '';
  availableLanguages: string[] = [
    'English',
    'French',
    'German',
    'Italien',
  
  ];
  
  getInvalidControls() {
    const invalidControls: string[] = [];
    const controls = this.addForm.controls;
  
    for (const name in controls) {
      if (controls[name].invalid) {
        invalidControls.push(name);
      }
    }
  
    return invalidControls;
  }
  
  submitCompany() {
    console.log('Form submitted:', this.addForm.value);
    console.log('Company data financial_report:', this.companyData.financial_report ? 'Present' : 'Not present');
    
    // if (this.addForm.invalid) {
    //   this.translate.get('FORM_INVALID').subscribe((translatedMessage) => {
    //     this.errorMessages['formValidation'] = translatedMessage;
    //   });
    //   return;
    // }

    if (this.addForm.invalid) {
      const invalidFields = this.getInvalidControls();
    
      this.translate.get('FORM_INVALID').subscribe((translatedMessage) => {
        this.errorMessages['formValidation'] = `${translatedMessage}: ${invalidFields.join(', ')}`;
      });
    
      return;
    }

    // Remove financial_report from companyData if it's not present
    if (!this.companyData.financial_report) {
      delete this.companyData.financial_report;
    }

    // if (!this.companyData.logo) {
    //   delete this.companyData.logo;
    // }
  
    try {
      // Map form values to company data
      this.companyData.name = this.addForm.value.companyName;
      this.companyData.headquarters = this.addForm.value.headquartersAddress;
      this.companyData.branch_locations = this.addForm.value.branchLocations;
      this.companyData.unique_identifier = this.addForm.value.unique_identifier;
  
      this.companyData.directors = [{
        role: this.addForm.value.role,
        signature: this.addForm.value.signature,
        first_name: this.addForm.value.first_name,
        last_name: this.addForm.value.last_name,
        salutation: this.addForm.value.salutation,
        number_of_employees: this.addForm.value.number_of_employees,
        email: this.addForm.value.email,
        phone_number: this.addForm.value.director_phone_number,
      }];
      
      this.companyData.legal_information.legal_forms = Object.keys(this.legalFormMap).find(
        key => this.legalFormMap[key] === this.addForm.value.legal_forms
      ) || 'Unknown';
      this.companyData.legal_information.legal_status = this.addForm.value.legal_status;
      this.companyData.legal_information.sector = this.addForm.value.sector;
  
      this.companyData.financial_information.company_capital = this.convertToValidNumber(this.addForm.value.company_capital) || '0';
  
      this.companyData.activity.details = this.addForm.value.details;
      this.companyData.activity.project_name = this.addForm.value.projectActivity;
      this.companyData.activity.location = this.addForm.value.location;
      this.companyData.company_profile = this.addForm.value.companyProfile;
      this.companyData.company_purpose = this.addForm.value.companyPurpose;
      this.companyData.zip_code = this.addForm.value.zip_code;
      this.companyData.location = this.addForm.value.location;
      this.companyData.country = this.addForm.value.country;
      this.companyData.languages = this.addForm.value.languages;
      this.companyData.phone_number = this.addForm.value.company_phone_number;
      this.companyData.logo = this.addForm.value.logo || '';

      console.log('Company data with base64 logo:', {
        name: this.companyData.name,
        logo: this.companyData.logo ? this.companyData.logo.substring(0, 50) + '...' : 'No logo',
        preview: this.companyData.logo!.substring(0, 50) + '...',
        logoLength: this.companyData.logo?.length || 0,
        isClean: this.companyData.logo!.startsWith('data:')

      });
      
      console.log('Final company data before submission:', {
        ...this.companyData,
        financial_report: this.companyData.financial_report ? `Base64 string (${this.companyData.financial_report.length} chars)` : 'Empty',
        logo: this.companyData.logo ? `Base64 string (${this.companyData.logo.length} chars)` : 'Empty'
      });
  
      this.companyService.createCompany(this.companyData).subscribe({
        next: (response) => {
          console.log('Company created successfully:', response);
          this.translate.get('COMPANY_CREATED_SUCCESS').subscribe((translatedMessage) => {
            this.successMessage = translatedMessage;
          });
          this.resetForm();
          this.activeTab = 'myCompanies';
          
          // Reset to first page and refresh
          this.currentPage = 1;
          this.getCompanies();
          
          this.cancelCompanyForm();
          this.isTableVisible = true;
        },
        error: (error) => {
          // console.error('Full error response:', error);
          // console.error('Error details:', error.error);
          // let errorMessage = error.error?.detail || error.message || 'An unknown error occurred. Please try again.';
          // console.log('Displaying error message:', errorMessage);
          // this.errorMessages = { companyCreation: errorMessage };
         
          this.translate.get('COMPANY_CREATED_SUCCESS').subscribe((translatedMessage) => {
            this.successMessage = translatedMessage;
          });
          this.resetForm();
          this.activeTab = 'myCompanies';
          
          // Reset to first page and refresh
          this.currentPage = 1;
          this.getCompanies();
          
          this.cancelCompanyForm();
          this.isTableVisible = true;
        }
      });
  
    } catch (e) {
      console.error('Unexpected error:', e);
      this.errorMessages = { general: 'Unexpected error occurred. Please try again.' };
    }
}

  convertToValidNumber(value: string): string {
    // Remove apostrophes and any non-numeric characters, but keep the decimal point
    const cleanedValue = value.replace(/[^0-9.]/g, '');

    // Ensure it's a valid number or string
    return cleanedValue;
  }

  resetForm() {
    this.companyData = {
      id: '',
      name: '',
      headquarters: '',
      branch_locations: '',
      directors: [{
        role: '', signature: '',
        first_name: '',
        last_name: '',
        salutation: '',
        number_of_employees: 0,
        email: '',
        phone_number: 0
      }],
      legal_information: {
        legal_forms: '',
        legal_status: '',
        sector: ''
      },
      financial_information: {
        company_capital: ''
      },
      activity: {
        details: '',
        project_name: '',
        location: ''
      },
      financial_report: '',
      unique_identifier: '',
      company_profile: '',
      company_purpose: '',
      zip_code: '',
      location: '',
      country: '',
      languages: [],
      phone_number: 0,
      logo: ''
    };
    
    // Reset form
    this.addForm.reset();
    
    // Reset file upload state
    this.uploadedFile = null;
    this.errorMessage = null;
    
    // Reset file input elements
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => {
      input.value = '';
    });
    
    console.log('Form and file upload state reset');
  }

  cancelCompanyForm() {
    this.isAddCompanyFormVisible = false;
    this.isTableVisible = true;
    this.resetForm();
  }

  ngOnInit(): void {
    console.log("teest");
    this.loadCompanies();
    console.log("teest");

    this.refresh();
    if (this.isLoggedIn) {
      this.refreshCompanies();
    }
    this.fetchParentCompanyData();
    console.log('Original legal form:', this.companyData?.legal_information?.legal_forms);


    console.log('Mapped legal form:', this.companyData.legal_information.legal_forms);

    console.log("Financial Report URL: ", this.selectedCompany?.activity?.financial_report);
    if (this.companyData) {
      const capitalValue = this.companyData.financial_information?.company_capital || 0;
      this.addForm.patchValue({
        financial_information: {
          company_capital: this.formatSwissNumber(capitalValue),
          _company_capital_raw: this.parseNumberInput(capitalValue)
        }
      });
    }

    
  }

  refreshCompanies(): void {

    this.getCompanies();

    if (this.companyID) {
      this.getCompanyDetails(this.companyID);
    }

    this.closeForm();
  }

  getCompanies(params?: Partial<PaginationParams>): void {
    const paginationParams: PaginationParams = {
      page: this.currentPage,
      page_size: this.itemsPerPage,
      ...params // Override with any provided params
    };

    this.companyService.getCompanies(paginationParams).subscribe({
      next: (response: PaginatedResponse<any>) => {
        this.companies = response.results || [];
        this.totalItems = response.count;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.hasNext = !!response.next;
        this.hasPrevious = !!response.previous;
        
        console.log('Pagination info:', {
          totalItems: this.totalItems,
          totalPages: this.totalPages,
          currentPage: this.currentPage,
          itemsPerPage: this.itemsPerPage,
          hasNext: this.hasNext,
          hasPrevious: this.hasPrevious
        });
      },
      error: (error) => {
        console.error('Error fetching companies:', error);
        this.refresh();
      }
    });
  }


 
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.getCompanies();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.hasPrevious) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.getCompanies();
  }

  // Get current page info
  get currentPageInfo(): string {
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${startItem}-${endItem} of ${this.totalItems}`;
  }

  // Get page numbers for pagination controls
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, this.currentPage - halfRange);
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

 

 
  companiess: any[] = [];
  loadCompanies(): void {
    this.searchService.getCompanyList().subscribe({
      next: (data: any) => {
        console.log('Companies data111:', data);
        if (Array.isArray(data.results)) {
          this.companiess = data.results;
        } else {
          console.error('Unexpected data format:', data);
          this.companiess = [];
        }
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
      }
    });
  }
  
  
  
  


  logout(): void {

    this.authStateService.logout();
    this.isLoggedIn = false;
    location.reload();


  }
  refresh(): void {
    this.authService.refreshToken().subscribe({
      next: (response) => {
        console.log('Token refreshed:', response);
        this.refreshCompanies();

      },
      error: (err) => {
        console.error('Error refreshing token:', err);
      },
    });

  }
  isModalOpen = false;
  companyUID = '';   // Dynamic Company ID
  companyID = '';   // Dynamic Company ID

  openModal(company: { name: string; id: string | undefined }) {
    if (!company.id) {
      console.error('Company ID is undefined!');
      return;
    }

    this.companyName = company.name;
    this.companyID = company.id;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.errorMessage55 = null;

  }
  errorMessage55: string | null = null; // Add this property


  requestDeletion(companyID: string | undefined): void {
    if (!companyID) {
      this.translate.get('COMPANY_ID_MISSING').subscribe((translatedMessage) => {
        console.error(translatedMessage);
      }); 
      return;
    }

    this.companyService.deleteCompany(companyID).subscribe({
      next: (response) => {
        this.translate.get('COMPANY_DELETED_SUCCESS').subscribe((translatedMessage) => {
          console.log(translatedMessage, response);
        });
        this.errorMessage55 = null;
        this.closeModal();
        
        // If we're on a page that becomes empty after deletion, go to previous page
        const remainingItems = this.totalItems - 1;
        const maxPage = Math.ceil(remainingItems / this.itemsPerPage);
        if (this.currentPage > maxPage && maxPage > 0) {
          this.currentPage = maxPage;
        }
        
        this.getCompanies();
      },
      error: (error) => {
        console.error('Error archiving company:', error);
        this.translate.get('ERROR_ARCHIVING_COMPANY').subscribe((translatedMessage) => {
          this.errorMessage55 = error?.error?.detail || translatedMessage;
        });
      }
    });
  }


  originalCompanyData: Company = {
    id: '',
    name: '',
    headquarters: '',
    branch_locations: '',
    directors: [{
      role: '', signature: '',
      first_name: '',
      last_name: '',
      salutation: '',
      number_of_employees: 0,
      email: '',
      phone_number: 0
    }],
    legal_information: {
      legal_forms: '',
      legal_status: '',
      sector: ''
    },
    financial_information: {
      company_capital: ''
    },
    activity: {
      details: '',
      project_name: '',
      location: ''
    },
    financial_report: '',
    unique_identifier: '',
    company_profile: '',
    company_purpose: '',
    zip_code: '',
    location: '',
    country: '',
    languages: [],
    phone_number: 0


  };

  getCompanyDetails(companyID: string) {
    this.companyService.getCompanyById(companyID).subscribe({
      next: (data) => {
        console.log('Company Details:', data);
  
        // Format the capital if available
        if (data.financial_information?.company_capital) {
          data.financial_information.company_capital =
            this.formatSwissNumber(data.financial_information.company_capital);
        }
  
        this.companyData = { ...data };
        this.originalCompanyData = JSON.parse(JSON.stringify(data));
        this.isEdit = true;
        this.isTableVisible = false;
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
  
        let messageKey = err.status === 404
        ? 'ERROR.COMPANY_NOT_FOUND'
        : 'ERROR.COMPANY_NOT_APPROVED';
      
      this.translate.get(messageKey).subscribe((translatedMessage) => {
        this.snackBar.open(translatedMessage, 'Close', {
          duration: 8000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      });
  
        this.refresh();
      }
    });
  }
  
  // Declare two flags in your component:
  isAnotherSectionVisible = false;
  isThirdSectionVisible = false;

  selectedCompany: any = null;
  isCompanyDetailsVisible: boolean = false;
  viewCompanyDetails(companyID: string) {
    this.companyService.getCompanyById1(companyID).subscribe({
      next: (data) => {
        console.log('Company Details:', data);
        this.selectedCompany = { ...data };
  
        this.isCompanyDetailsVisible = true;
        this.isAnotherSectionVisible = false;
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
  
        let messageKey = err.status === 404
        ? 'ERROR.COMPANY_NOT_FOUND'
        : 'ERROR.COMPANY_NOT_APPROVED';
      
      this.translate.get(messageKey).subscribe((translatedMessage) => {
        this.snackBar.open(translatedMessage, 'Close', {
          duration: 8000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      });
      
  
        this.refresh();
      }
    });
  }
  
  
  viewCompanyDetailss(companyID: string) {
    console.log("Fetching details for company ID:", companyID); // Debugging log

    this.companyService.getCompanyById(companyID).subscribe({
      next: (data) => {
        console.log('Company Details:', data);
        this.selectedCompany = { ...data }; // Store company details

        this.isAnotherSectionVisible = true; // Show modal
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
        this.refresh();
      },
    });
  }
  viewCompanyDetailsss(companyID: string) {
    console.log("Fetching details for company ID:", companyID); // Debugging log

    this.companyService.getCompanyById(companyID).subscribe({
      next: (data) => {
        console.log('Company Details:', data);
        this.selectedCompany = { ...data }; // Store company details

        this.isThirdSectionVisible = true; // Show modal
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
        this.refresh();
      },
    });
  }
  closeisCompanyDetailsVisible() {
    this.isCompanyDetailsVisible = false;

  }
  closeisCompanyDetailsVisible2() {
    this.isAnotherSectionVisible = false;
  }
  


  closeForm() {
    this.isEdit = false;
    this.isTableVisible = true;
    this.successMessagee1 = '';
    this.successMessagee2 = '';
    this.successMessagee3 = '';
    this.successMessagee4 = '';
    this.successMessagee5 = '';
    this.successMessagee6 = '';
  }
  languageCodeToKey: { [key: string]: string } = {
    EN: 'English',
    FR: 'French',
    DE: 'German',
    IT: 'Italien',
  };
  
  generatePDF(companyID: string) {
    this.companyService.getCompanyById(companyID).subscribe({
      next: (data) => {
        this.refresh();
        const doc = new jsPDF();
        // Use German translations for section titles
      const COMPANY_REPORT = this.translate.instant('PDF.COMPANY_REPORT');
      const COMPANY_INFO = this.translate.instant('COMPANY_INFO');
      const LEGAL_INFO = this.translate.instant('LEGAL_INFO');
      const FINANCIAL_INFO = this.translate.instant('FINANCIAL_INFO');
      const ADDRESS_INFO = this.translate.instant('ADDRESS_INFO');
      const MANAGEMENT_DETAILSS = this.translate.instant('MANAGEMENT_DETAILS');
      const ACTIVITIESS = this.translate.instant('ACTIVITIES');
      const FILENAME = this.translate.instant('PDF.FILENAME');
        doc.setFontSize(14);
        doc.text(this.translate.instant('PDF.COMPANY_REPORT'), 14, 10);
  
        const selectedCompany = { ...data };
        let y = 20;
  
        const drawRoundedBorder = (data: any) => {
          const table = data.table;
          doc.setDrawColor(8, 94, 90);
          doc.roundedRect(table.startX, table.startY, table.width, table.height, 4, 4, 'S');
        };
  
        const tableOptions = {
          theme: 'grid',
          styles: { fontSize: 11, cellPadding: 3 },
          headStyles: { fillColor: [8, 94, 90], textColor: 255, fontStyle: 'bold' },
          didDrawTable: drawRoundedBorder,
        };
  
        const addSection = (title: string, head: any[], body: any[][]) => {
          if (body.length > 0 && body[0].some(cell => cell !== '' && cell !== null)) {
            doc.setFontSize(12);
            doc.text(this.translate.instant(title), 14, y);
            y += 6;
            (doc as any).autoTable({ ...tableOptions, startY: y, head, body });
            y = (doc as any).lastAutoTable.finalY + 10;
          }
        };
  
        // Section: Created By
        addSection('CREATED_BY',
          [[this.translate.instant('Full Name'), this.translate.instant('Email')]],
          [[selectedCompany?.employee_username || '', selectedCompany?.employee || '']]
        );
  
        // Section: Company Info
        addSection('COMPANY_INFO',
          [[
            this.translate.instant('UID'),
            this.translate.instant('Company Name'),
            this.translate.instant('Approval Status'),
            this.translate.instant('Company Profile')
          ]],
          [[
            selectedCompany?.unique_identifier || '',
            selectedCompany?.name || '',
            this.translate.instant('STATUS_' + (selectedCompany?.approval_status?.toUpperCase() || '')),
            selectedCompany?.company_profile || ''
          ]]
        );
  
        // Additional sections
        addSection('COMPANY_INFO',
          [[
            this.translate.instant('Company Purpose'),
            this.translate.instant('Languages'),
            this.translate.instant('Phone Number')
          ]],
          [[
            this.cleanText(selectedCompany?.company_purpose),
            (selectedCompany?.languages || [])
              .map((code: string) =>
                this.translate.instant('LANGUAGES.' + (this.languageCodeToKey[code] || code))
              ).join(', '),
            selectedCompany?.phone_number || ''
          ]]
        );
        
  
        addSection('LEGAL_INFO',
          [[
            this.translate.instant('LEGAL_FORM'),
            this.translate.instant('LEGAL_STATUS'),
            this.translate.instant('SECTOR')
          ]],
          [[
            this.getLegalFormName(selectedCompany?.legal_information?.legal_forms || 'DEFAULT_LEGAL_FORM'),
            this.translate.instant('LEGAL_STATUSE.' + (selectedCompany?.legal_information?.legal_status?.toUpperCase() || 'DEFAULT_LEGAL_STATUS')),
            this.getTranslatedSector(selectedCompany?.legal_information?.sector?.trim() || 'DEFAULT_SECTOR')
          ]]
        );
  
        addSection('FINANCIAL_INFO',
          [[this.translate.instant('COMPANY_CAPITAL')]],
          [[this.formatSwissNumber(selectedCompany?.financial_information?.company_capital)]]
        );
  
        addSection('ADDRESS_INFO',
          [[
            this.translate.instant('HEADQUARTERS'),
            this.translate.instant('BRANCH_LOCATIONS'),
            this.translate.instant('ZIP CODE'),
            this.translate.instant('LOCATION'),
            this.translate.instant('COUNTRY')
          ]],
          [[
            selectedCompany?.headquarters || '',
            this.getBranchLocationNames(selectedCompany?.branch_locations) || '',
            selectedCompany?.zip_code || '',
            selectedCompany?.location || '',
            this.translate.instant(`COUNTRIES.${selectedCompany?.country?.toUpperCase()}`) || ''
          ]]
        );
  
        const managementBody = (selectedCompany?.directors || []).map((director: any) => [
          this.translate.instant(director.salutation || ''),
          director.first_name || '',
          director.last_name || '',
          director.signature || '',
          director.number_of_employees?.toString() || ''
        ]);
        addSection('MANAGEMENT_DETAILSS',
          [[
            this.translate.instant('SALUTATION'),
            this.translate.instant('FIRST_NAME'),
            this.translate.instant('LAST_NAME'),
            this.translate.instant('SIGNATORIES'),
            this.translate.instant('NUMBER_OF_EMPLOYEES')
          ]],
          managementBody
        );
  
        const activity = selectedCompany?.activity;
        addSection('ACTIVITIESS',
          [[this.translate.instant('PROJECT_ACTIVITY'), this.translate.instant('LOCATION')]],
          activity
            ? [[
                this.cleanText(`${activity.project_name || ''} - ${activity.details || ''}`),
                activity.location || ''
              ]]
            : []
        );
        
  
        doc.save(FILENAME + '.pdf');
      },
      error: (err) => {
        console.error('Error fetching company details:', err);
        this.refresh();
      }
    });
  }
  
  
  cleanText(text: string | undefined | null): string {
    if (!text) return '';
    return text
      .replace(/[^\x00-\x7F]/g, '') 
      .replace(/\s+/g, ' ')        
      .trim();
  }
  
  
  
  

  

  showSignatureField = false;

  showBranchInput: boolean = false;


  successMessagee1: string = '';
  successMessagee2: string = '';
  successMessagee3: string = '';
  successMessagee4: string = '';
  successMessagee5: string = '';
  successMessagee6: string = '';
  errorMessagesUpdateLogo:string = '';
  removeLanguage(lang: string) {
    this.companyData.languages = this.companyData.languages.filter((l: string) => l !== lang);
  }
  edit() {
    this.errorMessages = {};

    if (!this.companyData.name || !this.companyData.headquarters || !this.companyData.location || !this.companyData.country) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedMessage) => {
        this.errorMessages['general'] = translatedMessage;
      });
      return;
    }
    const updateData: Partial<Company> = {};

    if (this.companyData.name !== this.originalCompanyData.name) {
      updateData.name = this.companyData.name;
    }
    if (this.companyData.headquarters !== this.originalCompanyData.headquarters) {
      updateData.headquarters = this.companyData.headquarters;
    }
    if (this.companyData.branch_locations !== this.originalCompanyData.branch_locations) {
      updateData.branch_locations = this.companyData.branch_locations;
    }
    if (this.companyData.financial_report !== this.originalCompanyData.financial_report) {
      updateData.financial_report = this.companyData.financial_report;
    }
    if (this.companyData.unique_identifier !== this.originalCompanyData.unique_identifier) {
      updateData.unique_identifier = this.companyData.unique_identifier;
    }
    if (this.companyData.company_profile !== this.originalCompanyData.company_profile) {
      updateData.company_profile = this.companyData.company_profile;
    }
    if (this.companyData.phone_number !== this.originalCompanyData.phone_number) {
      updateData.phone_number = this.companyData.phone_number;
    }

    if (this.companyData.company_purpose !== this.originalCompanyData.company_purpose) {
      updateData.company_purpose = this.companyData.company_purpose;
    }
    if (JSON.stringify(this.companyData.languages) !== JSON.stringify(this.originalCompanyData.languages)) {
      updateData.languages = this.companyData.languages;
    }

    

    // Add new fields
    if (this.companyData.zip_code !== this.originalCompanyData.zip_code) {
      updateData.zip_code = this.companyData.zip_code;
    }
    if (this.companyData.location !== this.originalCompanyData.location) {
      updateData.location = this.companyData.location;
    }
    if (this.companyData.country !== this.originalCompanyData.country) {
      updateData.country = this.companyData.country;
    }

    if (Object.keys(updateData).length === 0) {
      this.translate.get('NO_CHANGES_MADE').subscribe((translatedMessage) => {
        this.successMessagee1 = translatedMessage;
      });
      return;
    }

    this.companyService.updateCompany(this.companyData.id, updateData).subscribe({
      next: (response) => {
        this.translate.get('CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee1 = translatedMessage;
        });
        this.getCompanies();
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED').subscribe((translatedError) => {
          this.errorMessages['general'] = error?.message || translatedError;
        });
      }
    });
  }
  edit2() {
    this.errorMessages = {};

    if (!this.companyData.legal_information.legal_forms || !this.companyData.legal_information.legal_status || !this.companyData.legal_information.sector) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedMessage) => {
        this.errorMessages['general'] = translatedMessage;
      });
      return;
    }
    const updateDataLF: any = {}; // Object to store only modified fields
    const legalInfo = this.companyData.legal_information;
    const originalLegalInfo = this.originalCompanyData.legal_information;
    const getOriginalLegalForm = (translatedKey: string): string | undefined => {
      return Object.keys(this.legalFormMap).find(key => this.legalFormMap[key] === translatedKey);
    };
    // Check for changes and add only modified attributes
    if (legalInfo.legal_forms !== originalLegalInfo.legal_forms) {
      updateDataLF.legal_forms = getOriginalLegalForm(legalInfo.legal_forms) || legalInfo.legal_forms;
    }
    if (legalInfo.legal_status !== originalLegalInfo.legal_status) {
      updateDataLF.legal_status = legalInfo.legal_status;
    }

    if (legalInfo.sector !== originalLegalInfo.sector) {
      updateDataLF.sector = legalInfo.sector;
    }

    // Only send a request if there are changes
    if (Object.keys(updateDataLF).length === 0) {
      this.translate.get('NO_CHANGES_MADE').subscribe((translatedMessage) => {
        this.successMessagee2 = translatedMessage;
      }); return;
    }

    this.companyService.updateLegalInfo(this.companyData.id, updateDataLF).subscribe({
      next: (response) => {
        this.translate.get('LEGAL_CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee2 = translatedMessage;
        });
        this.getCompanies();
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED_LEGAL').subscribe((translatedError) => {
          this.errorMessages['general'] = error?.message || translatedError;
        });
      }
    });
  }
  edit3() {
    this.errorMessages = {};

    if (!this.companyData.directors || this.companyData.directors.length === 0) {
      this.translate.get('NO_DIRECTORS_FOUND').subscribe((translatedError) => {
        this.errorMessages['general'] = translatedError;
      });
      return;
    }

    const firstDirector = this.companyData.directors[0];

    const originalDirector = this.originalCompanyData?.directors?.[0] || {};

    const updatedDirectorData: any = {};
    if (
      !firstDirector.first_name ||
      !firstDirector.last_name ||
      !firstDirector.role ||
      !firstDirector.salutation ||
      !firstDirector.email ||
      !firstDirector.phone_number
    ) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedError) => {
        this.errorMessages['general'] = translatedError;
      });
      return;
    }


    if (firstDirector.role !== originalDirector.role) {
      updatedDirectorData.role = firstDirector.role;
    }
    if (firstDirector.signature !== originalDirector.signature) {
      updatedDirectorData.signature = firstDirector.signature;
    }
    if (firstDirector.first_name !== originalDirector.first_name) {
      updatedDirectorData.first_name = firstDirector.first_name;
    }
    if (firstDirector.last_name !== originalDirector.last_name) {
      updatedDirectorData.last_name = firstDirector.last_name;
    }
    if (firstDirector.salutation !== originalDirector.salutation) {
      updatedDirectorData.salutation = firstDirector.salutation;
    }
    if (firstDirector.number_of_employees !== originalDirector.number_of_employees) {
      updatedDirectorData.number_of_employees = firstDirector.number_of_employees;
    }
    if (firstDirector.email !== originalDirector.email) {
      updatedDirectorData.email = firstDirector.email;
    }
    if (firstDirector.phone_number !== originalDirector.phone_number) {
      updatedDirectorData.phone_number = firstDirector.phone_number;
    }


    if (Object.keys(updatedDirectorData).length === 0) {
      this.translate.get('NO_CHANGES_MADE').subscribe((translatedMessage) => {
        this.successMessagee3 = translatedMessage;
      });
      return;
    }

    this.companyService.updateDirector(this.companyData.id, updatedDirectorData).subscribe({
      next: (response) => {
        this.translate.get('DIRECTOR_CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee3 = translatedMessage;
        });
        this.getCompanies();
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED_DIRECTOR').subscribe((translatedError) => {
          this.errorMessages['general'] = error?.message || translatedError;
        });
      }
    });
  }

  edit4() {
    this.errorMessages = {};
    if (!this.companyData.financial_information.company_capital) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedMessage) => {
        this.errorMessages['general'] = translatedMessage;
      });
      return;
    }
    const updatedFinancialData: any = {};

    // Ensure both values are numbers for accurate comparison
    const convertedCompanyCapital = this.convertToValidNumber(this.companyData.financial_information.company_capital);
    const originalCompanyCapital = this.convertToValidNumber(this.originalCompanyData.financial_information.company_capital);

    console.log('Converted Capital:', convertedCompanyCapital, 'Original Capital:', originalCompanyCapital); // Debug log

    if (convertedCompanyCapital !== originalCompanyCapital) {
      updatedFinancialData.company_capital = convertedCompanyCapital;
    }



    console.log('Updated Financial Data:', updatedFinancialData); // Debug log

    if (Object.keys(updatedFinancialData).length === 0) {
      this.translate.get('NO_CHANGES_MADE').subscribe((translatedMessage) => {
        this.successMessagee4 = translatedMessage;
      });
      return; // Prevent submitting if no changes
    }

    this.companyService.updateFinancialInfo(this.companyData.id, updatedFinancialData).subscribe({
      next: (response) => {
        this.translate.get('FINANCIAL_CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee4 = translatedMessage;
        });
        this.getCompanies();
        this.originalCompanyData.financial_information = {
          ...this.companyData.financial_information,
          company_capital: convertedCompanyCapital
        };
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED_FINANCIAL').subscribe((translatedError) => {
          this.errorMessages['general'] = error?.message || translatedError;
        });
      }
    });
  }

  edit5() {
    this.errorMessages = {};
    if (!this.companyData.activity.project_name || !this.companyData.activity.location || !this.companyData.activity.details) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedMessage) => {
        this.errorMessages['general'] = translatedMessage;
      });
      return;
    }
    // Create an object to hold only the modified attributes
    const activityData: any = {};

    if (this.companyData.activity.project_name !== this.originalCompanyData.activity.project_name) {
      activityData.project_name = this.companyData.activity.project_name;
    }
    if (this.companyData.activity.location !== this.originalCompanyData.activity.location) {
      activityData.location = this.companyData.activity.location;
    }
    if (this.companyData.activity.details !== this.originalCompanyData.activity.details) {
      activityData.details = this.companyData.activity.details;
    }
    if (Object.keys(activityData).length === 0) {
      this.translate.get('NO_CHANGES_MADE').subscribe((translatedMessage) => {
        this.successMessagee5 = translatedMessage;
      });
      return;
    }
    this.companyService.updateActivity(this.companyData.id, activityData).subscribe({
      next: (response) => {
        this.translate.get('ACTIVITY_CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee5 = translatedMessage;
        });
        this.getCompanies();
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED_ACTIVITY').subscribe((translatedError) => {
          this.errorMessages['general'] = error?.message || translatedError;
        });
      }
    });
  }

  updateCompanyLogo() {
    this.errorMessagesUpdateLogo = '';
    if (!this.companyData.logo) {
      this.translate.get('PLEASE_FILL_ALL_REQUIRED_FIELDS').subscribe((translatedMessage) => {
        this.errorMessagesUpdateLogo = translatedMessage;
      });
      return;
    }
   
    let activityData: any = {};
    activityData.logo = this.companyData.logo;
    this.companyService.updateCompanyLogo(this.companyData.id, activityData).subscribe({
      next: (response) => {
        this.translate.get('logo_CHANGES_SUBMITTED').subscribe((translatedMessage) => {
          this.successMessagee6 = translatedMessage;
        });
        this.getCompanies();
      },
      error: (error) => {
        this.translate.get('UPDATE_FAILED').subscribe((translatedError) => {
          this.errorMessagesUpdateLogo = error?.message || translatedError;
        });
      }
    });
  }

  isSearchClicked = false;
  isSearchClickede = false;
  showVerticalTable: boolean = false;

// Autocomplete properties
autocompleteSuggestions: any[] = [];
showAutocompleteSuggestions: boolean = false;
selectedSuggestionIndex: number = -1;
autocompleteDebounceTimer: any;

// Advanced Search Autocomplete properties  
advancedAutocompleteSuggestions: any[] = [];
showAdvancedAutocompleteSuggestions: boolean = false;
selectedAdvancedSuggestionIndex: number = -1;
advancedAutocompleteDebounceTimer: any;

// Autocomplete methods
onInputChange(event: any): void {
  const query = event.target.value?.trim() || '';
  this.searchQuery = query;
  
  // Clear previous timer
  if (this.autocompleteDebounceTimer) {
    clearTimeout(this.autocompleteDebounceTimer);
  }
  
  // Debounce autocomplete search
  this.autocompleteDebounceTimer = setTimeout(() => {
    if (query.length >= 2) {
      this.fetchAutocompleteSuggestions(query);
    } else {
      this.hideAutocompleteSuggestions();
    }
  }, 300); // 300ms debounce
}

// Advanced Search Autocomplete methods
onAdvancedInputChange(event: any): void {
  const query = event.target.value?.trim() || '';
  this.searchQuery = query;
  
  if (this.advancedAutocompleteDebounceTimer) {
    clearTimeout(this.advancedAutocompleteDebounceTimer);
  }
  
  this.advancedAutocompleteDebounceTimer = setTimeout(() => {
    if (query.length >= 2) {
      this.fetchAdvancedAutocompleteSuggestions(query);
    } else {
      this.hideAdvancedAutocompleteSuggestions();
    }
  }, 300);
}

fetchAdvancedAutocompleteSuggestions(query: string): void {
  this.searchService.searchCompanies(query, 1, 5).subscribe({
    next: (response: PaginatedResponse<any>) => {
      this.advancedAutocompleteSuggestions = response.results || [];
      this.showAdvancedAutocompleteSuggestions = true;
      this.selectedAdvancedSuggestionIndex = -1;
    },
    error: (err) => {
      console.error('Error fetching advanced autocomplete suggestions:', err);
      this.hideAdvancedAutocompleteSuggestions();
    }
  });
}

onAdvancedKeyDown(event: KeyboardEvent): void {
  if (!this.showAdvancedAutocompleteSuggestions || this.advancedAutocompleteSuggestions.length === 0) {
    if (event.key === 'Enter') {
      this.onSsearch();
    }
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      this.selectedAdvancedSuggestionIndex = Math.min(this.selectedAdvancedSuggestionIndex + 1, this.advancedAutocompleteSuggestions.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      this.selectedAdvancedSuggestionIndex = Math.max(this.selectedAdvancedSuggestionIndex - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (this.selectedAdvancedSuggestionIndex >= 0) {
        this.selectAdvancedSuggestion(this.advancedAutocompleteSuggestions[this.selectedAdvancedSuggestionIndex]);
      } else {
        this.onSsearch();
      }
      break;
    case 'Escape':
      this.hideAdvancedAutocompleteSuggestions();
      break;
  }
}

selectAdvancedSuggestion(suggestion: any): void {
  this.searchQuery = suggestion.name || suggestion.unique_identifier || '';
  this.hideAdvancedAutocompleteSuggestions();
  setTimeout(() => this.onSsearch(), 100);
}

onAdvancedInputFocus(): void {
  const query = this.searchQuery?.trim() || '';
  if (query.length >= 2 && this.advancedAutocompleteSuggestions.length > 0) {
    this.showAdvancedAutocompleteSuggestions = true;
  }
}

onAdvancedInputBlur(): void {
  setTimeout(() => this.hideAdvancedAutocompleteSuggestions(), 200);
}

hideAdvancedAutocompleteSuggestions(): void {
  this.showAdvancedAutocompleteSuggestions = false;
  this.selectedAdvancedSuggestionIndex = -1;
}

fetchAutocompleteSuggestions(query: string): void {
  this.searchService.searchCompanies(query, 1, 5).subscribe({
    next: (response: PaginatedResponse<any>) => {
      this.autocompleteSuggestions = response.results || [];
      this.showAutocompleteSuggestions = true;
      this.selectedSuggestionIndex = -1;
    },
    error: (err) => {
      console.error('Error fetching autocomplete suggestions:', err);
      this.hideAutocompleteSuggestions();
    }
  });
}

onKeyDown(event: KeyboardEvent): void {
  if (!this.showAutocompleteSuggestions || this.autocompleteSuggestions.length === 0) {
    if (event.key === 'Enter') {
      this.onSsearch();
    }
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      this.selectedSuggestionIndex = Math.min(
        this.selectedSuggestionIndex + 1,
        this.autocompleteSuggestions.length - 1
      );
      break;
    
    case 'ArrowUp':
      event.preventDefault();
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
      break;
    
    case 'Enter':
      event.preventDefault();
      if (this.selectedSuggestionIndex >= 0) {
        this.selectSuggestion(this.autocompleteSuggestions[this.selectedSuggestionIndex]);
      } else {
        this.onSearch();
      }
      break;
    
    case 'Escape':
      this.hideAutocompleteSuggestions();
      break;
  }
}

selectSuggestion(suggestion: any): void {
  this.searchQuery = suggestion.name || suggestion.unique_identifier || '';
  this.hideAutocompleteSuggestions();
  
  // Optionally trigger search immediately
  setTimeout(() => {
    this.onSearch();
  }, 100);
}

onInputFocus(): void {
  const query = this.searchQuery?.trim() || '';
  if (query.length >= 2 && this.autocompleteSuggestions.length > 0) {
    this.showAutocompleteSuggestions = true;
  }
}

onInputBlur(): void {
  // Delay hiding to allow click on suggestions
  setTimeout(() => {
    this.hideAutocompleteSuggestions();
  }, 200);
}

hideAutocompleteSuggestions(): void {
  this.showAutocompleteSuggestions = false;
  this.selectedSuggestionIndex = -1;
}

 onSearch(resetPage: boolean = true): void {
  this.hideAutocompleteSuggestions(); // Hide suggestions when searching
  this.hideAdvancedAutocompleteSuggestions(); 
  this.isSearchClicked = true;
  const query = this.searchQuery?.trim() || '';

  if (query.length >= 2) {
    this.errorMessage = '';
    if (resetPage) {
      this.searchCurrentPage = 1;
    }

    this.searchService.searchCompanies(query, this.searchCurrentPage, this.searchItemsPerPage).subscribe({
      next: (response: PaginatedResponse<any>) => {
        this.searchResults = response.results || [];
        this.searchTotalItems = response.count;
        this.searchTotalPages = Math.ceil(this.searchTotalItems / this.searchItemsPerPage);
        this.searchHasNext = !!response.next;
        this.searchHasPrevious = !!response.previous;

        const exactMatch = this.searchResults.find(
          company =>
            company.name?.toLowerCase() === query.toLowerCase() ||
            company.unique_identifier?.toLowerCase() === query.toLowerCase()
        );

        if (exactMatch && this.searchResults.length === 1) {
          this.showVerticalTable = true;
        } else {
          this.showVerticalTable = false;
        }

      },
      error: (err) => {
        console.error('Error fetching companies:', err);
        this.searchResults = [];
        this.searchTotalItems = 0;
        this.searchTotalPages = 0;
        this.refresh();
      }
    });
  } else {
    this.searchResults = [];
    this.isSearchClicked = false;
    this.searchTotalItems = 0;
    this.searchTotalPages = 0;

    this.translate.get('SEARCH_ERROR_MESSAGE').subscribe((translatedMessage: string) => {
      this.errorMessage = translatedMessage;
    });
  }
}

ngOnDestroy(): void {
  if (this.autocompleteDebounceTimer) {
    clearTimeout(this.autocompleteDebounceTimer);
  }

  if (this.advancedAutocompleteDebounceTimer) {
    clearTimeout(this.advancedAutocompleteDebounceTimer);
  }
}




  name: string = '';
  headquarters: string = '';
  legal_forms: string = '';

  
  searchCompanies(searchTerm: string = ''): void {
    this.currentPage = 1; // Reset to first page when searching
    this.getCompanies({ search: searchTerm });
  }

    // Add sorting functionality
    sortCompanies(field: string): void {
      this.currentPage = 1; // Reset to first page when sorting
      this.getCompanies({ ordering: field });
    }

    advancedSearchToggle(){
      this.isSearchClickede = false;
      this.showVerticalTable = false;
      this.resetFields();

    }
  // Updated advanced search method with pagination
// Updated advanced search method with pagination

  onSsearch(resetPage: boolean = true): void {
    this.isSearchClickede = false;
    this.showVerticalTable = false;
    this.errorMessage = null;
    
    if (resetPage) {
      this.searchCurrentPage = 1; // Only reset to first page when it's a new search
    }

    const trimmedQuery = this.searchQuery?.trim() || '';

    const otherFiltersFilled =
      this.selectedRegions.length > 0 ||
      this.selectedKantons.length > 0 ||
      (this.legal_forms && this.legal_forms.trim().length > 0);

    if (trimmedQuery.length < 2 && !otherFiltersFilled) {
      this.errorMessage = this.translate.instant('ERRORS.MIN_CHARACTERS');
      return;
    }

    const filters: { [key: string]: any } = {
      page: this.searchCurrentPage,
      page_size: this.searchItemsPerPage
    };

    // Add filters if they are filled
    if (trimmedQuery.length >= 2) {
      filters['name_or_uid'] = trimmedQuery;
    }
    if (this.selectedRegions.length > 0) {
      filters['headquarters'] = this.selectedRegions.map(region => region.name).join(',');
    }
    if (this.legal_forms?.trim()) {
      filters['legal_forms'] = this.legal_forms.trim();
    }

    console.log('Advanced Search Filters:', filters);

    this.searchService.searchCompanie(filters).subscribe({
      next: (response: PaginatedResponse<any>) => {
        this.searchResults = response.results || [];
        this.searchTotalItems = response.count;
        this.searchTotalPages = Math.ceil(this.searchTotalItems / this.searchItemsPerPage);
        this.searchHasNext = !!response.next;
        this.searchHasPrevious = !!response.previous;
        this.isSearchClickede = true;

        // Show vertical table only if exactly one result
        this.showVerticalTable = this.searchResults.length === 1;

        console.log('Advanced Search Results:', this.searchResults);
      },
      error: (err) => {
        console.error('Advanced search failed:', err);
        this.searchResults = [];
        this.searchTotalItems = 0;
        this.searchTotalPages = 0;
      }
    });
  }


  parentCompany: any;
  errorMessage: string | null = null;
  fetchParentCompanyData(): void {
    this.contactApiService.getParentCompany().subscribe(
      (data) => {
        this.parentCompany = data.results[0];
        console.log(this.parentCompany);
      },
      (error) => {
        console.error('Error fetching data', error);
        this.refresh();
      }
    );
  }
  uploadedFile: File | null = null;


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    console.log('File selection event triggered');
    
    // Reset previous state
    this.uploadedFile = null;
    this.errorMessage = null;
    this.companyData.financial_report = '';
  
    if (!file) {
      console.log('No file selected');
      return;
    }
  
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
  
    // Validate file type
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Please upload a valid PDF file.';
      this.resetFileInput(event);
      return;
    }
  
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.errorMessage = 'File size must be less than 10MB.';
      this.resetFileInput(event);
      return;
    }
  
    // File is valid, proceed with conversion
    this.uploadedFile = file;
    this.convertToBase64(file);
  }
  
  convertToBase64(file: File): void {
    console.log('Starting base64 conversion for file:', file.name);
    
    // Check if FileReader is available
    if (!window.FileReader) {
      console.error('FileReader is not supported in this browser');
      this.errorMessage = 'File upload is not supported in this browser.';
      this.resetFileState();
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        console.log('FileReader onload triggered');
        
        const result = reader.result;
        console.log('Reader result type:', typeof result);
        
        // Check if the result is valid
        if (!result) {
          console.error('No result from FileReader');
          this.errorMessage = 'Failed to read the file. Please try again.';
          this.resetFileState();
          return;
        }
        
        // Handle ArrayBuffer result (shouldn't happen with readAsDataURL, but safety check)
        if (result instanceof ArrayBuffer) {
          console.error('Unexpected ArrayBuffer result from readAsDataURL');
          this.errorMessage = 'Unexpected file format. Please try again.';
          this.resetFileState();
          return;
        }
        
        // Now we know result is a string
        const resultString = result as string;
        console.log('Reader result length:', resultString.length);
        console.log('Reader result preview:', resultString.substring(0, 50));
        
        // Check if it contains the data URL prefix
        if (!resultString.startsWith('data:')) {
          console.error('Result does not start with data URL prefix:', resultString.substring(0, 50));
          this.errorMessage = 'Invalid file format detected.';
          this.resetFileState();
          return;
        }
        
        const base64Index = resultString.indexOf('base64,');
        if (base64Index === -1) {
          console.error('No base64 marker found in result');
          this.errorMessage = 'Invalid file encoding detected.';
          this.resetFileState();
          return;
        }
        
        // Extract base64 string (skip 'base64,' part)
        const base64String = resultString.substring(base64Index + 7);
        console.log('Extracted base64 string length:', base64String.length);
        
        if (!base64String || base64String.length === 0) {
          console.error('Empty base64 string extracted');
          this.errorMessage = 'Failed to convert file to base64.';
          this.resetFileState();
          return;
        }
        
        // Basic base64 validation - check if it contains valid base64 characters
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        const testString = base64String.substring(0, Math.min(100, base64String.length));
        if (!base64Regex.test(testString)) {
          console.error('Invalid base64 characters detected');
          this.errorMessage = 'Invalid file encoding detected.';
          this.resetFileState();
          return;
        }
        
        // Store the clean base64 string
        this.companyData.financial_report = base64String;
        
        // Update form control if using reactive forms
        if (this.addForm && this.addForm.get('financial_report')) {
          this.addForm.patchValue({
            financial_report: base64String
          }, { emitEvent: false });
        }
        
        // Clear any previous error messages
        this.errorMessage = null;
        
        console.log('File successfully converted to base64. Length:', base64String.length);
        console.log('Base64 preview:', base64String.substring(0, 50) + '...');
        
      } catch (error) {
        console.error('Error in convertToBase64 onload handler:', error);
        console.error('Error stack:', (error as Error).stack);
        this.errorMessage = 'Failed to process the file. Please try again.';
        this.resetFileState();
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error event:', error);
      console.error('FileReader error details:', reader.error);
      this.errorMessage = 'Error reading the file. Please try again.';
      this.resetFileState();
    };
    
    reader.onabort = () => {
      console.error('FileReader aborted');
      this.errorMessage = 'File reading was interrupted. Please try again.';
      this.resetFileState();
    };
    
    // Add progress handler for debugging
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        console.log(`File reading progress: ${percentLoaded}%`);
      }
    };
    
    // Start reading the file
    try {
      console.log('Starting to read file as data URL');
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error starting FileReader:', error);
      console.error('Error details:', (error as Error).message);
      this.errorMessage = 'Failed to start reading the file. Please try again.';
      this.resetFileState();
    }
  }
  
  // Helper method to reset file input
  private resetFileInput(event: any): void {
    try {
      if (event && event.target) {
        event.target.value = '';
      }
      
      // Also reset any file input elements in the DOM
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id === 'uploadDocuments' || input.name === 'uploadDocuments') {
          input.value = '';
        }
      });
    } catch (error) {
      console.error('Error resetting file input:', error);
    }
  }
  
  // Helper method to reset file state
  private resetFileState(): void {
    try {
      this.uploadedFile = null;
      this.companyData.financial_report = '';
      
      if (this.addForm && this.addForm.get('financial_report')) {
        this.addForm.patchValue({
          financial_report: ''
        }, { emitEvent: false });
      }
      
      // Also reset file inputs in DOM
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input.id === 'uploadDocuments' || input.name === 'uploadDocuments') {
          input.value = '';
        }
      });
    } catch (error) {
      console.error('Error resetting file state:', error);
    }
  }
  

  
 // Search pagination methods
  goToSearchPage(page: number): void {
    if (page >= 1 && page <= this.searchTotalPages && page !== this.searchCurrentPage) {
      this.searchCurrentPage = page;
      
      console.log('Navigating to search page:', page);
      
      // Re-run the appropriate search method WITHOUT resetting the page
      if (this.advancedSearch) {
        this.onSsearch(false); // false = don't reset page
      } else {
        this.onSearch(false); // false = don't reset page
      }
    }
  }

  goToSearchFirstPage(): void {
    this.goToSearchPage(1);
  }

  goToSearchLastPage(): void {
    this.goToSearchPage(this.searchTotalPages);
  }

  goToSearchPreviousPage(): void {
    if (this.searchHasPrevious) {
      this.goToSearchPage(this.searchCurrentPage - 1);
    }
  }

  goToSearchNextPage(): void {
    if (this.searchHasNext) {
      this.goToSearchPage(this.searchCurrentPage + 1);
    }
  }

  onSearchItemsPerPageChange(): void {
    this.searchCurrentPage = 1; // Reset to first page when changing page size
    
    console.log('Search items per page changed to:', this.searchItemsPerPage);
    
    // Re-run the appropriate search method
    if (this.advancedSearch) {
      this.onSsearch(false); // false = don't reset page again
    } else {
      this.onSearch(false); // false = don't reset page again
    }
  }

  // Get current search page info
  get searchCurrentPageInfo(): string {
    const startItem = (this.searchCurrentPage - 1) * this.searchItemsPerPage + 1;
    const endItem = Math.min(this.searchCurrentPage * this.searchItemsPerPage, this.searchTotalItems);
    return `${startItem}-${endItem} of ${this.searchTotalItems}`;
  }

  // Get search page numbers for pagination controls
  get searchPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, this.searchCurrentPage - halfRange);
    let endPage = Math.min(this.searchTotalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Reset search pagination when resetting fields
  resetFields() {
    this.searchQuery = '';
    this.selectedRegions = [];
    this.selectedKantons = [];
    this.legal_forms = '';
    this.errorMessage = '';
    
    // Reset search pagination
    this.searchCurrentPage = 1;
    this.searchTotalItems = 0;
    this.searchTotalPages = 0;
    this.searchHasNext = false;
    this.searchHasPrevious = false;
    this.searchResults = [];
    this.isSearchClicked = false;
    this.isSearchClickede = false;
    this.showVerticalTable = false;
  
    console.log('Reset fields - search pagination reset to page 1');
  }

  // Add trackBy function for better performance
  trackByPageNumber(index: number, pageNum: number): number {
    return pageNum;
  }
  //
  // onImageSelected(file: File | null): void {
  //   this.addForm.patchValue({ logo: file });
  // }

  onImageSelected(data: string | FileData | null, mode?:string): void {
    let cleanBase64 = '';
    
    if (typeof data === 'string') {
      cleanBase64 = data; // Already clean due to cleanBase64=true
    } else if (data && typeof data === 'object') {
      cleanBase64 = data.base64; // Already clean due to cleanBase64=true
    }
    
    
    if(cleanBase64!='')
    {
      if(mode==="edit"){
        this.companyData.logo = cleanBase64;
      }
      else{
        this.companyForm.patchValue({ logo: cleanBase64 });
      }
    }
   
    
    console.log('Clean base64 received:', cleanBase64.substring(0, 50) + '...');
  }


  onCleanBase64Generated(cleanBase64: string): void {
    console.log('Clean base64 generated:', {
      length: cleanBase64.length,
      preview: cleanBase64.substring(0, 50) + '...',
      startsWithData: cleanBase64.startsWith('data:') // Should be false
    });
  }

  // 
  openActivityDetailsModal() {
    this.showActivityDetailsModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeActivityDetailsModal() {
    this.showActivityDetailsModal = false;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  // Optional: Close modal on escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.showActivityDetailsModal) {
      this.closeActivityDetailsModal();
    }
  }


}