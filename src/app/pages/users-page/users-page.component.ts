import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService, AdminUser } from '../../services/users.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  saving = false;
  deleting = false;
  error: string | null = null;
  success: string | null = null;

  form!: FormGroup;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadUsers();
  }

  buildForm(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      first_name: [''],
      last_name: [''],
      email: ['', [Validators.email]],
      is_active: [true],
      is_superuser: [false],
      password: [''],
      password_confirm: [''],
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.usersService.list().subscribe({
      next: (users) => {
        this.users = users.sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Erro ao carregar usuários.';
      },
    });
  }

  newUser(): void {
    this.editingId = null;
    this.form.reset({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      is_active: true,
      is_superuser: false,
      password: '',
      password_confirm: '',
    });
    this.error = null;
    this.success = null;
  }

  editUser(u: AdminUser): void {
    this.editingId = u.id ?? null;
    this.form.patchValue({
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      is_active: u.is_active,
      is_superuser: u.is_superuser,
      password: '',
      password_confirm: '',
    });
    this.error = null;
    this.success = null;
  }

  deleteUser(u: AdminUser): void {
    if (!u.id) return;
    if (!confirm(`Excluir usuário "${u.username}"?`)) return;

    this.deleting = true;
    this.error = null;
    this.success = null;

    this.usersService.delete(u.id).subscribe({
      next: () => {
        this.users = this.users.filter((x) => x.id !== u.id);
        this.deleting = false;
        this.success = 'Usuário excluído com sucesso.';
        if (this.editingId === u.id) {
          this.newUser();
        }
      },
      error: () => {
        this.deleting = false;
        this.error = 'Erro ao excluir usuário.';
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.error = 'Preencha os campos obrigatórios.';
      return;
    }

    const value = this.form.value;
    if (value.password || value.password_confirm) {
      if (value.password !== value.password_confirm) {
        this.error = 'Senha e confirmação não conferem.';
        return;
      }
    }

    const payload: AdminUser = {
      username: value.username,
      first_name: value.first_name || '',
      last_name: value.last_name || '',
      email: value.email || '',
      is_active: !!value.is_active,
      is_superuser: !!value.is_superuser,
    };

    if (value.password) {
      payload.password = value.password;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    if (this.editingId) {
      this.usersService.update(this.editingId, payload).subscribe({
        next: (updated) => {
          this.users = this.users.map((u) =>
            u.id === updated.id ? updated : u
          );
          this.saving = false;
          this.success = 'Usuário atualizado com sucesso.';
        },
        error: () => {
          this.saving = false;
          this.error = 'Erro ao atualizar usuário.';
        },
      });
    } else {
      this.usersService.create(payload).subscribe({
        next: (created) => {
          this.users = [...this.users, created].sort((a, b) =>
            a.username.localeCompare(b.username)
          );
          this.saving = false;
          this.success = 'Usuário criado com sucesso.';
          // limpa senha e confirmação
          this.form.patchValue({ password: '', password_confirm: '' });
          this.editingId = created.id ?? null;
        },
        error: () => {
          this.saving = false;
          this.error = 'Erro ao criar usuário.';
        },
      });
    }
  }
}
