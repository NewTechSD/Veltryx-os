# Dependency Injection Container

O container de DI é o resolvedor estrutural do Kernel. Ele registra definições explícitas de provider, resolve dependências por tokens oficiais e controla os lifecycles `singleton` e `transient`. O Service Registry permanece o catálogo público de serviços; ele não cria instâncias.

```text
Provider Definition
        |
        v
DI Container -> Provider Resolver -> Resolved Instance
                                      |
                                      v
                               Service Registry
```

## Contrato

`kernel.container()` expõe registro, lookup, resolução e snapshot. Providers podem ser `value`, `factory` ou `class`; suas dependências são arrays explícitos de tokens. Não há decorators, `reflect-metadata`, autowiring ou resolução de scopes avançados.

Singletons são criados uma vez e cacheados. Transients são recriados a cada resolução. Duplicatas falham por padrão; replacement exige `{ replace: true }`. O grafo de resolução detecta ciclos simples e compostos e retorna um erro controlado com o caminho de tokens.

O snapshot contém status, contadores, tokens, kind, lifecycle, dependências e diagnostics. Instâncias, factories, classes, closures, stacks e secrets não são expostos. Arrays e objetos públicos são congelados.

## Limitações e próximos passos

Scopes `request`, `tenant`, `workspace` e `scoped` continuam apenas no vocabulário do Service Registry. Factories complexas, disposal e graph visualization ficam para evoluções posteriores. O próximo passo é o Runtime Context e seu snapshot completo (TASK-0310).
