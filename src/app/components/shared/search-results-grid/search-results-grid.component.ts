import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface SearchResult {
  id: string;
  name: string;
  logo_url?: string;
  unique_identifier: string;
  headquarters?: string;
  location?: string;
  country: string;
  legal_information: {
    legal_forms: any;
    legal_status: string;
  };
}

@Component({
  selector: 'app-search-results-grid',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './search-results-grid.component.html',
  styleUrl: './search-results-grid.component.scss'
})

export class SearchResultsGridComponent {
  @Input() searchResults: SearchResult[] = [];
  @Input() searchTotalItems: number = 0;
  @Input() getLegalFormName!: (legalForms: any) => string;
  @Input() getTranslatedStatus!: (status: string) => string;
  
  @Output() companySelected = new EventEmitter<string>();
  @Output() pdfGenerated = new EventEmitter<string>();

  onViewCompanyDetails(companyId: string): void {
    this.companySelected.emit(companyId);
  }

  onGeneratePDF(companyId: string): void {
    this.pdfGenerated.emit(companyId);
  }
}