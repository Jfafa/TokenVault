const PROTO_PATH = __dirname + "/TokenVault.proto";

const parseArgs = require("minimist");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const token_vault = grpc.loadPackageDefinition(packageDefinition).token_vault;

(async () => {
  const target = "localhost:50051";

  const client = new token_vault.TokenVault(
    target,
    grpc.credentials.createInsecure()
  );

  console.log("**** Running test from client with unique pan ****");
  await client.AddCreditCard(
    { pan: "1234567891234567" },
    function (err, response) {
      console.log("Message: ", response.message, "\n Card: ", response.card);
    }
  );

  console.log(
    "**** Running test from client with pan that is already in DynamoDb ****"
  );
  await client.AddCreditCard(
    { pan: "1234567891234567" },
    function (err, response) {
      console.log("Message: ", response.message, "\n Card: ", response.card);
    }
  );

  console.log("**** Running test from client with valid card ID ****");

  await client.GetCreditCard(
    { id: "01F45779N3MH3M4TWDHP21GCKR" },
    function (err, response) {
      console.log("Message: ", response.message, "\n Card: ", response.card);
    }
  );

  console.log("**** Running test from client with invalid card ID ****");

  await client.GetCreditCard(
    { id: "22222222222222TESTID" },
    function (err, response) {
      console.log("Message: ", response.message, "\n Card: ", response.card);
    }
  );
})();
