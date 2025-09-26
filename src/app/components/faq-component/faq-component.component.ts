import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FaqService } from '../../services/faq.service';



@Component({
  selector: 'app-faq-component',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './faq-component.component.html',
  styleUrl: './faq-component.component.scss'
})
export class FaqComponentComponent implements OnInit, OnDestroy {


 
  private destroy$ = new Subject<void>();
  
  // faqSections: FAQSection[] = [];
  faqSections: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private faqService: FaqService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.loadFaqData();
    
    // Listen for language changes
    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFaqData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  trackBySection(index: number, section: any): any {
    return section.id || index;
  }
  
  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  

  private loadFaqData() {
    this.loading = true;
    this.error = null;

    const currentLanguage = this.getCurrentLanguage();

    this.faqService.getFaqSections()
      .pipe(
        switchMap(sectionsResponse => {
          // const activeSections = sectionsResponse.results.filter((section: any) => section.is_active);
          const activeSections = sectionsResponse.results;
          
          if (activeSections.length === 0) {
            return of([]);
          }

          // Create array of API calls for each section's items using the updated API
          const itemRequests = activeSections.map((section: any)=>
            this.faqService.getFaqItems(section.id, currentLanguage)
              .pipe(
                map((response: { results: any[]; }) => {
                  // Extract the first result (should only be one section)
                  const sectionWithItems = response.results[0];
                  if (sectionWithItems) {
                    return {
                      ...section, // Keep original section data
                      title: sectionWithItems.title || section.title, // Use API title if available
                      items: sectionWithItems.items
                        // .filter(item => item.is_active) // Filter only active items
                        .sort((a:any, b:any) => a.order - b.order) // Sort by order
                    };
                  }
                  return {
                    ...section,
                    items: []
                  };
                }),
                catchError(error => {
                  console.error(`Error loading items for section ${section.id}:`, error);
                  return of({
                    ...section,
                    items: []
                  });
                })
              )
          );

          // Execute all requests in parallel
          return forkJoin(itemRequests);
        }),
        catchError(error => {
          console.error('Error loading FAQ sections:', error);
          this.error = 'Failed to load FAQ data. Please try again later.';
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((sections :any)=> {
        this.faqSections = sections
          //.filter(section => section.items.length > 0) // Only show sections with items
          .sort((a:any, b:any) => a.order - b.order);
        this.loading = false;
      });

      
  }


  private getCurrentLanguage(): string {
    return this.translateService.currentLang || 
           localStorage.getItem('selectedLanguage') || 
           'en';
  }

  // Optional: Method to manually refresh data
  refreshData() {
    this.loadFaqData();
  }
}
