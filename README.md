# 🛡️ Protege+

**Plataforma Online com Exercícios e Jogos Sérios Aplicados à Segurança Digital**

O **Protege+** é uma plataforma educativa interativa, desenvolvida com o objetivo de aumentar a literacia em cibersegurança entre jovens adultos e estudantes. Através de simulações práticas e mecânicas de gamificação, a plataforma ensina os utilizadores a identificar e a mitigar ameaças digitais de uma forma envolvente e segura.

Este projeto foi desenvolvido como **Trabalho Final de Curso** para a Licenciatura em Engenharia Informática da **Universidade Lusófona**.

---

## ✨ Principais Funcionalidades

* 🧠 **Quizzes Educativos:** Avaliação de conhecimentos em cibersegurança com sistema de progressão.
* 🎣 **Simulador de Ameaças:** Ambiente seguro onde os utilizadores treinam a identificação de ataques reais (ex: e-mails de phishing).
* 🤖 **Detetor de Phishing:** Ambiente onde o utilizador coloca uma mensagem ou email suspeito e com a integração da IA da Groq a mensagem é analisada e devolvida uma resposta.
* 🎮 **Gamificação Avançada:**
  * **Sistema de XP e Níveis:** Pontos ganhos por atividades concluídas, refletindo a evolução do utilizador.
  * **Leaderboard (Hall of Fame):** Tabelas de classificação (Geral, Quiz e Simulador) para fomentar a competitividade saudável.
  * **Streaks (Chama Diária):** Recompensas para acessos consecutivos à plataforma.
  * **Conquistas e Medalhas:** Desbloqueio de molduras de perfil exclusivas consoante o nível e missões concluídas.
* 🔒 **Segurança (MFA):** Sistema de Autenticação Multifator implementado. A plataforma recompensa os utilizadores (com XP e medalhas) que ativam o MFA, promovendo boas práticas na vida real.
* 👁️ **Acessibilidade Inclusiva:** Integração de filtros de alto contraste e modos de visualização adaptados para daltónicos, garantindo uma experiência de navegação adequada para todos os utilizadores.
* 🌍 **Suporte Multilíngue:** Disponível em Português e Inglês, com deteção de preferências guardadas por cookies ou na base de dados.

---

## 🛠️ Stack Tecnológica

**Backend:**
* [Python 3.x](https://www.python.org/)
* [Django 4.x](https://www.djangoproject.com/) (Arquitetura MVT)
* [PostgreSQL](https://www.postgresql.org/) (Hospedado no **Neon** para ambiente de produção)

**Frontend:**
* HTML5 / CSS3
* JavaScript
* Design responsivo e acessível

**Integrações e Deploy:**
* **Groq API** (Processamento de IA assíncrono para o simulador)
* Autenticação via Google (OAuth)
* **Render** (Hospedagem e Deploy da plataforma web)

---

## 🚀 Como executar o projeto localmente

Para correres este projeto na tua máquina local, certifica-te de que tens o Python e o Git instalados e segue os passos abaixo.

### 1. Clonar o repositório
```bash
git clone https://github.com/MarceloCampos2005/Projeto-Final---Engenharia-Informatica---PROTEGE-.git
cd Projeto-Final---Engenharia-Informatica---PROTEGE-
```

### 2. Criar e ativar o ambiente virtual (Virtualenv)
```bash
python -m venv venv

# Em Windows:
venv\Scripts\activate

# Em Linux/Mac:
source venv/bin/activate
```

### 3. Instalar as dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar as Variáveis de Ambiente
Cria um ficheiro `.env` na raiz do projeto e adiciona as chaves necessárias (exemplo):
```ini
SECRET_KEY=tua-secret-key-do-django
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/nomedabase
GROQ_API_KEY=tua-chave-da-groq-api
```
*(Nota: Para ambiente de desenvolvimento local, o Django usará SQLite por defeito, a não ser que configures o url do PostgreSQL).*

### 5. Aplicar as migrações da Base de Dados
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Criar um Superutilizador (Admin)
```bash
python manage.py createsuperuser
```

### 7. Iniciar o Servidor
```bash
python manage.py runserver
```
Acede à plataforma através de `http://127.0.0.1:8000/`.

---

## 👨‍💻 Autor

**Marcelo Campos**
* Licenciatura em Engenharia Informática - Universidade Lusófona (Centro Universitário do Porto)
* GitHub: [@MarceloCampos2005](https://github.com/MarceloCampos2005)

*Agradecimentos especiais ao orientador Professor Hugo Barbosa e ao coorientador Professor José Vasconcelos pelo apoio no desenvolvimento deste projeto.*

---

## 📄 Licença

Este projeto tem fins académicos. Os direitos de cópia pertencem a Marcelo Campos e à Universidade Lusófona, sendo permitida a cópia e distribuição com objetivos educacionais ou de investigação não comerciais, com os devidos créditos.
