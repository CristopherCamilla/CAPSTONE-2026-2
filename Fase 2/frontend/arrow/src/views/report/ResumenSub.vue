<template>
  <div class="report-embed">
    <iframe
        title="proyecto_titulo"
        :src="'https://app.powerbi.com/view?r=eyJrIjoiYTBiZmJkOWQtZDVhNS00MzUwLWFhMDMtZTAxZjk4MDY0OTdhIiwidCI6ImM4ODA5YTc4LThiZmEtNDFiOS1hMmUxLTk4YTcxYWZjODk4NiIsImMiOjR9'"
        allowfullscreen
    />
  </div>
</template>

<style scoped>
/* Full-bleed: ocupa TODO el ancho del viewport, ignorando el max-width del padre */
.report-embed{
  width: 100dvw;                  /* mejor que 100vw: no cuenta la barra de scroll */
  margin-left: 50%;
  transform: translateX(-50%);    /* centra el bloque full-bleed */
  padding: clamp(8px, 2vw, 24px); /* padding responsivo */
  box-sizing: border-box;
}

/* El iframe ocupa el 100% del wrapper */
.report-embed iframe{
  display: block;
  width: 100%;
  height: calc(100svh - 160px);   /* 160px ≈ header/tabs; ajusta si necesitas */
  border: 0;
}

/* Alturas más cómodas en tablets y móviles */
@media (max-width: 1024px){
  .report-embed iframe{ height: calc(100svh - 140px); }
}
@media (max-width: 640px){
  .report-embed iframe{ height: 70svh; } /* menos alto para no tapar tabs */
}
</style>