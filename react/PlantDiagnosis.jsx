import { useEffect, useRef, useState } from 'react';
import './PlantDiagnosis.css';

const DEMO_DIAGNOSIS = {
  name: 'Monstera deliciosa',
  commonName: 'Monstera',
  health: 98,
  status: 'Saudável',
  advice: ['Rega quando os primeiros 2–3 cm de terra estiverem secos.']
};

/**
 * @typedef {Object} PlantDiagnosisResult
 * @property {string} name
 * @property {string} commonName
 * @property {number} health Estimativa percentual devolvida pelo serviço de análise.
 * @property {string} status
 * @property {string[]} advice
 */

/**
 * @param {{ analyzeImage?: (file: File) => Promise<PlantDiagnosisResult> }} props
 */
export default function PlantDiagnosis({ analyzeImage } = {}) {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFileChange(event) {
    const [selectedFile] = event.currentTarget.files ?? [];
    event.currentTarget.value = '';
    setError('');
    setDiagnosis(null);

    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setFile(null);
      setError('Escolhe um ficheiro de imagem válido.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError('A imagem deve ter no máximo 10 MB.');
      return;
    }

    setFile(selectedFile);
    void handleAnalyze(selectedFile);
  }

  async function handleAnalyze(selectedFile) {
    setError('');
    setDiagnosis(null);
    setIsAnalyzing(true);

    try {
      const diagnosisRequest = analyzeImage
        ? analyzeImage(selectedFile)
        : Promise.resolve(DEMO_DIAGNOSIS);
      const [diagnosisOutcome] = await Promise.allSettled([
        diagnosisRequest,
        new Promise((resolve) => window.setTimeout(resolve, 2000))
      ]);
      if (diagnosisOutcome.status === 'rejected') throw diagnosisOutcome.reason;
      const result = diagnosisOutcome.value;
      validateDiagnosis(result);
      setDiagnosis(result);
    } catch (analysisError) {
      console.error('Não foi possível analisar a planta:', analysisError);
      setError(analysisError instanceof Error
        ? analysisError.message
        : 'Não foi possível analisar a imagem. Tenta novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="plant-diagnosis" aria-labelledby="plant-diagnosis-title">
      <header className="plant-diagnosis__header">
        <p className="plant-diagnosis__eyebrow">FloraAura · diagnóstico</p>
        <h2 id="plant-diagnosis-title">Como está a tua planta?</h2>
        <p>Tira uma fotografia para ver o resultado e receber uma dica de cuidado.</p>
      </header>

      <input
        ref={fileInput}
        className="plant-diagnosis__file-input"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Tirar ou escolher uma fotografia da planta"
        onChange={handleFileChange}
      />

      {isAnalyzing && (
        <div className="plant-diagnosis__loading" role="status" aria-live="polite">
          <span className="plant-diagnosis__spinner" aria-hidden="true" />
          <span>A analisar a folha...</span>
        </div>
      )}

      {error && <p className="plant-diagnosis__error" role="alert">{error}</p>}

      {diagnosis && previewUrl && (
        <article className="plant-diagnosis__card" aria-live="polite">
          <img
            className="plant-diagnosis__photo"
            src={previewUrl}
            alt={`Fotografia da planta identificada como ${diagnosis.commonName}`}
          />
          <div className="plant-diagnosis__card-content">
            <p className="plant-diagnosis__eyebrow">Diagnóstico da planta</p>
            <div className="plant-diagnosis__card-heading">
              <h3>{diagnosis.commonName}</h3>
              <p className="plant-diagnosis__health">{diagnosis.health}% {diagnosis.status}</p>
            </div>
            <p className="plant-diagnosis__advice">
              <span aria-hidden="true">💧</span>
              {diagnosis.advice[0]}
            </p>
            {!analyzeImage && (
              <p className="plant-diagnosis__demo-note">
                Demonstração: o resultado é simulado e não analisa realmente a fotografia.
              </p>
            )}
          </div>
        </article>
      )}

      {!diagnosis && !isAnalyzing && !error && (
        <div className="plant-diagnosis__empty">
          {previewUrl ? (
            <img className="plant-diagnosis__preview" src={previewUrl} alt="Fotografia selecionada para analisar" />
          ) : (
            <div className="plant-diagnosis__placeholder" aria-hidden="true">
              <span>🌿</span>
              <p>A fotografia da tua planta aparecerá aqui</p>
            </div>
          )}
        </div>
      )}

      <button
        className="plant-diagnosis__button"
        type="button"
        disabled={isAnalyzing}
        onClick={() => fileInput.current?.click()}
      >
        {isAnalyzing ? 'A analisar...' : 'Tirar Foto/Analisar'}
      </button>
      <p className="plant-diagnosis__hint">Escolhe uma fotografia ou tira uma nova · até 10 MB</p>
    </section>
  );
}

/**
 * @param {PlantDiagnosisResult} result
 */
function validateDiagnosis(result) {
  if (
    !result ||
    typeof result.name !== 'string' ||
    typeof result.commonName !== 'string' ||
    typeof result.status !== 'string' ||
    !Number.isFinite(result.health) ||
    result.health < 0 ||
    result.health > 100 ||
    !Array.isArray(result.advice) ||
    result.advice.length === 0 ||
    result.advice.some((tip) => typeof tip !== 'string')
  ) {
    throw new Error('O serviço devolveu um diagnóstico num formato inválido.');
  }
}
