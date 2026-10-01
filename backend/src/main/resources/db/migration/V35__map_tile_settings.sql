-- Lets the admin point the mobile app's maps at a tile provider of their choice (for example one
-- with an API key). Both null means the app's built-in OpenStreetMap tiles.
alter table app_settings add column map_tile_url varchar(500);
alter table app_settings add column map_attribution varchar(200);
