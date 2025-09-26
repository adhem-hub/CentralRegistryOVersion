import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslationService } from './services/translation.service';
import { HeaderComponent } from "./shared/header/header.component";
import { SearchComponent } from "./components/search/search.component";
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { FaqComponent } from './shared/faq/faq.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [    MatChipsModule,
    CommonModule,RouterOutlet, HeaderComponent,
    //  SearchComponent,
  // FaqComponent,
   FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Central_Register';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private translateService: TranslateService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      let lang: string | null = localStorage.getItem('selectedLanguage');
      console.log("Initial language from localStorage:", lang);

      if (!lang) {
        const browserLang = navigator.language || navigator.languages[0]; // e.g., 'en-US' or 'de'
        lang = browserLang ? browserLang.split('-')[0] : null; // get 'en' from 'en-US'
      }

      lang = lang || 'de'; // Default to German if still not set

      // this.translateService.setDefaultLang('de');
      this.translateService.use(lang);
    }
  }
}
