-- ============================================================
-- Esquema del Editor Markdown Colaborativo (ejecutar en el
-- SQL Editor del Dashboard de Supabase)
-- ============================================================

-- gen_random_uuid() viene de pgcrypto (ya activo por defecto en Supabase)
create extension if not exists pgcrypto;

-- Tabla principal: documentos Markdown persistidos
create table if not exists public.documentos (
    id              uuid primary key default gen_random_uuid(),
    titulo          varchar(255) not null,
    contenido       text not null default '',
    creado_por      uuid references auth.users (id),
    actualizado_en  timestamptz not null default now()
);

-- Salas de edicion compartida (extension futura: varios codigos de sala
-- pueden apuntar al mismo documento; hoy el frontend usa el id del
-- documento como codigo de sala)
create table if not exists public.salas_colaborativas (
    codigo_sala     varchar(50) primary key,
    documento_id    uuid references public.documentos (id) on delete cascade,
    activa          boolean not null default true
);

-- Colaboradores invitados a un documento. El propietario (documentos.creado_por)
-- no aparece aqui: su acceso es implicito. Se invita por email para poder
-- compartir incluso con usuarios que aun no se han registrado.
create table if not exists public.documento_colaboradores (
    documento_id  uuid not null references public.documentos (id) on delete cascade,
    email         varchar(320) not null,
    invitado_en   timestamptz not null default now(),
    primary key (documento_id, email)
);

create index if not exists idx_documento_colaboradores_email
    on public.documento_colaboradores (email);

-- Nota: Spring Boot se conecta con el rol propietario (postgres), que no esta
-- sujeto a RLS. Si en el futuro se accede a estas tablas directamente desde el
-- navegador con la anon key, habilita RLS y define las politicas pertinentes.
