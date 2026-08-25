# Module Manifest

## Objetivo

Documentar o contrato oficial inicial do Module Manifest implementado na TASK-0201 / IMP-0008.

O Module Manifest permite que Module Discovery e Module Loader validem a estrutura de um modulo antes de qualquer carregamento ou execucao.

## Contrato

A interface publica e `IModuleManifest`, exportada por `@veltryx/contracts`.

Campos obrigatorios:

- `id`: identificador unico e estavel do modulo.
- `name`: nome legivel do modulo.
- `version`: versao publicada do modulo.
- `dependencies`: dependencias declaradas do modulo.
- `compatibility`: compatibilidade declarada com kernel, runtime e metadata.
- `permissions`: permissoes declaradas ou requeridas.
- `routes`: rotas ou superficies conceituais declaradas.
- `metadata`: referencias de metadata declarada.
- `events`: eventos declarados.
- `providers`: services ou capacidades publicados por contrato.
- `components`: componentes declarados por contrato.
- `migrations`: migracoes declaradas.
- `seeds`: seeds declaradas.

Campos opcionais:

- `description`.
- `author`.

## Validacao estrutural

O parser valida somente estrutura:

- manifesto deve ser objeto em memoria.
- `id`, `name` e `version` devem ser strings nao vazias.
- campos de colecao devem ser arrays; entradas de colecoes declarativas devem ser strings nao vazias.
- `compatibility` deve ser objeto.
- entradas de `dependencies` devem possuir `id` string nao vazia.
- `dependency.version`, quando informado, deve ser string nao vazia.
- `dependency.optional`, quando informado, deve ser boolean.

## Representacoes

- ModuleVersion: representacao estrutural de versao publicada, sem resolucao de compatibilidade.
- ModuleDependency: dependencia declarada por id, faixa de versao opcional e obrigatoriedade opcional.
- KernelModuleManifestParser: recebe objetos em memoria, valida e retorna o manifesto de dominio.
- KernelModuleManifestValidator: executa validacao estrutural do manifesto.
- KernelModuleDiscoveryValidator: reutiliza a validacao estrutural do manifesto e valida duplicidade de id no processo de descoberta.

## Fora do escopo

- Carregamento de modulos.
- Execucao de codigo de modulo.
- Regras de negocio.
- API.
- Persistencia.
- Autenticacao.
- Validacao semantica complexa de versoes.



