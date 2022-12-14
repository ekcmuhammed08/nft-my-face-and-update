import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
  toMintAddress,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "FaceToken"
const description = "this token i use it to nft my face"
const symbol = "FCT"
const sellerFeeBasisPoints = 100
const imageFile = "my-face-updated.png"

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )
   // file to buffer
  const buffer = fs.readFileSync("src/" + imageFile)

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, imageFile)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

   // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: tokenName,
      description: description,
      image: imageUri,
    })

  console.log("metadata uri:", uri)

  async function createNFT(
    metaplex:Metaplex,
    uri: string
    ): Promise<NftWithToken> {
      const { nft } = await metaplex
      .nfts()
      .create({
        uri: uri,
        name: tokenName,
        sellerFeeBasisPoints: sellerFeeBasisPoints,
        symbol:symbol,
      })
    console.log(
      `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
    )
    return nft
  }

  async function updateNFT(
    metaplex: Metaplex,
    uri: string,
    mintAddress: PublicKey,
    ) {
      const nft = await metaplex.nfts().findByMint({mintAddress}) // get "NftWithToken" type from mint address
      
      await metaplex
      .nfts()
      .update({
        nftOrSft:nft,
        name: tokenName,
        symbol:symbol,
        uri: uri,
        sellerFeeBasisPoints: sellerFeeBasisPoints,
      })
      console.log(
        `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
      )
  }

  await createNFT(metaplex,uri)
  const mintAddress = new PublicKey("9RiPfjZb4ypzoBrrkta41GqtFLW8tuvGDSVEfmjgjKHn")
  await updateNFT(metaplex,uri,mintAddress)
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
