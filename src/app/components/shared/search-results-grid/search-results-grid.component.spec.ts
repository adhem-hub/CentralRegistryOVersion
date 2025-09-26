import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsGridComponent } from './search-results-grid.component';

describe('SearchResultsGridComponent', () => {
  let component: SearchResultsGridComponent;
  let fixture: ComponentFixture<SearchResultsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
