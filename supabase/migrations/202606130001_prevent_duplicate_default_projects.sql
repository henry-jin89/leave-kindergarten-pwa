with ranked_projects as (
  select
    id,
    first_value(id) over (
      partition by user_id, type, cycle_start, cycle_end
      order by created_at, id
    ) as keeper_id,
    row_number() over (
      partition by user_id, type, cycle_start, cycle_end
      order by created_at, id
    ) as row_number
  from public.projects
  where type in ('annual_leave', 'parenting_leave', 'kindergarten')
),
duplicate_projects as (
  select id, keeper_id
  from ranked_projects
  where row_number > 1
)
update public.entries
set project_id = duplicate_projects.keeper_id
from duplicate_projects
where entries.project_id = duplicate_projects.id;

with ranked_projects as (
  select
    id,
    row_number() over (
      partition by user_id, type, cycle_start, cycle_end
      order by created_at, id
    ) as row_number
  from public.projects
  where type in ('annual_leave', 'parenting_leave', 'kindergarten')
)
delete from public.projects
using ranked_projects
where projects.id = ranked_projects.id
  and ranked_projects.row_number > 1;

create unique index if not exists projects_default_cycle_unique_idx
on public.projects (user_id, type, cycle_start, cycle_end)
where type in ('annual_leave', 'parenting_leave', 'kindergarten');
