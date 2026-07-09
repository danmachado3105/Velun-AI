# 🌌 Velun AI

Um assistente de inteligência artificial pessoal, rodando 100% localmente no seu computador — sem custos, sem limites de uso e com total privacidade.

Construído do zero como projeto de portfólio, aplicando arquitetura em camadas, boas práticas de engenharia de software e um design visual autoral (identidade "Aurora").

![status](https://img.shields.io/badge/status-em%20desenvolvimento-blueviolet)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## 📸 Demonstração

<img width="395" height="245" alt="Captura de tela 2026-07-08 224738" src="https://github.com/user-attachments/assets/4153d629-24c7-475b-95bf-e474baa6ab49" />
<img width="395" height="245" alt="Captura de tela 2026-07-08 224753" src="https://github.com/user-attachments/assets/3373d3c4-c0f5-4152-a606-d90a8369e115" />

---

## ✨ Funcionalidades

- 💬 Chat em tempo real, com respostas em streaming (efeito "digitando...")
- 🧵 Múltiplas conversas, com histórico salvo e organizado por data
- 🧠 **Memória semântica**: o Velun lembra de preferências e informações do usuário entre conversas diferentes, usando busca por similaridade (RAG)
- 📎 Upload de arquivos (PDF, Word, texto) com extração automática de conteúdo
- 🎨 Modo claro/escuro com identidade visual autoral
- 📱 Interface responsiva (funciona bem em desktop e mobile)
- 🗂️ Renderização de Markdown nas respostas, com destaque de código

## 🧭 Roadmap (próximos passos)

- [ ] Leitura de imagens via modelo de visão
- [ ] Ações por mensagem (copiar, editar, regenerar resposta)
- [ ] Pesquisa na internet integrada ao chat
- [ ] Autenticação e suporte a múltiplos usuários
- [ ] Agente com acesso a arquivos e navegador (execução de tarefas)

---

## 🛠️ Stack tecnológica

**Backend**
- Python + FastAPI
- SQLAlchemy + Alembic (SQLite, com suporte planejado a PostgreSQL)
- ChromaDB (busca vetorial para memória semântica)
- Ollama (execução local de modelos open source, ex: Qwen2.5)

**Frontend**
- React + TypeScript
- Tailwind CSS
- Vite

---

## 🏗️ Arquitetura

O backend segue uma **arquitetura em camadas**, inspirada em princípios de Clean Architecture:

<img width="584" height="200" alt="Captura de tela 2026-07-08 225413" src="https://github.com/user-attachments/assets/256c8973-0dc5-408f-b297-fc6bbdb30682" />

Essa separação permite, por exemplo, trocar o provedor de IA (hoje, Ollama) por outro serviço no futuro sem alterar as regras de negócio — o sistema depende de uma interface (`LLMProvider`), não de uma implementação específica.

A memória de longo prazo usa uma abordagem de **RAG (Retrieval-Augmented Generation)**: mensagens relevantes são transformadas em embeddings e guardadas no ChromaDB; antes de cada resposta, o sistema busca as memórias mais similares semanticamente à pergunta atual e as injeta no contexto do modelo.

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- [Python 3.11+](https://www.python.org/)
- [Node.js LTS](https://nodejs.org/)
- [Ollama](https://ollama.com/) instalado e rodando
- Um modelo baixado no Ollama, ex: `ollama pull qwen2.5:1.5b`

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

---

## 📄 Licença

Este projeto está sob a licença MIT — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 👤 Autor

Desenvolvido por **Danilo** como projeto de portfólio e aprendizado de arquitetura de software.
