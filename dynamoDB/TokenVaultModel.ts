import * as DynamoDB from "aws-sdk/clients/dynamodb";

class TokenVaultModel {
  protected dynamoDb: DynamoDB;
  constructor() {
    this.dynamoDb = new DynamoDB({
      apiVersion: "2012-08-10",
      region: "us-east-1",
    });
  }

  async put(item) {
    const convertedItem = DynamoDB.Converter.marshall(item);
    const params = {
      Item: convertedItem,
      TableName: "token-vault-table",
    };
    await this.dynamoDb.putItem(params).promise();
  }

  async readForPanRepeats(pan: string) {
    const params = {
      TableName: "token-vault-table",
      FilterExpression: "#hashedAttrName = :value",
      ExpressionAttributeNames: {
        "#hashedAttrName": "hashed",
      },
      ExpressionAttributeValues: {
        ":value": { S: pan },
      },
    };
    const foundItems = await this.dynamoDb.scan(params).promise();
    const responseArray = [];
    foundItems.Items.forEach((element) => {
      responseArray.push(DynamoDB.Converter.unmarshall(element));
    });
    return responseArray[0];
  }

  async findByCardId(id: string) {
    const params = {
      TableName: "token-vault-table",
      KeyConditionExpression: "#keyName = :keyValue",
      ExpressionAttributeNames: {
        "#keyName": "id",
      },
      ExpressionAttributeValues: {
        ":keyValue": { S: id },
      },
    };
    const foundItems = await this.dynamoDb.query(params).promise();
    if(!foundItems.Items.length) return null
    return DynamoDB.Converter.unmarshall(foundItems.Items[0]);
  }
}

export default new TokenVaultModel();
