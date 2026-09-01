# Runtime Context

O Runtime Context é a representação operacional, pública e imutável do Runtime. Ele consolida read models estruturais sem acessar registries, providers ou módulos internos.

```text
Configuration Snapshot
Service Registry Snapshot
DI Snapshot
Module System Snapshot
Execution Context Snapshot opcional
        |
        v
Runtime Context Factory
        |
        v
Runtime Context
```

## Runtime Context e Execution Context

O Execution Context descreve quem, onde e sob qual execução uma operação ocorre. O Runtime Context descreve como a plataforma está configurada e disponível. O resumo opcional de execução contém apenas request/correlation IDs e indicadores de disponibilidade de tenant, workspace e user. Roles, permissions, metadata e dados de usuário não são copiados.

## Composição

O contexto informa `runtimeId`, lifecycle, environment, runtime mode, timestamps, configuração pública, summary do Service Registry, summary de DI, summary do Module System, warnings, errors e diagnostics.

O lifecycle estrutural aceita `idle`, `bootstrapping`, `ready`, `warning`, `error` e `stopped`. Transições inválidas falham de forma controlada. Não há shutdown avançado ou disposal de recursos externos.

## Segurança e imutabilidade

A factory recebe somente snapshots públicos. Ela não resolve providers, não executa factories, não carrega módulos e não inicia serviços. Objetos aninhados e arrays são congelados. O validator rejeita ids, enums e contadores inválidos e detecta funções em estruturas públicas. Secrets, `process.env`, stacks, instâncias e authorization data não fazem parte do contrato.

## Limitações

O contexto ainda não possui Metadata Engine, Component Registry, renderer ou UI Composition. Eventos específicos de Runtime continuam adiados para evitar ciclo estrutural com o Event Bus. O próximo passo recomendado é a evolução do Metadata Engine.

## Metadata Summary

O Runtime Context recebe um resumo leve do Metadata Engine durante o bootstrap estrutural. O campo `metadata` informa status, namespaces registrados, resources registrados, entities registradas e pages registradas.

O Runtime nao resolve, executa, renderiza ou duplica metadata nesta etapa.
