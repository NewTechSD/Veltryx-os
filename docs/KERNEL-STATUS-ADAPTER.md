# Kernel Status Adapter

## Objetivo

O Kernel Status Adapter em `apps/admin` adapta o snapshot publico do `@veltryx/kernel` para o view model do dashboard.

Ele nao e mais responsavel por consolidar estado interno do Kernel. A responsabilidade de produzir `modulesLoaded`, status de descriptors, registry summary, warnings estruturados e status de bootstrap consolidado pertence ao Kernel.

## Fluxo

```text
apps/admin/app/page.tsx
      |
      v
getKernelStatusViewModel()
      |
      v
getKernelStatusSnapshot()
      |
      v
VeltryxKernel.status().snapshot()
      |
      v
KernelDashboard
```

## Responsabilidade atual

O Adapter pode:

- instanciar o Kernel server-side;
- executar `bootstrap`, `initialize` e `ready`;
- chamar `kernel.status({ environment, includeTechnicalDetails }).snapshot()`;
- criar fallback controlado se o lifecycle falhar antes de um snapshot publico estar disponivel;
- converter dados para apresentacao no Admin;
- fornecer o snapshot para `/health`, `/status` e `/diagnostics`.

O Adapter nao deve:

- chamar `kernel.modules().list()` para calcular cards;
- chamar `kernel.modules().resolveDependencies()` para consolidar status;
- inferir `modulesLoaded`;
- acessar internals do Kernel;
- inventar contadores de metadata;
- criar API externa, banco, auth ou regra de negocio.

## Estados explicitos

Falhas de lifecycle retornam `kernelStatus: error`, `bootStatus: failed` e metricas `unavailable` ou `notBootstrapped`.

Warnings e errors seguem `KernelDiagnosticEntry` e continuam serializaveis para renderizacao server-side.

## Testes

A cobertura valida:

- consumo do snapshot publico do Kernel;
- preservacao de estados `unavailable`, `notImplemented` e `notBootstrapped`;
- ausencia de inferencia de `modulesLoaded` quando o Kernel fornece o valor;
- fallback controlado em falha de bootstrap;
- renderizacao do dashboard com dados do adapter.

