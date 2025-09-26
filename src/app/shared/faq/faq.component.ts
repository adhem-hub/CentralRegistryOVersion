import { Component, OnDestroy, OnInit } from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';
import { CommonModule } from '@angular/common'; 
import { Subject, takeUntil } from 'rxjs';
import { ContactApiService } from '../../services/contact-api-service.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ContentService } from '../../services/content.service';

export interface ContentSection {
  id: string;
}

export interface ContentItem {
  id: string;
  section: ContentSection;
  title: string;
  description?: string;
  text_one?: string;
  text_two?: string;
  text_three?: string;
  subtitle?: string;
  language: string;
}

export interface ExpansionCardData {
  title: string;
  content?: string;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-faq',
  imports: [CommonModule, MatExpansionModule, MatIconModule, TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit, OnDestroy{
  languages = ['en', 'fr', 'de', 'it'];
  currentLanguage = 'de';
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private contactApiService: ContactApiService, private translateService: TranslateService,
    private contentService: ContentService
  ) {
     
    }
  parentCompany: any;
  data: ExpansionCardData[] =[]
//   data: ExpansionCardData[] = [
//     {
//       title: 'Legal requirements',
//       content: `The Climate and Innovation Act of the Federal Office for the Environment (FOEN) (see the legislative article) entered into force on January 1, 2025. This law obliges companies in Switzerland to actively reduce their greenhouse gas emissions, particularly carbon dioxide (CO₂), in order to achieve the national goal of climate neutrality by 2050.

// Companies that fail to comply face stricter regulatory requirements. This can lead to financial disadvantages, such as additional taxes or the loss of subsidies. They also risk a weakening of their market position, as customers, investors, and business partners increasingly value environmental responsibility and prefer sustainable business practices.

// Early commitment to climate protection, on the other hand, enables companies to benefit from government support programs, increase their competitiveness and position themselves as responsible players in an increasingly sustainability-oriented market.`
//     },
//     {
//       title: 'How it works',
//       content: `📝 Register: Registration in the Sustainability Register
// 🌱 CO₂ reduction: Implementation through our ESG partner companies
// 📋 Receive certificate: Evidence of ESG reporting, marketing & compliance

// 🌍 Set an example for a sustainable future now!`
//     },
//     {
//       title: 'Your contribution',
//       content: `Your participation in this program demonstrates your commitment to environmental responsibility and helps achieve Switzerland's climate goals. By registering and implementing CO₂ reduction measures, you contribute to a more sustainable future while potentially benefiting from government incentives and improved market positioning.`
//     }
//   ];

  trackByFn(index: number, item: ExpansionCardData): string {
    return item.title;
  }

  ngOnInit(): void {
    const savedLanguage = localStorage.getItem('selectedLanguage');
      this.currentLanguage = savedLanguage ? savedLanguage : 'de';
      this.translateService.use(this.currentLanguage);
   
    this.fetchParentCompanyData();
    this.loadContent();
    this.translateService.onLangChange
    .pipe(takeUntil(this.destroy$))
    .subscribe((event:any) => {
      console.log('Language changed to:', event.lang);
      this.currentLanguage = event.lang;
      this.loadContent();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  loadContent(): void {
    this.loading = true;
    this.error = null;

    this.contentService.getContent(this.currentLanguage).subscribe({
      next: (contentItems: ContentItem[]) => {
        console.log('contentItems : ', contentItems)
        this.data = this.transformContentItems(contentItems);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching content:', err);
        this.error = this.translateService.instant('failed_to_load_content');
        this.loading = false;
        // Fallback to default data if needed
        // this.setDefaultData();
      }
    });
  }

  private transformContentItems(contentItems: ContentItem[]): ExpansionCardData[] {
    return contentItems.map(item => ({
      title: item.title,
      content: this.buildContent(item),
      isExpanded: false
    }));
  }

  private buildContent(item: ContentItem): string {
    // Combine the available text fields into a single content string
    const contentParts: string[] = [];
    
    if (
      item.description &&
      !item.description.toLowerCase().includes('test descreption') &&
      !item.description.toLowerCase().includes('description du test') &&
      !item.description.toLowerCase().includes('testbeschreibung') &&
      !item.description.toLowerCase().includes('descrizione del test')
    ) {
      contentParts.push(item.description);
    }
    if(item.title.toLowerCase().includes('works') ||item.title.toLowerCase().includes('funziona') ||
      item.title.toLowerCase().includes('funktioniert') || item.title.toLowerCase().includes('marche')  ){
      if (item.text_one) {
        contentParts.push(`📝 ${item.text_one}`);
      }
      
      if (item.text_two) {
        contentParts.push(`🌱 ${item.text_two}`);
      }
      
      if (item.text_three) {
        contentParts.push(`📋 ${item.text_three}`);
      }
      if (item.subtitle) {
        contentParts.push(`🌍 ${item.subtitle}`);
      }
    }
    else if(item.title.toLowerCase().includes('contribution') ||item.title.toLowerCase().includes('contributo') ||
    item.title.toLowerCase().includes('beitrag')   ){
      if (item.text_one) {
        contentParts.push(`✅ ${item.text_one}`);
      }
      
      if (item.text_two) {
        contentParts.push(`✅ ${item.text_two}`);
      }
      
      if (item.text_three) {
        contentParts.push(`✅ ${item.text_three}`);
      }
      if (item.subtitle) {
        contentParts.push(` ${item.subtitle}`);
      }
    }
    else{
      if (item.text_one) {
        contentParts.push(item.text_one);
      }
      
      if (item.text_two) {
        contentParts.push(item.text_two);
      }
      
      if (item.text_three) {
        contentParts.push(item.text_three);
      }
      if (item.subtitle) {
        contentParts.push(item.subtitle);
      }
    }
    
   

    return contentParts.join('\n\n');
  }

 
}
