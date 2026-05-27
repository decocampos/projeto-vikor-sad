# Projeto VIKOR SAD (ESBOÇO/ETAPA INICIAL/AMBIENTAÇÃO)

Aplicacao Web para replicar o estudo de caso do artigo "Multi-attribute evaluation method of nuclear island plant overall layout schemes based on linguistic intuitionistic fuzzy VIKOR".

O objetivo inicial é entregar um MVP para a Fase 2 da disciplina: uma interface simples para visualizar alternativas, criterios, pesos e ranking VIKOR do artigo, com backend FastAPI preparado para calculos VIKOR numericos.

## Artigo base

- Titulo: Multi-attribute evaluation method of nuclear island plant overall layout schemes based on linguistic intuitionistic fuzzy VIKOR
- Autores: Dong Hao, JinCheng Su, YanFang Fan
- Periodico: Annals of Nuclear Energy 227 (2026) 111950
- DOI: https://doi.org/10.1016/j.anucene.2025.111950

## Stack

- Frontend: React
- Backend: FastAPI
- Versionamento: Git + GitHub
- Deploy: etapa seguinte

## Como rodar

### Backend

Requer Python 3.11 ou superior.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API local:

- Health check: http://localhost:8000/health
- Swagger/OpenAPI: http://localhost:8000/docs
- Caso do artigo: http://localhost:8000/api/article-case

### Frontend

Requer Node.js 20 ou superior.

```powershell
cd frontend
npm install
npm.cmd run dev
```

Aplicacao local:

- http://localhost:5173

Se o backend estiver rodando, o frontend usa a API. Se nao estiver, ele usa um fallback local com os mesmos dados do MVP.

## Funcionalidades do MVP

- Mostra o ranking publicado no artigo: X4 > X1 > X3 > X2.
- Exibe valores S, R e Q do metodo VIKOR.
- Lista criterios, dimensoes e pesos DEMATEL-ANP.
- Mostra a matriz agregada LIFN do artigo.
- Exporta o ranking em CSV.
- Disponibiliza endpoint generico `POST /api/vikor` para calculo VIKOR numerico.

## Exemplo de payload para POST /api/vikor

```json
{
  "alternatives": ["A1", "A2", "A3"],
  "criteria": [
    { "code": "cost", "weight": 0.4, "type": "cost" },
    { "code": "quality", "weight": 0.6, "type": "benefit" }
  ],
  "scores": {
    "A1": { "cost": 100, "quality": 70 },
    "A2": { "cost": 120, "quality": 90 },
    "A3": { "cost": 80, "quality": 75 }
  },
  "v": 0.5
}
```
