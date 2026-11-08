# OS-SEC-DATA-0001 — Gap Analysis

**Base:** `e34f582`  
**Resultado:** `APPROVED_WITH_NOTES`  
**Escopo:** lacunas comprovadas por código e documentação; nenhuma correção de produção nesta task.

## 1. Matriz de lacunas

| ID   | Severidade | Lacuna                                                                       | Evidência                                                                     | Impacto                                                               |
| ---- | ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P-01 | Crítica    | Não existe provider durável                                                  | `InMemoryPersistenceProvider`; `docs/PERSISTENCE-LAYER.md`                    | Dados são perdidos no reinício e não suportam operação multi-processo |
| P-02 | Alta       | Não há transações, Unit of Work ou locking                                   | `IRepository` não define transação; RFC-0015 exclui a capacidade              | Operações compostas podem ficar parcialmente aplicadas                |
| P-03 | Alta       | Não há migrations/schema ownership                                           | RFC-0015 e docs excluem SQL/schema/migrations                                 | Deploy e evolução de dados não são reproduzíveis                      |
| P-04 | Crítica    | Metadata de tenant/workspace é passiva                                       | `PersistenceRecordMetadata` e `DATA-ACCESS-CONTRACTS.md`                      | Não impede leitura ou escrita cross-tenant                            |
| P-05 | Alta       | Backup, restore e disaster recovery inexistentes                             | Não há adapter/serviço de backup; retention é in-memory                       | Não há recuperação operacional comprovável                            |
| S-01 | Crítica    | Não há autenticação real                                                     | `AuthBridge`; RFC-0011                                                        | Não é possível provar a identidade de um usuário                      |
| S-02 | Crítica    | Não há sessão, cookies ou recuperação de acesso                              | RFC-0011 e `AUTH-BRIDGE.md`                                                   | Admin não pode ser protegido por login                                |
| S-03 | Crítica    | Não há autorização/RBAC server-side                                          | permissions são campos estruturais vazios; sem Permission Engine              | Roles e tenant informados não conferem acesso                         |
| S-04 | Crítica    | Tenant informado pelo cliente não é prova de escopo                          | `ApiRequestContext`/`ExecutionContextInput` aceitam hints; não há enforcement | Risco de acesso entre tenants quando houver dados reais               |
| S-05 | Alta       | Não há política por recurso, ação e workspace                                | contratos atuais não definem evaluator/policy store                           | Não há autorização granular                                           |
| S-06 | Alta       | Não há auditoria de eventos sensíveis                                        | há diagnósticos/snapshots estruturais, mas não audit trail de authz           | Incidentes não têm rastreabilidade suficiente                         |
| S-07 | Alta       | Não há CSRF, anti-enumeração ou rate limiting                                | nenhum componente correspondente no Admin/Kernel                              | Login futuro ficaria exposto a abuso sem controles adicionais         |
| S-08 | Média      | Contratos `auth.ts` e `context.ts` possuem conceitos sobrepostos de contexto | tipos `TenantContext`/`WorkspaceContext` têm formas diferentes                | Pode gerar mapeamentos inseguros na integração de transporte          |

## 2. Mitigações já existentes

- Validação e imutabilidade dos registros in-memory (`persistence-validator.ts`, `in-memory-repository.ts`).
- Snapshots agregados que não expõem records, clientes, conexões, secrets ou stack traces.
- Sanitização de hints no `AuthBridge`.
- Separação entre `AuthContext` e o contexto estrutural legado.
- API atual read-only e adapters públicos no Admin.
- Testes de persistência, auth foundation, execution context, runtime API e retenção/auditoria estrutural.

Essas mitigações reduzem risco de implementação acidental, mas não substituem autenticação, autorização ou isolamento de dados.

## 3. Riscos de comportamento

1. **Falsa sensação de segurança:** `roles`, `permissions` e `tenantId` podem parecer autorizados porque estão presentes no contexto, embora sejam apenas dados de entrada/fundação.
2. **Perda de dados:** o provider process-local não sobrevive a reinício.
3. **Estado parcial:** sem transação, uma sequência de repositórios pode aplicar apenas parte de uma operação.
4. **Vazamento futuro:** adicionar um banco sem filtro centralizado e testes cross-tenant permitiria consultas fora do escopo.
5. **Incompatibilidade de snapshots:** um adapter futuro que exponha conexões, records ou erros de infraestrutura quebraria a intenção dos snapshots públicos.
6. **Confusão de identidade:** os tipos de Auth e Context devem ser mapeados por uma política única antes de aceitar credenciais externas.

## 4. Bloqueios e decisões pendentes

São bloqueios para implementação segura, não para esta auditoria:

- decisão formal de adapter e migrations;
- semântica de transação e concorrência;
- modelo de identidade e sessão;
- fonte autoritativa para tenant/workspace membership;
- política de autorização e negação default;
- enforcement no repository/unit of work;
- auditoria, retenção, backup e restore;
- controles de login e administração.

## 5. Fora do escopo desta task

Não foram instalados ORM/driver/banco, não foram criadas migrations, não houve login, alteração de contrato, RFC/ADR aprovada, substituição do provider in-memory ou mudança de comportamento do produto.
