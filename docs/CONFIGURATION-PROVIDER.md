# Configuration Provider

## Objetivo

O Configuration Provider é a fonte oficial, framework-agnostic e somente de leitura para configuração estrutural do Veltryx OS. Ele carrega fontes conhecidas, valida valores, aplica precedência e oferece um snapshot público seguro por `kernel.configuration().snapshot()`.

## Fluxo e precedência

```text
Defaults
   |
Environment
   |
In-Memory Overrides
   |
Configuration Resolver
   |
Configuration Provider
   |
Configuration Snapshot
```

As fontes são processadas na ordem `defaults → environment → in-memory`; portanto, a precedência efetiva é `in-memory > environment > defaults`. Um valor inválido é rejeitado e não substitui o último valor válido.

```text
Internal Configuration
   |
kernel.configuration().snapshot()
   |
Public Read Model
   |
Kernel / Admin / Diagnostics / Runtime Futuro
```

## Fontes

- `DefaultConfigurationSource`: defaults estruturais seguros.
- `EnvironmentConfigurationSource`: lê somente a allowlist documentada.
- `InMemoryConfigurationSource`: recebe overrides defensivamente copiados no bootstrap e em testes.

Não existem fontes remotas, persistência, banco ou configuração por tenant.

## Chaves oficiais e defaults

| Chave                       | Default       |
| --------------------------- | ------------- |
| `app.name`                  | `Veltryx OS`  |
| `app.version`               | `0.1.0`       |
| `environment`               | `development` |
| `runtime.mode`              | `preview`     |
| `debug.enabled`             | `false`       |
| `kernel.status.enabled`     | `true`        |
| `events.structural.enabled` | `true`        |
| `modules.snapshot.enabled`  | `true`        |

Ambientes válidos: `development`, `test`, `preview` e `production`. Runtime modes válidos: `development`, `preview`, `production` e `test`.

## Environment allowlist

Somente `NODE_ENV`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_VERSION`, `VELTRYX_ENV`, `VELTRYX_RUNTIME_MODE` e `VELTRYX_DEBUG` são consideradas. `VELTRYX_ENV` precede `NEXT_PUBLIC_APP_ENV`, que precede `NODE_ENV` dentro da fonte de ambiente.

## Snapshot público

O snapshot contém `generatedAt`, `environment`, `appName`, `appVersion`, `runtimeMode`, `debugEnabled`, nomes/tipos/chaves carregadas das fontes, warnings, errors e diagnostics. O objeto e seus arrays são congelados e recriados defensivamente.

## Segurança

O provider nunca expõe `process.env`, valores de sources, secrets, tokens, senhas ou stacks. Chaves sensíveis e desconhecidas são rejeitadas. O snapshot de sources contém somente nomes de chaves oficiais carregadas, nunca seus valores.

## Warnings e errors

Warnings representam degradações não impeditivas. Errors representam fonte com falha, chave desconhecida/sensível, tipo inválido ou ausência obrigatória. Erros são normalizados sem stack trace. Como defaults válidos são carregados primeiro, um override opcional inválido não quebra o Kernel e o valor válido anterior permanece.

## Integração com Kernel Status

O Kernel Status Snapshot consome `environment`, `appName`, `appVersion` e `runtimeMode` do Configuration Provider. O snapshot completo de configuração não é duplicado no status. O override legado explícito de `kernel.status({ environment })` permanece disponível para compatibilidade.

O Kernel usa `app.version` ao registrar descriptors de serviços estruturais, sem tornar o Service Registry dependente do Configuration Provider para funcionar isoladamente.

## Limitações conhecidas

Não há edição dinâmica, API, painel, persistência, remote config, feature flags avançadas, secrets manager, escopo por tenant/usuário ou configurações de negócio. A leitura não inicia Runtime, Module System ou outros lifecycles.

## Próximos passos

Consumidores futuros podem adotar as chaves públicas por contratos aprovados. Novas chaves estruturais ou novas fontes exigem governança compatível; secrets devem permanecer em uma fronteira específica futura e nunca neste snapshot.
