# Missão ENOPS — Água, Dignidade e Futuro

Scape room educativo em HTML, CSS e JavaScript puro (sem dependências,
sem build) desenvolvido para a ENOPS Engenharia. Os jogadores ajudam a
Família Oliveira passando por quatro salas: Diagnóstico, Planejamento,
Obra e Transformação.

## Rodar localmente

Como o jogo usa ES Modules, ele precisa ser servido por HTTP (não abrir o
`index.html` direto com `file://`). Qualquer servidor estático funciona:

```bash
python3 -m http.server 8080
# depois abra http://localhost:8080
```

## Hospedar

É um site 100% estático — basta publicar a pasta inteira em qualquer
serviço de hospedagem estática:

- **GitHub Pages**: Settings → Pages → Deploy from branch.
- **Netlify / Vercel**: arraste a pasta ou conecte o repositório.
- Qualquer servidor web comum (Apache, Nginx, etc.).

Nenhuma variável de ambiente, chave de API ou backend é necessária.

## Estrutura

```
index.html          telas do jogo (recepção, mapa das salas, salas 1-4, encerramento)
css/style.css        todo o visual e as animações
js/
  main.js             navegação entre telas e integração das salas
  state.js            progresso salvo em localStorage
  utils.js            modal de feedback, confete, arrastar-e-soltar
  room1.js .. room4.js lógica de cada sala
assets/img/           ilustrações (.webp, otimizadas para web)
```

## Progresso

O progresso de cada jogador fica salvo no `localStorage` do navegador
(chave `enops-scaperoom-progress-v1`), então o jogo pode ser fechado e
retomado depois. O botão "Reiniciar missão" no mapa das salas apaga esse
progresso.
