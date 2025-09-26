import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { SearchComponent } from '../components/search/search.component';
import { FaqComponent } from '../shared/faq/faq.component';
import { AuthStateService } from '../services/auth-state.service';


@Component({
  selector: 'app-home',
  standalone: true,
    imports: [TranslateModule, CommonModule, SearchComponent,
       MatIconModule, TranslateModule,
       FaqComponent
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  isLoggedIn: boolean = false;

  constructor(
    private authStateService: AuthStateService,
  ) {
  
    this.authStateService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });
    
  }

}
