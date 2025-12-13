> **👁️ Traitement et reconnaissance d'image** > 

![Badge Status](https://img.shields.io/badge/Status-Concluído-green) ![Badge License](https://img.shields.io/badge/License-MIT-blue) ![Badge Tech](https://img.shields.io/badge/Tech-TensorFlow.js-orange)

## 📋 Sobre o Projeto

O **TRI (Detector de Objetos Web)** é uma aplicação de acessibilidade digital que utiliza **Inteligência Artificial** e **Visão Computacional** para identificar objetos em tempo real diretamente no navegador.

O objetivo principal é auxiliar pessoas com **deficiência visual**, proporcionando maior autonomia e segurança através de feedback sonoro imediato sobre o ambiente ao redor.

---

## 🚀 Demo Online

Você pode testar a aplicação diretamente pelo navegador do seu celular ou computador (necessário webcam):

👉 **Acesse:** [https://traitement-et-reconnaissance-dimage.vercel.app/](https://traitement-et-reconnaissance-dimage.vercel.app/)

---

## 📄 Embasamento Teórico

Abaixo estão os detalhes técnicos e teóricos apresentados no banner oficial do projeto:

### 1. Introdução
A acessibilidade digital representa um desafio crítico e uma necessidade urgente na sociedade contemporânea. No Brasil, dados do Censo de 2022 revelam que aproximadamente **7,9 milhões de pessoas** vivem com alguma dificuldade visual, enfrentando barreiras significativas no acesso à informação e à interação digital.

Em resposta a este cenário, e alinhado aos princípios da **Lei Brasileira de Inclusão**, torna-se imperativo o desenvolvimento de soluções tecnológicas inovadoras. Este trabalho apresenta o Detector de Objetos Web (TRI), uma ferramenta que visa preencher essa lacuna, proporcionando maior autonomia e independência através de software acessível.

### 2. Objetivos
O objetivo é desenvolver e implementar uma aplicação web que utilize técnicas avançadas de Visão Computacional e Inteligência Artificial para realizar a identificação de objetos e obstáculos em tempo real.

Essa ferramenta inovadora tem o propósito central de auxiliar pessoas com deficiência visual, oferecendo feedback imediato por meio de **alertas de áudio**. A solução visa, assim, promover maior autonomia, inclusão digital e segurança aos usuários em seus ambientes cotidianos.

### 3. Metodologia e Arquitetura Tecnológica
A aplicação desenvolvida utilizou a Metodologia Ágil e o modelo de Prototipagem Evolutiva. A arquitetura foca em Visão Computacional e Deep Learning.

* **Modelo de IA:** O sistema emprega o modelo **COCO-SSD** (baseado na arquitetura SSD), selecionado por oferecer o melhor equilíbrio entre acurácia e velocidade para detecção em tempo real.
* **Refatoração:** Uma refatoração estratégica migrou o projeto para JavaScript e **TensorFlow.js**, implementando uma arquitetura de Computação no Lado do Cliente (*Client-Side Computing*).
* **Performance:** Essa decisão foi essencial para garantir baixa latência e permitir a execução rápida em dispositivos móveis, utilizando a **Web Speech API** para alertas de áudio.

### 4. Conclusão
O projeto Detector de Objetos Web (TRI) atingiu seu objetivo principal ao desenvolver uma aplicação web acessível para auxiliar pessoas com deficiência visual na identificação de obstáculos em tempo real.

O sucesso reside na combinação de tecnologia robusta (*Deep Learning com SSD*) e acessibilidade prática (*Web Speech API* e processamento local). A decisão estratégica de refatorar para JavaScript/TensorFlow.js garantiu o desempenho necessário de baixa latência para a execução eficiente em dispositivos móveis, o principal meio de uso.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma arquitetura moderna focada em performance web:

| Tecnologia | Descrição |
| :--- | :--- |
| **TensorFlow.js** | Biblioteca de Machine Learning para execução de modelos no navegador. |
| **COCO-SSD** | Modelo de detecção de objetos (*Single Shot MultiBox Detector*) treinado na base COCO. |
| **Web Speech API** | API nativa do navegador para síntese de voz (Text-to-Speech). |
| **HTML5 / CSS3** | Estrutura semântica e estilização responsiva. |

---

## 👥 Autores e Orientação

* **David Costa**
* **Marcos Alexandre Correa**
* **Wolkendo Arias**

---

## 📚 Referências Bibliográficas

* **BRASIL.** Lei nº 13.146, de 6 de julho de 2015. Institui a Lei Brasileira de Inclusão da Pessoa com Deficiência.
* **COCO-SSD.** Object Detection with COCO-SSD TensorFlow.js Models.
* **IBGE.** Censo Demográfico 2022: Pessoas com deficiência.
* **LIU, W. et al.** SSD: Single Shot MultiBox Detector. ECCV 2016.
* **TENSORFLOW.** TensorFlow.js. Documentação Oficial.
