# ADR-003: Ionic React como UI kit

**Data:** 2026-07-29
**Status:** aceito
**Substituído por:**

## Contexto

O app é mobile-first e será desenvolvido por um único dev, com timeline de semanas para um MVP de validação. A interface depende de padrões de interação mobile que são trabalhosos de construir do zero: bottom sheets, gestos de swipe, tabs, tratamento de safe-area em aparelhos com notch.

O frontend já estava definido como React, então a escolha se restringiu ao kit de componentes.

## Alternativas consideradas

- **Tailwind + shadcn/ui** — descartada porque, apesar de produzir um visual mais moderno, customizável e com bundle mais leve, exige montar os padrões de interação mobile na mão, o que é justamente o trabalho que um dev solo não tem folga para absorver nesta timeline.

## Decisão

Adotamos **Ionic React**, que é construído para apps mobile-web e PWA e entrega componentes touch-friendly, gestos e safe-area prontos de fábrica.

A razão principal é velocidade de entrega sob a restrição de dev solo com prazo de semanas: o Ionic troca customização visual por padrões de interação mobile que já funcionam.

## Tradeoffs

**O que ganhamos:**
- Padrões de interação mobile corretos sem esforço de implementação
- Menos superfície de bug em gestos, navegação e layout em aparelhos variados
- MVP mais rápido

**O que abrimos mão:**
- Visual característico do Ionic, menos diferenciado e mais lento de customizar a fundo
- Bundle um pouco maior, o que importa porque o público prioritário usa aparelhos de entrada

## Consequências

- Os componentes de UI seguem os padrões do Ionic; introduzir um segundo sistema de design ou de estilos em paralelo é o tipo de decisão que exige novo ADR.
- O peso do bundle passa a ser algo a monitorar, junto com o impacto dos ads em Core Web Vitals mobile.
- Se a identidade visual se tornar um diferencial de produto, esta decisão deve ser reavaliada — o custo de sair do Ionic cresce conforme mais telas dependem dos seus componentes.
