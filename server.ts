const PROTO_PATH = __dirname + "/TokenVault.proto";

const ULID = require("ulid");
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
import { createHmac } from "crypto";
import TokenVaultModel from "./dynamoDB/TokenVaultModel";
const aes256 = require("aes256");

async function AddCreditCard(call, callback) {
  const hashed = createHmac("sha512", process.env.SALT)
    .update(call.request.pan)
    .digest("hex");

  const repeatedPanItem = await TokenVaultModel.readForPanRepeats(hashed);
  if (!!repeatedPanItem) {
    callback(null, { message: "Same pan was found", card: repeatedPanItem });
  } else {
    const id = ULID.ulid();
    const encrypted = aes256.encrypt(process.env.SECRET, call.request.pan);

    await TokenVaultModel.put({ id: id, ecrypted: encrypted, hashed: hashed });

    callback(null, { message: "Card was added" });
  }
}

async function GetCreditCard(call, callback) {
  const result = await TokenVaultModel.findByCardId(call.request.id);
  if (!!result) {
    console.log(result);
    callback(null, { message: "Card was found", card: result });
  } else {
    callback(null, { message: "Card was not found" });
  }
}

(() => {
  const server = new grpc.Server();
  server.addService(token_vault.TokenVault.service, {
    AddCreditCard: AddCreditCard,
    GetCreditCard: GetCreditCard,
  });
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start();
    }
  );
})();
