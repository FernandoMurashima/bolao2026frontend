import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-regulation-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './regulation-page.component.html',
  styleUrl: './regulation-page.component.scss',
})
export class RegulationPageComponent {}
