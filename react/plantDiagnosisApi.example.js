/**
 * Adaptador de exemplo para um endpoint da tua aplicação.
 * O servidor deve chamar PlantNet/um modelo de visão e devolver:
 * { name, commonName, health, status, advice: string[] }
 * Mantém as chaves dos fornecedores apenas no servidor.
 *
 * @param {File} file
 */
export async function analyzePlantWithBackend(file) {
  const body = new FormData();
  body.append('image', file);

  const response = await fetch('/api/plant-diagnosis', {
    method: 'POST',
    body
  });

  if (!response.ok) {
    throw new Error('O serviço de diagnóstico está indisponível. Tenta novamente mais tarde.');
  }

  return response.json();
}
