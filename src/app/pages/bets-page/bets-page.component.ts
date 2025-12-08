import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CopaService, Stage, Match, Bet, ExtraBet, Team } from '../../services/copa.service';
import { forkJoin } from 'rxjs';
import { RouterModule } from '@angular/router';


interface MatchRow {
  match: Match;
  betId?: number;
  home_score: number | null;
  away_score: number | null;
}

interface ExtraFormRow {
  type: string;
  label: string;
  useTeam: boolean;
  points: number;
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

  teams: Team[] = [];
  extrasForm!: FormGroup;
  extrasConfig: ExtraFormRow[] = [
    { type: 'CHAMPION', label: 'Campeã', useTeam: true, points: 500 },
    { type: 'RUNNER_UP', label: 'Vice-campeã', useTeam: true, points: 250 },
    { type: 'THIRD_PLACE', label: '3º lugar', useTeam: true, points: 125 },
    { type: 'MOST_RED', label: 'Mais cartões vermelhos', useTeam: true, points: 100 },
    { type: 'MOST_YELLOW', label: 'Mais cartões amarelos', useTeam: true, points: 100 },
    { type: 'FEWEST_GC', label: 'Menos gols sofridos', useTeam: true, points: 50 },
    { type: 'MOST_GC', label: 'Mais gols sofridos', useTeam: true, points: 250 },
    { type: 'FEWEST_GF', label: 'Menos gols marcados', useTeam: true, points: 250 },
    { type: 'MOST_GF', label: 'Mais gols marcados', useTeam: true, points: 300 },
    { type: 'TOP_SCORER', label: 'Artilheiro (jogador)', useTeam: false, points: 300 },
  ];
  extrasLoading = false;
  extrasSaving = false;
  extrasError: string | null = null;
  extrasSuccess: string | null = null;
  extrasMap: { [type: string]: ExtraBet } = {};

  constructor(private fb: FormBuilder, private copaService: CopaService) {}

  ngOnInit(): void {
    this.initExtrasForm();
    this.loadInitialData();
  }

  initExtrasForm(): void {
    this.extrasForm = this.fb.group({
      extras: this.fb.array(
        this.extrasConfig.map((cfg) =>
          this.fb.group({
            type: [cfg.type],
            team: [null],
            player_name: [''],
          })
        )
      ),
    });
  }

  get extrasArray(): FormArray {
    return this.extrasForm.get('extras') as FormArray;
  }

  loadInitialData(): void {
    this.loadingMatches = true;
    this.extrasLoading = true;

    forkJoin({
      stages: this.copaService.getStages(),
      teams: this.copaService.getTeams(),
      bets: this.copaService.getBets(),
      extraBets: this.copaService.getExtraBets(),
    }).subscribe({
      next: ({ stages, teams, bets, extraBets }) => {
        this.stages = stages.sort((a, b) => a.order - b.order);
        this.teams = teams;

        const extrasMap: { [type: string]: ExtraBet } = {};
        extraBets.forEach((e) => {
          extrasMap[e.type] = e;
        });
        this.extrasMap = extrasMap;
        this.patchExtrasForm();

        this.loadStageMatches(this.activeStageOrder, bets);
        this.loadingMatches = false;
        this.extrasLoading = false;
      },
      error: () => {
        this.loadingMatches = false;
        this.extrasLoading = false;
        this.stageError = 'Erro ao carregar dados iniciais.';
      },
    });
  }

  patchExtrasForm(): void {
    this.extrasConfig.forEach((cfg, index) => {
      const row = this.extrasArray.at(index) as FormGroup;
      const data = this.extrasMap[cfg.type];
      if (data) {
        row.patchValue({
          type: cfg.type,
          team: data.team ?? null,
          player_name: data.player_name ?? '',
        });
      }
    });
  }

  loadStageMatches(stageOrder: number, existingBets?: Bet[]): void {
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

  saveExtras(): void {
    if (this.extrasSaving) return;
    this.extrasSaving = true;
    this.extrasError = null;
    this.extrasSuccess = null;

    const tournament = this.copaService.getTournamentId();
    const requests: any[] = [];

    this.extrasConfig.forEach((cfg, index) => {
      const row = this.extrasArray.at(index) as FormGroup;
      const type = cfg.type;
      const existing = this.extrasMap[type];

      const payload: Partial<ExtraBet> = {
        tournament,
        type,
      };

      if (cfg.useTeam) {
        const teamId = row.value.team;
        if (!teamId) {
          return;
        }
        payload.team = teamId;
        payload.player_name = '';
      } else {
        const playerName = (row.value.player_name || '').trim();
        if (!playerName) {
          return;
        }
        payload.player_name = playerName;
        payload.team = null;
      }

      if (existing) {
        payload.id = existing.id;
      }

      requests.push(this.copaService.saveExtraBet(payload));
    });

    if (!requests.length) {
      this.extrasSaving = false;
      return;
    }

    forkJoin(requests).subscribe({
      next: (saved) => {
        const map: { [type: string]: ExtraBet } = { ...this.extrasMap };
        saved.forEach((e) => {
          map[e.type] = e;
        });
        this.extrasMap = map;
        this.extrasSaving = false;
        this.extrasSuccess = 'Palpites especiais salvos.';
      },
      error: () => {
        this.extrasSaving = false;
        this.extrasError = 'Erro ao salvar palpites especiais.';
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
