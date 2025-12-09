import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';

import { CopaService, ExtraBet, Team } from '../../services/copa.service';

interface ExtraFormRow {
  type: string;
  label: string;
  useTeam: boolean;
  points: number;
}

@Component({
  selector: 'app-extra-bets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './extra-bets-page.component.html',
  styleUrl: './extra-bets-page.component.scss',
})
export class ExtraBetsPageComponent implements OnInit {
  teams: Team[] = [];

  extrasForm!: FormGroup;
  extrasConfig: ExtraFormRow[] = [
    { type: 'CHAMPION', label: 'Campeã', useTeam: true, points: 500 },
    { type: 'RUNNER_UP', label: 'Vice-campeã', useTeam: true, points: 250 },
    { type: 'THIRD_PLACE', label: '3º lugar', useTeam: true, points: 125 },
    {
      type: 'MOST_RED',
      label: 'Mais cartões vermelhos',
      useTeam: true,
      points: 100,
    },
    {
      type: 'MOST_YELLOW',
      label: 'Mais cartões amarelos',
      useTeam: true,
      points: 100,
    },
    {
      type: 'FEWEST_GC',
      label: 'Menos gols sofridos',
      useTeam: true,
      points: 50,
    },
    {
      type: 'MOST_GC',
      label: 'Mais gols sofridos',
      useTeam: true,
      points: 250,
    },
    {
      type: 'FEWEST_GF',
      label: 'Menos gols marcados',
      useTeam: true,
      points: 250,
    },
    {
      type: 'MOST_GF',
      label: 'Mais gols marcados',
      useTeam: true,
      points: 300,
    },
    {
      type: 'TOP_SCORER',
      label: 'Artilheiro (jogador)',
      useTeam: false,
      points: 300,
    },
  ];

  extrasLoading = false;
  extrasSaving = false;
  extrasError: string | null = null;
  extrasSuccess: string | null = null;
  extrasMap: { [type: string]: ExtraBet } = {};

  constructor(private fb: FormBuilder, private copaService: CopaService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  // ---------- FORM ----------

  private initForm(): void {
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

  // ---------- LOAD DATA ----------

  private loadData(): void {
    this.extrasLoading = true;
    this.extrasError = null;

    forkJoin({
      teams: this.copaService.getTeams(),
      extraBets: this.copaService.getExtraBets(),
    }).subscribe({
      next: ({ teams, extraBets }) => {
        this.teams = teams;

        const map: { [type: string]: ExtraBet } = {};
        extraBets.forEach((e) => {
          map[e.type] = e;
        });
        this.extrasMap = map;

        this.patchExtrasForm();
        this.extrasLoading = false;
      },
      error: () => {
        this.extrasLoading = false;
        this.extrasError = 'Erro ao carregar palpites especiais.';
      },
    });
  }

  private patchExtrasForm(): void {
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

  // ---------- SAVE ----------

  saveExtras(): void {
    if (this.extrasSaving) {
      return;
    }

    this.extrasSaving = true;
    this.extrasError = null;
    this.extrasSuccess = null;

    const tournament = this.copaService.getTournamentId();
    const requests: Observable<ExtraBet>[] = [];

    this.extrasConfig.forEach((cfg, index) => {
      const row = this.extrasArray.at(index) as FormGroup;
      const existing = this.extrasMap[cfg.type];

      const payload: Partial<ExtraBet> = {
        tournament,
        type: cfg.type,
      };

      if (cfg.useTeam) {
        const teamId = row.get('team')!.value;
        if (!teamId) {
          // essa linha ficou em branco, só pula
          return;
        }
        payload.team = teamId;
        payload.player_name = '';
      } else {
        const playerName = (row.get('player_name')!.value || '').trim();
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

    // nada preenchido → dá feedback visível
    if (!requests.length) {
      this.extrasSaving = false;
      this.extrasError = 'Preencha pelo menos um palpite antes de salvar.';
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
      error: (err) => {
        console.error('Erro ao salvar palpites especiais', err);
        this.extrasSaving = false;
        this.extrasError =
          err?.error?.detail || 'Erro ao salvar palpites especiais.';
      },
    });
  }
}
