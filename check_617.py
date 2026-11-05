import cv2
import os

p = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals/0d9655986ef1459293be7daa83e502f4.jpg'
img = cv2.imread(p)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

casc = cv2.CascadeClassifier('/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml')
faces = casc.detectMultiScale(gray, scaleFactor=1.02, minNeighbors=1, minSize=(20, 20))
print('Faces found with minNeighbors=1:', faces)

eye_casc = cv2.CascadeClassifier('/usr/share/opencv4/haarcascades/haarcascade_eye.xml')
eyes = eye_casc.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=2)
print('Eyes found:', eyes)

# Also test 621
p2 = '/var/lib/docker/volumes/maktab_davomad_uploads/backup_originals/c48904d3e51d4255833688521a26c89b.jpg'
img2 = cv2.imread(p2)
gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
faces2 = casc.detectMultiScale(gray2, scaleFactor=1.02, minNeighbors=1, minSize=(20, 20))
print('Faces found in 621:', faces2)
eyes2 = eye_casc.detectMultiScale(gray2, scaleFactor=1.05, minNeighbors=2)
print('Eyes found in 621:', eyes2)
