const DEFAULT_PHOTO_ID = 'photo-1525498128493-380d1990a112';
const PHOTO_BY_PLANT = {
  'monstera-deliciosa': 'photo-1525498128493-380d1990a112',
  'monstera deliciosa': 'photo-1525498128493-380d1990a112',
  'costela-de-adao': 'photo-1525498128493-380d1990a112',
  'chlorophytum-comosum': 'photo-1608161779298-f42256d2c58d',
  'chlorophytum comosum': 'photo-1608161779298-f42256d2c58d',
  'dracaena-trifasciata': 'photo-1567225557594-88d73e55f2cb',
  'dracaena trifasciata': 'photo-1567225557594-88d73e55f2cb',
  'espada-de-sao-jorge': 'photo-1567225557594-88d73e55f2cb',
  'epipremnum-aureum': 'photo-1757877598243-4fc57b5c2fae',
  'epipremnum aureum': 'photo-1757877598243-4fc57b5c2fae',
  jiboia: 'photo-1757877598243-4fc57b5c2fae',
  'spathiphyllum-wallisii': 'photo-1593691509543-c55fb32d8de5',
  'spathiphyllum wallisii': 'photo-1593691509543-c55fb32d8de5',
  'aloe-vera': 'photo-1509423350716-97f9360b4e09',
  'aloe vera': 'photo-1509423350716-97f9360b4e09',
  'ficus-elastica': 'photo-1501004318641-b39e6451bec6',
  'ficus elastica': 'photo-1501004318641-b39e6451bec6',
  'calathea-orbifolia': 'photo-1714507767656-2fb307e1b03d',
  'goeppertia orbifolia': 'photo-1714507767656-2fb307e1b03d',
  'zamioculcas-zamiifolia': 'photo-1787676841452-9e7d64fe781b',
  'zamioculcas zamiifolia': 'photo-1787676841452-9e7d64fe781b',
  'pilea-peperomioides': 'photo-1604762511431-6280a12cb835',
  'pilea peperomioides': 'photo-1604762511431-6280a12cb835',
  'peperomia-obtusifolia': 'photo-1695952816190-4a2193e40b8d',
  'peperomia obtusifolia': 'photo-1695952816190-4a2193e40b8d',
  'philodendron-hederaceum': 'photo-1600411833196-7c1f6b1a8b90',
  'philodendron hederaceum': 'photo-1600411833196-7c1f6b1a8b90',
  'maranta-leuconeura': 'photo-1668526450019-ae9924b3ac4b',
  'maranta leuconeura': 'photo-1668526450019-ae9924b3ac4b',
  'dypsis-lutescens': 'photo-1768692857070-e57811d9ccaa',
  'dypsis lutescens': 'photo-1768692857070-e57811d9ccaa',
  'beaucarnea-recurvata': 'photo-1509423350716-97f9360b4e09',
  'beaucarnea recurvata': 'photo-1509423350716-97f9360b4e09',
  'tradescantia-zebrina': 'photo-1747774504116-ed3319ce061d',
  'tradescantia zebrina': 'photo-1747774504116-ed3319ce061d',
  'ceropegia-woodii': 'photo-1613552280945-a2c31fb79415',
  'ceropegia woodii': 'photo-1613552280945-a2c31fb79415',
  'begonia-maculata': 'photo-1663647733214-3286521f6660',
  'begonia maculata': 'photo-1663647733214-3286521f6660',
  'crassula-ovata': 'photo-1616189597001-9046fce2594d',
  'crassula ovata': 'photo-1616189597001-9046fce2594d',
  'howea-forsteriana': 'photo-1768692857070-e57811d9ccaa',
  'howea forsteriana': 'photo-1768692857070-e57811d9ccaa'
};

function normalizePlantKey(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function getPlantPhotoUrl(plant) {
  const photoId = [plant?.catalogId, plant?.id, plant?.species, plant?.name]
    .map(normalizePlantKey)
    .map((key) => PHOTO_BY_PLANT[key])
    .find(Boolean) || DEFAULT_PHOTO_ID;

  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`;
}
