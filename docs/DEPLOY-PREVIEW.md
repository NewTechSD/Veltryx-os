# Deploy Preview

## Objetivo

Este documento prepara o primeiro deploy preview online do `apps/admin` do Veltryx OS em Ubuntu com Node.js, pnpm, PM2, CyberPanel, OpenLiteSpeed, SSL e subdominio dedicado.

Rotas publicadas:

- `/`
- `/health`
- `/status`
- `/diagnostics`

Este fluxo nao cria API NestJS, banco, autenticacao, autorizacao, Runtime Renderer, Builder, Event Bus ou regra de negocio.

## Arquitetura do Preview

```text
Browser
  |
  v
https://os.veltryx.com.br
  |
  v
OpenLiteSpeed / CyberPanel
  |
  v
Reverse Proxy
  |
  v
127.0.0.1:3000
  |
  v
apps/admin Next.js production server
  |
  v
@veltryx/kernel public status snapshot
```

Subdominios sugeridos:

- `os.veltryx.com.br`
- `admin.veltryx.com.br`
- `preview.veltryx.com.br`

## Pre-requisitos do Servidor

- Ubuntu atualizado.
- Node.js LTS instalado.
- pnpm instalado.
- PM2 instalado globalmente.
- CyberPanel/OpenLiteSpeed instalado.
- DNS do subdominio apontando para o servidor.
- Repositorio clonado no servidor.

Exemplo:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
npm install -g pm2
```

## Variaveis de Ambiente

Use apenas variaveis publicas e seguras no preview:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Veltryx OS
NEXT_PUBLIC_APP_ENV=preview
NEXT_PUBLIC_APP_VERSION=0.1.0
```

Nao incluir tokens, senhas, secrets, chaves privadas, credenciais de banco ou qualquer dado sensivel.

## Build Production

Na raiz do repositorio:

```bash
pnpm install
pnpm build
pnpm --filter @veltryx/admin build
```

O Admin usa `next build` e `next start`. Esta task nao habilita `output: "standalone"`; o fluxo esperado e executar o app no workspace com pnpm e dependencias instaladas no servidor.

## Start Manual

Para validar sem PM2:

```bash
pnpm --filter @veltryx/admin start -- -p 3000
```

Validar em outro terminal:

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/status
curl -i http://127.0.0.1:3000/diagnostics
```

## PM2

Arquivo criado:

```text
apps/admin/ecosystem.config.cjs
```

A configuracao executa o Next.js production server em `127.0.0.1:3000` via `next start -p 3000`.

Comandos:

```bash
cd /home/veltryx/Veltryx-so/apps/admin
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs veltryx-admin
pm2 restart veltryx-admin
pm2 save
```

Para iniciar automaticamente apos reboot:

```bash
pm2 startup
pm2 save
```

Logs esperados:

```text
apps/admin/logs/pm2-out.log
apps/admin/logs/pm2-error.log
```

## CyberPanel / OpenLiteSpeed Reverse Proxy

1. Criar o subdominio no CyberPanel, por exemplo `os.veltryx.com.br`.
2. Confirmar que o DNS do subdominio aponta para o servidor.
3. Criar ou editar o Virtual Host do subdominio.
4. Configurar proxy/rewrite para encaminhar trafego para:

```text
http://127.0.0.1:3000
```

Fluxo esperado:

```text
https://os.veltryx.com.br -> OpenLiteSpeed -> 127.0.0.1:3000 -> apps/admin
```

Quando usar rewrite rules do OpenLiteSpeed, configurar regra equivalente a proxy pass para o backend local. A interface do CyberPanel pode variar por versao; manter o backend restrito a `127.0.0.1`.

Reiniciar OpenLiteSpeed apos alterar o virtual host:

```bash
systemctl restart lsws
```

ou pelo painel do CyberPanel em `LiteSpeed Status` / `Restart LiteSpeed`.

## SSL

No CyberPanel:

1. Acessar o site/subdominio criado.
2. Emitir SSL via Let's Encrypt.
3. Confirmar que HTTPS esta ativo.
4. Validar redirecionamento HTTP -> HTTPS se configurado.
5. Abrir `https://os.veltryx.com.br/health` no navegador ou via `curl`.

## Validacao de Rotas

```bash
curl -i https://os.veltryx.com.br/
curl -i https://os.veltryx.com.br/health
curl -i https://os.veltryx.com.br/status
curl -i https://os.veltryx.com.br/diagnostics
```

Resultados esperados:

- `/`: dashboard inicial do Veltryx OS.
- `/health`: JSON seguro com `status`, `kernel` e `timestamp`.
- `/status`: status publico do Kernel.
- `/diagnostics`: diagnostico tecnico controlado.

## Checklist Pos-Deploy

- [ ] Dominio/subdominio resolve corretamente.
- [ ] SSL ativo.
- [ ] `/` abre o dashboard.
- [ ] `/health` retorna JSON valido.
- [ ] `/status` renderiza corretamente.
- [ ] `/diagnostics` renderiza corretamente.
- [ ] PM2 mantem `veltryx-admin` online.
- [ ] Logs nao exibem erros criticos.
- [ ] Stack trace nao aparece em producao.
- [ ] Variaveis sensiveis nao aparecem no frontend.
- [ ] Build production foi usado.
- [ ] Nenhuma rota depende de banco, auth ou API externa.
- [ ] OpenLiteSpeed encaminha para `127.0.0.1:3000`.

## Troubleshooting

Verificar processo:

```bash
pm2 status
pm2 logs veltryx-admin
```

Verificar porta local:

```bash
curl -i http://127.0.0.1:3000/health
```

Reiniciar app:

```bash
pm2 restart veltryx-admin
```

Reiniciar OpenLiteSpeed:

```bash
systemctl restart lsws
```

## Limites

Este deploy preview nao inclui Docker production, Kubernetes, CI/CD completo, Prometheus, OpenTelemetry, tracing distribuido, logs estruturados avancados, alertas, webhooks, banco, Auth, API NestJS, Runtime Renderer, Builder ou modulos de negocio.
