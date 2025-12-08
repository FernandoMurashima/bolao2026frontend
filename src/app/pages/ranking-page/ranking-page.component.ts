import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopaService, RankingRow } from '../../services/copa.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-ranking-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ranking-page.component.html',
  styleUrl: './ranking-page.component.scss',
})
export class RankingPageComponent implements OnInit {
  rows: RankingRow[] = [];
  loading = false;
  error: string | null = null;

  constructor(private copaService: CopaService) {}

  ngOnInit(): void {
    this.loadRanking();
  }

  loadRanking(): void {
    this.loading = true;
    this.error = null;
    this.copaService.getRanking().subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Erro ao carregar ranking.';
      },
    });
  }
}
