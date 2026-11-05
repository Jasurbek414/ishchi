import os
os.system("docker exec maktab-db psql -U postgres -d maktabdb -c \"SELECT id, full_name, face_id, photo_url FROM students WHERE sync_status = 'PENDING';\"")
