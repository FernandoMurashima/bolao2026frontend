import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LayoutShellComponent } from './layout/layout-shell/layout-shell.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { BetsPageComponent } from './pages/bets-page/bets-page.component';
import { RankingPageComponent } from './pages/ranking-page/ranking-page.component';
import { RegulationPageComponent } from './pages/regulation-page/regulation-page.component';
import { AdminResultsPageComponent } from './pages/admin-results-page/admin-results-page.component';
import { AuthGuard } from './guards/auth.guard';
import { ChangePasswordPageComponent } from './pages/change-password-page/change-password-page.component';
import { ExtraBetsPageComponent } from './pages/extra-bets-page/extra-bets-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomePageComponent },
      { path: 'palpites', component: BetsPageComponent },
      { path: 'palpites-especiais', component: ExtraBetsPageComponent },
      { path: 'ranking', component: RankingPageComponent },
      { path: 'regulamento', component: RegulationPageComponent },
      { path: 'admin/resultados', component: AdminResultsPageComponent },
      { path: 'trocar-senha', component: ChangePasswordPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
