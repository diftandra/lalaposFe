import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerekComponent } from './merek.component';

describe('MerekComponent', () => {
  let component: MerekComponent;
  let fixture: ComponentFixture<MerekComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MerekComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MerekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
