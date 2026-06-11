import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SupabaseService } from '../../core/services/supabase.service';
import { BotonTemaComponent } from '../../shared/boton-tema.component';

/**
 * Pantalla de acceso: login y registro contra Supabase Auth (email + password).
 */
@Component({
  selector: 'app-login',
  imports: [BotonTemaComponent, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async iniciarSesion(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.prepararEnvio();
    try {
      const { email, password } = this.formulario.getRawValue();
      const { error } = await this.supabase.iniciarSesion(email, password);

      if (error) {
        this.error.set('Credenciales no validas o usuario inexistente.');
        return;
      }
      await this.router.navigate(['/']);
    } catch (error_) {
      this.error.set('No se pudo contactar con Supabase. Revisa la consola (F12).');
      console.error('[Login] Error inesperado al iniciar sesion:', error_);
    } finally {
      this.cargando.set(false);
    }
  }

  protected async registrarse(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.prepararEnvio();
    try {
      const { email, password } = this.formulario.getRawValue();
      const { data, error } = await this.supabase.registrarse(email, password);

      if (error) {
        this.error.set(error.message);
        return;
      }

      // Si la confirmacion por email esta activa en Supabase, todavia no hay sesion.
      if (data.session) {
        await this.router.navigate(['/']);
      } else {
        this.aviso.set('Cuenta creada. Revisa tu correo para confirmar la direccion.');
      }
    } catch (error_) {
      this.error.set('No se pudo contactar con Supabase. Revisa la consola (F12).');
      console.error('[Login] Error inesperado al registrarse:', error_);
    } finally {
      this.cargando.set(false);
    }
  }

  private prepararEnvio(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.aviso.set(null);
  }
}
