export class Card {
    public cardId: string
    public idTCGP: string
    public name : string
    public expIdTCGP: string
    public expName: string
    public expCardNumber : string
    public rarity: string
    public price = new Array<Price>()
    public releaseDate?: string
    public energyType?: string
    public cardType?: string

    constructor(cardId: string, idTCGP: string, name:string, expId:string, expName:string, expCardNumber:string, rarity:string){
        this.cardId = cardId
        this.idTCGP = idTCGP
        this.name = name
        this.expIdTCGP = expId
        this.expName = expName
        this.expCardNumber = expCardNumber
        this.rarity = rarity
    }
}

export class Price {
    public date: number
    public cardId: string
    public variant: string 
    public vendor: string
    public price: number

    constructor(date: number, cardId: string, variant: string, vendor: string, price: number){
        this.date = date
        this.cardId = cardId
        this.variant = variant
        this.vendor = vendor
        this.price = price
    }
}

export class CardSearch {
    public total: number = 0
    public cards: Card[] = new Array()
}