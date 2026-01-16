import { initializeMOI, getWallet } from '../src/lib/moi-client';
import util from 'util';

async function main() {
    await initializeMOI();
    const wallet = getWallet();
    console.log("Address:", wallet.getAddress().toString());

    try {
        const balance = await wallet.getBalance();
        console.log("Balance:", balance);
        // inspect detailed properties if balance is an object
        // console.log(util.inspect(balance));
    } catch (e) {
        console.error("Error fetching balance:", e);
    }
}

main();
