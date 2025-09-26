import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({name: 'salutationTranslate'})
export class SalutationTranslatePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}
  
  transform(salutation: string, currentLang: string): string {
    // Map stored values back to keys, then translate
    const salutationMap = {
      // French mappings
      'M.': 'MR',
      'Mme': 'MS',
      // German mappings  
      'Herr': currentLang === 'de' ? 'MR' : 'HERR',
      'Frau': currentLang === 'de' ? 'MS' : 'FRAU',
      // Italian mappings
      'Sig.': 'MR',
      'Sig.ra': 'MS'
    };
    
    const key = salutationMap[salutation as keyof typeof salutationMap] || salutation;
    return this.translate.instant(key);
  }
}