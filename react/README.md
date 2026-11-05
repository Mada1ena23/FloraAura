# Componente React de diagnóstico de plantas

Este componente é independente da aplicação FloraAura atual, que usa HTML e JavaScript sem React.

## Utilização

Num projeto React com `react` e `react-dom` instalados:

```jsx
import PlantDiagnosis from './PlantDiagnosis.jsx';

export default function App() {
  return <PlantDiagnosis />;
}
```

Sem propriedades, o componente simula a análise localmente: o botão «Tirar Foto/Analisar» abre a câmara ou o seletor de imagens; depois de escolher uma fotografia, mostra o estado «A analisar a folha...» durante pelo menos dois segundos e apresenta um cartão verde com a imagem, o resultado ilustrativo «Monstera · 98% Saudável» e uma dica de rega. A fotografia não é enviada nem analisada realmente.

## Ligar a um serviço real

O componente aceita uma função `analyzeImage(file)` que devolve uma promessa com o formato:

```js
{
  name: 'Nome científico',
  commonName: 'Nome comum',
  health: 82,
  status: 'Precisa de atenção',
  advice: ['Sugestão de cuidado']
}
```

Por exemplo, usa o adaptador para um endpoint no teu servidor:

```jsx
import PlantDiagnosis from './PlantDiagnosis.jsx';
import { analyzePlantWithBackend } from './plantDiagnosisApi.example.js';

<PlantDiagnosis analyzeImage={analyzePlantWithBackend} />
```

O endpoint `/api/plant-diagnosis` deve receber a imagem, chamar PlantNet para identificar a espécie e, se pretender estimar saúde visual, um serviço de visão separado. A percentagem de saúde não é fornecida pela identificação de espécie do PlantNet: deve ser calculada pelo serviço visual e apresentada como estimativa. Guarda sempre as chaves da API no servidor, nunca no componente ou no navegador.

## Sugestões com base na meteorologia local

O componente `WeatherPlantAdvice` pede a localização apenas quando a pessoa carrega no botão e consulta a previsão diária do [Open-Meteo](https://open-meteo.com/), que não exige chave de API:

```jsx
import WeatherPlantAdvice from './WeatherPlantAdvice.jsx';

export default function App() {
  return <WeatherPlantAdvice />;
}
```

O navegador tem de permitir o acesso à localização, e a aplicação deve estar num contexto seguro (HTTPS ou `localhost`). O componente mostra a temperatura atual e máxima, a probabilidade e quantidade de chuva, e apresenta uma sugestão geral para rega ou proteção solar. A previsão não substitui a verificação do substrato nem os cuidados específicos de cada planta.

## Cartão de alerta meteorológico

Para apresentar um alerta simples com base no estado do clima:

```jsx
import WeatherAlert from './WeatherAlert.jsx';

<WeatherAlert estatutoclima="sol" />
<WeatherAlert estatutoclima="chuva" />
```

O estado `sol` mostra o alerta laranja de rega à noite; `chuva` mostra o alerta azul a indicar que não é necessário regar. Para outros valores, o componente não apresenta um cartão.

## Missões e pontos do jardim

O componente `GardenMissions` apresenta o nível «Jardineiro Iniciante», duas missões selecionáveis e uma barra de progresso calculada sobre os 50 pontos disponíveis:

```jsx
import GardenMissions from './GardenMissions.jsx';

<GardenMissions />
```

Assinalar ou desmarcar uma missão atualiza imediatamente os pontos e a barra. O progresso fica no estado React do componente e reinicia quando o componente é desmontado ou a página é recarregada.
