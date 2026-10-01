-- The brand colour moved from burnt orange to sky blue. The app reads this default on launch for
-- every user who has not picked a colour of their own, so updating it here recolours those
-- installs without a new APK. A colour an admin chose deliberately is left as it is.
alter table app_settings alter column default_seed_color set default '#0284C7';

update app_settings
set default_seed_color = '#0284C7'
where upper(default_seed_color) = '#E8541F';
