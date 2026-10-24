# Deploy do preview tecnico

Baseline inspecionada: `936ddd4`. Referencia executavel: [ecosystem.config.cjs](../apps/admin/ecosystem.config.cjs). Este guia nao registra deploy realizado nem aprova producao com dados reais.

## Configuracao efetivamente versionada

| Item       | Valor no arquivo PM2                                               |
| ---------- | ------------------------------------------------------------------ |
| Processo   | `veltryx-admin`                                                    |
| cwd        | `/opt/projects/Veltryx-os/apps/admin`                              |
| Executavel | `/usr/bin/pnpm`                                                    |
| Argumentos | `start` (script `next start`)                                      |
| Porta      | `PORT=3100`                                                        |
| Instancias | 1, fork                                                            |
| Reinicio   | autorestart; max_memory_restart=512M                               |
| Logs       | `apps/admin/logs/pm2-out.log` e `pm2-error.log` sob cwd versionado |

O arquivo **nao fixa hostname/bind**. Nao afirmar que o PM2 atual restringe o servidor a loopback. Conferir com `ss -ltnp` e restringir acesso ao backend via configuracao de bind ou firewall antes de expor pela borda. Alterar o PM2 e trabalho de configuracao separado desta revisao documental.

## Pre-requisitos

Node e pnpm disponiveis, dependencias/build revisados, PM2 e proxy configurados pelo operador, DNS/SSL validos quando houver dominio. `packageManager` fixa pnpm 9.15.0; Node nao e fixado por engines no baseline. Registrar versoes usadas e confirmar o caminho real do executavel pnpm no servidor. Nao supor `/usr/bin/pnpm` sem verificar.

O path de instalacao deve corresponder ao `cwd` e aos caminhos de logs do arquivo PM2. Nao usar o antigo exemplo `Veltryx-so`.

## Preparacao e checks

Na raiz do checkout correspondente ao commit escolhido:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
mkdir -p apps/admin/logs
```

Registrar commit, versoes e resultados. `.env.example` contem apenas configuracao de preview. Secrets nunca vao para `NEXT_PUBLIC_*`. Nenhum banco, login ou delivery adapter e habilitado por estas variaveis.

## Validacao manual com bind explicito

Para testar o build localmente com bind conhecido:

```bash
pnpm --filter @veltryx/admin exec next start -H 127.0.0.1 -p 3100
```

Esse comando e uma alternativa manual; **nao e o comando que o arquivo PM2 versionado executa**. Encerrar o processo manual antes de iniciar PM2 na mesma porta.

```bash
curl -i http://127.0.0.1:3100/health
curl -i http://127.0.0.1:3100/api/v1/health
curl -i http://127.0.0.1:3100/api/v1/status
```

## PM2

No host em que o repositorio esteja em `/opt/projects/Veltryx-os` e o executavel esteja correto:

```bash
cd /opt/projects/Veltryx-os/apps/admin
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs veltryx-admin --lines 100
ss -ltnp
```

Para configuracao ja existente, conferir se o processo aponta para o mesmo cwd e porta antes de reiniciar. Nao iniciar segundo processo na mesma porta. Salvar estado/startup somente apos validacao pelo operador; este guia nao executa mudancas no host.

## Proxy e HTTPS

Configurar o vhost autorizado do CyberPanel/OpenLiteSpeed para encaminhar ao backend `http://127.0.0.1:3100`. O dominio nao e fixado pelo repositorio: usar o dominio real do ambiente. Emitir/validar certificado, conferir HTTPS e redirecionamento se previsto. Nao usar porta 3000 por copiar instrucoes antigas.

Depois da mudanca, validar URL externa e backend; garantir que a porta de backend nao esteja aberta indevidamente. Recarregar o proxy pelo procedimento operacional do servidor, considerando outros sites hospedados.

## Smoke tests

| Rota                               | Esperado                                             |
| ---------------------------------- | ---------------------------------------------------- |
| `/`                                | Dashboard do preview                                 |
| `/health`                          | JSON de liveness                                     |
| `/status`, `/diagnostics`          | Superficies estruturais sanitizadas                  |
| `/modules`                         | Resumo do Module System                              |
| `/api/v1/health`, `/api/v1/status` | Envelope seguro, no-store e nosniff                  |
| Demais rotas API v1                | Escopo definido em [API Reference](API-ENDPOINTS.md) |

A rota dinamica `/runtime/[sourceType]/[namespace]/[sourceId]` depende de uma referencia demonstrativa valida e dos guardrails do adapter. Nao e uma API de publicacao de sites.

## Checklist operacional

- [ ] Commit, Node/pnpm e checks registrados.
- [ ] Cwd, executavel, logs e PORT=3100 conferidos.
- [ ] Bind/rede inspecionados; acesso direto ao backend restrito.
- [ ] Processo unico, proxy e HTTPS funcionando.
- [ ] Smoke tests locais e externos aprovados.
- [ ] Erros nao expoem stack, secrets ou env bruto.
- [ ] Versao anterior e procedimento de retorno identificados.
- [ ] Nenhum dado real de cliente e servido pelo preview sem auth/isolamento.

## Retorno e limites

Para regressao do preview sem banco, voltar ao commit/artefato anterior conhecido, reinstalar pelo lockfile quando necessario, rebuildar e reiniciar pelo procedimento do operador; repetir smoke tests. Isso nao define rollback de dados futuros.

Persistencia atual e em memoria; restart perde dados desse provider. Liveness nao prova readiness nem login. Nao ha deploy de Runtime Adapter, WordPress, workflow, banco ou negocio neste procedimento. A proposta de release operacional esta na [RFC-0018](../rfc/RFC-0018-deployment.md).
