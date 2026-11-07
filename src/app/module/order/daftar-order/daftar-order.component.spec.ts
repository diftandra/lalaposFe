import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaftarOrderComponent } from './daftar-order.component';

describe('DaftarOrderComponent', () => {
  let component: DaftarOrderComponent;
  let fixture: ComponentFixture<DaftarOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DaftarOrderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DaftarOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
