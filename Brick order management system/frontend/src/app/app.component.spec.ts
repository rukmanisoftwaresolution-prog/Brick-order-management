import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { SettingsApiService } from './settings-api.service';

@Component({ standalone: true, template: '' })
class SettingsRouteStubComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, SettingsRouteStubComponent],
      providers: [
        provideRouter([{ path: 'settings', component: SettingsRouteStubComponent }]),
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
    expect(fixture.nativeElement.querySelector('.today-label').textContent.trim())
      .toBe(formatDate(fixture.componentInstance.currentDate, 'EEEE, dd MMMM yyyy', 'en-US'));
  });

  it('keeps the mobile navigation open after the menu button is clicked', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[aria-label="Toggle navigation"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-frame').classList).toContain('nav-open');
  });

  it('navigates to settings when the accessible profile button is activated', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const profileButton: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Open profile settings"]');
    expect(profileButton).toBeTruthy();
    expect(profileButton.type).toBe('button');
    profileButton.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/settings');
  });
});
