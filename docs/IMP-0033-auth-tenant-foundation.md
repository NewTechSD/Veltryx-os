# IMP-0033  Auth + Tenant Foundation

Status: Approved  
Authorized By: RFC-0011 + RFC-0002 + RFC-0004 + RFC-0006 + RFC-0013 + RFC-0099  
Depends On: TASK-0316

This IMP adds transport-agnostic Principal, Auth Session, Tenant and Workspace contracts, a Kernel Auth Bridge, structured Execution Context integration and safe API/HTTP hints. Anonymous/default/default is the public fallback; System Principal is available only to internal explicit calls. Login, JWT, sessions, cookies, RBAC, Permission Engine and persistence are excluded.
