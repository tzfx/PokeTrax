import React from 'react';
import { Card } from '../model/Card'
import { baseURL } from '../index'
import {
    getRarity,
    deleteCardFromCollection,
    getEnergy,
    addCardToCollection
} from '../controls/CardDB';
import { CollectionButtons } from './CollectionButtons';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import { AddCardCollection } from './AddCardCollection';
import {
    Dialog,
    DialogTitle,
    IconButton,
    CircularProgress,
    Paper,
    Tooltip,
    Fab
} from '@mui/material';
import { CardDialog } from './CardDialog';

const rainbowHolo = `linear-gradient(
    90deg,
    rgba(255, 0, 0, 1) 0%,
    rgba(255, 154, 0, 1) 10%,
    rgba(208, 222, 33, 1) 20%,
    rgba(79, 220, 74, 1) 30%,
    rgba(63, 218, 216, 1) 40%,
    rgba(47, 201, 226, 1) 50%,
    rgba(28, 127, 238, 1) 60%,
    rgba(95, 21, 242, 1) 70%,
    rgba(186, 12, 248, 1) 80%,
    rgba(251, 7, 217, 1) 90%,
    rgba(255, 0, 0, 1) 100%`
interface Props {
    id?: string
    card: Card
    onDelete: () => void
}

class State {
    public imgLoaded = false
    public addDialogShow = false
    public cardDialogShow = false
    public count: number

    constructor(count: number) {
        this.count = count
    }
}

