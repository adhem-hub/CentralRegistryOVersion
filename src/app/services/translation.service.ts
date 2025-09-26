import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('de'); 
    // console.log("TranslationService initialized with default language 'de'");
    // console.log("Available languages:", this.translate.getLangs());
    // console.log("Current language:", this.translate.currentLang);
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
  }
}
