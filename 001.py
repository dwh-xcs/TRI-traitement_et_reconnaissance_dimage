import face_recognition
import cv2

# Carrega a imagem e converte para RGB
img = cv2.imread('.\img\imagem001.jpg')
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# Detecta rostos
locs = face_recognition.face_locations(rgb)
print(f"Rostos detectados: {len(locs)}")

# Desenha retângulos ao redor dos rostos
for (top, right, bottom, left) in locs:
    cv2.rectangle(img, (left, top), (right, bottom), (0, 255, 0), 2)

cv2.imshow("Resultado", img)
cv2.waitKey(0)
cv2.destroyAllWindows()
