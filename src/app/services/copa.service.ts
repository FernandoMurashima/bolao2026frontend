import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Stage {
  id: number;
  order: number;
  name: string;
  deadline: string;
  points_exact_score: number;
  points_result: number;
  points_one_team_goals: number;
}

export interface Team {
  id: number;
  name: string;
  code: string;
}

export interface Match {
  id: number;
  tournament: number;
  stage: Stage;
  home_team: Team;
  away_team: Team;
  kickoff: string;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
}

export interface Bet {
  id?: number;
  match: Match;
  match_id?: number;
  home_score: number;
  away_score: number;
  created_at?: string;
  updated_at?: string;
  points?: number;
}

export interface ExtraBet {
  id?: number;
  tournament: number;
  type: string;
  team?: number | null;
  player_name?: string;
  created_at?: string;
  points?: number;
}

export interface RankingRow {
  user_id: number;
  username: string;
  position: number;
  total_points: number;
  exact_scores: number;
  results: number;
  stage5_points: number;
  extras_points: number;
  champion_hit: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CopaService {
  private apiUrl = `${environment.apiBaseUrl}/api/copa`;
  private tournamentId = environment.tournamentId;

  constructor(private http: HttpClient) {}

  getStages(): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.apiUrl}/stages/`);
  }

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/teams/`);
  }

  getMatchesByStage(stageOrder: number): Observable<Match[]> {
    let params = new HttpParams()
      .set('tournament', this.tournamentId)
      .set('stage_order', stageOrder);
    return this.http.get<Match[]>(`${this.apiUrl}/matches/`, { params });
  }

  getBets(): Observable<Bet[]> {
    return this.http.get<Bet[]>(`${this.apiUrl}/bets/`);
  }

  saveBet(bet: Partial<Bet>): Observable<Bet> {
    if (bet.id) {
      return this.http.put<Bet>(`${this.apiUrl}/bets/${bet.id}/`, bet);
    }
    return this.http.post<Bet>(`${this.apiUrl}/bets/`, bet);
  }

  getExtraBets(): Observable<ExtraBet[]> {
    let params = new HttpParams().set('tournament', this.tournamentId);
    return this.http.get<ExtraBet[]>(`${this.apiUrl}/extra-bets/`, { params });
  }

  saveExtraBet(extra: Partial<ExtraBet>): Observable<ExtraBet> {
    if (extra.id) {
      return this.http.put<ExtraBet>(
        `${this.apiUrl}/extra-bets/${extra.id}/`,
        extra
      );
    }
    return this.http.post<ExtraBet>(`${this.apiUrl}/extra-bets/`, extra);
  }

  getRanking(): Observable<RankingRow[]> {
    let params = new HttpParams().set('tournament', this.tournamentId);
    return this.http.get<RankingRow[]>(`${this.apiUrl}/ranking/`, { params });
  }

  getTournamentId(): number {
    return this.tournamentId;
  }

  updateMatchResult(
    matchId: number,
    home_score: number | null,
    away_score: number | null
  ): Observable<Match> {
    return this.http.patch<Match>(`${this.apiUrl}/matches/${matchId}/`, {
      home_score,
      away_score,
    });
  }
}
