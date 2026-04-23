Crie funções de serviço (API) para o endpoint: $ARGUMENTS

## O que criar

Adicione as funções no arquivo de serviço apropriado em `frontend/src/services/` ou crie um novo arquivo `frontend/src/services/<nome>Api.js`.

## Estrutura padrão

```js
// ─── nomeFuncao ──────────────────────────────────────────────────
// Descrição do que a função faz e qual endpoint chama.
export async function nomeFuncao(params) {
  const response = await fetch(`${API_BASE_URL}/endpoint`, {
    method: "GET", // ou POST, PATCH, DELETE
    headers: {
      ...getAuthHeader(), // incluir se endpoint for autenticado
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload), // omitir em GET
  });

  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json(); // ou return; para 204 No Content
}
```

## Regras

- Importar `getAuthHeader` de `../services/authApi` para endpoints autenticados
- Reutilizar o padrão `parseErrorMessage` para extrair erros legíveis
- Não fazer catch dentro do serviço — deixar o componente tratar o erro
- Adicionar comentário `// ─── nomeFuncao ───` antes de cada função
- Normalizar dados se o backend retornar estrutura diferente da usada no frontend

## Tipos de operação

- **GET lista**: `fetchNomes()` — retorna array
- **GET por ID**: `fetchNome(id)` — retorna objeto
- **POST criar**: `createNome(payload)` — retorna objeto criado
- **PATCH atualizar**: `updateNome(id, payload)` — retorna objeto atualizado
- **DELETE**: `deleteNome(id)` — retorna void (204)

Após criar, mostre um exemplo de como usar a função em um componente com `useEffect` e tratamento de loading/error.
