import { exportGardenBackup, importGardenBackup } from '../db.js';

const MAX_BACKUP_SIZE = 5 * 1024 * 1024;

export function setupGardenBackup() {
  const exportButton = document.getElementById('export-garden-backup');
  const importButton = document.getElementById('import-garden-backup');
  const fileInput = document.getElementById('garden-backup-file');
  const status = document.getElementById('garden-backup-status');
  if (!exportButton || !importButton || !fileInput || !status) return;

  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    try {
      const backup = await exportGardenBackup();
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `floraura-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'Cópia de segurança exportada.';
    } catch (err) {
      console.error('Erro ao exportar os dados da FloraAura:', err);
      status.textContent = 'Não foi possível exportar os dados.';
    } finally {
      exportButton.disabled = false;
    }
  });

  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files ?? [];
    fileInput.value = '';
    if (!file) return;

    if (file.size > MAX_BACKUP_SIZE) {
      status.textContent = 'O ficheiro excede o limite de 5 MB.';
      return;
    }
    if (!window.confirm('A importação vai substituir as plantas, favoritos e catálogo pessoal atuais. Queres continuar?')) {
      status.textContent = 'Importação cancelada.';
      return;
    }

    importButton.disabled = true;
    try {
      const backup = JSON.parse(await file.text());
      await importGardenBackup(backup);
      status.textContent = 'Cópia restaurada. A atualizar a aplicação…';
      window.location.reload();
    } catch (err) {
      console.error('Erro ao importar os dados da FloraAura:', err);
      status.textContent = err instanceof SyntaxError
        ? 'O ficheiro não contém JSON válido.'
        : err.message || 'Não foi possível importar os dados.';
    } finally {
      importButton.disabled = false;
    }
  });
}
