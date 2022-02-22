const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

/*
  cpf: string
  name: string
  id: uuid
  statement: []
*/

const costumers = [];

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const id = uuidv4();

  costumers.push({
    cpf,
    name,
    id,
    statement: []
  })

  return response.status(201).send(`User ${name} create success`);
})

app.listen(3333);