export class CardCase extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = new State(props.card.count ?? 0)
    }
    render() {
        return (
            <div id={`card-case${this.props.id}`} className='flex justify-center' >
                <Paper
                    elevation={3}
                    className='rounded-lg w-72 h-fit hover:shadow-2xl hover:bg-blue-500 hover:text-white'>
                    {this.getTitle()}
                    <div id="collection-buttons" className="flex w-full items-center justify-center ">
                        {
                            this.props.card.collection != null &&
                            <CollectionButtons
                                count={this.state.count}
                                onDelete={() => { this.deleteCard() }}
                                onUpdate={(add: boolean) => this.updateCount(add)}
                                onMove={(collection: string) => {
                                    this.move(collection)
                                }} />
                        }
                    </div>
                    <div style={{ position: 'relative' }}>
                        {this.imgSpinner()}
                        <div className="flex justify-center align-middle">
                            <img className={`w-64 h-[357px] rounded-xl cursor-pointer ${(this.props.card.collection != null && this.state.count <= 0) ? "opacity-40" : ""}`}
                                id={`card-img${this.props.id}`}
                                style={{ visibility: this.state.imgLoaded ? 'visible' : 'hidden' }}
                                src={baseURL + "/cardImg/" + this.props.card?.cardId}
                                alt={this.props.card.name}
                                onClick={() => this.setState({ ...this.state, cardDialogShow: true })}
                                onLoad={() => this.setState({ ...this.state, imgLoaded: true })}
                                onError={(ev) => { if (ev.target instanceof HTMLImageElement) ev.target.src = './assests/pokemon-back.png' }}

                            />
                            {this.holoOverlay()}
                        </div>
                    </div>
                    <div className='h-8 pl-2 pr-2 flex justify-center items-center'>
                        <div className='flex justify-items-center items-center h-8 w-8 ml-2'>
                            <Tooltip title={this.props.card.expName}>
                                <img className='h-6' alt="" src={baseURL + "/expSymbol/" + this.props.card?.expName} />
                            </Tooltip>
                        </div>
                        <div className='grow'></div>
                        <a href={'https://tcgplayer.com/product/' + this.props.card?.idTCGP}>{this.getPrice()}</a>
                        <div className='grow'></div>
                        <div>{this.props.card?.expCardNumber}</div>
                        <div className='grow'></div>
                        <Tooltip title={this.props.card.rarity}>
                            <div className='flex justify-items-center items-center h-8 w-8'>
                                {getRarity(this.props.card?.rarity ?? "")}
                            </div>
                        </Tooltip>
                    </div>
                </Paper>
                <Dialog open={this.state.addDialogShow} onClose={() => this.setState({ ...this.state, addDialogShow: false })}>
                    <div className='flex justify-center items-center w-96 p-2 pr-4'>
                        <DialogTitle>Add {this.props.card.name}</DialogTitle>
                        <div className="flex-grow"></div>
                        <IconButton
                            id="close-card-add"
                            className="w-8 h-8"
                            size="large"
                            onClick={() => this.setState({ ...this.state, addDialogShow: false })}>
                            <ClearIcon />
                        </IconButton>
                    </div>
                    <AddCardCollection card={this.props.card} close={() => this.setState({ ...this.state, addDialogShow: false })}></AddCardCollection>
                </Dialog>
                <Dialog
                    id="card-dialog"
                    maxWidth='xl'
                    open={this.state.cardDialogShow}
                    onClose={() => this.setState({ ...this.state, cardDialogShow: false })}>
                    <div className='flex justify-center items-center w-full p-2 pr-4'>
                        <DialogTitle className='flex items-center'>
                            {getEnergy(this.props.card?.energyType ?? "")}
                            <div className='w-2'></div>
                            {this.props.card.name}
                        </DialogTitle>
                        <div className="flex-grow"></div>
                        <IconButton
                            id="close-card-dialog"
                            className="w-8 h-8"
                            size="large"
                            onClick={() => this.setState({ ...this.state, cardDialogShow: false })}>
                            <ClearIcon />
                        </IconButton>
                    </div>
                    <CardDialog card={this.props.card}></CardDialog>
                </Dialog>
            </div>
        )
    }

    private getTitle() {
        return (
            <div className='h-16 mt-4 mb-2 ml-4 mr-4 rounded-md flex items-center'>
                <div className='absolute w-64 h-16 rounded-md flex items-center opacity-30'
                    style={{ backgroundImage: `url("${this.getVariantBG()}")` }}>
                    {getEnergy(this.props.card?.energyType ?? "")}
                </div>
                <div className='absolute w-64 h-16 rounded-md flex items-center '
                >
                    {getEnergy(this.props.card?.energyType ?? "")}
                    <div className='pl-2 text-lg truncate' id="card-case-title">
                        <span>{this.props.card?.name}</span></div>
                    <div className='flex-grow'></div>
                    {
                        this.props.card.variant?.includes("1st Edition") &&
                        <img className="w-8 m-2" src='assests/1st-edition.png' alt="1st ed" />
                    }
                    {this.getCornerButton()}
                </div>
            </div>
        )
    }


    private getVariantBG() {
    switch (this.props.card.energyType) {
        case 'Grass':
            return `assests/grass-rev.png`
        case 'Fire':
            return `assests/fire-rev.png`
        case 'Water':
            return `assests/water-rev.png`
        case 'Psychic':
            return `assests/psychic-rev.png`
        case 'Lightning':
            return `assests/lightning-rev.png`
        case 'Fighting':
            return `assests/fighting-rev.png`
        case 'Colorless':
            return `assests/colorless-rev.png`
        case 'Darkness':
            return `assests/dark-rev.png`
        case 'Metal':
            return `assests/steel-rev.png`
        case 'Fairy':
            return `assests/fairy-rev.png`
        case 'Dragon':
            return `assests/dragon-rev.png`
        default:
            return `assests/trainer-rev.png`
    }
}

    private updateCount(add: boolean) {
    let card: Card = JSON.parse(JSON.stringify(this.props.card))
    if (this.state.count != null) {
        if (add) {
            card.count = this.state.count + 1
        } else {
            card.count = this.state.count - 1
        }

        addCardToCollection(card).then(
            (_) => {
                this.setState({ ...this.state, count: card.count ?? 0 })
            }
        )
    }
}

    private move(collection: string) {
    let card = { ...this.props.card, collection: collection }
    deleteCardFromCollection(this.props.card)
    this.props.onDelete()
    addCardToCollection(card)
}

    private deleteCard() {
    deleteCardFromCollection(this.props.card)
    this.props.onDelete()
}

    private getCornerButton() {
    if (this.props.card.collection == null) {
        return (
            <div className='min-w-10 m-2'>
                <Fab
                    id={`add-card-button${this.props.id}`}
                    aria-label="add"
                    size="small"
                    onClick={() => this.setState({ ...this.state, addDialogShow: true })}>
                    <AddIcon />
                </Fab>
            </div>)
    }
}

    private imgSpinner() {
    if (this.state.imgLoaded === false) {
        return (
            <div className="h-full" style={{ position: 'absolute' }}>
                <div className='flex items-center justify-center w-64 h-full'>
                    <CircularProgress className="flex" size={100} ></CircularProgress>
                </div>
            </div>
        )
    }
}

    private holoOverlay() {
    if (this.props.card.variant === 'Reverse Holofoil') {
        return (
            <div className="h-full" style={{ position: 'absolute' }}>
                <img className='flex items-center justify-center w-64 h-full rounded-md opacity-40' alt="holo-overlay" src={this.getVariantBG()} />
            </div>
        )
    } else if (this.props.card.variant === 'Holofoil' || this.props.card.variant === '1st Edition Holofoil') {
        return (
            <div className="h-full" style={{ position: 'absolute' }}>
                <div className='flex items-center justify-center w-64 h-full rounded-md opacity-30'
                    style={{
                        background: rainbowHolo
                    }}
                ></div>
            </div>
        )
    }
}

    private getPrice(): string {
    return this.props.card.price != null ? `$${this.props.card.price.toFixed(2).toString()}` : `$-.--`
}

componentWillReceiveProps(props: Props) {
    if (props.card.cardId !== this.props.card.cardId) {
        this.setState(new State(props.card.count ?? 0))
    }
}

}
