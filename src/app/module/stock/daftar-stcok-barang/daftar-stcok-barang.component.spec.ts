import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaftarStcokBarangComponent } from './daftar-stcok-barang.component';

describe('DaftarStcokBarangComponent', () => {
  let component: DaftarStcokBarangComponent;
  let fixture: ComponentFixture<DaftarStcokBarangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DaftarStcokBarangComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaftarStcokBarangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
