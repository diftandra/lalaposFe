import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportStockComponent } from './report-stock.component';

describe('ReportStockComponent', () => {
  let component: ReportStockComponent;
  let fixture: ComponentFixture<ReportStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportStockComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
