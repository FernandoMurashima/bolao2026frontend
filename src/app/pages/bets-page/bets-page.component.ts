import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { CopaService, Stage, Match, Bet } from '../../services/copa.service';

interface MatchRow {
  match: Match;
  betId?: number;
  home_score: number | null;
  away_score: number | null;
}

@Component({
  selector: 'app-bets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './bets-page.component.html',
  styleUrl: './bets-page.component.scss',
})
export class BetsPageComponent implements OnInit {
  stages: Stage[] = [];
  activeStageOrder = 1;
  matchesByStage: { [order: number]: MatchRow[] } = {};
  loadingMatches = false;
  savingStage = false;
  stageError: string | null = null;

  constructor(private copaService: CopaService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loadingMatches = true;

    forkJoin({
      stages: this.copaService.getStages(),
      bets: this.copaService.getBets(),
    }).subscribe({
      next: ({ stages, bets }) => {
        this.stages = stages.sort((a, b) => a.order - b.order);
        this.loadStageMatches(this.activeStageOrder, bets);
        this.loadingMatches = false;
      },
      error: () => {
        this.loadingMatches = false;
        this.stageError = 'Erro ao carregar dados iniciais.';
      },
    });
  }

  private loadStageMatches(stageOrder: number, existingBets?: Bet[]): void {
    this.stageError = null;
    this.loadingMatches = true;

    this.copaService.getMatchesByStage(stageOrder).subscribe({
      next: (matches) => {
        const bets$ = existingBets ? existingBets : [];
        const betMap: { [matchId: number]: Bet } = {};
        bets$.forEach((b) => {
          if (b.match && b.match.stage && b.match.stage.order === stageOrder) {
            betMap[b.match.id] = b;
          }
        });

        const rows: MatchRow[] = matches.map((m) => {
          const existing = betMap[m.id];
          return {
            match: m,
            betId: existing?.id,
            home_score: existing?.home_score ?? null,
            away_score: existing?.away_score ?? null,
          };
        });

        this.matchesByStage[stageOrder] = rows;
        this.loadingMatches = false;
      },
      error: () => {
        this.loadingMatches = false;
        this.stageError = 'Erro ao carregar jogos da fase.';
      },
    });
  }

  setActiveStage(order: number): void {
    this.activeStageOrder = order;
    if (!this.matchesByStage[order]) {
      this.copaService.getBets().subscribe({
        next: (bets) => {
          this.loadStageMatches(order, bets);
        },
        error: () => {
          this.loadStageMatches(order);
        },
      });
    }
  }

  getCurrentStageRows(): MatchRow[] {
    return this.matchesByStage[this.activeStageOrder] || [];
  }

  updateScore(row: MatchRow, field: 'home_score' | 'away_score', value: string): void {
    const num = value === '' ? null : Number(value);
    if (num !== null && (isNaN(num) || num < 0)) return;
    row[field] = num;
  }

  saveStageBets(): void {
    const rows = this.getCurrentStageRows();
    if (!rows.length) return;

    this.savingStage = true;
    this.stageError = null;

    this.copaService.getBets().subscribe({
      next: (existingBets) => {
        const betMap: { [matchId: number]: Bet } = {};
        existingBets.forEach((b) => {
          betMap[b.match.id] = b;
        });

        const requests = rows
          .filter(
            (r) =>
              r.home_score !== null &&
              r.away_score !== null &&
              r.home_score !== undefined &&
              r.away_score !== undefined
          )
          .map((r) => {
            const previous = betMap[r.match.id];
            const payload: Partial<Bet> = {
              match_id: r.match.id,
              home_score: r.home_score!,
              away_score: r.away_score!,
            };
            if (previous) {
              payload.id = previous.id;
            } else if (r.betId) {
              payload.id = r.betId;
            }
            return this.copaService.saveBet(payload);
          });

        if (!requests.length) {
          this.savingStage = false;
          return;
        }

        forkJoin(requests).subscribe({
          next: (saved) => {
            const newMap: { [matchId: number]: Bet } = {};
            saved.forEach((b) => {
              newMap[b.match.id] = b;
            });
            rows.forEach((r) => {
              const b = newMap[r.match.id];
              if (b) {
                r.betId = b.id;
              }
            });
            this.savingStage = false;
          },
          error: (err) => {
            this.savingStage = false;
            this.stageError =
              err?.error?.detail || 'Erro ao salvar palpites da fase.';
          },
        });
      },
      error: () => {
        this.savingStage = false;
        this.stageError = 'Erro ao carregar palpites existentes.';
      },
    });
  }

  getStageByOrder(order: number): Stage | undefined {
    return this.stages.find((s) => s.order === order);
  }

  isStageDeadlinePassed(order: number): boolean {
    const stage = this.getStageByOrder(order);
    if (!stage) return false;
    return new Date(stage.deadline) < new Date();
  }
}
