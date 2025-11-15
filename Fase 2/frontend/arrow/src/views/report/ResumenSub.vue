<template>
  <div class="report-embed">
    <iframe
        title="proyecto_titulo"
        src="https://app.powerbi.com/view?r=eyJrIjoiYTBiZmJkOWQtZDVhNS00MzUwLWFhMDMtZTAxZjk4MDY0OTdhIiwidCI6ImM4ODA5YTc4LThiZmEtNDFiOS1hMmUxLTk4YTcxYWZjODk4NiIsImMiOjR9"
        allowfullscreen
    />
  </div>
</template>

<style scoped>
.report-embed {
  width: 100dvw;
  margin-left: 50%;
  transform: translateX(-50%);
  padding: clamp(8px, 2vw, 24px);
  box-sizing: border-box;
}

/* iframe full width */
.report-embed iframe {
  display: block;
  width: 100%;
  max-width: 1400px;             /* opcional: límite en pantallas gigantes */
  margin-inline: auto;
  height: calc(100svh - 160px);  /* ajusta según alto del header */
  border: 0;
}

/* tablets */
@media (max-width: 1024px) {
  .report-embed iframe {
    height: calc(100svh - 140px);
  }
}

/* móviles: usa ratio tipo “video” */
@media (max-width: 640px) {
  .report-embed {
    padding-inline: 0;
  }
  .report-embed iframe {
    height: auto;
    aspect-ratio: 3 / 4;        /* más alto que ancho, estilo “panel” */
  }
}
</style>