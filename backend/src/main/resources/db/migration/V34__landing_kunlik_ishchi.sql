-- The landing page says "kunlik ishchi" rather than "mardikor". Only the word is swapped, so any
-- other wording an admin has written in the panel stays as it is.

update landing_content
set hero_subtitle = replace(replace(hero_subtitle, 'Mardikor', 'Kunlik ishchi'), 'mardikor', 'kunlik ishchi')
where hero_subtitle ilike '%mardikor%';

update landing_items
set title = replace(replace(title, 'Mardikor', 'Kunlik ishchi'), 'mardikor', 'kunlik ishchi'),
    description = replace(replace(description, 'Mardikor', 'Kunlik ishchi'), 'mardikor', 'kunlik ishchi')
where title ilike '%mardikor%' or description ilike '%mardikor%';
