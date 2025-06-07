import cv2
import matplotlib.pyplot as plt

# Carregue sua imagem local (substitua pelo caminho desejado)
imagem = cv2.imread("sua_imagem.jpg")  # exemplo: "gato.jpg"
gray = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)

# 1. Método Clássico: Canny (detecção de bordas)
bordas = cv2.Canny(gray, 100, 200)

# 2. Simulação de saída com deep learning (desfoque como placeholder visual)
blur = cv2.GaussianBlur(imagem, (11, 11), 0)

# Convertendo para RGB para exibir corretamente com matplotlib
img_rgb = cv2.cvtColor(imagem, cv2.COLOR_BGR2RGB)
blur_rgb = cv2.cvtColor(blur, cv2.COLOR_BGR2RGB)

# Exibição lado a lado
plt.figure(figsize=(18, 6))

plt.subplot(1, 3, 1)
plt.imshow(img_rgb)
plt.title("Imagem Original")
plt.axis("off")

plt.subplot(1, 3, 2)
plt.imshow(bordas, cmap='gray')
plt.title("Método Clássico: Canny")
plt.axis("off")

plt.subplot(1, 3, 3)
plt.imshow(blur_rgb)
plt.title("Simulação de Deep Learning")
plt.axis("off")

plt.tight_layout()
plt.show()
