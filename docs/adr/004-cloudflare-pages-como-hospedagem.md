# ADR-004: Cloudflare Pages como hospedagem

**Data:** 2026-07-29
**Status:** aceito
**Substituído por:**

## Contexto

O modelo de negócio definido no discovery conceitual (6.6) é monetização exclusivamente por anúncios, mantendo o app gratuito e sem cadastro. Como não há backend nem banco de dados de usuário, o deploy é de um frontend estático — e o custo de hospedagem precisa ser zero.

A restrição decisiva é contratual, não técnica: o plano Hobby (gratuito) da Vercel **proíbe uso comercial, incluindo anúncios** como o Google AdSense, conforme suas fair use guidelines. Hospedar o app com ads ali violaria os termos.

## Alternativas consideradas

- **Vercel, plano Hobby** — descartada porque proíbe monetização por anúncios, que é o único modelo de receita do projeto.
- **Vercel, plano Pro** — descartada porque é paga, e não há receita para custear hospedagem antes da validação.

## Decisão

Adotamos **Cloudflare Pages** no plano gratuito, que permite uso comercial e oferece banda ilimitada. O deploy é automatizado com **GitHub Actions**: build e publicação a cada push, para eliminar deploy manual de um dev solo.

A razão principal é compatibilidade do plano gratuito com o modelo de receita por ads.

## Tradeoffs

**O que ganhamos:**
- Hospedagem gratuita compatível com anúncios, sem risco de violação de termos
- Banda ilimitada, relevante porque o app serve binários WASM (sql.js, Tesseract.js)
- Deploy automático com esforço mínimo de manutenção

**O que abrimos mão:**
- A conveniência do ecossistema de preview deploys e DX da Vercel, mais familiar em projetos React

## Consequências

- O papel do Cloudflare Pages é exclusivamente servir os arquivos estáticos do app (HTML/JS/CSS/WASM). Nenhum dado de usuário trafega para ele, e essa propriedade não pode ser quebrada por nenhuma feature futura sem revisar esta decisão e a isenção de responsabilidade do produto.
- Qualquer necessidade futura de código server-side deve ser avaliada dentro do que o Cloudflare oferece (Workers/Functions), não com uma migração de provedor.
- Se o modelo de monetização deixar de ser ads, a restrição que motivou esta decisão desaparece e a escolha pode ser reaberta.
