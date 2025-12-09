import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-change-password-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password-page.component.html',
  styleUrls: ['./change-password-page.component.scss'],
})
export class ChangePasswordPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.group({
    old_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    new_password_confirm: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.errorMessage = 'Preencha todos os campos corretamente.';
      return;
    }

    const oldPassword = this.form.value.old_password!;
    const newPassword = this.form.value.new_password!;
    const newPasswordConfirm = this.form.value.new_password_confirm!;

    this.loading = true;

    this.auth
      .changePassword(oldPassword, newPassword, newPasswordConfirm)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.detail || 'Senha alterada com sucesso.';
        },
        error: (err) => {
          this.loading = false;

          if (err.error && typeof err.error === 'object') {
            if (err.error.old_password) {
              this.errorMessage = err.error.old_password;
            } else if (err.error.new_password) {
              this.errorMessage = err.error.new_password;
            } else if (err.error.new_password_confirm) {
              this.errorMessage = err.error.new_password_confirm;
            } else if (err.error.detail) {
              this.errorMessage = err.error.detail;
            } else {
              this.errorMessage = 'Erro ao alterar senha.';
            }
          } else {
            this.errorMessage = 'Erro ao alterar senha.';
          }
        },
      });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
