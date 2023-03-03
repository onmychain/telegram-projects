import { Bot, CommandContext, Context } from "grammy";
import dotenv from "dotenv";
import { ethers } from "ethers"
import { abi } from "./contracts/XPToken.json"

// Load environment variables
dotenv.config()

// Create the bot using the token
const bot = new Bot(String(process.env.TOKEN))

// Connect to default provider http://127.0.0.1:8545/
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
const contract = new ethers.Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", abi, provider)
const signer = new ethers.Wallet(String(process.env.PRIVATE_KEY), provider)

// Only allow owner execute certain commands
async function checkOwnership(ctx: CommandContext<Context>, next: any) {
    try {
        const user = await ctx.getAuthor()
        if (user.status !== "creator") "Only the group creator can issue this command."
        await next()
    } catch (error: any) {
        ctx.reply(error)
    }
}

// Listen for the /mint command
bot.command("mint", async ctx => checkOwnership(ctx, async () => {
    try {
        const [address, amount] = ctx.match.split(" ")
        const amt = ethers.utils.parseEther(amount)
        const tx = await contract.connect(signer).mint(address, amt)
        const receipt = await tx.wait()
        const balanceOf = await contract.balanceOf(address)
        const text = await ethers.utils.formatEther(balanceOf)
        const symbol = await contract.symbol()
        ctx.reply([
            `Minted <code>${amount}</code> ${symbol}\n`,
            `Address: <code>${address}</code>\n`,
            `Balance Of: <code>${text}</code>\n`,
            `Tx: <code>${receipt.transactionHash}</code>\n`,
        ].join(""), { parse_mode: "HTML" })
    } catch (error: any) {
        ctx.reply(error)
    }
}))
// Listen for the /burn command
bot.command("burn", async ctx => checkOwnership(ctx, async () => {
    try {
        const [address, amount] = ctx.match.split(" ")
        const amt = ethers.utils.parseEther(amount)
        const tx = await contract.connect(signer).burnFrom(address, amt)
        const receipt = await tx.wait()
        const balanceOf = await contract.balanceOf(address)
        const text = await ethers.utils.formatEther(balanceOf)
        const symbol = await contract.symbol()
        ctx.reply([
            `Burned <code>${amount}</code> ${symbol}\n`,
            `Address: <code>${address}</code>\n`,
            `Balance Of: <code>${text}</code>\n`,
            `Tx: <code>${receipt.transactionHash}</code>\n`,
        ].join(""), { parse_mode: "HTML" })
    } catch (error: any) {
        ctx.reply(error)
    }
}))
// Listen for the /balanceOf command
bot.command("balanceOf", async ctx => {
    try {
        const address = ctx.match
        const balanceOf = await contract.balanceOf(address)
        const text = ethers.utils.formatEther(balanceOf)
        ctx.reply(`Balance Of: <code>${text}</code>.`, { parse_mode: "HTML" })
    } catch (error: any) {
        ctx.reply(error)
    }

})
// Listen for the /totalSupply command
bot.command("totalSupply", async ctx => {
    try {
        const totalSupply = await contract.totalSupply()
        const text = ethers.utils.formatEther(totalSupply)
        ctx.reply(`Total supply: <code>${text}</code>.`, { parse_mode: "HTML" })
    } catch (error: any) {
        ctx.reply(error)
    }
})

// Start the bot
bot.start()
