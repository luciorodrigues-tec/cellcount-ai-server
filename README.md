# BE-FIX-003 — Server Contract Tests

Atualiza quatro testes antigos que ainda procuravam rotas diretamente em
`server.js`.

Os testes passam a verificar:

- composição e registros no `server.js`;
- contratos HTTP reais em `routes/operationalStatusRoutes.js`.

Nenhum arquivo de runtime ou motor clínico é alterado.

## Instalação

```bat
INSTALL_BE-FIX-003.bat
```

## Validação adicional

```bat
node engineering\scripts\checkArchitecture.mjs
node --test tests\cck0001_architecture_test.mjs
node --test
```
