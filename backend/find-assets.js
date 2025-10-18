import algosdk from "algosdk";

const indexer = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", "");
const creator = "5K747IR5K27IO4HAB6ON7UMLXXTYJIS4HZEXX5XO5HT2J4QW377WCPNAEQ";

const res = await indexer.lookupAccountCreatedAssets(creator).do();
const created = res.assets || [];
for (const a of created) {
  const { index: assetId, params } = a;
  if (params.name === "LearnToken" && params["unit-name"] === "LEARN") {
    console.log("Found LearnToken:", assetId);
  }
}