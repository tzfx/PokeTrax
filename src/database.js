const path = require('path')
const os = require("os");
const fs = require('fs');
const compver = require('compare-version');
const https = require("follow-redirects").https
const axios = require('axios')
const hash = require('object-hash');

const DB_META = "./sql/meta.json"
const CARD_DB_FILE = "./sql/data.sqlite3"
const PRICE_DB_FILE = "./sql/prices.sqlite3"
const COLLECTION_DB_FILE = "./sql/collections.sqlite3"
const Database = require('better-sqlite3')


/* Print the working directory for the application to get date files */
const pwd = () => {
    if (process.env.NODE_ENV === 'development') {
        return "./"
    } else if (process.env.NODE_ENV === 'test') {
        return "./test/data"
    }
    switch (os.platform()) {
        case 'darwin': return '/Applications/PokeTrax.app/Contents/'
        case 'win32': return ''
        default: return "./"
    }
}

/**
 * Prices database close when done
 * @returns {Datebase}
 */
const pricesDB = () => { return new Database(path.join(pwd(), PRICE_DB_FILE)) }
/**
 * Card database close when done
 * @returns {Datebase}
 */
const cardDB = () => { return new Database(path.join(pwd(), CARD_DB_FILE)) }
/**
 * Collection database close when done
 * @returns {Datebase}
 */
const collectionDB = () => { return new Database(path.join(pwd(), COLLECTION_DB_FILE)) }

//Check for card Updates
let dbUpdate = { ready: false, updated: false }
const dbStatus = () => {
    return dbUpdate
}

const checkForDbUpdate = () => {
    return new Promise(
        async (resolve, reject) => {
            //Init databases
            let meta = await pullDbMeta()
            //if new and no meta file exists
            if (fs.existsSync(path.join(pwd(), DB_META)) === false) {
                dbUpdate = { ready: false, updated: true }
                try {
                    await pullDb(meta)
                    resolve()
                } catch (err) {
                    dbUpdate = { ready: false, updated: false, error: err }
                    console.log(err)
                    reject()
                }
            } else { // look for update
                let current = JSON.parse(fs.readFileSync(path.join(pwd(), DB_META), { encoding: 'utf8', flag: 'r' }))
                if (compver(meta.version, current.version) > 0) {
                    dbUpdate = { ready: false, updated: true }
                    try {
                        await pullDb(meta)
                        resolve()
                    } catch (err) {
                        dbUpdate = { ready: false, updated: false, error: err }
                        console.log(err)
                        reject()
                    }
                } else {
                    dbUpdate = { ready: true, updated: false }
                }
            }
        }
    )
}

//pull release info from database repo
async function pullDbMeta() {
    return new Promise(
        async (resolve, reject) => {
            try {
                let release = await axios.get('https://api.github.com/repos/jgunzelman88/pokepull/releases/latest')
                let asset = release.data.assets.find((value) => value.name === "data.sqlite3")
                let meta = { 'version': release.data.name, 'asset': asset.browser_download_url }
                resolve(meta)
            } catch (err) {
                reject(err)
            }
        }
    )
}

//Pull new database file and reinitialize database
async function pullDb(meta) {
    return new Promise(
        async (resolve, reject) => {
            https.get(meta.asset, (stream) => {
                //write database file
                let writer = fs.createWriteStream(path.join(pwd(), CARD_DB_FILE))
                stream.pipe(writer)
                writer.on('finish', () => {
                    fs.writeFileSync(path.join(pwd(), "./sql/meta.json"), JSON.stringify(meta))
                    dbUpdate = { ready: true, updated: true }
                    resolve()
                })
                writer.on('error', () => { reject() })
            })
        }
    )
}

/**
 * Return TCGPrice 
 * @param {Card} card 
 * @returns 
 */
async function getTcgpPrice(card) {
    let prices = []
    let db = pricesDB()
    let api = await axios.get(`https://infinite-api.tcgplayer.com/price/history/${card.idTCGP}?range=month`);
    for (let result of api.data.result) {
        let date = Date.parse(result.date)
        result.variants.forEach(
            (variant) => {
                let price = {
                    "date": date,
                    "cardId": card.cardId,
                    "variant": variant.variant,
                    "vendor": "tcgp",
                    "price": parseFloat(variant.marketPrice)
                }
                prices.push(price)
                let sql = `INSERT OR IGNORE INTO prices 
                                (id, date, cardId, variant, vendor, price) 
                                VALUES ($id, $date, $cardId, $variant, $vendor, $price)`
                db.prepare(sql).run({
                    "id": hash(price),
                    "date": price.date,
                    "cardId": price.cardId,
                    "variant": price.variant,
                    "vendor": price.vendor,
                    "price": price.price
                })
            }
        )

        return (prices)
    }
}

/**
 * Get prices from database
 * @param {Card} card
 * @param {number} _start 
 * @param {number} _end 
 * @returns 
 */
const getPrices = async (card, _start, _end) => {
    let now = new Date();
    now.setTime(Date.now())

    let then = new Date()
    then.setTime(Date.now())
    then.setDate(now.getDate() - 1)

    let endDate = _end != null ? new Date(_end) : now
    let startDate = _start != null ? new Date(_start) : then
    let sql = `SELECT * FROM prices WHERE cardId = $cardId AND date > $start AND date < $end ORDER BY date DESC`
    let db = pricesDB()
    try {
        let rows = db.prepare(sql).all({ "cardId": card.cardId, "start": startDate.getTime(), "end": endDate.getTime() })
        if (rows.length === 0) {
            let cardPrices = await getTcgpPrice(card)
            return cardPrices.filter((price) => (price.date > _start && price.date < _end))
        } else {
            return rows
        }
    } catch (err) {
        return new Error(err)
    } finally {
        db.close()
    }
}

const init = async () => {
    try {
        let prices = pricesDB()
        prices.prepare(`CREATE TABLE IF NOT EXISTS prices (id TEXT UNIQUE, date INTEGER, cardId TEXT, variant TEXT, vendor TEXT, price REAL)`).run()
        prices.close()

        let collections = collectionDB()
        collections.prepare(`CREATE TABLE IF NOT EXISTS collections (name TEXT UNIQUE, img TEXT)`).run()
        collections.prepare(`CREATE TABLE IF NOT EXISTS collectionCards (cardId TEXT, collection TEXT, variant TEXT, paid REAL, count INTEGER, grade TEXT)`).run()
        collections.close()
    } catch (err) {
        console.error(err)
    }
}

module.exports.dbStatus = dbStatus
module.exports.init = init
module.exports.pwd = pwd
module.exports.pricesDB = pricesDB
module.exports.collectionDB = collectionDB
module.exports.cardDB = cardDB
module.exports.checkForDbUpdate = checkForDbUpdate
module.exports.getPrices = getPrices