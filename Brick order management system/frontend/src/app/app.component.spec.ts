import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { SettingsApiService } from './settings-api.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: SettingsApiService,
          useValue: {
            value: signal({ profileName: 'Aarav Kumar', profileEmail: '', mobileNumber: '', role: 'Administrator', plantName: 'North plant', plantAddress: '', plantStatus: 'OPERATIONAL' }),
            load: () => of({})
          }
        }
      ]
    }).compileComponents();
  });

  it('renders the Brickworks navigation and overview route', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('brickworks');
    expect(fixture.nativeElement.textContent).toContain('Customers');
    expect(fixture.nativeElement.textContent).toContain('Overview');
  });

  it('keeps the mobile navigation open after the menu button is clicked', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[aria-label="Toggle navigation"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-frame').classList).toContain('nav-open');
  });
});
