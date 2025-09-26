import { Component } from '@angular/core';
import { ContactApiService } from '../../services/contact-api-service.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  parentCompany: any;

   constructor(private contactApiService: ContactApiService) {
       
      }

   ngOnInit(): void {
      
      this.fetchParentCompanyData();
      
    }

  fetchParentCompanyData(): void {
    this.contactApiService.getParentCompany().subscribe(
      (data) => {
        console.log("data ", data)
        this.parentCompany = data.results[0];
        console.log(this.parentCompany);
      },
      (error) => {
        console.error('Error fetching data', error);
        // this.refresh();
      }
    );
  }

}
