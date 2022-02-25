const express = require('express');
const { json } = require('express/lib/response');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCpf(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => {
    return customer.cpf === cpf;
  });

  if (!customer) {
    response.status(400).json({ error: "Customer not found" })
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.get("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer);
})

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({
      error: "Customer already exists!"
    })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send(`User ${name} create success`);
})

app.put("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  if (!name) {
    response.status(400).json({ error: "Name is empty!" })
  }

  customer.name = name;

  response.status(201).send();
})

app.delete("/account", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).json(customers);
})

app.get("/statement", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.get("/statement/date", verifyIfExistsAccountCpf, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormat = new Date(date + " 00:00");



  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      dateFormat.toDateString()
  );

  return response.json(statement);
})

app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const customerOperation = {
    description,
    amount,
    type: "credit",
    created_at: new Date()
  }

  customer.statement.push(customerOperation);

  response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountCpf, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    response.status(400).json({ error: "Insufficient funds!" })
  }

  const customerOperation = {
    amount,
    type: "debit",
    created_at: new Date()
  }

  customer.statement.push(customerOperation);

  response.status(201).send();
})

app.get("/balance", verifyIfExistsAccountCpf, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
})



app.listen(3333);