import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailMerekComponent } from './detail-merek.component';

describe('DetailMerekComponent', () => {
  let component: DetailMerekComponent;
  let fixture: ComponentFixture<DetailMerekComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailMerekComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailMerekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
