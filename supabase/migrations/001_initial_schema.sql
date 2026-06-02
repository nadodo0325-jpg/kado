create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('teacher', 'student', 'parent')),
  email text unique,
  display_name varchar(50) not null,
  avatar_url text,
  aura_color text not null default 'stable'
    check (aura_color in ('high_energy', 'stable', 'tired', 'low_pressure')),
  current_status text not null default 'home'
    check (current_status in ('moving', 'home', 'flow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_name varchar(80) not null,
  class_code varchar(20) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.parent_student_relations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  category text not null check (category in ('homework', 'quiz', 'todo', 'others')),
  title varchar(100) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.task_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  item_kind text not null default 'normal'
    check (item_kind in ('normal', 'payment', 'form')),
  teacher_force_chat boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.student_task_statuses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  task_item_id uuid not null references public.task_items(id) on delete cascade,
  status text not null default 'red'
    check (status in ('red', 'green', 'processing')),
  updated_at timestamptz not null default now(),
  unique (student_id, task_item_id)
);

create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  mood text not null check (mood in ('high_energy', 'stable', 'tired', 'low_pressure')),
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (student_id, checkin_date)
);

create table if not exists public.parent_interactions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('pat', 'energy', 'ok')),
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_ai_configs (
  user_id uuid primary key references public.users(id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic')),
  encrypted_api_key text not null,
  key_last4 varchar(4),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.task_messages (
  id uuid primary key default gen_random_uuid(),
  task_item_id uuid not null references public.task_items(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_classes_teacher_id
on public.classes(teacher_id);

create index if not exists idx_class_members_class_id
on public.class_members(class_id);

create index if not exists idx_parent_student_parent_id
on public.parent_student_relations(parent_id);

create index if not exists idx_parent_student_student_id
on public.parent_student_relations(student_id);

create index if not exists idx_tasks_class_id
on public.tasks(class_id);

create index if not exists idx_task_items_task_id
on public.task_items(task_id);

create index if not exists idx_student_task_statuses_student_id
on public.student_task_statuses(student_id);

create index if not exists idx_student_task_statuses_task_item_id
on public.student_task_statuses(task_item_id);

create index if not exists idx_mood_checkins_student_date
on public.mood_checkins(student_id, checkin_date);

create index if not exists idx_parent_interactions_student_id
on public.parent_interactions(student_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_student_task_statuses_updated_at on public.student_task_statuses;
create trigger set_student_task_statuses_updated_at
before update on public.student_task_statuses
for each row
execute function public.set_updated_at();

drop trigger if exists set_teacher_ai_configs_updated_at on public.teacher_ai_configs;
create trigger set_teacher_ai_configs_updated_at
before update on public.teacher_ai_configs
for each row
execute function public.set_updated_at();