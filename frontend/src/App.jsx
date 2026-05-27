import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { articleCase as fallbackArticleCase } from './data/articleCase'

function App() {
  const [caseData, setCaseData] = useState(fallbackArticleCase)
  const [source, setSource] = useState('local')

  useEffect(() => {
    const controller = new AbortController()
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

    fetch(`${apiBaseUrl}/api/article-case`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('API unavailable')
        }
        return response.json()
      })
      .then((data) => {
        setCaseData(data)
        setSource('api')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setSource('local')
        }
      })

    return () => controller.abort()
  }, [])

  const ranking = useMemo(
    () => [...caseData.published_results].sort((a, b) => a.rank - b.rank),
    [caseData],
  )

  const dimensions = useMemo(() => {
    return caseData.criteria.reduce((groups, criterion) => {
      const current = groups.get(criterion.dimension) ?? {
        name: criterion.dimension,
        count: 0,
        weight: 0,
      }
      current.count += 1
      current.weight += criterion.weight
      groups.set(criterion.dimension, current)
      return groups
    }, new Map())
  }, [caseData])

  const topCriteria = useMemo(
    () =>
      [...caseData.criteria]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6),
    [caseData],
  )

  const maxQ = Math.max(...ranking.map((item) => item.q), 1)
  const bestAlternative = caseData.alternatives.find(
    (alternative) => alternative.code === ranking[0]?.alternative,
  )

  function exportCsv() {
    const header = ['rank', 'alternative', 'S', 'R', 'Q']
    const rows = ranking.map((item) => [
      item.rank,
      item.alternative,
      item.s.toFixed(3),
      item.r.toFixed(3),
      item.q.toFixed(3),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'vikor-ranking.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function formatLifn(values) {
    return `(${values.map((value) => value.toFixed(3)).join(', ')})`
  }

  return (
    <main className="app-shell">
      <section className="overview">
        <div className="overview-copy">
          <span className="eyebrow">VIKOR decision support</span>
          <h1>{caseData.article.title}</h1>
          <p>
            MVP baseado no artigo de {caseData.article.authors}. O ranking abaixo
            replica os valores publicados para comparar os quatro layouts X1-X4.
          </p>
          <div className="source-row">
            <span className={`status-dot ${source}`}></span>
            <span>Dados carregados via {source === 'api' ? 'FastAPI' : 'fallback local'}</span>
            <a href={caseData.article.doi} target="_blank" rel="noreferrer">
              DOI do artigo
            </a>
          </div>
        </div>
        <button type="button" className="export-button" onClick={exportCsv}>
          <span aria-hidden="true">CSV</span>
          Exportar ranking
        </button>
      </section>

      <section className="metric-grid" aria-label="Resumo do caso">
        <article>
          <span>Melhor alternativa</span>
          <strong>{ranking[0]?.alternative}</strong>
          <p>{bestAlternative?.name}</p>
        </article>
        <article>
          <span>Criterios</span>
          <strong>{caseData.criteria.length}</strong>
          <p>Distribuidos em {dimensions.size} dimensoes.</p>
        </article>
        <article>
          <span>Parametro VIKOR</span>
          <strong>v = {caseData.vikor.v}</strong>
          <p>Equilibrio entre utilidade do grupo e arrependimento individual.</p>
        </article>
        <article>
          <span>Metodo base</span>
          <strong>DEMATEL-ANP</strong>
          <p>Pesos extraidos do estudo e usados como referencia inicial.</p>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="panel ranking-panel">
          <div className="panel-heading">
            <div>
              <h2>Ranking publicado</h2>
              <p>Menor Q indica a solucao de compromisso mais forte.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Alternativa</th>
                  <th>S</th>
                  <th>R</th>
                  <th>Q</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => (
                  <tr key={item.alternative}>
                    <td>{item.rank}</td>
                    <td>
                      <strong>{item.alternative}</strong>
                    </td>
                    <td>{item.s.toFixed(3)}</td>
                    <td>{item.r.toFixed(3)}</td>
                    <td>{item.q.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Forca relativa</h2>
              <p>Escala invertida de Q para leitura visual rapida.</p>
            </div>
          </div>
          <div className="bar-chart" aria-label="Grafico de barras do ranking">
            {ranking.map((item) => {
              const quality = Math.max(6, (1 - item.q / maxQ) * 100)
              return (
                <div className="bar-row" key={item.alternative}>
                  <span>{item.alternative}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill rank-${item.rank}`}
                      style={{ width: `${quality}%` }}
                    ></div>
                  </div>
                  <strong>{item.q.toFixed(3)}</strong>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel weights-panel">
          <div className="panel-heading">
            <div>
              <h2>Pesos por dimensao</h2>
              <p>Contribuicao agregada dos criterios do artigo.</p>
            </div>
          </div>
          <div className="dimension-list">
            {[...dimensions.values()].map((dimension) => (
              <div className="dimension-row" key={dimension.name}>
                <div>
                  <strong>{dimension.name}</strong>
                  <span>{dimension.count} criterios</span>
                </div>
                <meter min="0" max="1" value={dimension.weight}></meter>
                <b>{dimension.weight.toFixed(3)}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="panel criteria-panel">
          <div className="panel-heading">
            <div>
              <h2>Criterios dominantes</h2>
              <p>Maiores pesos globais usados no caso.</p>
            </div>
          </div>
          <ol className="criteria-list">
            {topCriteria.map((criterion) => (
              <li key={criterion.code}>
                <span>{criterion.code}</span>
                <div>
                  <strong>{criterion.name}</strong>
                  <small>{criterion.dimension}</small>
                </div>
                <b>{criterion.weight.toFixed(3)}</b>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel matrix-panel">
        <div className="panel-heading">
          <div>
            <h2>Matriz agregada do artigo</h2>
            <p>Cada celula usa o formato LIFN: termo linguistico, pertinencia e nao pertinencia.</p>
          </div>
        </div>
        <div className="table-wrap matrix-wrap">
          <table>
            <thead>
              <tr>
                <th>Criterio</th>
                {caseData.alternatives.map((alternative) => (
                  <th key={alternative.code}>{alternative.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseData.criteria.map((criterion) => (
                <tr key={criterion.code}>
                  <td>
                    <strong>{criterion.code}</strong>
                    <span>{criterion.name}</span>
                  </td>
                  {caseData.alternatives.map((alternative) => (
                    <td key={alternative.code}>
                      {formatLifn(caseData.assessments[criterion.code][alternative.code])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default App
