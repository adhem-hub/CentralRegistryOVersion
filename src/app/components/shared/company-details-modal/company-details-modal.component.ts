import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SalutationTranslatePipe } from '../../../salutation-translate-pipe.pipe';




@Component({
  selector: 'app-company-details-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule,
    SalutationTranslatePipe
  ],
  templateUrl: './company-details-modal.component.html',
  styleUrls: ['./company-details-modal.component.scss']
})

export class CompanyDetailsModalComponent {
  @Input() company: any;
  @Input() searchResults: any[] = [];
  @Input() languageCodeToKey: { [key: string]: string } = {};
  @Input() currentLanguage: string = 'en';
  
  @Output() closeModal = new EventEmitter<void>();

  onCloseModal() {
    this.closeModal.emit();
  }

  getTranslatedSector(sector: string): string {
    // Implement your sector translation logic here
    return sector || '';
  }

  // sectorChoices = [
  //   { value: 'raw_materials', label: 'SECTORE.RAW_MATERIALS' },
  //   { value: 'manufacturing', label: 'SECTORE.MANUFACTURING' },
  //   { value: 'services', label: 'SECTORE.SERVICES' },
  //   { value: 'knowledge', label: 'SECTORE.KNOWLEDGE' },
  //   { value: 'public', label: 'SECTORE.PUBLIC' }
  // ];
  // getTranslatedSector(sectorValue: string): string {
  //   const sector = this.sectorChoices.find(choice => choice.value === sectorValue);
  //   return sector ? this.translate.instant(sector.label) : sectorValue;
  // }
  formatSwissNumber(value: string): string {
    // Implement your Swiss number formatting logic here
    if(value!='0.00')
    {
      return value+' CHF';
    }
    return '';
  }
}
