# SPRINT-0002 Kernel Core Services

## Objetivo

Transformar o bootstrap inicial em um Kernel extensivel, preparado para suportar modulos, runtime e metadata conforme definido nas RFCs.

Nenhuma funcionalidade de negocio devera ser implementada.

---

# RFCs utilizadas

- RFC-0002 Platform Core
- RFC-0003 Module System
- RFC-0004 Service Registry
- RFC-0005 Metadata Engine
- RFC-0006 Runtime Engine

---

# IMP-0008 Module Manifest

## Objetivo

Implementar o contrato oficial do Module Manifest.

### Escopo

- Interface IModuleManifest
- Validacao estrutural
- Parser (estrutura, sem logica complexa)
- Versionamento
- Dependencias
- Compatibilidade

### Criterio de aceite

O Module Loader deve conseguir validar um manifesto.

---

# IMP-0009 Module Discovery

## Objetivo

Implementar descoberta automatica de modulos.

### Escopo

- Scanner de diretorios
- Registro de modulos
- Catalogo em memoria
- Deteccao de duplicidade

Sem carregamento ainda.

---

# IMP-0010 Dependency Resolver

## Objetivo

Implementar resolucao de dependencias entre modulos.

### Escopo

- Grafo de dependencias
- Ordenacao topologica
- Deteccao de ciclos
- Validacao de versoes

Sem executar modulos.

---

# IMP-0011 Event Bus

## Objetivo

Implementar o contrato do Event Bus.

### Escopo

- Registro de eventos
- Publicacao
- Assinatura
- Eventos sincronos
- Eventos em memoria

Sem filas externas.

---

# IMP-0012 Execution Context

## Objetivo

Implementar o Execution Context.

### Escopo

- RequestContext
- TenantContext
- UserContext
- CorrelationId
- RequestId
- Locale
- Timezone

Sem autenticacao.

---

# IMP-0013 Metadata Registry

## Objetivo

Evoluir o Metadata Registry.

### Escopo

- Registro
- Namespace
- Lookup
- Cache em memoria
- Versionamento

Sem persistencia.

---

# IMP-0014 Runtime Context

## Objetivo

Conectar Runtime ao Execution Context.

### Escopo

- RuntimeSession
- RuntimeState
- Context Injection
- Resolvers

Sem renderizacao.

---

# Criterios de aceite

Ao final da sprint:

- Module Manifest validado.
- Module Discovery funcional.
- Dependency Resolver funcional.
- Event Bus operacional.
- Execution Context disponivel.
- Metadata Registry evoluido.
- Runtime Context integrado.

Nenhuma regra de negocio.

Nenhuma API.

Nenhum banco.

Nenhum frontend.
