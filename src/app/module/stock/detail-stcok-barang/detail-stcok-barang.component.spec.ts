import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailStcokBarangComponent } from './detail-stcok-barang.component';

describe('DetailStcokBarangComponent', () => {
  let component: DetailStcokBarangComponent;
  let fixture: ComponentFixture<DetailStcokBarangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailStcokBarangComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailStcokBarangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
