import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CopaService, Stage, Match } from '../../services/copa.service';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';


interface MatchRowAdmin {
  match: Match;
  home_score: number | null;
  away_score: number | null;
}

@Component({
  selector: 'app-admin-results-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-results-page.component.html',
  styleUrl: './admin-results-page.component.scss',
})
export class AdminResultsPageComponent implements OnInit {
  stages: Stage[] = [];
  activeStageOrder = 1;
  matchesByStage: { [order: number]: MatchRowAdmin[] } = {};
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private copaService: CopaService) {}

  ngOnInit(): void {
    this.loadStages();
  }

  loadStages(): void {
    this.loading = true;
    this.error = null;
    this.copaService.getStages().subscribe({
      next: (stages) => {
        this.stages = stages.sort((a, b) => a.order - b.order);
        this.loading = false;
        if (this.stages.length) {
          this.setActiveStage(this.stages[0].order);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Erro ao carregar fases.';
      },
    });
  }

  setActiveStage(order: number): void {
    this.activeStageOrder = order;
    this.success = null;
    this.error = null;
    if (!this.matchesByStage[order]) {
      this.loadMatches(order);
    }
  }

  loadMatches(order: number): void {
    this.loading = true;
    this.error = null;
    this.copaService.getMatchesByStage(order).subscribe({
      next: (matches) => {
        const rows: MatchRowAdmin[] = matches.map((m) => ({
          match: m,
          home_score: m.home_score,
          away_score: m.away_score,
        }));
        this.matchesByStage[order] = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Erro ao carregar jogos da fase.';
      },
    });
  }

  getCurrentRows(): MatchRowAdmin[] {
    return this.matchesByStage[this.activeStageOrder] || [];
  }

  saveResults(): void {
    const rows = this.getCurrentRows();
    if (!rows.length) return;

    this.saving = true;
    this.error = null;
    this.success = null;

    const requests = rows.map((r) =>
      this.copaService.updateMatchResult(
        r.match.id,
        r.home_score === null || r.home_score === undefined ? null : r.home_score,
        r.away_score === null || r.away_score === undefined ? null : r.away_score
      )
    );

    forkJoin(requests).subscribe({
      next: (updated) => {
        const map: { [id: number]: Match } = {};
        updated.forEach((m) => {
          map[m.id] = m;
        });
        rows.forEach((r) => {
          const m = map[r.match.id];
          if (m) {
            r.match = m;
            r.home_score = m.home_score;
            r.away_score = m.away_score;
          }
        });
        this.saving = false;
        this.success = 'Resultados salvos com sucesso para esta fase.';
      },
      error: () => {
        this.saving = false;
        this.error = 'Erro ao salvar resultados.';
      },
    });
  }

  getStageByOrder(order: number): Stage | undefined {
    return this.stages.find((s) => s.order === order);
  }
}
