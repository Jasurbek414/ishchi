#!/bin/bash
docker exec maktab-db psql -U postgres -d maktabdb -c "COPY (SELECT id, full_name, face_id, photo_url, sync_error FROM students WHERE sync_status = 'FAILED') TO '/tmp/failed.csv' WITH CSV DELIMITER '|';"
docker cp maktab-db:/tmp/failed.csv /opt/maktab_davomad/failed.csv
head -10 /opt/maktab_davomad/failed.csv
wc -l /opt/maktab_davomad/failed.csv
